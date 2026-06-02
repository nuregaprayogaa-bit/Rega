import { requireRole } from "@/server/auth-helpers";
import {
  listPendingAssets,
  moderationCounts,
} from "@/server/services/moderation-service";
import { assetPreviewUrl } from "@/lib/asset-display";
import {
  ModerationCard,
  type PendingAsset,
} from "@/components/admin/moderation-card";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function standardPrice(prices: { licenseType: string; amountIDR: number }[]) {
  return prices.find((p) => p.licenseType === "STANDARD")?.amountIDR ?? 0;
}

export default async function AdminPage() {
  await requireRole(["ADMIN"], "/admin");
  const [pending, counts] = await Promise.all([
    listPendingAssets(),
    moderationCounts(),
  ]);

  const cards: PendingAsset[] = pending.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    type: a.type,
    previewUrl: assetPreviewUrl(a),
    priceStandard: standardPrice(a.prices),
    categoryName: a.category?.name ?? null,
    contributorName: a.contributor.name,
    sensitiveFlags: a.sensitiveFlags,
    createdAt: a.createdAt.toISOString(),
  }));

  const stats = [
    { label: "Menunggu", value: counts.pending, color: "text-amber-600" },
    { label: "Disetujui", value: counts.approved, color: "text-emerald-600" },
    { label: "Ditolak", value: counts.rejected, color: "text-red-600" },
  ];

  return (
    <div className="container py-8">
      <h1 className="mb-1 text-2xl font-bold">Panel Moderasi</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Tinjau karya yang masuk sebelum tayang di katalog publik.
      </p>

      <div className="mb-8 grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mb-4 text-lg font-semibold">
        Antrian Moderasi ({cards.length})
      </h2>
      {cards.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          Tidak ada karya yang menunggu moderasi. 🎉
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <ModerationCard key={c.id} asset={c} />
          ))}
        </div>
      )}
    </div>
  );
}
