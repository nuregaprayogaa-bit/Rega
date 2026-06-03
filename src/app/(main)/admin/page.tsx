import { Users, Briefcase, Package, ShoppingBag } from "lucide-react";

import { getAdminOverview } from "@/server/services/admin-service";
import { formatIDR } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { PayoutButtons, DisputeButtons } from "@/components/admin/admin-buttons";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const data = await getAdminOverview();

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat icon={Users} label="Total user" value={data.users} />
        <Stat icon={Briefcase} label="Freelancer" value={data.freelancers} />
        <Stat icon={Package} label="Jasa" value={data.gigs} />
        <Stat icon={ShoppingBag} label="Order" value={data.orders} />
      </div>

      {/* Payout pending */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Permintaan penarikan dana</h2>
        {data.pendingPayouts.length === 0 ? (
          <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            Tidak ada permintaan penarikan.
          </p>
        ) : (
          <div className="space-y-3">
            {data.pendingPayouts.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
                <div>
                  <p className="font-semibold">{formatIDR(p.amountIDR)}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.user.name} · {p.bankName} {p.accountNo} a.n. {p.accountName}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</p>
                </div>
                <PayoutButtons id={p.id} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sengketa */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Sengketa terbuka</h2>
        {data.openDisputes.length === 0 ? (
          <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            Tidak ada sengketa.
          </p>
        ) : (
          <div className="space-y-3">
            {data.openDisputes.map((d) => (
              <div key={d.id} className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{d.order.gig.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Order #{d.order.code} · diadukan oleh {d.openedBy.name}
                    </p>
                  </div>
                  <DisputeButtons orderId={d.order.id} />
                </div>
                <p className="mt-2 rounded-lg bg-muted/50 p-3 text-sm">{d.reason}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
