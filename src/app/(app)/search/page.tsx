import Link from "next/link";
import type { AssetType } from "@prisma/client";

import { db } from "@/server/db";
import { listApprovedAssets } from "@/server/services/asset-service";
import { assetPreviewUrl } from "@/lib/asset-display";
import { AssetCard, type AssetCardData } from "@/components/catalog/asset-card";
import { SearchBar } from "@/components/layout/search-bar";
import { SearchFilters } from "@/components/catalog/search-filters";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function standardPrice(prices: { licenseType: string; amountIDR: number }[]) {
  return prices.find((p) => p.licenseType === "STANDARD")?.amountIDR ?? 0;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const type = (sp.type as AssetType | undefined) || undefined;
  const categorySlug = sp.category || undefined;
  const page = Number(sp.page ?? 1) || 1;

  const [{ items, total, totalPages }, categories] = await Promise.all([
    listApprovedAssets({ q, type, categorySlug, page }),
    db.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const cards: AssetCardData[] = items.map((a) => ({
    id: a.id,
    title: a.title,
    type: a.type,
    previewUrl: assetPreviewUrl(a),
    priceStandard: standardPrice(a.prices),
    categoryName: a.category?.name ?? null,
  }));

  function pageHref(p: number) {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (type) next.set("type", type);
    if (categorySlug) next.set("category", categorySlug);
    next.set("page", String(p));
    return `/search?${next.toString()}`;
  }

  return (
    <div className="container py-8">
      <div className="mb-6 space-y-4">
        <SearchBar className="w-full md:hidden" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold">
              {q ? `Hasil untuk "${q}"` : "Jelajahi Katalog"}
            </h1>
            <p className="text-sm text-muted-foreground">{total} karya ditemukan</p>
          </div>
          <SearchFilters categories={categories} />
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-lg border border-dashed py-20 text-center text-muted-foreground">
          Tidak ada karya yang cocok. Coba kata kunci atau filter lain.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {cards.map((c) => (
            <AssetCard key={c.id} asset={c} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
            {page > 1 ? <Link href={pageHref(page - 1)}>Sebelumnya</Link> : <span>Sebelumnya</span>}
          </Button>
          <span className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            asChild={page < totalPages}
          >
            {page < totalPages ? (
              <Link href={pageHref(page + 1)}>Berikutnya</Link>
            ) : (
              <span>Berikutnya</span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
