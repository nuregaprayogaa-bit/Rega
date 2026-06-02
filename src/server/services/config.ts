import { db } from "@/server/db";
import { CONFIG_KEYS, DEFAULTS } from "@/lib/constants";

// Mengambil nilai konfigurasi bisnis dari AppConfig, dengan fallback ke default.
// Logika bisnis (checkout, earning, download) memakai helper ini, BUKAN env langsung,
// agar nilai bisa diubah admin tanpa deploy.

async function getNumberConfig(key: string, fallback: number): Promise<number> {
  const row = await db.appConfig.findUnique({ where: { key } });
  if (!row) return fallback;
  const parsed = Number(row.value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function getPpnPercent(): Promise<number> {
  return getNumberConfig(CONFIG_KEYS.PPN_PERCENT, DEFAULTS.PPN_PERCENT);
}

export async function getPlatformFeePercent(): Promise<number> {
  return getNumberConfig(
    CONFIG_KEYS.PLATFORM_FEE_PERCENT,
    DEFAULTS.PLATFORM_FEE_PERCENT,
  );
}

export async function getDownloadUrlTtl(): Promise<number> {
  return getNumberConfig(
    CONFIG_KEYS.DOWNLOAD_URL_TTL_SECONDS,
    DEFAULTS.DOWNLOAD_URL_TTL_SECONDS,
  );
}

export async function setConfig(key: string, value: string): Promise<void> {
  await db.appConfig.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}
