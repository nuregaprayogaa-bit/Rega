import Link from "next/link";
import { Heart } from "lucide-react";

import { requireUser } from "@/server/auth-helpers";
import { listWishlist } from "@/server/services/wishlist-service";
import { GigCard } from "@/components/gig/gig-card";
import { Button } from "@/components/ui/button";
import type { GigCardData } from "@/server/services/catalog-service";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const user = await requireUser("/wishlist");
  const items = await listWishlist(user.id);

  const gigs: GigCardData[] = items.map(({ gig }) => ({
    id: gig.id,
    slug: gig.slug,
    title: gig.title,
    coverImage: gig.coverImage,
    ratingAvg: gig.ratingAvg,
    ratingCount: gig.ratingCount,
    ordersCount: gig.ordersCount,
    startingPrice: gig.packages[0]?.priceIDR ?? 0,
    categoryName: gig.category?.name ?? null,
    freelancer: {
      id: gig.freelancer.id,
      name: gig.freelancer.name,
      image: gig.freelancer.image,
      level: gig.freelancer.freelancerProfile?.level ?? "NEW",
    },
  }));

  return (
    <div className="container py-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Heart className="h-6 w-6 text-destructive" /> Favorit Saya
      </h1>
      <p className="text-sm text-muted-foreground">Jasa yang kamu simpan</p>

      {gigs.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <Heart className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Belum ada favorit</p>
          <p className="text-sm text-muted-foreground">
            Tekan ikon hati pada jasa untuk menyimpannya di sini.
          </p>
          <Button asChild>
            <Link href="/search">Jelajahi jasa</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {gigs.map((g) => (
            <GigCard key={g.id} gig={g} wishlisted />
          ))}
        </div>
      )}
    </div>
  );
}
