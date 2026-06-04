import "server-only";
import { headers } from "next/headers";

// Rate limiter sederhana berbasis memori (fixed window).
// Catatan: pada serverless (Vercel), state ini per-instance & bisa ter-reset.
// Cukup untuk MVP/anti-spam dasar. Untuk skala besar, ganti ke Redis/Upstash.

type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 };
  }
  b.count += 1;
  if (b.count > limit) {
    return { ok: false, remaining: 0, retryAfterMs: b.reset - now };
  }
  return { ok: true, remaining: limit - b.count, retryAfterMs: 0 };
}

/** Ambil IP klien dari header (di belakang proxy Vercel). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

/** Helper: batasi sebuah aksi berdasarkan IP. Mengembalikan pesan error jika kena limit. */
export async function limitByIp(
  scope: string,
  limit: number,
  windowMs: number,
): Promise<string | null> {
  const ip = await clientIp();
  const res = rateLimit(`${scope}:${ip}`, limit, windowMs);
  if (!res.ok) {
    const secs = Math.ceil(res.retryAfterMs / 1000);
    return `Terlalu banyak percobaan. Coba lagi dalam ${secs} detik.`;
  }
  return null;
}
