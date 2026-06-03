import Image from "next/image";
import Link from "next/link";
import { ImageIcon } from "lucide-react";

import { formatIDR } from "@/lib/money";
import { initials } from "@/lib/format";
import { RatingSummary } from "@/components/ui/stars";
import { LevelBadge } from "@/components/ui/level-badge";
import type { GigCardData } from "@/server/services/catalog-service";

export function GigCard({ gig }: { gig: GigCardData }) {
  return (
    <Link
      href={`/gig/${gig.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {gig.coverImage ? (
          <Image
            src={gig.coverImage}
            alt={gig.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}
        {gig.categoryName && (
          <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium backdrop-blur">
            {gig.categoryName}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Freelancer */}
        <div className="flex items-center gap-2">
          <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-secondary">
            {gig.freelancer.image ? (
              <Image src={gig.freelancer.image} alt="" fill className="object-cover" sizes="24px" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-secondary-foreground">
                {initials(gig.freelancer.name)}
              </span>
            )}
          </div>
          <span className="truncate text-xs text-muted-foreground">{gig.freelancer.name}</span>
          <LevelBadge level={gig.freelancer.level} className="ml-auto shrink-0" />
        </div>

        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug group-hover:text-primary">
          {gig.title}
        </h3>

        <RatingSummary ratingAvg={gig.ratingAvg} ratingCount={gig.ratingCount} />

        <div className="mt-auto border-t pt-2">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Mulai dari
          </span>
          <p className="text-base font-bold text-foreground">{formatIDR(gig.startingPrice)}</p>
        </div>
      </div>
    </Link>
  );
}
