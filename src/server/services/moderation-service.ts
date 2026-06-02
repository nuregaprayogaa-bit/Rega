import "server-only";
import { AssetStatus } from "@prisma/client";

import { db } from "@/server/db";

/** Daftar asset yang menunggu moderasi (PENDING), terbaru dulu. */
export async function listPendingAssets() {
  return db.asset.findMany({
    where: { status: AssetStatus.PENDING },
    include: {
      category: true,
      prices: true,
      contributor: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function listModerationHistory(limit = 50) {
  return db.asset.findMany({
    where: { status: { in: [AssetStatus.APPROVED, AssetStatus.REJECTED] } },
    include: { contributor: { select: { name: true } } },
    orderBy: { reviewedAt: "desc" },
    take: limit,
  });
}

export async function approveAsset(assetId: string, reviewerId: string) {
  await db.asset.update({
    where: { id: assetId },
    data: {
      status: AssetStatus.APPROVED,
      rejectionReason: null,
      reviewedById: reviewerId,
      reviewedAt: new Date(),
    },
  });
}

export async function rejectAsset(
  assetId: string,
  reviewerId: string,
  reason: string,
) {
  await db.asset.update({
    where: { id: assetId },
    data: {
      status: AssetStatus.REJECTED,
      rejectionReason: reason,
      reviewedById: reviewerId,
      reviewedAt: new Date(),
    },
  });
}

export async function moderationCounts() {
  const [pending, approved, rejected] = await Promise.all([
    db.asset.count({ where: { status: AssetStatus.PENDING } }),
    db.asset.count({ where: { status: AssetStatus.APPROVED } }),
    db.asset.count({ where: { status: AssetStatus.REJECTED } }),
  ]);
  return { pending, approved, rejected };
}
