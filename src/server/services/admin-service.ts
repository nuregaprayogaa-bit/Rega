import "server-only";
import {
  OrderStatus,
  PayoutStatus,
  DisputeStatus,
} from "@prisma/client";

import { db } from "@/server/db";
import {
  ledgerRelease,
  ledgerRefund,
  ledgerPayoutReverse,
} from "@/server/services/ledger-service";
import { recomputeFreelancerStats } from "@/server/services/profile-service";

export async function getAdminOverview() {
  const [users, freelancers, gigs, orders, pendingPayouts, openDisputes] =
    await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: "FREELANCER" } }),
      db.gig.count(),
      db.order.count(),
      db.payoutRequest.findMany({
        where: { status: PayoutStatus.PENDING },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      }),
      db.dispute.findMany({
        where: { status: DisputeStatus.OPEN },
        include: {
          order: { select: { id: true, code: true, gig: { select: { title: true } } } },
          openedBy: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

  return { users, freelancers, gigs, orders, pendingPayouts, openDisputes };
}

/** Setujui payout (dana sudah dipotong saat diajukan). */
export async function approvePayout(payoutId: string): Promise<{ ok: boolean }> {
  const res = await db.payoutRequest.updateMany({
    where: { id: payoutId, status: PayoutStatus.PENDING },
    data: { status: PayoutStatus.PAID, processedAt: new Date() },
  });
  return { ok: res.count > 0 };
}

/** Tolak payout: kembalikan saldo ke dompet (+ entri reversal). */
export async function rejectPayout(payoutId: string): Promise<{ ok: boolean }> {
  return db.$transaction(async (tx) => {
    const payout = await tx.payoutRequest.findFirst({
      where: { id: payoutId, status: PayoutStatus.PENDING },
    });
    if (!payout) return { ok: false };
    await tx.payoutRequest.update({
      where: { id: payoutId },
      data: { status: PayoutStatus.REJECTED, processedAt: new Date() },
    });
    await tx.walletAccount.update({
      where: { userId: payout.userId },
      data: { availableIDR: { increment: payout.amountIDR } },
    });
    await ledgerPayoutReverse(tx, {
      id: payout.id,
      userId: payout.userId,
      amountIDR: payout.amountIDR,
    });
    return { ok: true };
  });
}

/** Selesaikan sengketa: rilis dana ke freelancer (menangkan freelancer). */
export async function resolveDisputeRelease(orderId: string): Promise<{ ok: boolean }> {
  const result = await db.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, status: OrderStatus.DISPUTED },
    });
    if (!order) return { ok: false as const };
    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.COMPLETED, completedAt: new Date() },
    });
    await ledgerRelease(tx, order);
    await tx.walletAccount.update({
      where: { userId: order.freelancerId },
      data: {
        pendingIDR: { decrement: order.freelancerNetIDR },
        availableIDR: { increment: order.freelancerNetIDR },
      },
    });
    await tx.gig.update({
      where: { id: order.gigId },
      data: { ordersCount: { increment: 1 } },
    });
    await tx.dispute.update({
      where: { orderId },
      data: { status: DisputeStatus.RESOLVED_RELEASE, resolvedAt: new Date() },
    });
    return { ok: true as const, freelancerId: order.freelancerId };
  });
  if (result.ok) await recomputeFreelancerStats(result.freelancerId);
  return { ok: result.ok };
}

/** Selesaikan sengketa: kembalikan dana ke client (menangkan client). */
export async function resolveDisputeRefund(orderId: string): Promise<{ ok: boolean }> {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, status: OrderStatus.DISPUTED },
    });
    if (!order) return { ok: false };
    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
    });
    await ledgerRefund(tx, order);
    await tx.walletAccount.update({
      where: { userId: order.freelancerId },
      data: { pendingIDR: { decrement: order.freelancerNetIDR } },
    });
    await tx.dispute.update({
      where: { orderId },
      data: { status: DisputeStatus.RESOLVED_REFUND, resolvedAt: new Date() },
    });
    return { ok: true };
  });
}
