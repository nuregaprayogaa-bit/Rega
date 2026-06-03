import Link from "next/link";
import { LayoutDashboard, Package, ShoppingBag, Wallet, UserCog } from "lucide-react";

import { requireRole } from "@/server/auth-helpers";
import { Role } from "@prisma/client";

const NAV = [
  { href: "/sell", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/sell/gigs", label: "Jasa Saya", icon: Package },
  { href: "/sell/orders", label: "Order Masuk", icon: ShoppingBag },
  { href: "/sell/wallet", label: "Dompet", icon: Wallet },
  { href: "/sell/profile", label: "Profil", icon: UserCog },
];

export default async function SellLayout({ children }: { children: React.ReactNode }) {
  await requireRole([Role.FREELANCER, Role.ADMIN]);

  return (
    <div className="container py-8">
      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          {/* Nav horizontal di mobile, vertikal di desktop */}
          <nav className="flex gap-1 overflow-x-auto no-scrollbar lg:flex-col">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
