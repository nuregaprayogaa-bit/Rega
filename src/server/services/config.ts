import { db } from "@/server/db";
import { CONFIG_KEYS, DEFAULTS } from "@/lib/constants";

// Mengambil nilai konfigurasi bisnis dari AppConfig, dengan fallback ke default.
// Logika bisnis (checkout, escrow, payout) memakai helper ini, BUKAN env langsung,
// agar nilai bisa diubah admin tanpa deploy.

async function getNumberConfig(key: string, fallback: number): Promise<number> {
  const row = await db.appConfig.findUnique({ where: { key } });
  if (!row) return fallback;
  const parsed = Number(row.value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function getPlatformFeePercent(): Promise<number> {
  return getNumberConfig(
    CONFIG_KEYS.PLATFORM_FEE_PERCENT,
    DEFAULTS.PLATFORM_FEE_PERCENT,
  );
}

export async function getBuyerServiceFeePercent(): Promise<number> {
  return getNumberConfig(
    CONFIG_KEYS.BUYER_SERVICE_FEE_PERCENT,
    DEFAULTS.BUYER_SERVICE_FEE_PERCENT,
  );
}

export async function getAutoAcceptDays(): Promise<number> {
  return getNumberConfig(
    CONFIG_KEYS.ORDER_AUTO_ACCEPT_DAYS,
    DEFAULTS.ORDER_AUTO_ACCEPT_DAYS,
  );
}

export async function getMinPayoutIDR(): Promise<number> {
  return getNumberConfig(CONFIG_KEYS.MIN_PAYOUT_IDR, DEFAULTS.MIN_PAYOUT_IDR);
}

export async function setConfig(key: string, value: string): Promise<void> {
  await db.appConfig.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}
