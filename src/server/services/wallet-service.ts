import "server-only";
import { PayoutStatus, type PayoutAccountType } from "@prisma/client";

import { db } from "@/server/db";
import { getMinPayoutIDR } from "@/server/services/config";
import { ledgerPayout } from "@/server/services/ledger-service";
import {
  payoutSchema,
  payoutAccountSchema,
  type PayoutInput,
  type PayoutAccountInput,
} from "@/lib/validations/profile";

/** Rekening/e-wallet penarikan tersimpan milik freelancer. */
export async function getPayoutAccount(userId: string) {
  return db.payoutAccount.findUnique({ where: { userId } });
}

export async function savePayoutAccount(
  userId: string,
  input: PayoutAccountInput,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = payoutAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const { type, provider, accountName, accountNo } = parsed.data;
  await db.payoutAccount.upsert({
    where: { userId },
    create: { userId, type: type as PayoutAccountType, provider, accountName, accountNo },
    update: { type: type as PayoutAccountType, provider, accountName, accountNo },
  });
  return { ok: true };
}

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
  const { amountIDR } = parsed.data;
  if (amountIDR < min) {
    return { ok: false, error: `Minimal penarikan Rp ${min.toLocaleString("id-ID")}.` };
  }

  // Wajib ada rekening tersimpan dulu.
  const account = await db.payoutAccount.findUnique({ where: { userId } });
  if (!account) {
    return { ok: false, error: "Tambahkan rekening/e-wallet penarikan dulu." };
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
        // Snapshot tujuan dari rekening tersimpan.
        bankName: account.provider,
        accountName: account.accountName,
        accountNo: account.accountNo,
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
