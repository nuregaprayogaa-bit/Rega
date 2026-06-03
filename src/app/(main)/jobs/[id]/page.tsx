import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Wallet, Tag, Users } from "lucide-react";

import { getJob } from "@/server/services/job-service";
import { getCurrentUser } from "@/server/auth-helpers";
import { formatIDR } from "@/lib/money";
import { formatDate, initials } from "@/lib/format";
import { LevelBadge } from "@/components/ui/level-badge";
import { ProposalForm } from "@/components/jobs/proposal-form";
import { AcceptProposalButton } from "@/components/jobs/accept-proposal-button";

export const dynamic = "force-dynamic";

const PROPOSAL_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-muted text-muted-foreground",
};
const PROPOSAL_LABEL: Record<string, string> = {
  PENDING: "Menunggu",
  ACCEPTED: "Diterima",
  REJECTED: "Ditolak",
};

function budgetLabel(min: number | null, max: number | null) {
  if (min != null && max != null) return `${formatIDR(min)} – ${formatIDR(max)}`;
  if (max != null) return `Maks ${formatIDR(max)}`;
  if (min != null) return `Min ${formatIDR(min)}`;
  return "Anggaran fleksibel";
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [job, user] = await Promise.all([getJob(id), getCurrentUser()]);
  if (!job) notFound();

  const isOwner = user?.id === job.clientId;
  const isOpen = job.status === "OPEN";
  const myProposal = user ? job.proposals.find((p) => p.freelancerId === user.id) : undefined;

  return (
    <div className="container max-w-3xl py-8">
      <Link href="/jobs" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Papan pekerjaan
      </Link>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-xl font-bold sm:text-2xl">{job.title}</h1>
          <span
            className={`shrink-0 rounded-full px-3 py-0.5 text-xs font-medium ${
              isOpen ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
            }`}
          >
            {isOpen ? "Terbuka" : "Ditutup"}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
            <Wallet className="h-4 w-4" /> {budgetLabel(job.budgetMinIDR, job.budgetMaxIDR)}
          </span>
          {job.category && (
            <span className="inline-flex items-center gap-1.5">
              <Tag className="h-4 w-4" /> {job.category.name}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4" /> {job.proposals.length} penawaran
          </span>
          <span>Diposting {formatDate(job.createdAt)}</span>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t pt-4">
          <div className="relative h-9 w-9 overflow-hidden rounded-full bg-secondary">
            {job.client.image ? (
              <Image src={job.client.image} alt="" fill sizes="36px" className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs font-semibold">
                {initials(job.client.name)}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Diposting oleh</p>
            <p className="text-sm font-medium">{job.client.name}</p>
          </div>
        </div>

        <div className="mt-5">
          <h2 className="mb-1 text-sm font-semibold">Deskripsi</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {job.description}
          </p>
        </div>
      </div>

      {/* Area aksi */}
      <div className="mt-6">
        {isOwner ? (
          <section>
            <h2 className="mb-3 text-lg font-semibold">Penawaran masuk ({job.proposals.length})</h2>
            {job.proposals.length === 0 ? (
              <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                Belum ada penawaran. Tunggu freelancer mengirim penawaran.
              </p>
            ) : (
              <div className="space-y-3">
                {job.proposals.map((p) => (
                  <div key={p.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/freelancer/${p.freelancer.id}`} className="flex items-center gap-2">
                        <div className="relative h-9 w-9 overflow-hidden rounded-full bg-secondary">
                          {p.freelancer.image ? (
                            <Image src={p.freelancer.image} alt="" fill sizes="36px" className="object-cover" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-xs font-semibold">
                              {initials(p.freelancer.name)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium hover:text-primary">{p.freelancer.name}</p>
                          {p.freelancer.freelancerProfile?.headline && (
                            <p className="text-xs text-muted-foreground">
                              {p.freelancer.freelancerProfile.headline}
                            </p>
                          )}
                        </div>
                      </Link>
                      <LevelBadge level={p.freelancer.freelancerProfile?.level ?? "NEW"} className="ml-1" />
                      <span className="ml-auto font-bold text-primary">{formatIDR(p.priceIDR)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm">{p.message}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PROPOSAL_BADGE[p.status]}`}>
                        {PROPOSAL_LABEL[p.status]}
                      </span>
                      {isOpen && p.status === "PENDING" && (
                        <AcceptProposalButton proposalId={p.id} jobId={job.id} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : myProposal ? (
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Penawaranmu</h3>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${PROPOSAL_BADGE[myProposal.status]}`}>
                {PROPOSAL_LABEL[myProposal.status]}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{myProposal.message}</p>
            <p className="mt-2 text-sm font-bold text-primary">{formatIDR(myProposal.priceIDR)}</p>
            {myProposal.status === "ACCEPTED" && (
              <p className="mt-2 text-sm text-success">
                🎉 Penawaranmu diterima! Hubungi client untuk melanjutkan.
              </p>
            )}
          </div>
        ) : isOpen ? (
          user ? (
            <ProposalForm jobId={job.id} />
          ) : (
            <div className="rounded-xl border bg-card p-5 text-center">
              <p className="text-sm text-muted-foreground">Masuk untuk mengirim penawaran.</p>
              <Link
                href={`/login?callbackUrl=/jobs/${job.id}`}
                className="mt-2 inline-block font-medium text-primary hover:underline"
              >
                Masuk / Daftar
              </Link>
            </div>
          )
        ) : (
          <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            Pekerjaan ini sudah ditutup.
          </p>
        )}
      </div>
    </div>
  );
}
