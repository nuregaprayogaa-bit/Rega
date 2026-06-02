import "server-only";
import { OrderStatus } from "@prisma/client";

import { db } from "@/server/db";
import { getDownloadUrl, isStorageConfigured } from "@/server/adapters/storage/s3";
import { getDownloadUrlTtl } from "@/server/services/config";
import { slugify } from "@/lib/slug";

/** Apakah user berhak mengunduh file asli asset ini? */
export async function canUserDownload(
  userId: string,
  assetId: string,
): Promise<boolean> {
  const owned = await db.orderItem.findFirst({
    where: {
      assetId,
      order: { buyerId: userId, status: OrderStatus.PAID },
    },
    select: { id: true },
  });
  return Boolean(owned);
}

/** Daftar asset yang sudah dibeli user (bisa diunduh ulang). */
export async function listUserDownloads(userId: string) {
  const items = await db.orderItem.findMany({
    where: { order: { buyerId: userId, status: OrderStatus.PAID } },
    distinct: ["assetId"],
    orderBy: { order: { paidAt: "desc" } },
    select: {
      licenseType: true,
      priceAtPurchase: true,
      order: { select: { id: true, paidAt: true } },
      asset: {
        select: {
          id: true,
          title: true,
          type: true,
          width: true,
          height: true,
          previewFileKey: true,
          watermarkedFileKey: true,
        },
      },
    },
  });
  return items;
}

export type DownloadLinkResult =
  | { ok: true; url: string; simulated: boolean }
  | { ok: false; error: string };

/**
 * Buat presigned URL berbatas waktu untuk file ASLI. Otorisasi diverifikasi
 * di server. File key asli tidak pernah dikirim ke client.
 */
export async function createDownloadLink(
  userId: string,
  assetId: string,
): Promise<DownloadLinkResult> {
  const allowed = await canUserDownload(userId, assetId);
  if (!allowed) {
    return { ok: false, error: "Kamu belum membeli karya ini." };
  }

  const asset = await db.asset.findUnique({
    where: { id: assetId },
    select: { id: true, title: true, originalFileKey: true, type: true },
  });
  if (!asset) return { ok: false, error: "Karya tidak ditemukan." };

  // Catat aktivitas unduh.
  await db.download.create({
    data: { userId, assetId, orderId: "" }, // orderId opsional untuk log re-download
  }).catch(() => {});

  if (!isStorageConfigured()) {
    // Mode demo: belum ada file asli di storage. Beri placeholder agar
    // alur bisa dites end-to-end (gambar resolusi besar).
    return {
      ok: true,
      simulated: true,
      url: `https://picsum.photos/seed/${asset.id}/2400/1600`,
    };
  }

  const ttl = await getDownloadUrlTtl();
  const ext = asset.originalFileKey.split(".").pop() || "jpg";
  const filename = `${slugify(asset.title)}.${ext}`;
  const url = await getDownloadUrl(asset.originalFileKey, ttl, filename);
  return { ok: true, url, simulated: false };
}
