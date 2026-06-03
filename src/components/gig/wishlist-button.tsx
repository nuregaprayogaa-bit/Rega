"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { toggleWishlistAction } from "@/app/actions/wishlist";

export function WishlistButton({
  gigId,
  initial,
  variant = "icon",
  className,
}: {
  gigId: string;
  initial: boolean;
  variant?: "icon" | "full";
  className?: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !saved;
    setSaved(next); // optimistik
    startTransition(async () => {
      const res = await toggleWishlistAction(gigId);
      if (res.needLogin) {
        setSaved(!next);
        router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (!res.ok) {
        setSaved(!next);
        toast.error("Gagal menyimpan. Coba lagi.");
        return;
      }
      setSaved(!!res.wishlisted);
      toast.success(res.wishlisted ? "Disimpan ke favorit" : "Dihapus dari favorit");
    });
  }

  if (variant === "full") {
    return (
      <button
        onClick={toggle}
        disabled={isPending}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary",
          saved && "border-destructive/40 text-destructive",
          className,
        )}
      >
        <Heart className={cn("h-4 w-4", saved && "fill-destructive")} />
        {saved ? "Tersimpan" : "Simpan ke favorit"}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      aria-label={saved ? "Hapus dari favorit" : "Simpan ke favorit"}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", saved && "fill-destructive text-destructive")} />
    </button>
  );
}
