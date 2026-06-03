import "server-only";
import { GigStatus, type PackageTier } from "@prisma/client";

import { db } from "@/server/db";
import { slugify } from "@/lib/slug";
import { gigSchema, type GigInput } from "@/lib/validations/gig";

export type GigResult =
  | { ok: true; gigId: string; slug: string }
  | { ok: false; error: string };

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "jasa";
  let slug = base;
  for (let i = 0; i < 5; i++) {
    const existing = await db.gig.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function createGig(
  freelancerId: string,
  input: GigInput,
): Promise<GigResult> {
  const parsed = gigSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const data = parsed.data;
  const slug = await uniqueSlug(data.title);

  const gig = await db.gig.create({
    data: {
      freelancerId,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId || null,
      title: data.title,
      slug,
      description: data.description,
      coverImage: data.coverImage || null,
      gallery: data.gallery,
      // MVP: langsung tayang. (Moderasi admin tersedia di Phase berikutnya.)
      status: GigStatus.ACTIVE,
      packages: {
        create: data.packages.map((p) => ({
          tier: p.tier as PackageTier,
          title: p.title,
          description: p.description,
          priceIDR: p.priceIDR,
          deliveryDays: p.deliveryDays,
          revisions: p.revisions,
          deliverables: p.deliverables,
        })),
      },
    },
    select: { id: true, slug: true },
  });
  return { ok: true, gigId: gig.id, slug: gig.slug };
}

export async function updateGig(
  freelancerId: string,
  gigId: string,
  input: GigInput,
): Promise<GigResult> {
  const parsed = gigSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const existing = await db.gig.findFirst({
    where: { id: gigId, freelancerId },
    select: { id: true, slug: true },
  });
  if (!existing) return { ok: false, error: "Jasa tidak ditemukan." };
  const data = parsed.data;

  await db.$transaction(async (tx) => {
    await tx.gig.update({
      where: { id: gigId },
      data: {
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId || null,
        title: data.title,
        description: data.description,
        coverImage: data.coverImage || null,
        gallery: data.gallery,
      },
    });
    // Ganti paket: hapus & buat ulang (sederhana & konsisten untuk MVP).
    await tx.servicePackage.deleteMany({ where: { gigId } });
    await tx.servicePackage.createMany({
      data: data.packages.map((p) => ({
        gigId,
        tier: p.tier as PackageTier,
        title: p.title,
        description: p.description,
        priceIDR: p.priceIDR,
        deliveryDays: p.deliveryDays,
        revisions: p.revisions,
        deliverables: p.deliverables,
      })),
    });
  });
  return { ok: true, gigId, slug: existing.slug };
}

export async function setGigStatus(
  freelancerId: string,
  gigId: string,
  status: GigStatus,
): Promise<{ ok: boolean }> {
  const res = await db.gig.updateMany({
    where: { id: gigId, freelancerId },
    data: { status },
  });
  return { ok: res.count > 0 };
}

export async function deleteGig(
  freelancerId: string,
  gigId: string,
): Promise<{ ok: boolean; error?: string }> {
  // Jangan hapus jika ada order aktif/selesai (jaga integritas riwayat).
  const orders = await db.order.count({ where: { gigId } });
  if (orders > 0) {
    return {
      ok: false,
      error: "Jasa sudah pernah dipesan. Jeda (pause) saja agar tidak hilang dari riwayat.",
    };
  }
  const res = await db.gig.deleteMany({ where: { id: gigId, freelancerId } });
  return { ok: res.count > 0 };
}

export async function listMyGigs(freelancerId: string) {
  return db.gig.findMany({
    where: { freelancerId },
    include: {
      packages: { orderBy: { priceIDR: "asc" } },
      category: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMyGig(freelancerId: string, gigId: string) {
  return db.gig.findFirst({
    where: { id: gigId, freelancerId },
    include: { packages: { orderBy: { priceIDR: "asc" } } },
  });
}

/** Detail gig publik (by slug) + paket + freelancer + review. */
export async function getPublicGigBySlug(slug: string) {
  const gig = await db.gig.findFirst({
    where: { slug, status: GigStatus.ACTIVE },
    include: {
      packages: { orderBy: { priceIDR: "asc" } },
      category: { select: { name: true, slug: true } },
      subcategory: { select: { name: true, slug: true } },
      freelancer: {
        select: {
          id: true,
          name: true,
          image: true,
          createdAt: true,
          freelancerProfile: true,
        },
      },
      reviews: {
        include: { client: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 30,
      },
    },
  });
  return gig;
}
