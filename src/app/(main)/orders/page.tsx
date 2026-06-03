import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, ChevronRight } from "lucide-react";

import { listClientOrders } from "@/server/services/order-service";
import { requireUser } from "@/server/auth-helpers";
import { formatIDR } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { PACKAGE_TIER_LABEL } from "@/lib/constants";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await requireUser("/orders");
  const orders = await listClientOrders(user.id);

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-2xl font-bold">Pesanan Saya</h1>
      <p className="text-sm text-muted-foreground">Jasa yang kamu pesan</p>

      {orders.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Belum ada pesanan</p>
          <p className="text-sm text-muted-foreground">Yuk cari jasa yang kamu butuhkan.</p>
          <Button asChild>
            <Link href="/search">Jelajahi jasa</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="flex items-center gap-4 rounded-xl border bg-card p-3 transition-shadow hover:shadow-sm"
            >
              <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                {o.gig.coverImage && (
                  <Image src={o.gig.coverImage} alt="" fill sizes="80px" className="object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{o.gig.title}</p>
                <p className="text-xs text-muted-foreground">
                  oleh {o.freelancer.name} · Paket {PACKAGE_TIER_LABEL[o.packageTier]} · {formatDate(o.createdAt)}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <OrderStatusBadge status={o.status} />
                  <span className="text-sm font-semibold">{formatIDR(o.totalIDR)}</span>
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
