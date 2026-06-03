import "server-only";
import {
  GigStatus,
  OrderStatus,
  type PackageTier,
  type Prisma,
} from "@prisma/client";

import { db } from "@/server/db";
import { computeOrderAmounts } from "@/lib/money";
import {
  getBuyerServiceFeePercent,
  getPlatformFeePercent,
  getAutoAcceptDays,
} from "@/server/services/config";
import {
  getPaymentProvider,
  isPaymentConfigured,
} from "@/server/adapters/payment";
import { recomputeFreelancerStats } from "@/server/services/profile-service";
import { notify } from "@/server/services/notification-service";
import { NotificationType } from "@prisma/client";
import {
  ledgerCapture,
  ledgerRelease,
} from "@/server/services/ledger-service";
import {
  checkoutSchema,
  deliverySchema,
  revisionSchema,
  type CheckoutInput,
  type DeliveryInput,
  type RevisionInput,
} from "@/lib/validations/order";

// ============================================================
// STATE MACHINE — transisi yang diizinkan (divalidasi server-side)
// ============================================================
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
  IN_PROGRESS: [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.DISPUTED],
  DELIVERED: [
    OrderStatus.COMPLETED,
    OrderStatus.REVISION_REQUESTED,
    OrderStatus.DISPUTED,
  ],
  REVISION_REQUESTED: [
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
    OrderStatus.DISPUTED,
  ],
  COMPLETED: [],
  CANCELLED: [],
  DISPUTED: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

function generateOrderCode(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RGA-${rand}`;
}

export type CheckoutResult =
  | {
      ok: true;
      orderId: string;
      simulated: boolean;
      snapToken: string | null;
      redirectUrl: string | null;
    }
  | { ok: false; error: string };

/**
 * Buat order dari sebuah paket gig. Harga SELALU diambil ulang dari DB
 * (tidak pernah percaya angka dari client). Membuat order PENDING_PAYMENT,
 * lalu memulai pembayaran (atau langsung lunas di mode simulasi).
 */
export async function createCheckout(
  client: { id: string; name?: string | null; email?: string | null },
  input: CheckoutInput,
): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const { gigId, tier, requirements } = parsed.data;

  const gig = await db.gig.findFirst({
    where: { id: gigId, status: GigStatus.ACTIVE },
    select: {
      id: true,
      freelancerId: true,
      packages: { where: { tier: tier as PackageTier } },
    },
  });
  if (!gig) return { ok: false, error: "Jasa tidak tersedia." };
  if (gig.freelancerId === client.id) {
    return { ok: false, error: "Anda tidak bisa memesan jasa milik sendiri." };
  }
  const pkg = gig.packages[0];
  if (!pkg) return { ok: false, error: "Paket tidak ditemukan." };

  const buyerFeePercent = await getBuyerServiceFeePercent();
  const commissionPercent = await getPlatformFeePercent();
  const amounts = computeOrderAmounts({
    packagePrice: pkg.priceIDR,
    buyerFeePercent,
    commissionPercent,
  });

  const order = await db.order.create({
    data: {
      code: generateOrderCode(),
      clientId: client.id,
      freelancerId: gig.freelancerId,
      gigId: gig.id,
      packageId: pkg.id,
      packageTier: pkg.tier,
      status: OrderStatus.PENDING_PAYMENT,
      packagePriceIDR: amounts.packagePriceIDR,
      serviceFeeIDR: amounts.serviceFeeIDR,
      totalIDR: amounts.totalIDR,
      commissionIDR: amounts.commissionIDR,
      freelancerNetIDR: amounts.freelancerNetIDR,
      revisionsAllowed: pkg.revisions,
      requirements: requirements || null,
      conversation: { create: {} },
    },
    select: { id: true, totalIDR: true },
  });

  // Mode simulasi (tanpa konfigurasi Midtrans) -> langsung lunas.
  if (!isPaymentConfigured()) {
    await markOrderPaid(order.id, "SIMULASI", `sim_${order.id}`);
    return { ok: true, orderId: order.id, simulated: true, snapToken: null, redirectUrl: null };
  }

  try {
    const provider = getPaymentProvider();
    const tx = await provider.createTransaction({
      orderId: order.id,
      grossAmount: order.totalIDR,
      customer: { name: client.name, email: client.email },
      items: [
        { id: pkg.id, name: `Paket ${pkg.tier}`, price: amounts.packagePriceIDR, quantity: 1 },
        { id: "fee", name: "Biaya layanan", price: amounts.serviceFeeIDR, quantity: 1 },
      ],
    });
    await db.order.update({
      where: { id: order.id },
      data: { snapToken: tx.token, paymentRef: order.id },
    });
    return {
      ok: true,
      orderId: order.id,
      simulated: false,
      snapToken: tx.token,
      redirectUrl: tx.redirectUrl,
    };
  } catch (e) {
    console.error("Gagal membuat transaksi pembayaran:", e);
    return { ok: false, error: "Gagal memulai pembayaran. Coba lagi." };
  }
}

/**
 * Tandai order LUNAS -> escrow (IDEMPOTEN). Dipanggil webhook Midtrans / simulasi.
 * Atomic: ubah status, tahan dana di escrow (ledger), tambah saldo pending freelancer.
 */
export async function markOrderPaid(
  orderId: string,
  paymentMethod: string,
  ref: string,
): Promise<void> {
  const autoAcceptDays = await getAutoAcceptDays();

  await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) return;
    if (order.status !== OrderStatus.PENDING_PAYMENT) return; // idempoten

    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + 14); // tenggat longgar; tampilan saja

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.IN_PROGRESS,
        paidAt: new Date(),
        paymentMethod,
        paymentRef: ref,
        dueAt,
      },
    });

    // Tahan dana di escrow + catat earning tertahan freelancer.
    await ledgerCapture(tx, { id: order.id, totalIDR: order.totalIDR });
    await tx.walletAccount.upsert({
      where: { userId: order.freelancerId },
      create: { userId: order.freelancerId, pendingIDR: order.freelancerNetIDR },
      update: { pendingIDR: { increment: order.freelancerNetIDR } },
    });
  });

  // Notifikasi ke freelancer: order baru masuk (best-effort, di luar transaksi).
  const paid = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, code: true, freelancerId: true, status: true, gig: { select: { title: true } } },
  });
  if (paid && paid.status === OrderStatus.IN_PROGRESS) {
    await notify({
      userId: paid.freelancerId,
      type: NotificationType.ORDER_NEW,
      title: "Order baru masuk! 🎉",
      body: `Pesanan #${paid.code} untuk "${paid.gig.title}" sudah dibayar. Ayo mulai dikerjakan.`,
      link: `/orders/${paid.id}`,
      email: true,
    });
  }

  // autoAcceptDays dipakai nanti saat DELIVERED; disimpan di config (tidak di sini).
  void autoAcceptDays;
}

