"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  LayoutDashboard,
  ShoppingBag,
  Store,
  ShieldCheck,
  Wallet,
  Heart,
  FilePlus2,
  MessageCircle,
} from "lucide-react";
import type { Role } from "@prisma/client";

import { logoutAction } from "@/app/actions/session";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  name: string | null;
  email: string | null;
  image: string | null;
  role: Role;
};

export function UserMenu({ name, email, image, role }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const initials = (name ?? email ?? "U").slice(0, 2).toUpperCase();
  const isFreelancer = role === "FREELANCER" || role === "ADMIN";

  // Navigasi programatik: lebih andal di perangkat sentuh (HP) daripada
  // Link di dalam item dropdown Radix.
  const go = (href: string) => (e: Event) => {
    e.preventDefault();
    router.push(href);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar>
          {image && <AvatarImage src={image} alt={name ?? ""} />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="font-medium">{name ?? "Pengguna"}</span>
            <span className="text-xs font-normal text-muted-foreground">{email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={go("/dashboard")}>
          <LayoutDashboard /> Dasbor
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={go("/messages")}>
          <MessageCircle /> Pesan
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={go("/orders")}>
          <ShoppingBag /> Pesanan Saya
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={go("/wishlist")}>
          <Heart /> Favorit
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={go("/jobs/new")}>
          <FilePlus2 /> Posting Pekerjaan
        </DropdownMenuItem>
        {isFreelancer && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={go("/sell")}>
              <Store /> Kelola Jasa
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={go("/sell/wallet")}>
              <Wallet /> Dompet
            </DropdownMenuItem>
          </>
        )}
        {role === "ADMIN" && (
          <DropdownMenuItem onSelect={go("/admin")}>
            <ShieldCheck /> Panel Admin
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            startTransition(() => {
              void logoutAction();
            });
          }}
        >
          <LogOut /> Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
