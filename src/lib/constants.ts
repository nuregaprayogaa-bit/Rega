// Konstanta & nilai default bisnis. Nilai runtime diambil dari AppConfig
// (lihat src/server/services/config.ts) sehingga bisa diubah tanpa deploy.

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Rega";
export const APP_TAGLINE = "Marketplace jasa freelance terpercaya di Indonesia";

export const DEFAULTS = {
  // Komisi platform dari freelancer (persen dari harga paket).
  PLATFORM_FEE_PERCENT: Number(process.env.PLATFORM_FEE_PERCENT ?? 10),
  // Biaya layanan yang dibebankan ke client (persen di atas harga paket).
  BUYER_SERVICE_FEE_PERCENT: Number(process.env.BUYER_SERVICE_FEE_PERCENT ?? 5),
  // Auto-accept: jika client diam setelah hasil dikirim, order dianggap selesai.
  ORDER_AUTO_ACCEPT_DAYS: Number(process.env.ORDER_AUTO_ACCEPT_DAYS ?? 3),
  // Minimal saldo untuk request penarikan dana.
  MIN_PAYOUT_IDR: Number(process.env.MIN_PAYOUT_IDR ?? 50000),
} as const;

// Key yang dipakai pada tabel AppConfig.
export const CONFIG_KEYS = {
  PLATFORM_FEE_PERCENT: "PLATFORM_FEE_PERCENT",
  BUYER_SERVICE_FEE_PERCENT: "BUYER_SERVICE_FEE_PERCENT",
  ORDER_AUTO_ACCEPT_DAYS: "ORDER_AUTO_ACCEPT_DAYS",
  MIN_PAYOUT_IDR: "MIN_PAYOUT_IDR",
} as const;

export const SUPPORTED_LOCALES = ["id", "en"] as const;
export const DEFAULT_LOCALE = "id";

export const PACKAGE_TIERS = ["BASIC", "STANDARD", "PREMIUM"] as const;
export type PackageTierKey = (typeof PACKAGE_TIERS)[number];

export const PACKAGE_TIER_LABEL: Record<PackageTierKey, string> = {
  BASIC: "Basic",
  STANDARD: "Standar",
  PREMIUM: "Premium",
};

// Kategori jasa awal yang relevan untuk pasar Indonesia (referensi Fastwork).
export const SEED_CATEGORIES = [
  { name: "Desain Grafis", slug: "desain-grafis", icon: "Palette" },
  { name: "Penulisan & Terjemahan", slug: "penulisan-terjemahan", icon: "PenLine" },
  { name: "Video & Animasi", slug: "video-animasi", icon: "Clapperboard" },
  { name: "Digital Marketing", slug: "digital-marketing", icon: "Megaphone" },
  { name: "Web & Pemrograman", slug: "web-pemrograman", icon: "Code" },
  { name: "Bisnis & Keuangan", slug: "bisnis-keuangan", icon: "Briefcase" },
  { name: "Musik & Audio", slug: "musik-audio", icon: "Music" },
  { name: "Fotografi", slug: "fotografi", icon: "Camera" },
] as const;

export const FREELANCER_LEVEL_LABEL: Record<string, string> = {
  NEW: "Freelancer Baru",
  LEVEL_1: "Level 1",
  LEVEL_2: "Level 2",
  TOP_RATED: "Top Rated",
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Menunggu Pembayaran",
  IN_PROGRESS: "Dikerjakan",
  DELIVERED: "Menunggu Konfirmasi",
  REVISION_REQUESTED: "Revisi Diminta",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  DISPUTED: "Sengketa",
};
