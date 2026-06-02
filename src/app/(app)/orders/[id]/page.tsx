import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Download } from "lucide-react";

import { requireUser } from "@/server/auth-helpers";
import { getOrderForBuyer } from "@/server/services/order-service";
import { formatIDR } from "@/lib/money";
import { APP_NAME } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { status } = await searchParams;
  const order = await getOrderForBuyer(id, user.id);
  if (!order) notFound();

  const isPaid = order.status === "PAID";

  return (
    <div className="container max-w-3xl py-8">
      {status === "success" && isPaid && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <CheckCircle2 className="h-6 w-6" />
          <div>
            <p className="font-semibold">Pembayaran berhasil!</p>
            <p className="text-sm">File-mu sudah bisa diunduh di halaman Unduhan Saya.</p>
          </div>
        </div>
      )}
      {status === "pending" && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <Clock className="h-6 w-6" />
          <p className="text-sm">
            Menunggu pembayaran. Selesaikan pembayaran agar file bisa diunduh.
          </p>
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-bold">Invoice {APP_NAME}</h1>
              <p className="font-mono text-sm text-muted-foreground">
                #{order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <Badge variant={isPaid ? "success" : "warning"}>
              {isPaid ? "LUNAS" : order.status}
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Tanggal</span>
            <span className="text-right">
              {new Date(order.createdAt).toLocaleString("id-ID")}
            </span>
            <span className="text-muted-foreground">Pembeli</span>
            <span className="text-right">{user.name ?? user.email}</span>
            {order.paymentMethod && (
              <>
                <span className="text-muted-foreground">Metode</span>
                <span className="text-right uppercase">{order.paymentMethod}</span>
              </>
            )}
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="min-w-0 flex-1">
                  <Link href={`/asset/${item.asset.id}`} className="hover:text-primary">
                    {item.asset.title}
                  </Link>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {item.licenseType}
                  </span>
                </span>
                <span>{formatIDR(item.priceAtPurchase)}</span>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatIDR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                PPN {Number(order.ppnPercent)}%
              </span>
              <span>{formatIDR(order.ppnAmount)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatIDR(order.total)}</span>
            </div>
          </div>

          {isPaid && (
            <Button className="mt-6 w-full" asChild>
              <Link href="/downloads">
                <Download className="h-4 w-4" /> Buka Unduhan Saya
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
