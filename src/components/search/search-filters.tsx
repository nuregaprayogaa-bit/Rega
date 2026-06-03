"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string; slug: string };

const PRICE_RANGES = [
  { label: "< Rp 100rb", min: 0, max: 100000 },
  { label: "Rp 100rb – 500rb", min: 100000, max: 500000 },
  { label: "Rp 500rb – 2jt", min: 500000, max: 2000000 },
  { label: "> Rp 2jt", min: 2000000, max: undefined },
];

const DURATIONS = [
  { label: "Express (≤ 1 hari)", days: 1 },
  { label: "Hingga 3 hari", days: 3 },
  { label: "Hingga 7 hari", days: 7 },
  { label: "Hingga 14 hari", days: 14 },
];

export function SearchFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const update = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === "") next.delete(k);
        else next.set(k, v);
      }
      next.delete("page");
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  const activeCat = params.get("category") ?? "";
  const activeMin = params.get("minPrice") ?? "";
  const activeMax = params.get("maxPrice") ?? "";
  const activeRating = params.get("minRating") ?? "";
  const activeDays = params.get("maxDays") ?? "";

  const hasFilters = activeCat || activeMin || activeMax || activeRating || activeDays;

  return (
    <div className="space-y-6 text-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Filter</h2>
        {hasFilters && (
          <button
            onClick={() =>
              update({
                category: undefined,
                minPrice: undefined,
                maxPrice: undefined,
                minRating: undefined,
                maxDays: undefined,
              })
            }
            className="text-xs text-primary hover:underline"
          >
            Reset
          </button>
        )}
      </div>

      {/* Kategori */}
      <FilterGroup title="Kategori">
        <FilterOption
          label="Semua kategori"
          active={!activeCat}
          onClick={() => update({ category: undefined })}
        />
        {categories.map((c) => (
          <FilterOption
            key={c.id}
            label={c.name}
            active={activeCat === c.slug}
            onClick={() => update({ category: c.slug })}
          />
        ))}
      </FilterGroup>

      {/* Harga */}
      <FilterGroup title="Rentang harga">
        {PRICE_RANGES.map((r) => {
          const active = activeMin === String(r.min) && activeMax === String(r.max ?? "");
          return (
            <FilterOption
              key={r.label}
              label={r.label}
              active={active}
              onClick={() =>
                update({
                  minPrice: active ? undefined : String(r.min),
                  maxPrice: active || r.max == null ? undefined : String(r.max),
                })
              }
            />
          );
        })}
      </FilterGroup>

      {/* Rating */}
      <FilterGroup title="Rating minimum">
        {[4.5, 4, 3].map((r) => (
          <button
            key={r}
            onClick={() =>
              update({ minRating: activeRating === String(r) ? undefined : String(r) })
            }
            className={cn(
              "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-secondary",
              activeRating === String(r) && "bg-secondary font-medium",
            )}
          >
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            {r}+ ke atas
          </button>
        ))}
      </FilterGroup>

      {/* Durasi */}
      <FilterGroup title="Waktu pengerjaan">
        {DURATIONS.map((d) => (
          <FilterOption
            key={d.days}
            label={d.label}
            active={activeDays === String(d.days)}
            onClick={() =>
              update({ maxDays: activeDays === String(d.days) ? undefined : String(d.days) })
            }
          />
        ))}
      </FilterGroup>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function FilterOption({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "block w-full rounded-md px-2 py-1.5 text-left transition-colors hover:bg-secondary",
        active && "bg-secondary font-medium text-primary",
      )}
    >
      {label}
    </button>
  );
}
