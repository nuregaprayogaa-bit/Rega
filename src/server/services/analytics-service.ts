import "server-only";
import { OrderStatus } from "@prisma/client";

import { db } from "@/server/db";

export type MonthlyEarning = { label: string; total: number };

const MONTHS_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

/** Statistik dasar untuk dashboard analytics freelancer. */
export async function getFreelancerAnalytics(userId: string) {
  const [grouped, completedOrders, gigs, profile] = await Promise.all([
    db.order.groupBy({
      by: ["status"],
      where: { freelancerId: userId, status: { not: OrderStatus.PENDING_PAYMENT } },
      _count: true,
    }),
    db.order.findMany({
      where: { freelancerId: userId, status: OrderStatus.COMPLETED },
      select: { freelancerNetIDR: true, completedAt: true },
    }),
    db.gig.findMany({
      where: { freelancerId: userId },
      select: { id: true, title: true, slug: true, ordersCount: true, ratingAvg: true, ratingCount: true },
      orderBy: { ordersCount: "desc" },
      take: 5,
    }),
    db.freelancerProfile.findUnique({ where: { userId } }),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const g of grouped) statusCounts[g.status] = g._count;

  const totalEarnings = completedOrders.reduce((s, o) => s + o.freelancerNetIDR, 0);

  // Pendapatan 6 bulan terakhir.
  const now = new Date();
  const buckets: MonthlyEarning[] = [];
  const keyOf = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
  const map = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = keyOf(d);
    map.set(key, 0);
    buckets.push({ label: MONTHS_ID[d.getMonth()]!, total: 0 });
  }
  const orderedKeys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    orderedKeys.push(keyOf(d));
  }
  for (const o of completedOrders) {
    if (!o.completedAt) continue;
    const key = `${o.completedAt.getFullYear()}-${o.completedAt.getMonth()}`;
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + o.freelancerNetIDR);
  }
  orderedKeys.forEach((k, idx) => {
    buckets[idx]!.total = map.get(k) ?? 0;
  });

  const thisMonthKey = keyOf(now);
  const thisMonthEarnings = map.get(thisMonthKey) ?? 0;

  const completed = statusCounts[OrderStatus.COMPLETED] ?? 0;
  const cancelled = statusCounts[OrderStatus.CANCELLED] ?? 0;
  const totalForRate = completed + cancelled;
  const completionRate = totalForRate > 0 ? Math.round((completed / totalForRate) * 100) : 100;

  const activeOrders =
    (statusCounts[OrderStatus.IN_PROGRESS] ?? 0) +
    (statusCounts[OrderStatus.REVISION_REQUESTED] ?? 0) +
    (statusCounts[OrderStatus.DELIVERED] ?? 0);

  return {
    totalEarnings,
    thisMonthEarnings,
    completed,
    activeOrders,
    completionRate,
    statusCounts,
    monthly: buckets,
    gigs,
    ratingAvg: profile?.ratingAvg ?? 0,
    ratingCount: profile?.ratingCount ?? 0,
  };
}
