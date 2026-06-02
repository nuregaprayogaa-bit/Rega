import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { requireUser } from "@/server/auth-helpers";
import { listOrders } from "@/server/services/order-service";
import { formatIDR } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  PAID: { label: "Lunas", variant: "success" },
  PENDING: { label: "Menunggu", variant: "warning" },
  FAILED: { label: "Gagal", variant: "destructive" },
  EXPIRED: { label: "Kedaluwarsa", variant: "secondary" },
  CANCELLED: { label: "Dibatalkan", variant: "secondary" },
};

export default async function OrdersPage() {
  const user = await requireUser("/orders");
  const orders = await listOrders(user.id);

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-bold">Riwayat Pesanan</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-20 text-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">Belum ada pesanan.</p>
          <Button asChild>
            <Link href="/search">Jelajahi Katalog</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Pesanan</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => {
                const s = STATUS[o.status] ?? STATUS.PENDING!;
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">
                      {o.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(o.createdAt).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell className="text-sm">{o.items.length} item</TableCell>
                    <TableCell className="text-sm font-medium">
                      {formatIDR(o.total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/orders/${o.id}`}>Detail</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
