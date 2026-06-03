import Link from "next/link";
import { ShoppingBag, Store, Wallet, Star, Plus, Search } from "lucide-react";

import { requireUser } from "@/server/auth-helpers";
import { listClientOrders, listFreelancerOrders } from "@/server/services/order-service";
import { getWallet } from "@/server/services/wallet-service";
import { getMyProfile } from "@/server/services/profile-service";
import { formatIDR } from "@/lib/money";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const isFreelancer = user.role === "FREELANCER" || user.role === "ADMIN";

  const clientOrders = await listClientOrders(user.id);
  const activeClient = clientOrders.filter(
    (o) => !["COMPLETED", "CANCELLED"].includes(o.status),
  );

  return (
    <div className="container max-w-5xl py-8">
      <h1 className="text-2xl font-bold">Halo, {user.name?.split(" ")[0] ?? "👋"}</h1>
      <p className="text-sm text-muted-foreground">Selamat datang kembali di Worq.</p>

      {isFreelancer && <FreelancerSummary userId={user.id} />}

      {/* Pesanan sebagai client */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pesanan aktif</h2>
          <Link href="/orders" className="text-sm text-primary hover:underline">Lihat semua</Link>
        </div>
        {activeClient.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Belum ada pesanan aktif.</p>
            <Button asChild size="sm">
              <Link href="/search"><Search className="mr-2 h-4 w-4" /> Cari jasa</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {activeClient.slice(0, 5).map((o) => (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 hover:shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{o.gig.title}</p>
                  <p className="text-xs text-muted-foreground">oleh {o.freelancer.name}</p>
                </div>
                <OrderStatusBadge status={o.status} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

async function FreelancerSummary({ userId }: { userId: string }) {
  const [orders, wallet, profile] = await Promise.all([
    listFreelancerOrders(userId),
    getWallet(userId),
    getMyProfile(userId),
  ]);
  const active = orders.filter((o) => ["IN_PROGRESS", "REVISION_REQUESTED", "DELIVERED"].includes(o.status));

  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Wallet} label="Saldo tersedia" value={formatIDR(wallet.availableIDR)} href="/sell/wallet" />
        <StatCard icon={Store} label="Order aktif" value={String(active.length)} href="/sell/orders" />
        <StatCard
          icon={Star}
          label="Rating"
          value={profile && profile.ratingCount > 0 ? `${profile.ratingAvg.toFixed(1)} (${profile.ratingCount})` : "Baru"}
          href="/sell"
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild size="sm"><Link href="/sell/gigs/new"><Plus className="mr-2 h-4 w-4" /> Buat jasa baru</Link></Button>
        <Button asChild size="sm" variant="outline"><Link href="/sell">Dashboard freelancer</Link></Button>
      </div>
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link href={href} className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </Link>
  );
}
