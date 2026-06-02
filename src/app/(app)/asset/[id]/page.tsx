import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Film, ImageIcon, User } from "lucide-react";

import { db } from "@/server/db";
import { getApprovedAsset } from "@/server/services/asset-service";
import { getPpnPercent } from "@/server/services/config";
import { assetPreviewUrl } from "@/lib/asset-display";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PurchasePanel } from "@/components/catalog/purchase-panel";

export const dynamic = "force-dynamic";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [asset, ppnPercent, licenseDefs] = await Promise.all([
    getApprovedAsset(id),
    getPpnPercent(),
    db.license.findMany(),
  ]);

  if (!asset) notFound();

  const previewUrl = assetPreviewUrl(asset);
  const licenseInfo = new Map(licenseDefs.map((l) => [l.type, l]));
  const licenses = asset.prices
    .map((p) => {
      const def = licenseInfo.get(p.licenseType);
      return {
        licenseType: p.licenseType as "STANDARD" | "EXTENDED",
        name: def?.name ?? p.licenseType,
        description: def?.description ?? "",
        price: p.amountIDR,
      };
    })
    .sort((a, b) => a.price - b.price);

  return (
    <div className="container py-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted">
            <Image
              src={previewUrl}
              alt={asset.title}
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-contain"
              priority
            />
            <Badge className="absolute left-3 top-3" variant="secondary">
              {asset.type === "VIDEO" ? (
                <Film className="mr-1 h-3 w-3" />
              ) : (
                <ImageIcon className="mr-1 h-3 w-3" />
              )}
              {asset.type === "VIDEO" ? "Video (preview)" : "Foto (preview berwatermark)"}
            </Badge>
          </div>

          <div className="mt-6 space-y-4">
            <h1 className="text-2xl font-bold">{asset.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>oleh {asset.contributor.name ?? "Kontributor"}</span>
              {asset.category && (
                <>
                  <span>·</span>
                  <Link
                    href={`/search?category=${asset.category.slug}`}
                    className="hover:text-primary"
                  >
                    {asset.category.name}
                  </Link>
                </>
              )}
            </div>
            {asset.description && (
              <p className="text-sm leading-relaxed text-foreground/80">
                {asset.description}
              </p>
            )}

            {asset.tags.length > 0 && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  {asset.tags.map(({ tag }) => (
                    <Link key={tag.id} href={`/search?q=${encodeURIComponent(tag.name)}`}>
                      <Badge variant="outline">{tag.name}</Badge>
                    </Link>
                  ))}
                </div>
              </>
            )}
            {(asset.width || asset.height) && (
              <p className="text-xs text-muted-foreground">
                Resolusi: {asset.width} × {asset.height} px
              </p>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <PurchasePanel
            assetId={asset.id}
            title={asset.title}
            type={asset.type}
            previewUrl={previewUrl}
            licenses={licenses}
            ppnPercent={ppnPercent}
          />
          <p className="mt-3 text-center text-xs text-muted-foreground">
            File asli resolusi penuh bisa diunduh setelah pembayaran berhasil.
          </p>
        </aside>
      </div>
    </div>
  );
}
