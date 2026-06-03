import "server-only";
import { PayoutStatus } from "@prisma/client";

import { db } from "@/server/db";
import { getMinPayoutIDR } from "@/server/services/config";
import { ledgerPayout } from "@/server/services/ledger-service";
import { payoutSchema, type PayoutInput } from "@/lib/validations/profile";

export async function getWallet(userId: string) {
  return db.walletAccount.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function listPayouts(userId: string) {
  return db.payoutRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/** Riwayat earning (entri buku besar dompet) untuk freelancer. */
export async function listEarnings(userId: string) {
  return db.ledgerEntry.findMany({
    where: { account: `wallet:${userId}` },
    include: { order: { select: { code: true, gig: { select: { title: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

/**
 * Ajukan penarikan dana. Saldo available dikurangi & ditahan saat diajukan
 * (atomic + entri buku besar PAYOUT), menunggu persetujuan admin.
 */
export async function requestPayout(
  userId: string,
  input: PayoutInput,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = payoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const min = await getMinPayoutIDR();
  const { amountIDR, bankName, accountName, accountNo } = parsed.data;
  if (amountIDR < min) {
    return { ok: false, error: `Minimal penarikan Rp ${min.toLocaleString("id-ID")}.` };
  }

  return db.$transaction(async (tx) => {
    const wallet = await tx.walletAccount.findUnique({ where: { userId } });
    if (!wallet || wallet.availableIDR < amountIDR) {
      return { ok: false, error: "Saldo tidak cukup." };
    }
    const payout = await tx.payoutRequest.create({
      data: {
        walletId: wallet.id,
        userId,
        amountIDR,
        bankName,
        accountName,
        accountNo,
        status: PayoutStatus.PENDING,
      },
      select: { id: true },
    });
    await tx.walletAccount.update({
      where: { userId },
      data: { availableIDR: { decrement: amountIDR } },
    });
    await ledgerPayout(tx, { id: payout.id, userId, amountIDR });
    return { ok: true };
  });
}
