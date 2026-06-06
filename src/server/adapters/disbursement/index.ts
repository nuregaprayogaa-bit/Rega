import "server-only";
import type { DisbursementProvider } from "@/server/adapters/disbursement/types";
import { XenditDisbursement } from "@/server/adapters/disbursement/xendit";

/** Apakah disbursement otomatis dikonfigurasi? */
export function isDisbursementConfigured(): boolean {
  return Boolean(process.env.XENDIT_API_KEY);
}

export function getDisbursementProvider(): DisbursementProvider {
  // Default Xendit. Mudah ditambah Midtrans Iris dll via env.
  return new XenditDisbursement();
}

// Peta nama bank (yang dipilih freelancer) -> kode bank Xendit.
const BANK_CODES: Record<string, string> = {
  BCA: "BCA",
  Mandiri: "MANDIRI",
  BNI: "BNI",
  BRI: "BRI",
  "CIMB Niaga": "CIMB",
  Permata: "PERMATA",
  BSI: "BSI",
  Danamon: "DANAMON",
};

/** Kode bank provider untuk transfer otomatis; null jika tidak didukung (mis. e-wallet). */
export function bankCodeFor(provider: string): string | null {
  return BANK_CODES[provider] ?? null;
}

export type { DisbursementProvider } from "@/server/adapters/disbursement/types";
