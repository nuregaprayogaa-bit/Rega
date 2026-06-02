"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { formatIDR, calcPPN } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/components/cart/cart-context";
import { checkoutAction } from "@/app/(app)/checkout/actions";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        opts: {
          onSuccess?: () => void;
          onPending?: () => void;
          onError?: () => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

export function CheckoutClient({
  ppnPercent,
  snapEnabled,
}: {
  ppnPercent: number;
  snapEnabled: boolean;
}) {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const [loading, setLoading] = useState(false);

  const ppn = calcPPN(subtotal, ppnPercent);
  const total = subtotal + ppn;

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
        Keranjang kosong.{" "}
        <Link href="/search" className="text-primary">
          Jelajahi katalog
        </Link>
        .
      </div>
    );
  }

  async function pay() {
    setLoading(true);
    try {
      const res = await checkoutAction(
        items.map((i) => ({ assetId: i.assetId, licenseType: i.licenseType })),
      );
      if (!res.ok) {
        toast.error(res.error);
        setLoading(false);
        return;
      }

      if (res.simulated) {
        clear();
        toast.success("Pembayaran berhasil (mode simulasi)");
        router.push(`/orders/${res.orderId}?status=success`);
        return;
      }

      if (res.snapToken && window.snap) {
        window.snap.pay(res.snapToken, {
          onSuccess: () => {
            clear();
            router.push(`/orders/${res.orderId}?status=success`);
          },
          onPending: () => router.push(`/orders/${res.orderId}?status=pending`),
          onError: () => toast.error("Pembayaran gagal"),
          onClose: () => setLoading(false),
        });
      } else if (res.redirectUrl) {
        window.location.href = res.redirectUrl;
      } else {
        toast.error("Tidak dapat memulai pembayaran.");
        setLoading(false);
      }
    } catch {
      toast.error("Terjadi kesalahan. Coba lagi.");
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-3">
        {items.map((i) => (
          <div
            key={`${i.assetId}-${i.licenseType}`}
            className="flex items-center gap-3 rounded-lg border p-3"
          >
            <div className="relative h-14 w-18 shrink-0 overflow-hidden rounded bg-muted">
              <Image src={i.previewUrl} alt={i.title} fill sizes="72px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-medium">{i.title}</p>
              <p className="text-xs text-muted-foreground">Lisensi {i.licenseType}</p>
            </div>
            <span className="text-sm font-semibold">{formatIDR(i.price)}</span>
          </div>
        ))}
      </div>

      <aside>
        <Card>
          <CardContent className="space-y-3 p-5">
            <h2 className="font-semibold">Pembayaran</h2>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatIDR(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">PPN {ppnPercent}%</span>
                <span>{formatIDR(ppn)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>{formatIDR(total)}</span>
              </div>
            </div>

            <Button className="w-full" onClick={pay} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Memproses...
                </>
              ) : (
                "Bayar Sekarang"
              )}
            </Button>

            {!snapEnabled && (
              <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-800">
                Mode simulasi aktif (Midtrans belum dikonfigurasi). Pembayaran
                akan langsung dianggap berhasil untuk keperluan uji coba.
              </p>
            )}
            {snapEnabled && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <ShieldCheck className="h-3 w-3" /> Pembayaran aman via Midtrans
                (QRIS, VA, e-wallet, kartu).
              </p>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
