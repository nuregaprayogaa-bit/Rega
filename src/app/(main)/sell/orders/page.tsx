import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, ChevronRight } from "lucide-react";

import { requireRole } from "@/server/auth-helpers";
import { listFreelancerOrders } from "@/server/services/order-service";
import { Role } from "@prisma/client";
import { formatIDR } from "@/lib/money";
import { formatDate, initials } from "@/lib/format";
import { PACKAGE_TIER_LABEL } from "@/lib/constants";
import { OrderStatusBadge } from "@/components/order/order-status-badge";

export const dynamic = "force-dynamic";

export default async function SellOrdersPage() {
  const user = await requireRole([Role.FREELANCER, Role.ADMIN]);
  const orders = await listFreelancerOrders(user.id);

  return (
    <div>
      <h1 className="text-2xl font-bold">Order Masuk</h1>
      <p className="text-sm text-muted-foreground">Pesanan jasa dari client</p>

      {orders.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Belum ada order masuk</p>
          <p className="text-sm text-muted-foreground">
            Order akan muncul di sini saat ada client memesan jasamu.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="flex items-center gap-4 rounded-xl border bg-card p-3 transition-shadow hover:shadow-sm"
            >
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-secondary">
                {o.client.image ? (
                  <Image src={o.client.image} alt="" fill sizes="44px" className="object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs font-semibold">
                    {initials(o.client.name)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{o.gig.title}</p>
                <p className="text-xs text-muted-foreground">
                  {o.client.name} · Paket {PACKAGE_TIER_LABEL[o.packageTier]} · {formatDate(o.createdAt)}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <OrderStatusBadge status={o.status} />
                  <span className="text-sm font-semibold text-success">
                    +{formatIDR(o.freelancerNetIDR)}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
