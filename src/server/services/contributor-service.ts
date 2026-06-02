import "server-only";
import { AssetStatus } from "@prisma/client";

import { db } from "@/server/db";

/** Statistik ringkas untuk dasbor kontributor. */
export async function getContributorStats(contributorId: string) {
  const [uploads, approved, pending, rejected, earningAgg, salesCount] =
    await Promise.all([
      db.asset.count({ where: { contributorId } }),
      db.asset.count({ where: { contributorId, status: AssetStatus.APPROVED } }),
      db.asset.count({ where: { contributorId, status: AssetStatus.PENDING } }),
      db.asset.count({ where: { contributorId, status: AssetStatus.REJECTED } }),
      db.earningLedger.aggregate({
        where: { contributorId },
        _sum: { netEarning: true, grossAmount: true, platformFee: true },
      }),
      db.earningLedger.count({ where: { contributorId } }),
    ]);

  return {
    uploads,
    approved,
    pending,
    rejected,
    salesCount,
    grossTotal: earningAgg._sum.grossAmount ?? 0,
    platformFeeTotal: earningAgg._sum.platformFee ?? 0,
    netEarning: earningAgg._sum.netEarning ?? 0,
  };
}

/** Riwayat earning per penjualan. */
export async function listContributorEarnings(contributorId: string, limit = 50) {
  return db.earningLedger.findMany({
    where: { contributorId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      orderItem: {
        select: {
          licenseType: true,
          asset: { select: { id: true, title: true } },
          order: { select: { paidAt: true } },
        },
      },
    },
  });
}
