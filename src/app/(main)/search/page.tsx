import Link from "next/link";
import { SearchX } from "lucide-react";

import { searchGigs, listCategories, type GigSort } from "@/server/services/catalog-service";
import { getCurrentUser } from "@/server/auth-helpers";
import { getWishlistedIds } from "@/server/services/wishlist-service";
import { GigCard } from "@/components/gig/gig-card";
import { SearchFilters } from "@/components/search/search-filters";
import { MobileFilters } from "@/components/search/mobile-filters";
import { SortSelect } from "@/components/search/sort-select";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type SP = { [key: string]: string | string[] | undefined };

function num(v: string | string[] | undefined): number | undefined {
  if (typeof v !== "string") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const page = num(sp.page) ?? 1;

  const [categories, result] = await Promise.all([
    listCategories(),
    searchGigs({
      q,
      category,
      minPrice: num(sp.minPrice),
      maxPrice: num(sp.maxPrice),
      minRating: num(sp.minRating),
      maxDays: num(sp.maxDays),
      sort: (typeof sp.sort === "string" ? sp.sort : "relevan") as GigSort,
      page,
    }),
  ]);

  const user = await getCurrentUser();
  const wishlisted = user
    ? await getWishlistedIds(user.id, result.items.map((g) => g.id))
    : new Set<string>();

  const catName = categories.find((c) => c.slug === category)?.name;
  const totalPages = Math.ceil(result.total / result.perPage);

  const buildPageHref = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string") params.set(k, v);
    params.set("page", String(p));
    return `/search?${params.toString()}`;
  };

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {q ? `Hasil untuk "${q}"` : catName ? catName : "Semua jasa"}
        </h1>
        <p className="text-sm text-muted-foreground">{result.total} jasa ditemukan</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar filter (desktop) */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-20 rounded-xl border bg-card p-4">
            <SearchFilters categories={categories} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-2">
            <MobileFilters categories={categories} />
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden text-sm text-muted-foreground sm:inline">Urutkan:</span>
              <SortSelect />
            </div>
          </div>

          {result.items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-20 text-center">
              <SearchX className="h-10 w-10 text-muted-foreground" />
              <p className="font-medium">Tidak ada jasa yang cocok</p>
              <p className="text-sm text-muted-foreground">
                Coba ubah kata kunci atau atur ulang filter.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/search">Reset pencarian</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {result.items.map((g) => (
                <GigCard key={g.id} gig={g} wishlisted={wishlisted.has(g.id)} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  asChild
                  size="sm"
                  variant={p === result.page ? "default" : "outline"}
                >
                  <Link href={buildPageHref(p)}>{p}</Link>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
