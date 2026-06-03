import Link from "next/link";
import Image from "next/image";
import { Briefcase, FilePlus2, Users } from "lucide-react";

import { listOpenJobs } from "@/server/services/job-service";
import { getCurrentUser } from "@/server/auth-helpers";
import { formatIDR } from "@/lib/money";
import { formatDate, initials } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function budgetLabel(min: number | null, max: number | null) {
  if (min != null && max != null) return `${formatIDR(min)} – ${formatIDR(max)}`;
  if (max != null) return `Maks ${formatIDR(max)}`;
  if (min != null) return `Min ${formatIDR(min)}`;
  return "Anggaran fleksibel";
}

export default async function JobsPage() {
  const [jobs, user] = await Promise.all([listOpenJobs(), getCurrentUser()]);

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Briefcase className="h-6 w-6 text-primary" /> Papan Pekerjaan
          </h1>
          <p className="text-sm text-muted-foreground">
            Client memposting kebutuhan, freelancer mengirim penawaran.
          </p>
        </div>
        <Button asChild>
          <Link href={user ? "/jobs/new" : "/login?callbackUrl=/jobs/new"}>
            <FilePlus2 className="mr-2 h-4 w-4" /> Posting Pekerjaan
          </Link>
        </Button>
      </div>

      {jobs.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <Briefcase className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Belum ada pekerjaan terbuka</p>
          <p className="text-sm text-muted-foreground">Jadilah yang pertama memposting kebutuhan.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {jobs.map((j) => (
            <Link
              key={j.id}
              href={`/jobs/${j.id}`}
              className="block rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold leading-snug hover:text-primary">{j.title}</h2>
                {j.category && (
                  <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                    {j.category.name}
                  </span>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{j.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {budgetLabel(j.budgetMinIDR, j.budgetMaxIDR)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <div className="relative h-4 w-4 overflow-hidden rounded-full bg-secondary">
                    {j.client.image ? (
                      <Image src={j.client.image} alt="" fill sizes="16px" className="object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[8px] font-semibold">
                        {initials(j.client.name)}
                      </span>
                    )}
                  </div>
                  {j.client.name}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {j._count.proposals} penawaran
                </span>
                <span>{formatDate(j.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
