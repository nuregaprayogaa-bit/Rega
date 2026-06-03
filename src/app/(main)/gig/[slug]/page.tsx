import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Clock, RefreshCw, Check, Minus, MapPin } from "lucide-react";

import { getPublicGigBySlug } from "@/server/services/gig-service";
import { getCurrentUser } from "@/server/auth-helpers";
import { getBuyerServiceFeePercent } from "@/server/services/config";
import { formatIDR } from "@/lib/money";
import { formatDate, initials } from "@/lib/format";
import { PACKAGE_TIER_LABEL, PACKAGE_TIERS } from "@/lib/constants";
import { Stars, RatingSummary } from "@/components/ui/stars";
import { LevelBadge } from "@/components/ui/level-badge";
import { GigGallery } from "@/components/gig/gig-gallery";
import { PackagePanel, type PanelPackage } from "@/components/gig/package-panel";
import { WishlistButton } from "@/components/gig/wishlist-button";
import { isWishlisted } from "@/server/services/wishlist-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const gig = await getPublicGigBySlug(slug);
  if (!gig) return { title: "Jasa tidak ditemukan" };
  return {
    title: gig.title,
    description: gig.description.slice(0, 160),
    openGraph: gig.coverImage ? { images: [gig.coverImage] } : undefined,
  };
}

