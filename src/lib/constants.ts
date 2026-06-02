// Konstanta & nilai default bisnis. Nilai runtime diambil dari AppConfig
// (lihat src/server/services/config.ts) sehingga bisa diubah tanpa deploy.

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Nusagraf";

export const DEFAULTS = {
  PPN_PERCENT: Number(process.env.PPN_PERCENT ?? 11),
  PLATFORM_FEE_PERCENT: Number(process.env.PLATFORM_FEE_PERCENT ?? 20),
  DOWNLOAD_URL_TTL_SECONDS: Number(process.env.DOWNLOAD_URL_TTL_SECONDS ?? 300),
} as const;

// Key yang dipakai pada tabel AppConfig.
export const CONFIG_KEYS = {
  PPN_PERCENT: "PPN_PERCENT",
  PLATFORM_FEE_PERCENT: "PLATFORM_FEE_PERCENT",
  DOWNLOAD_URL_TTL_SECONDS: "DOWNLOAD_URL_TTL_SECONDS",
} as const;

// Kategori awal yang relevan untuk pasar Indonesia.
export const SEED_CATEGORIES = [
  { name: "Kuliner", slug: "kuliner" },
  { name: "Pariwisata", slug: "pariwisata" },
  { name: "UMKM", slug: "umkm" },
  { name: "Ekonomi & Bisnis", slug: "ekonomi-bisnis" },
  { name: "Alam & Pemandangan", slug: "alam-pemandangan" },
  { name: "Budaya & Tradisi", slug: "budaya-tradisi" },
  { name: "Teknologi", slug: "teknologi" },
  { name: "Pendidikan", slug: "pendidikan" },
  { name: "Kesehatan", slug: "kesehatan" },
  { name: "Transportasi", slug: "transportasi" },
] as const;

export const SUPPORTED_LOCALES = ["id", "en"] as const;
export const DEFAULT_LOCALE = "id";
