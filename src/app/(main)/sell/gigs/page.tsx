import Link from "next/link";
import Image from "next/image";
import { Plus, Package, Eye } from "lucide-react";

import { requireRole } from "@/server/auth-helpers";
import { listMyGigs } from "@/server/services/gig-service";
import { Role } from "@prisma/client";
import { formatIDR } from "@/lib/money";
import { RatingSummary } from "@/components/ui/stars";
import { Button } from "@/components/ui/button";
import { GigRowActions } from "@/components/sell/gig-row-actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Aktif",
  PAUSED: "Dijeda",
  DRAFT: "Draf",
  PENDING_REVIEW: "Menunggu review",
  REJECTED: "Ditolak",
};

export default async function MyGigsPage() {
  const user = await requireRole([Role.FREELANCER, Role.ADMIN]);
  const gigs = await listMyGigs(user.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jasa Saya</h1>
          <p className="text-sm text-muted-foreground">Kelola jasa yang kamu tawarkan</p>
        </div>
        <Button asChild>
          <Link href="/sell/gigs/new"><Plus className="mr-2 h-4 w-4" /> Buat jasa</Link>
        </Button>
      </div>

      {gigs.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Belum ada jasa</p>
          <p className="text-sm text-muted-foreground">Buat jasa pertamamu dan mulai terima order.</p>
          <Button asChild><Link href="/sell/gigs/new">Buat jasa pertama</Link></Button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {gigs.map((g) => {
            const startingPrice = g.packages[0]?.priceIDR ?? 0;
            return (
              <div key={g.id} className="flex items-center gap-4 rounded-xl border bg-card p-3">
                <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {g.coverImage && (
                    <Image src={g.coverImage} alt="" fill sizes="80px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{g.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="rounded-full bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
                      {STATUS_LABEL[g.status] ?? g.status}
                    </span>
                    <span>Mulai {formatIDR(startingPrice)}</span>
                    <RatingSummary ratingAvg={g.ratingAvg} ratingCount={g.ratingCount} size={12} />
                    <span>{g.ordersCount} order</span>
                  </div>
                </div>
                {g.status === "ACTIVE" && (
                  <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
                    <Link href={`/gig/${g.slug}`} target="_blank"><Eye className="h-4 w-4" /></Link>
                  </Button>
                )}
                <GigRowActions gigId={g.id} status={g.status} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
