"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  LogOut,
  LayoutDashboard,
  ShoppingBag,
  Store,
  ShieldCheck,
  Wallet,
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
  const [, startTransition] = useTransition();
  const initials = (name ?? email ?? "U").slice(0, 2).toUpperCase();
  const isFreelancer = role === "FREELANCER" || role === "ADMIN";

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
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard /> Dasbor
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/orders">
            <ShoppingBag /> Pesanan Saya
          </Link>
        </DropdownMenuItem>
        {isFreelancer && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/sell">
                <Store /> Kelola Jasa
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/sell/wallet">
                <Wallet /> Dompet
              </Link>
            </DropdownMenuItem>
          </>
        )}
        {role === "ADMIN" && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <ShieldCheck /> Panel Admin
            </Link>
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