export default async function GigDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [gig, user, feePercent] = await Promise.all([
    getPublicGigBySlug(slug),
    getCurrentUser(),
    getBuyerServiceFeePercent(),
  ]);
  if (!gig) notFound();

  const images = [gig.coverImage, ...gig.gallery].filter(Boolean) as string[];
  const profile = gig.freelancer.freelancerProfile;
  const panelPackages: PanelPackage[] = gig.packages.map((p) => ({
    id: p.id,
    tier: p.tier,
    title: p.title,
    description: p.description,
    priceIDR: p.priceIDR,
    deliveryDays: p.deliveryDays,
    revisions: p.revisions,
    deliverables: p.deliverables,
  }));

  const isOwner = user?.id === gig.freelancer.id;
  const canOrder = !isOwner;
  const wished = user ? await isWishlisted(user.id, gig.id) : false;

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link href="/search" className="hover:text-primary">Jasa</Link>
        {gig.category && (
          <>
            {" / "}
            <Link href={`/search?category=${gig.category.slug}`} className="hover:text-primary">
              {gig.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Konten utama */}
        <div className="min-w-0 space-y-8">
          <div>
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{gig.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Link href={`/freelancer/${gig.freelancer.id}`} className="flex items-center gap-2">
                <div className="relative h-8 w-8 overflow-hidden rounded-full bg-secondary">
                  {gig.freelancer.image ? (
                    <Image src={gig.freelancer.image} alt="" fill sizes="32px" className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs font-semibold">
                      {initials(gig.freelancer.name)}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium hover:text-primary">{gig.freelancer.name}</span>
              </Link>
              <LevelBadge level={profile?.level ?? "NEW"} />
              <RatingSummary ratingAvg={gig.ratingAvg} ratingCount={gig.ratingCount} />
              <WishlistButton gigId={gig.id} initial={wished} variant="full" className="ml-auto" />
            </div>
          </div>

          <GigGallery images={images} title={gig.title} />

          <section>
            <h2 className="mb-3 text-lg font-semibold">Tentang jasa ini</h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {gig.description}
            </div>
          </section>

          {/* Tabel perbandingan paket */}
          <section>
            <h2 className="mb-3 text-lg font-semibold">Bandingkan paket</h2>
            <PackageComparison packages={gig.packages} />
          </section>

          {/* Tentang freelancer */}
          <section className="rounded-xl border p-5">
            <h2 className="mb-4 text-lg font-semibold">Tentang freelancer</h2>
            <div className="flex items-start gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-secondary">
                {gig.freelancer.image ? (
                  <Image src={gig.freelancer.image} alt="" fill sizes="64px" className="object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-lg font-semibold">
                    {initials(gig.freelancer.name)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link href={`/freelancer/${gig.freelancer.id}`} className="font-semibold hover:text-primary">
                    {gig.freelancer.name}
                  </Link>
                  <LevelBadge level={profile?.level ?? "NEW"} />
                </div>
                {profile?.headline && (
                  <p className="text-sm text-muted-foreground">{profile.headline}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {profile?.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {profile.location}
                    </span>
                  )}
                  <span>Bergabung {formatDate(gig.freelancer.createdAt)}</span>
                  <span>{profile?.completedOrders ?? 0} order selesai</span>
                </div>
                {profile?.bio && <p className="mt-3 text-sm leading-relaxed">{profile.bio}</p>}
                {profile?.skills && profile.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {profile.skills.map((s) => (
                      <span key={s} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Review */}
          <section>
            <h2 className="mb-4 text-lg font-semibold">
              Ulasan ({gig.ratingCount})
            </h2>
            {gig.reviews.length === 0 ? (
              <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                Belum ada ulasan untuk jasa ini.
              </p>
            ) : (
              <div className="space-y-4">
                {gig.reviews.map((r) => (
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
                      <div>
                        <p className="text-sm font-medium">{r.client.name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                      </div>
                      <Stars rating={r.rating} className="ml-auto" />
                    </div>
                    {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
                    {r.freelancerReply && (
                      <div className="mt-2 rounded-lg bg-muted/50 p-3 text-sm">
                        <p className="text-xs font-medium text-muted-foreground">
                          Balasan {gig.freelancer.name}:
                        </p>
                        <p className="mt-0.5">{r.freelancerReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Panel paket (sticky) */}
        <aside>
          <div className="sticky top-20">
            <PackagePanel
              gigId={gig.id}
              packages={panelPackages}
              serviceFeePercent={feePercent}
              canOrder={canOrder}
              isLoggedIn={!!user}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

// Tabel perbandingan paket Basic/Standar/Premium.
function PackageComparison({
  packages,
}: {
  packages: {
    tier: string;
    priceIDR: number;
    deliveryDays: number;
    revisions: number;
    deliverables: string[];
  }[];
}) {
  const byTier = new Map(packages.map((p) => [p.tier, p]));
  const tiers = PACKAGE_TIERS.filter((t) => byTier.has(t));
  // Gabungan semua deliverables untuk baris perbandingan.
  const allDeliverables = Array.from(
    new Set(packages.flatMap((p) => p.deliverables)),
  );

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left">
            <th className="p-3 font-medium text-muted-foreground">Paket</th>
            {tiers.map((t) => (
              <th key={t} className="p-3 text-center font-semibold">
                {PACKAGE_TIER_LABEL[t]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="p-3 text-muted-foreground">Harga</td>
            {tiers.map((t) => (
              <td key={t} className="p-3 text-center font-bold">
                {formatIDR(byTier.get(t)!.priceIDR)}
              </td>
            ))}
          </tr>
          <tr className="border-b">
            <td className="p-3 text-muted-foreground">
              <Clock className="mr-1 inline h-3.5 w-3.5" /> Pengerjaan
            </td>
            {tiers.map((t) => (
              <td key={t} className="p-3 text-center">{byTier.get(t)!.deliveryDays} hari</td>
            ))}
          </tr>
          <tr className="border-b">
            <td className="p-3 text-muted-foreground">
              <RefreshCw className="mr-1 inline h-3.5 w-3.5" /> Revisi
            </td>
            {tiers.map((t) => (
              <td key={t} className="p-3 text-center">{byTier.get(t)!.revisions}x</td>
            ))}
          </tr>
          {allDeliverables.map((d) => (
            <tr key={d} className="border-b last:border-0">
              <td className="p-3 text-muted-foreground">{d}</td>
              {tiers.map((t) => (
                <td key={t} className="p-3 text-center">
                  {byTier.get(t)!.deliverables.includes(d) ? (
                    <Check className="mx-auto h-4 w-4 text-success" />
                  ) : (
                    <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
