import { db } from "@/server/db";
import { CONFIG_KEYS, DEFAULTS } from "@/lib/constants";

// Mengambil nilai konfigurasi bisnis dari AppConfig, dengan fallback ke default.
// Nilai di-cache di memori (TTL pendek) agar tidak query DB di setiap request —
// konfigurasi jarang berubah, jadi ini aman & mempercepat halaman checkout/gig.

const TTL_MS = 60_000;
const cache = new Map<string, { value: number; expires: number }>();

async function getNumberConfig(key: string, fallback: number): Promise<number> {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;

  const row = await db.appConfig.findUnique({ where: { key } });
  const parsed = row ? Number(row.value) : NaN;
  const value = Number.isFinite(parsed) ? parsed : fallback;
  cache.set(key, { value, expires: Date.now() + TTL_MS });
  return value;
}

export async function getPlatformFeePercent(): Promise<number> {
  return getNumberConfig(CONFIG_KEYS.PLATFORM_FEE_PERCENT, DEFAULTS.PLATFORM_FEE_PERCENT);
}

export async function getBuyerServiceFeePercent(): Promise<number> {
  return getNumberConfig(CONFIG_KEYS.BUYER_SERVICE_FEE_PERCENT, DEFAULTS.BUYER_SERVICE_FEE_PERCENT);
}

export async function getAutoAcceptDays(): Promise<number> {
  return getNumberConfig(CONFIG_KEYS.ORDER_AUTO_ACCEPT_DAYS, DEFAULTS.ORDER_AUTO_ACCEPT_DAYS);
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
  cache.delete(key); // invalidasi cache setelah diubah
}
