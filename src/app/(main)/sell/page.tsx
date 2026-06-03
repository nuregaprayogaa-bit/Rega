import Link from "next/link";
import { Wallet, Clock, CheckCircle2, Star, Plus, Package } from "lucide-react";

import { requireRole } from "@/server/auth-helpers";
import { listFreelancerOrders } from "@/server/services/order-service";
import { getWallet } from "@/server/services/wallet-service";
import { getMyProfile } from "@/server/services/profile-service";
import { listMyGigs } from "@/server/services/gig-service";
import { Role } from "@prisma/client";
import { formatIDR } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/order/order-status-badge";

export const dynamic = "force-dynamic";

export default async function SellHomePage() {
  const user = await requireRole([Role.FREELANCER, Role.ADMIN]);
  const [orders, wallet, profile, gigs] = await Promise.all([
    listFreelancerOrders(user.id),
    getWallet(user.id),
    getMyProfile(user.id),
    listMyGigs(user.id),
  ]);

  const active = orders.filter((o) =>
    ["IN_PROGRESS", "REVISION_REQUESTED", "DELIVERED"].includes(o.status),
  );
  const needAction = orders.filter((o) =>
    ["IN_PROGRESS", "REVISION_REQUESTED"].includes(o.status),
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Freelancer</h1>
          <p className="text-sm text-muted-foreground">Pantau jasa, order, dan penghasilanmu</p>
        </div>
        <Button asChild className="hidden sm:inline-flex">
          <Link href="/sell/gigs/new"><Plus className="mr-2 h-4 w-4" /> Buat jasa</Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Wallet} label="Saldo tersedia" value={formatIDR(wallet.availableIDR)} hint={`Pending ${formatIDR(wallet.pendingIDR)}`} />
        <Stat icon={Clock} label="Order aktif" value={String(active.length)} />
        <Stat icon={CheckCircle2} label="Order selesai" value={String(profile?.completedOrders ?? 0)} />
        <Stat
          icon={Star}
          label="Rating"
          value={profile && profile.ratingCount > 0 ? profile.ratingAvg.toFixed(1) : "—"}
          hint={profile && profile.ratingCount > 0 ? `${profile.ratingCount} ulasan` : "Belum ada ulasan"}
        />
      </div>

      {/* Perlu tindakan */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Perlu dikerjakan</h2>
        {needAction.length === 0 ? (
          <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            Tidak ada order yang menunggu. 🎉
          </p>
        ) : (
          <div className="space-y-2">
            {needAction.map((o) => (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 hover:shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{o.gig.title}</p>
                  <p className="text-xs text-muted-foreground">dari {o.client.name}</p>
                </div>
                <OrderStatusBadge status={o.status} />
              </Link>
            ))}
          </div>
        )}
      </section>

      {gigs.length === 0 && (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-dashed py-12 text-center">
          <Package className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Kamu belum punya jasa</p>
          <p className="text-sm text-muted-foreground">Buat jasa pertama untuk mulai menerima order.</p>
          <Button asChild><Link href="/sell/gigs/new">Buat jasa</Link></Button>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
