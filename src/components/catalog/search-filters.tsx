"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Category = { name: string; slug: string };

export function SearchFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "ALL") next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.push(`/search?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Select
        value={params.get("type") ?? "ALL"}
        onValueChange={(v) => setParam("type", v)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Tipe" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Semua Tipe</SelectItem>
          <SelectItem value="PHOTO">Foto</SelectItem>
          <SelectItem value="VIDEO">Video</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={params.get("category") ?? "ALL"}
        onValueChange={(v) => setParam("category", v)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Kategori" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Semua Kategori</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.slug} value={c.slug}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
