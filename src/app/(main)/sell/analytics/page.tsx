import Link from "next/link";
import { Wallet, TrendingUp, CheckCircle2, Clock, Star } from "lucide-react";

import { requireRole } from "@/server/auth-helpers";
import { getFreelancerAnalytics } from "@/server/services/analytics-service";
import { Role } from "@prisma/client";
import { formatIDR, formatIDRShort } from "@/lib/money";
import { RatingSummary } from "@/components/ui/stars";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await requireRole([Role.FREELANCER, Role.ADMIN]);
  const a = await getFreelancerAnalytics(user.id);

  const maxMonthly = Math.max(1, ...a.monthly.map((m) => m.total));

  return (
    <div>
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p className="text-sm text-muted-foreground">Ringkasan performa & penghasilanmu</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Wallet} label="Total penghasilan" value={formatIDR(a.totalEarnings)} />
        <Stat icon={TrendingUp} label="Bulan ini" value={formatIDR(a.thisMonthEarnings)} />
        <Stat icon={CheckCircle2} label="Order selesai" value={String(a.completed)} />
        <Stat icon={Clock} label="Order aktif" value={String(a.activeOrders)} />
      </div>

      {/* Grafik pendapatan 6 bulan */}
      <section className="mt-8 rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Pendapatan 6 bulan terakhir</h2>
        <div className="mt-6 flex items-end justify-between gap-2 sm:gap-4" style={{ height: 180 }}>
          {a.monthly.map((m, i) => (
            <div key={i} className="flex flex-1 flex-col items-center justify-end gap-2">
              <span className="text-[10px] font-medium text-muted-foreground">
                {m.total > 0 ? formatIDRShort(m.total) : ""}
              </span>
              <div
                className="w-full rounded-t-md bg-primary/80 transition-all"
                style={{ height: `${Math.max(4, (m.total / maxMonthly) * 140)}px` }}
                title={formatIDR(m.total)}
              />
              <span className="text-xs text-muted-foreground">{m.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Tingkat penyelesaian & rating */}
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Kualitas layanan</h2>
          <div className="mt-4 space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-muted-foreground">Tingkat penyelesaian</span>
                <span className="font-semibold">{a.completionRate}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-success" style={{ width: `${a.completionRate}%` }} />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rating rata-rata</span>
              {a.ratingCount > 0 ? (
                <RatingSummary ratingAvg={a.ratingAvg} ratingCount={a.ratingCount} />
              ) : (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Star className="h-4 w-4" /> Belum ada
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Jasa terlaris */}
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">Jasa terlaris</h2>
          {a.gigs.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Belum ada jasa.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {a.gigs.map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-3 text-sm">
                  <Link href={`/gig/${g.slug}`} target="_blank" className="truncate hover:text-primary">
                    {g.title}
                  </Link>
                  <span className="shrink-0 text-muted-foreground">{g.ordersCount} order</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
