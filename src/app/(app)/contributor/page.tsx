import Link from "next/link";
import Image from "next/image";
import { Upload, TrendingUp, Image as ImageIcon, Wallet } from "lucide-react";

import { requireRole } from "@/server/auth-helpers";
import {
  getContributorStats,
  listContributorEarnings,
} from "@/server/services/contributor-service";
import { listContributorAssets } from "@/server/services/asset-service";
import { assetPreviewUrl } from "@/lib/asset-display";
import { formatIDR } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, { label: string; variant: "success" | "warning" | "destructive" }> = {
  APPROVED: { label: "Tayang", variant: "success" },
  PENDING: { label: "Menunggu", variant: "warning" },
  REJECTED: { label: "Ditolak", variant: "destructive" },
};

export default async function ContributorDashboardPage() {
  const user = await requireRole(["CONTRIBUTOR", "ADMIN"], "/contributor");
  const [stats, assets, earnings] = await Promise.all([
    getContributorStats(user.id),
    listContributorAssets(user.id),
    listContributorEarnings(user.id),
  ]);

  const statCards = [
    { label: "Total Upload", value: stats.uploads, icon: ImageIcon },
    { label: "Tayang", value: stats.approved, icon: TrendingUp },
    { label: "Penjualan", value: stats.salesCount, icon: Upload },
  ];

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dasbor Kontributor</h1>
          <p className="text-sm text-muted-foreground">
            Statistik karya & estimasi penghasilanmu.
          </p>
        </div>
        <Button asChild>
          <Link href="/contributor/upload">
            <Upload className="h-4 w-4" /> Unggah Karya
          </Link>
        </Button>
      </div>

      {/* Earning utama */}
      <Card className="mb-4 bg-primary text-primary-foreground">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="flex items-center gap-2 text-sm opacity-90">
              <Wallet className="h-4 w-4" /> Estimasi Penghasilan Bersih
            </p>
            <p className="mt-1 text-3xl font-bold">{formatIDR(stats.netEarning)}</p>
            <p className="mt-1 text-xs opacity-80">
              dari {formatIDR(stats.grossTotal)} penjualan kotor · potongan platform{" "}
              {formatIDR(stats.platformFeeTotal)}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mb-8 grid grid-cols-3 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <s.icon className="mb-1 h-5 w-5 text-primary" />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Riwayat penjualan */}
      <h2 className="mb-3 text-lg font-semibold">Riwayat Penjualan</h2>
      {earnings.length === 0 ? (
        <div className="mb-8 rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
          Belum ada penjualan.
        </div>
      ) : (
        <div className="mb-8 rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Karya</TableHead>
                <TableHead>Lisensi</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Earning Bersih</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {earnings.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="max-w-[200px] truncate text-sm">
                    {e.orderItem.asset.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{e.orderItem.licenseType}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatIDR(e.grossAmount)}</TableCell>
                  <TableCell className="text-sm font-medium text-emerald-600">
                    {formatIDR(e.netEarning)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {e.orderItem.order.paidAt
                      ? new Date(e.orderItem.order.paidAt).toLocaleDateString("id-ID")
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Karya saya */}
      <h2 className="mb-3 text-lg font-semibold">Karya Saya ({assets.length})</h2>
      {assets.length === 0 ? (
        <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
          Belum ada karya. Mulai unggah karya pertamamu!
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((a) => {
            const badge = STATUS_BADGE[a.status] ?? STATUS_BADGE.PENDING!;
            return (
              <div key={a.id} className="overflow-hidden rounded-lg border">
                <div className="relative aspect-[4/3] bg-muted">
                  <Image
                    src={assetPreviewUrl(a)}
                    alt={a.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                  />
                  <Badge className="absolute left-2 top-2" variant={badge.variant}>
                    {badge.label}
                  </Badge>
                </div>
                <div className="p-2">
                  <p className="line-clamp-1 text-sm font-medium">{a.title}</p>
                  {a.status === "REJECTED" && a.rejectionReason && (
                    <p className="mt-1 line-clamp-2 text-xs text-red-600">
                      Ditolak: {a.rejectionReason}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
