import "server-only";
import {
  OrderStatus,
  PayoutStatus,
  DisputeStatus,
  GigStatus,
  Role,
} from "@prisma/client";

import { db } from "@/server/db";
import { slugify } from "@/lib/slug";
import { ensureFreelancerSetup } from "@/server/services/auth-service";
import {
  ledgerRelease,
  ledgerRefund,
  ledgerPayoutReverse,
} from "@/server/services/ledger-service";
import { recomputeFreelancerStats } from "@/server/services/profile-service";
import { notify } from "@/server/services/notification-service";
import { NotificationType } from "@prisma/client";

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
  const payout = await db.payoutRequest.findUnique({ where: { id: payoutId } });
  const res = await db.payoutRequest.updateMany({
    where: { id: payoutId, status: PayoutStatus.PENDING },
    data: { status: PayoutStatus.PAID, processedAt: new Date() },
  });
  if (res.count > 0 && payout) {
    await notify({
      userId: payout.userId,
      type: NotificationType.PAYOUT,
      title: "Penarikan dana disetujui ✅",
      body: "Permintaan penarikan danamu telah diproses dan dibayarkan.",
      link: "/sell/wallet",
      email: true,
    });
  }
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

// ============================================================
// MODERASI JASA (gig)
// ============================================================

export async function listAllGigs() {
  return db.gig.findMany({
    include: {
      freelancer: { select: { id: true, name: true, email: true } },
      category: { select: { name: true } },
      packages: { orderBy: { priceIDR: "asc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function setGigStatusByAdmin(
  gigId: string,
  status: GigStatus,
): Promise<{ ok: boolean }> {
  const res = await db.gig.updateMany({ where: { id: gigId }, data: { status } });
  return { ok: res.count > 0 };
}

// ============================================================
// KELOLA KATEGORI
// ============================================================

export async function listCategoriesAdmin() {
  return db.category.findMany({
    include: { _count: { select: { gigs: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(
  name: string,
  icon?: string,
): Promise<{ ok: boolean; error?: string }> {
  const clean = name.trim();
  if (clean.length < 2) return { ok: false, error: "Nama kategori terlalu pendek." };
  const slug = slugify(clean);
  const existing = await db.category.findUnique({ where: { slug } });
  if (existing) return { ok: false, error: "Kategori sudah ada." };
  await db.category.create({ data: { name: clean, slug, icon: icon?.trim() || null } });
  return { ok: true };
}

export async function renameCategory(
  id: string,
  name: string,
): Promise<{ ok: boolean; error?: string }> {
  const clean = name.trim();
  if (clean.length < 2) return { ok: false, error: "Nama kategori terlalu pendek." };
  await db.category.update({ where: { id }, data: { name: clean } });
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<{ ok: boolean; error?: string }> {
  const count = await db.gig.count({ where: { categoryId: id } });
  if (count > 0) {
    return { ok: false, error: "Kategori masih dipakai oleh jasa. Pindahkan dulu." };
  }
  await db.category.delete({ where: { id } });
  return { ok: true };
}

// ============================================================
// MANAJEMEN USER
// ============================================================

export async function listAllUsers() {
  return db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
      _count: { select: { gigs: true, ordersAsClient: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function setUserRole(
  userId: string,
  role: Role,
): Promise<{ ok: boolean }> {
  await db.user.update({ where: { id: userId }, data: { role } });
  // Saat dijadikan freelancer, pastikan profil & dompet tersedia.
  if (role === Role.FREELANCER || role === Role.ADMIN) {
    await ensureFreelancerSetup(userId);
  }
  return { ok: true };
}
