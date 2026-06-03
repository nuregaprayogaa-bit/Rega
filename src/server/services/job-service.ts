import "server-only";
import { JobStatus, ProposalStatus, NotificationType, type Prisma } from "@prisma/client";

import { db } from "@/server/db";
import { notify } from "@/server/services/notification-service";
import { jobSchema, proposalSchema, type JobInput, type ProposalInput } from "@/lib/validations/job";

export async function createJob(
  clientId: string,
  input: JobInput,
): Promise<{ ok: boolean; jobId?: string; error?: string }> {
  const parsed = jobSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const d = parsed.data;
  const job = await db.job.create({
    data: {
      clientId,
      title: d.title,
      description: d.description,
      categoryId: d.categoryId || null,
      budgetMinIDR: d.budgetMinIDR ?? null,
      budgetMaxIDR: d.budgetMaxIDR ?? null,
    },
    select: { id: true },
  });
  return { ok: true, jobId: job.id };
}

export async function listOpenJobs(params?: { q?: string; category?: string }) {
  const where: Prisma.JobWhereInput = { status: JobStatus.OPEN };
  if (params?.q) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
    ];
  }
  if (params?.category) where.category = { slug: params.category };

  return db.job.findMany({
    where,
    include: {
      client: { select: { name: true, image: true } },
      category: { select: { name: true, slug: true } },
      _count: { select: { proposals: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getJob(jobId: string) {
  return db.job.findUnique({
    where: { id: jobId },
    include: {
      client: { select: { id: true, name: true, image: true, createdAt: true } },
      category: { select: { name: true, slug: true } },
      proposals: {
        include: {
          freelancer: {
            select: {
              id: true,
              name: true,
              image: true,
              freelancerProfile: { select: { level: true, headline: true, ratingAvg: true, ratingCount: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function listMyJobs(clientId: string) {
  return db.job.findMany({
    where: { clientId },
    include: { _count: { select: { proposals: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function submitProposal(
  freelancerId: string,
  input: ProposalInput,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = proposalSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const job = await db.job.findUnique({
    where: { id: parsed.data.jobId },
    select: { id: true, clientId: true, status: true, title: true },
  });
  if (!job || job.status !== JobStatus.OPEN) {
    return { ok: false, error: "Pekerjaan tidak tersedia." };
  }
  if (job.clientId === freelancerId) {
    return { ok: false, error: "Anda tidak bisa melamar pekerjaan sendiri." };
  }
  const existing = await db.jobProposal.findUnique({
    where: { jobId_freelancerId: { jobId: job.id, freelancerId } },
  });
  if (existing) return { ok: false, error: "Anda sudah mengirim penawaran." };

  await db.jobProposal.create({
    data: {
      jobId: job.id,
      freelancerId,
      message: parsed.data.message,
      priceIDR: parsed.data.priceIDR,
    },
  });

  await notify({
    userId: job.clientId,
    type: NotificationType.SYSTEM,
    title: "Penawaran baru untuk pekerjaanmu 📨",
    body: `Ada freelancer mengirim penawaran untuk "${job.title}".`,
    link: `/jobs/${job.id}`,
    email: true,
  });
  return { ok: true };
}

export async function acceptProposal(
  clientId: string,
  proposalId: string,
): Promise<{ ok: boolean; error?: string }> {
  return db.$transaction(async (tx) => {
    const proposal = await tx.jobProposal.findUnique({
      where: { id: proposalId },
      include: { job: { select: { id: true, clientId: true, title: true } } },
    });
    if (!proposal || proposal.job.clientId !== clientId) {
      return { ok: false, error: "Penawaran tidak ditemukan." };
    }
    await tx.jobProposal.update({
      where: { id: proposalId },
      data: { status: ProposalStatus.ACCEPTED },
    });
    // Tolak penawaran lain & tutup pekerjaan.
    await tx.jobProposal.updateMany({
      where: { jobId: proposal.jobId, id: { not: proposalId } },
      data: { status: ProposalStatus.REJECTED },
    });
    await tx.job.update({
      where: { id: proposal.jobId },
      data: { status: JobStatus.CLOSED },
    });
    await notify({
      userId: proposal.freelancerId,
      type: NotificationType.SYSTEM,
      title: "Penawaranmu diterima! 🎉",
      body: `Client memilih penawaranmu untuk "${proposal.job.title}". Hubungi client untuk lanjut.`,
      link: `/jobs/${proposal.jobId}`,
      email: true,
    });
    return { ok: true };
  });
}

export async function closeJob(clientId: string, jobId: string): Promise<{ ok: boolean }> {
  const res = await db.job.updateMany({
    where: { id: jobId, clientId },
    data: { status: JobStatus.CLOSED },
  });
  return { ok: res.count > 0 };
}
