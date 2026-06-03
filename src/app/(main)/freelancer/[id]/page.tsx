import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MapPin, CheckCircle2 } from "lucide-react";

import { getPublicFreelancer } from "@/server/services/profile-service";
import { formatDate, initials } from "@/lib/format";
import { Stars, RatingSummary } from "@/components/ui/stars";
import { LevelBadge } from "@/components/ui/level-badge";
import { GigCard } from "@/components/gig/gig-card";
import type { GigCardData } from "@/server/services/catalog-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getPublicFreelancer(id);
  if (!data) return { title: "Freelancer tidak ditemukan" };
  return {
    title: `${data.user.name} — Freelancer`,
    description: data.user.freelancerProfile?.headline ?? undefined,
  };
}

export default async function FreelancerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getPublicFreelancer(id);
  if (!data) notFound();

  const { user, reviews } = data;
  const profile = user.freelancerProfile;

  const gigCards: GigCardData[] = user.gigs.map((g) => ({
    id: g.id,
    slug: g.slug,
    title: g.title,
    coverImage: g.coverImage,
    ratingAvg: g.ratingAvg,
    ratingCount: g.ratingCount,
    ordersCount: g.ordersCount,
    startingPrice: g.packages[0]?.priceIDR ?? 0,
    categoryName: g.category?.name ?? null,
    freelancer: { id: user.id, name: user.name, image: user.image, level: profile?.level ?? "NEW" },
  }));

  return (
    <div className="container py-8">
      {/* Header profil */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-secondary">
            {user.image ? (
              <Image src={user.image} alt="" fill sizes="96px" className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-semibold">
                {initials(user.name)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <LevelBadge level={profile?.level ?? "NEW"} />
            </div>
            {profile?.headline && (
              <p className="mt-1 text-muted-foreground">{profile.headline}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-muted-foreground sm:justify-start">
              <RatingSummary
                ratingAvg={profile?.ratingAvg ?? 0}
                ratingCount={profile?.ratingCount ?? 0}
              />
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> {profile?.completedOrders ?? 0} order selesai
              </span>
              {profile?.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {profile.location}
                </span>
              )}
              <span>Bergabung {formatDate(user.createdAt)}</span>
            </div>
          </div>
        </div>

        {profile?.bio && (
          <p className="mt-4 text-sm leading-relaxed text-foreground/90">{profile.bio}</p>
        )}
        {profile?.skills && profile.skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {profile.skills.map((s) => (
              <span key={s} className="rounded-full bg-secondary px-3 py-1 text-xs">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Gig */}
      <section className="mt-8">
        <h2 className="mb-4 text-xl font-bold">Jasa oleh {user.name}</h2>
        {gigCards.length === 0 ? (
          <p className="rounded-xl border border-dashed py-12 text-center text-muted-foreground">
            Belum ada jasa aktif.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {gigCards.map((g) => (
              <GigCard key={g.id} gig={g} />
            ))}
          </div>
        )}
      </section>

      {/* Review */}
      {reviews.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold">Ulasan klien</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <div className="relative h-8 w-8 overflow-hidden rounded-full bg-secondary">
                    {r.client.image ? (
                      <Image src={r.client.image} alt="" fill sizes="32px" className="object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs font-semibold">
                        {initials(r.client.name)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.client.name}</p>
                    <p className="text-xs text-muted-foreground">{r.gig.title}</p>
                  </div>
                  <Stars rating={r.rating} className="ml-auto" />
                </div>
                {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
