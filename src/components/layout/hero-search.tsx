"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSearch() {
  const router = useRouter();
  return (
    <form
      className="flex w-full max-w-xl items-center gap-2 rounded-full bg-white p-1.5 shadow-lg"
      onSubmit={(e) => {
        e.preventDefault();
        const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
        router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
      }}
    >
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          name="q"
          placeholder="Coba 'desain logo' atau 'penerjemah'"
          className="w-full bg-transparent py-2.5 pl-12 pr-3 text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      <Button type="submit" size="lg" className="rounded-full px-6">
        Cari
      </Button>
    </form>
  );
}
