"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const OPTIONS: { value: string; label: string }[] = [
  { value: "relevan", label: "Paling relevan" },
  { value: "terlaris", label: "Terlaris" },
  { value: "rating", label: "Rating tertinggi" },
  { value: "termurah", label: "Harga termurah" },
  { value: "termahal", label: "Harga tertinggi" },
  { value: "terbaru", label: "Terbaru" },
];

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("sort") ?? "relevan";

  return (
    <select
      value={current}
      onChange={(e) => {
        const next = new URLSearchParams(params.toString());
        next.set("sort", e.target.value);
        router.push(`${pathname}?${next.toString()}`);
      }}
      className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