/** Freelancer mengirim hasil kerja: IN_PROGRESS/REVISION -> DELIVERED. */
export async function submitDelivery(
  freelancerId: string,
  input: DeliveryInput,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = deliverySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const autoAcceptDays = await getAutoAcceptDays();

  const result = await db.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: parsed.data.orderId, freelancerId },
      include: { gig: { select: { title: true } } },
    });
    if (!order) return { ok: false as const, error: "Order tidak ditemukan." };
    if (
      order.status !== OrderStatus.IN_PROGRESS &&
      order.status !== OrderStatus.REVISION_REQUESTED
    ) {
      return { ok: false as const, error: "Order tidak dalam status pengerjaan." };
    }

    const autoAcceptAt = new Date();
    autoAcceptAt.setDate(autoAcceptAt.getDate() + autoAcceptDays);

    await tx.delivery.create({
      data: {
        orderId: order.id,
        message: parsed.data.message,
        files: parsed.data.files,
      },
    });
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.DELIVERED,
        deliveredAt: new Date(),
        autoAcceptAt,
      },
    });
    return { ok: true as const, clientId: order.clientId, code: order.code, title: order.gig.title, id: order.id };
  });

  if (result.ok) {
    await notify({
      userId: result.clientId,
      type: NotificationType.ORDER_DELIVERED,
      title: "Hasil pekerjaan sudah dikirim 📦",
      body: `Freelancer mengirim hasil untuk pesanan #${result.code} ("${result.title}"). Periksa & selesaikan jika sudah sesuai.`,
      link: `/orders/${result.id}`,
      email: true,
    });
  }
  return result;
}

/** Client menerima hasil: DELIVERED -> COMPLETED. Rilis dana dari escrow. */
export async function acceptOrder(
  clientId: string,
  orderId: string,
): Promise<{ ok: boolean; error?: string }> {
  const result = await db.$transaction(async (tx) => {
    const order = await tx.order.findFirst({ where: { id: orderId, clientId } });
    if (!order) return { ok: false as const, error: "Order tidak ditemukan." };
    if (order.status !== OrderStatus.DELIVERED) {
      return { ok: false as const, error: "Order belum bisa diselesaikan." };
    }
    await releaseEscrow(tx, order);
    return { ok: true as const, freelancerId: order.freelancerId, net: order.freelancerNetIDR };
  });

  if (result.ok) {
    await recomputeFreelancerStats(result.freelancerId);
    await notify({
      userId: result.freelancerId,
      type: NotificationType.ORDER_COMPLETED,
      title: "Order selesai, dana cair! 💰",
      body: "Client menerima hasil pekerjaanmu. Penghasilan sudah masuk ke saldo dompetmu.",
      link: `/orders/${orderId}`,
      email: true,
    });
  }
  return result;
}

