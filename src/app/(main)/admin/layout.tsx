import Link from "next/link";
import { LayoutDashboard, Package, FolderTree, Users, ShieldCheck } from "lucide-react";

import { requireRole } from "@/server/auth-helpers";
import { Role } from "@prisma/client";

const NAV = [
  { href: "/admin", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/admin/gigs", label: "Moderasi Jasa", icon: Package },
  { href: "/admin/categories", label: "Kategori", icon: FolderTree },
  { href: "/admin/users", label: "Pengguna", icon: Users },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole([Role.ADMIN]);

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center gap-2">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Panel Admin</h1>
      </div>
      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
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
