import Image from "next/image";
import Link from "next/link";

import { listAllGigs } from "@/server/services/admin-service";
import { formatIDR } from "@/lib/money";
import { GigModerationButtons } from "@/components/admin/gig-moderation-buttons";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Aktif",
  PAUSED: "Dijeda",
  DRAFT: "Draf",
  PENDING_REVIEW: "Menunggu",
  REJECTED: "Ditolak",
};

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  PAUSED: "bg-amber-100 text-amber-700",
  REJECTED: "bg-red-100 text-red-700",
  PENDING_REVIEW: "bg-blue-100 text-blue-700",
  DRAFT: "bg-muted text-muted-foreground",
};

export default async function AdminGigsPage() {
  const gigs = await listAllGigs();

  return (
    <div>
      <h2 className="text-lg font-semibold">Moderasi Jasa</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Aktifkan, jeda, atau tolak jasa yang melanggar aturan.
      </p>

      {gigs.length === 0 ? (
        <p className="rounded-xl border border-dashed py-12 text-center text-muted-foreground">
          Belum ada jasa.
        </p>
      ) : (
        <div className="space-y-3">
          {gigs.map((g) => (
            <div key={g.id} className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-3">
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                {g.coverImage && (
                  <Image src={g.coverImage} alt="" fill sizes="80px" className="object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/gig/${g.slug}`} target="_blank" className="truncate font-medium hover:text-primary">
                  {g.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {g.freelancer.name} · {g.category?.name ?? "Tanpa kategori"} · Mulai{" "}
                  {formatIDR(g.packages[0]?.priceIDR ?? 0)}
                </p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[g.status] ?? ""}`}>
                  {STATUS_LABEL[g.status] ?? g.status}
                </span>
              </div>
              <GigModerationButtons gigId={g.id} status={g.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
