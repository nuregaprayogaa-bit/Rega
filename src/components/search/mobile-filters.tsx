"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SearchFilters } from "@/components/search/search-filters";

type Category = { id: string; name: string; slug: string };

export function MobileFilters({ categories }: { categories: Category[] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <SlidersHorizontal className="mr-2 h-4 w-4" /> Filter
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filter pencarian</DialogTitle>
        </DialogHeader>
        <SearchFilters categories={categories} />
      </DialogContent>
    </Dialog>
  );
}
