"use client";

import Image from "next/image";
import Link from "next/link";
import { Film, ImageIcon, Plus, Check } from "lucide-react";
import { toast } from "sonner";

import { formatIDR } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-context";

export type AssetCardData = {
  id: string;
  title: string;
  type: "PHOTO" | "VIDEO";
  previewUrl: string;
  priceStandard: number;
  categoryName?: string | null;
};

export function AssetCard({ asset }: { asset: AssetCardData }) {
  const { add, has } = useCart();
  const inCart = has(asset.id, "STANDARD");

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card">
      <Link href={`/asset/${asset.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={asset.previewUrl}
            alt={asset.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <Badge className="absolute left-2 top-2" variant="secondary">
            {asset.type === "VIDEO" ? (
              <Film className="mr-1 h-3 w-3" />
            ) : (
              <ImageIcon className="mr-1 h-3 w-3" />
            )}
            {asset.type === "VIDEO" ? "Video" : "Foto"}
          </Badge>
        </div>
      </Link>
      <div className="p-3">
        <Link href={`/asset/${asset.id}`}>
          <h3 className="line-clamp-1 text-sm font-medium hover:text-primary">
            {asset.title}
          </h3>
        </Link>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-primary">
            {formatIDR(asset.priceStandard)}
          </span>
          <Button
            size="sm"
            variant={inCart ? "secondary" : "default"}
            className="h-7 px-2"
            onClick={() => {
              if (inCart) return;
              add({
                assetId: asset.id,
                licenseType: "STANDARD",
                title: asset.title,
                price: asset.priceStandard,
                previewUrl: asset.previewUrl,
                type: asset.type,
              });
              toast.success("Ditambahkan ke keranjang");
            }}
          >
            {inCart ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
