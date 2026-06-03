"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Compass,
  Briefcase,
  FilePlus2,
  LayoutDashboard,
  ShoppingBag,
  Heart,
  Store,
  LogOut,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/actions/session";
import { BecomeFreelancerButton } from "@/components/layout/become-freelancer-button";

export function MobileNav({
  loggedIn,
  isFreelancer,
  isClient,
}: {
  loggedIn: boolean;
  isFreelancer: boolean;
  isClient: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const item =
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] gap-2 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Menu</DialogTitle>
        </DialogHeader>

        {/* Pencarian */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
            close();
            router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
          }}
          className="relative mb-1"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            placeholder="Cari jasa..."
            className="w-full rounded-md border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </form>

        <Link href="/search" className={item} onClick={close}>
          <Compass className="h-4 w-4 text-muted-foreground" /> Jelajahi Jasa
        </Link>
        <Link href="/jobs" className={item} onClick={close}>
          <Briefcase className="h-4 w-4 text-muted-foreground" /> Cari Pekerjaan
        </Link>
        {loggedIn && (
          <Link href="/jobs/new" className={item} onClick={close}>
            <FilePlus2 className="h-4 w-4 text-muted-foreground" /> Posting Pekerjaan
          </Link>
        )}

        <div className="my-1 border-t" />

        {loggedIn ? (
          <>
            <Link href="/dashboard" className={item} onClick={close}>
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" /> Dasbor
            </Link>
            <Link href="/orders" className={item} onClick={close}>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" /> Pesanan Saya
            </Link>
            <Link href="/wishlist" className={item} onClick={close}>
              <Heart className="h-4 w-4 text-muted-foreground" /> Favorit
            </Link>
            {isFreelancer && (
              <Link href="/sell" className={item} onClick={close}>
                <Store className="h-4 w-4 text-muted-foreground" /> Dashboard Freelancer
              </Link>
            )}
            {isClient && (
              <BecomeFreelancerButton className={`${item} w-full justify-start text-primary`}>
                <Store className="mr-3 h-4 w-4" /> Jadi Freelancer
              </BecomeFreelancerButton>
            )}
            <button
              className={`${item} w-full text-left text-destructive`}
              onClick={() => {
                close();
                void logoutAction();
              }}
            >
              <LogOut className="h-4 w-4" /> Keluar
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <Button asChild onClick={close}>
              <Link href="/register">Daftar gratis</Link>
            </Button>
            <Button asChild variant="outline" onClick={close}>
              <Link href="/login">Masuk</Link>
            </Button>
            <Button asChild variant="ghost" onClick={close}>
              <Link href="/register?role=freelancer">Jadi Freelancer</Link>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
