"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingCart } from "lucide-react";

import { formatIDR, calcPPN } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/components/cart/cart-context";

const LICENSE_LABEL = { STANDARD: "Standard", EXTENDED: "Extended" } as const;

export function CartView({ ppnPercent }: { ppnPercent: number }) {
  const router = useRouter();
  const { items, remove, subtotal } = useCart();
  const ppn = calcPPN(subtotal, ppnPercent);
  const total = subtotal + ppn;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-20 text-center">
        <ShoppingCart className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="font-medium">Keranjangmu kosong</p>
          <p className="text-sm text-muted-foreground">
            Jelajahi katalog dan tambahkan karya favoritmu.
          </p>
        </div>
        <Button asChild>
          <Link href="/search">Jelajahi Katalog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={`${item.assetId}-${item.licenseType}`}>
            <CardContent className="flex items-center gap-4 p-3">
              <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                <Image
                  src={item.previewUrl}
                  alt={item.title}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/asset/${item.assetId}`}
                  className="line-clamp-1 text-sm font-medium hover:text-primary"
                >
                  {item.title}
                </Link>
                <Badge variant="outline" className="mt-1">
                  Lisensi {LICENSE_LABEL[item.licenseType]}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatIDR(item.price)}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-7 text-destructive"
                  onClick={() => remove(item.assetId, item.licenseType)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardContent className="space-y-3 p-5">
            <h2 className="font-semibold">Ringkasan</h2>
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
            <Button className="w-full" onClick={() => router.push("/checkout")}>
              Lanjut ke Pembayaran
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
