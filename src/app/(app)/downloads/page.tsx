import Image from "next/image";
import Link from "next/link";
import { Download } from "lucide-react";

import { requireUser } from "@/server/auth-helpers";
import { listUserDownloads } from "@/server/services/download-service";
import { assetPreviewUrl } from "@/lib/asset-display";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/downloads/download-button";

export const dynamic = "force-dynamic";

export default async function DownloadsPage() {
  const user = await requireUser("/downloads");
  const items = await listUserDownloads(user.id);

  return (
    <div className="container py-8">
      <h1 className="mb-1 text-2xl font-bold">Unduhan Saya</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        File yang sudah kamu beli. Unduh ulang kapan saja.
      </p>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-20 text-center">
          <Download className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">Belum ada pembelian.</p>
          <Button asChild>
            <Link href="/search">Jelajahi Katalog</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <Card key={it.asset.id}>
              <CardContent className="flex items-center gap-4 p-3">
                <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                  <Image
                    src={assetPreviewUrl(it.asset)}
                    alt={it.asset.title}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/asset/${it.asset.id}`}
                    className="line-clamp-1 text-sm font-medium hover:text-primary"
                  >
                    {it.asset.title}
                  </Link>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline">Lisensi {it.licenseType}</Badge>
                    {it.order.paidAt && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(it.order.paidAt).toLocaleDateString("id-ID")}
                      </span>
                    )}
                  </div>
                </div>
                <DownloadButton assetId={it.asset.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
