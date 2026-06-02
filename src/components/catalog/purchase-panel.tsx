"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";

import { formatIDR, calcPPN } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/components/cart/cart-context";

type LicenseOption = {
  licenseType: "STANDARD" | "EXTENDED";
  name: string;
  description: string;
  price: number;
};

type Props = {
  assetId: string;
  title: string;
  type: "PHOTO" | "VIDEO";
  previewUrl: string;
  licenses: LicenseOption[];
  ppnPercent: number;
};

export function PurchasePanel({
  assetId,
  title,
  type,
  previewUrl,
  licenses,
  ppnPercent,
}: Props) {
  const router = useRouter();
  const { add, has } = useCart();
  const [selected, setSelected] = useState<LicenseOption["licenseType"]>(
    licenses[0]?.licenseType ?? "STANDARD",
  );

  const current = licenses.find((l) => l.licenseType === selected) ?? licenses[0];
  const inCart = current ? has(assetId, current.licenseType) : false;

  const { ppn, total } = useMemo(() => {
    const price = current?.price ?? 0;
    const ppnAmount = calcPPN(price, ppnPercent);
    return { ppn: ppnAmount, total: price + ppnAmount };
  }, [current, ppnPercent]);

  if (!current) return null;

  function addToCart() {
    add({
      assetId,
      licenseType: current!.licenseType,
      title,
      price: current!.price,
      previewUrl,
      type,
    });
    toast.success("Ditambahkan ke keranjang");
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="space-y-2">
          <p className="text-sm font-medium">Pilih lisensi</p>
          {licenses.map((l) => (
            <button
              key={l.licenseType}
              type="button"
              onClick={() => setSelected(l.licenseType)}
              className={`w-full rounded-lg border p-3 text-left transition-colors ${
                selected === l.licenseType
                  ? "border-primary bg-primary/5"
                  : "hover:border-muted-foreground/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{l.name}</span>
                <span className="font-semibold">{formatIDR(l.price)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{l.description}</p>
            </button>
          ))}
        </div>

        <Separator />

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Harga</span>
            <span>{formatIDR(current.price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">PPN {ppnPercent}%</span>
            <span>{formatIDR(ppn)}</span>
          </div>
          <div className="flex justify-between pt-1 text-base font-bold">
            <span>Total</span>
            <span>{formatIDR(total)}</span>
          </div>
        </div>

        <div className="space-y-2">
          {inCart ? (
            <Button className="w-full" variant="secondary" onClick={() => router.push("/cart")}>
              <Check className="h-4 w-4" /> Sudah di keranjang — Lihat
            </Button>
          ) : (
            <Button className="w-full" onClick={addToCart}>
              <ShoppingCart className="h-4 w-4" /> Tambah ke Keranjang
            </Button>
          )}
          <Button
            className="w-full"
            variant="outline"
            onClick={() => {
              if (!inCart) addToCart();
              router.push("/checkout");
            }}
          >
            Beli Sekarang
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
