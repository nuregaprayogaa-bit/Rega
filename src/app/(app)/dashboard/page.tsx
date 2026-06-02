import Link from "next/link";
import { Upload, ShieldCheck, Download, ShoppingBag, Image as ImageIcon } from "lucide-react";

import { requireUser } from "@/server/auth-helpers";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ROLE_LABEL: Record<string, string> = {
  BUYER: "Pembeli",
  CONTRIBUTOR: "Kontributor",
  ADMIN: "Admin",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const isContributor = user.role === "CONTRIBUTOR" || user.role === "ADMIN";
  const isAdmin = user.role === "ADMIN";

  const cards = [
    {
      href: "/search",
      title: "Jelajahi Katalog",
      desc: "Cari foto & video stok untuk kebutuhanmu.",
      icon: ImageIcon,
      show: true,
    },
    {
      href: "/downloads",
      title: "Unduhan Saya",
      desc: "Akses file yang sudah kamu beli.",
      icon: Download,
      show: true,
    },
    {
      href: "/orders",
      title: "Riwayat Pesanan",
      desc: "Lihat transaksi dan invoice.",
      icon: ShoppingBag,
      show: true,
    },
    {
      href: "/contributor",
      title: "Dasbor Kontributor",
      desc: "Statistik upload, penjualan, dan estimasi earning.",
      icon: Upload,
      show: isContributor,
    },
    {
      href: "/admin",
      title: "Panel Admin",
      desc: "Moderasi karya yang masuk.",
      icon: ShieldCheck,
      show: isAdmin,
    },
  ].filter((c) => c.show);

  return (
    <div className="container py-10">
      <div className="mb-8 flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            Halo, {user.name ?? "Pengguna"} 👋
          </h1>
          <p className="text-muted-foreground">Selamat datang di dasbor Nusagraf.</p>
        </div>
        <Badge variant="secondary">{ROLE_LABEL[user.role]}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="h-full transition-colors hover:border-primary">
              <CardHeader>
                <c.icon className="mb-2 h-6 w-6 text-primary" />
                <CardTitle className="text-lg">{c.title}</CardTitle>
                <CardDescription>{c.desc}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
