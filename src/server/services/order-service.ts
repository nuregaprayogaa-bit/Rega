import "server-only";
import { AssetStatus, OrderStatus, type LicenseType } from "@prisma/client";

import { db } from "@/server/db";
import { calcPPN, splitEarning } from "@/lib/money";
import { getPpnPercent, getPlatformFeePercent } from "@/server/services/config";
import {
  getPaymentProvider,
  isPaymentConfigured,
} from "@/server/adapters/payment";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations/order";

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
 * Buat Order dari item keranjang. Harga SELALU diambil ulang dari DB
 * (tidak pernah percaya angka dari client). PPN dihitung terpisah.
 */
export async function createCheckout(
  buyer: { id: string; name?: string | null; email?: string | null },
  input: CheckoutInput,
): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  // Dedupe (assetId + licenseType).
  const unique = new Map<string, { assetId: string; licenseType: LicenseType }>();
  for (const it of parsed.data.items) {
    unique.set(`${it.assetId}:${it.licenseType}`, {
      assetId: it.assetId,
      licenseType: it.licenseType as LicenseType,
    });
  }
  const items = [...unique.values()];

  // Ambil asset + harga dari DB.
  const assetIds = [...new Set(items.map((i) => i.assetId))];
  const assets = await db.asset.findMany({
    where: { id: { in: assetIds }, status: AssetStatus.APPROVED },
    select: {
      id: true,
      title: true,
      contributorId: true,
      prices: { select: { licenseType: true, amountIDR: true } },
    },
  });
  const assetMap = new Map(assets.map((a) => [a.id, a]));

  const lineItems: {
    assetId: string;
    title: string;
    licenseType: LicenseType;
    price: number;
  }[] = [];

  for (const it of items) {
    const asset = assetMap.get(it.assetId);
    if (!asset) {
      return { ok: false, error: "Beberapa karya tidak tersedia lagi." };
    }
    const price = asset.prices.find((p) => p.licenseType === it.licenseType);
    if (!price) {
      return { ok: false, error: "Harga lisensi tidak ditemukan." };
    }
    lineItems.push({
      assetId: asset.id,
      title: asset.title,
      licenseType: it.licenseType,
      price: price.amountIDR,
    });
  }

  const subtotal = lineItems.reduce((s, i) => s + i.price, 0);
  const ppnPercent = await getPpnPercent();
  const ppnAmount = calcPPN(subtotal, ppnPercent);
  const total = subtotal + ppnAmount;

  // Buat order PENDING.
  const order = await db.order.create({
    data: {
      buyerId: buyer.id,
      status: OrderStatus.PENDING,
      subtotal,
      ppnAmount,
      total,
      ppnPercent,
      items: {
        create: lineItems.map((i) => ({
          assetId: i.assetId,
          licenseType: i.licenseType,
          priceAtPurchase: i.price,
        })),
      },
    },
    select: { id: true },
  });

  // Mode simulasi (tanpa konfigurasi Midtrans) -> langsung lunas.
  if (!isPaymentConfigured()) {
    await markOrderPaid(order.id, "SIMULASI", `sim_${order.id}`);
    return {
      ok: true,
      orderId: order.id,
      simulated: true,
      snapToken: null,
      redirectUrl: null,
    };
  }

  // Buat transaksi Midtrans Snap.
  try {
    const provider = getPaymentProvider();
    const tx = await provider.createTransaction({
      orderId: order.id,
      grossAmount: total,
      customer: { name: buyer.name, email: buyer.email },
      items: [
        ...lineItems.map((i) => ({
          id: `${i.assetId}-${i.licenseType}`,
          name: `${i.title} (${i.licenseType})`,
          price: i.price,
          quantity: 1,
        })),
        { id: "ppn", name: `PPN ${ppnPercent}%`, price: ppnAmount, quantity: 1 },
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
 * Tandai order LUNAS (idempoten). Membuat Download + EarningLedger.
 * Dipanggil dari webhook Midtrans atau dari mode simulasi.
 */
export async function markOrderPaid(
  orderId: string,
  paymentMethod: string,
  ref: string,
): Promise<void> {
  const feePercent = await getPlatformFeePercent();

  await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return;
    if (order.status === OrderStatus.PAID) return; // idempoten

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PAID,
        paidAt: new Date(),
        paymentMethod,
        paymentRef: ref,
      },
    });

    const asset = await tx.asset.findMany({
      where: { id: { in: order.items.map((i) => i.assetId) } },
      select: { id: true, contributorId: true },
    });
    const contributorByAsset = new Map(asset.map((a) => [a.id, a.contributorId]));

    for (const item of order.items) {
      // Hak unduh.
      await tx.download.create({
        data: {
          userId: order.buyerId,
          assetId: item.assetId,
          orderId: order.id,
        },
      });
      // Ledger earning kontributor.
      const contributorId = contributorByAsset.get(item.assetId);
      if (contributorId) {
        const gross = item.priceAtPurchase;
        const { platformFee, netEarning } = splitEarning(gross, feePercent);
        await tx.earningLedger.create({
          data: {
            contributorId,
            orderItemId: item.id,
            grossAmount: gross,
            platformFee,
            netEarning,
            feePercent,
          },
        });
      }
    }
  });
}

export async function markOrderStatus(orderId: string, status: OrderStatus) {
  await db.order.updateMany({
    where: { id: orderId, status: OrderStatus.PENDING },
    data: { status },
  });
}

export async function getOrderForBuyer(orderId: string, buyerId: string) {
  return db.order.findFirst({
    where: { id: orderId, buyerId },
    include: {
      items: { include: { asset: { select: { id: true, title: true, type: true } } } },
    },
  });
}

export async function listOrders(buyerId: string) {
  return db.order.findMany({
    where: { buyerId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
}