/** Helper internal: lepas escrow -> saldo freelancer + pendapatan platform. */
async function releaseEscrow(
  tx: Prisma.TransactionClient,
  order: {
    id: string;
    totalIDR: number;
    freelancerNetIDR: number;
    freelancerId: string;
    gigId: string;
  },
): Promise<void> {
  await tx.order.update({
    where: { id: order.id },
    data: { status: OrderStatus.COMPLETED, completedAt: new Date() },
  });
  await ledgerRelease(tx, order);
  // Pindahkan earning dari pending -> available.
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
}

/** Client minta revisi: DELIVERED -> REVISION_REQUESTED (cek kuota). */
export async function requestRevision(
  clientId: string,
  input: RevisionInput,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = revisionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const result = await db.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: parsed.data.orderId, clientId },
    });
    if (!order) return { ok: false as const, error: "Order tidak ditemukan." };
    if (order.status !== OrderStatus.DELIVERED) {
      return { ok: false as const, error: "Revisi hanya bisa saat menunggu konfirmasi." };
    }
    if (order.revisionsUsed >= order.revisionsAllowed) {
      return { ok: false as const, error: "Kuota revisi paket sudah habis." };
    }

    await tx.revisionRequest.create({
      data: { orderId: order.id, message: parsed.data.message },
    });
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.REVISION_REQUESTED,
        revisionsUsed: { increment: 1 },
        autoAcceptAt: null,
      },
    });
    return { ok: true as const, freelancerId: order.freelancerId, code: order.code, id: order.id };
  });

  if (result.ok) {
    await notify({
      userId: result.freelancerId,
      type: NotificationType.ORDER_REVISION,
      title: "Permintaan revisi 🔁",
      body: `Client meminta revisi untuk pesanan #${result.code}. Lihat detail & kirim hasil perbaikannya.`,
      link: `/orders/${result.id}`,
      email: true,
    });
  }
  return result;
}

/** Batalkan order yang belum dibayar (oleh client). */
export async function cancelUnpaidOrder(
  clientId: string,
  orderId: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await db.order.updateMany({
    where: { id: orderId, clientId, status: OrderStatus.PENDING_PAYMENT },
    data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
  });
  if (res.count === 0) return { ok: false, error: "Order tidak bisa dibatalkan." };
  return { ok: true };
}

/**
 * Auto-accept order yang sudah DELIVERED melewati batas waktu (auto-accept).
 * Dipanggil oleh cron/endpoint terjadwal. Aman dipanggil berulang.
 */
export async function autoAcceptDueOrders(): Promise<number> {
  const due = await db.order.findMany({
    where: { status: OrderStatus.DELIVERED, autoAcceptAt: { lte: new Date() } },
    select: {
      id: true,
      totalIDR: true,
      freelancerNetIDR: true,
      freelancerId: true,
      gigId: true,
    },
  });

  let count = 0;
  for (const order of due) {
    await db.$transaction(async (tx) => {
      const fresh = await tx.order.findUnique({
        where: { id: order.id },
        select: { status: true },
      });
      if (fresh?.status !== OrderStatus.DELIVERED) return;
      await releaseEscrow(tx, order);
      count += 1;
    });
    await recomputeFreelancerStats(order.freelancerId);
  }
  return count;
}

// ============================================================
// QUERY
// ============================================================

const orderInclude = {
  gig: { select: { id: true, title: true, slug: true, coverImage: true } },
  package: true,
  client: { select: { id: true, name: true, image: true, email: true } },
  freelancer: { select: { id: true, name: true, image: true } },
  deliveries: { orderBy: { createdAt: "asc" } },
  revisionRequests: { orderBy: { createdAt: "asc" } },
  review: true,
  dispute: true,
  conversation: {
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, image: true } } },
      },
    },
  },
} satisfies Prisma.OrderInclude;

export async function getOrderForUser(orderId: string, userId: string) {
  return db.order.findFirst({
    where: { id: orderId, OR: [{ clientId: userId }, { freelancerId: userId }] },
    include: orderInclude,
  });
}

export async function listClientOrders(clientId: string) {
  return db.order.findMany({
    where: { clientId },
    include: {
      gig: { select: { title: true, slug: true, coverImage: true } },
      freelancer: { select: { name: true, image: true } },
      review: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listFreelancerOrders(freelancerId: string) {
  return db.order.findMany({
    where: { freelancerId, status: { not: OrderStatus.PENDING_PAYMENT } },
    include: {
      gig: { select: { title: true, slug: true, coverImage: true } },
      client: { select: { name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
