import "server-only";
import type { PaymentProvider } from "@/server/adapters/payment/types";
import { MidtransProvider } from "@/server/adapters/payment/midtrans";

/** Apakah Midtrans dikonfigurasi (punya server key)? */
export function isPaymentConfigured(): boolean {
  return Boolean(process.env.MIDTRANS_SERVER_KEY);
}

/**
 * Factory provider pembayaran. Default Midtrans. Mudah ditambah Xendit:
 * tinggal buat XenditProvider dan pilih via PAYMENT_PROVIDER.
 */
export function getPaymentProvider(): PaymentProvider {
  const provider = (process.env.PAYMENT_PROVIDER || "midtrans").toLowerCase();
  switch (provider) {
    case "midtrans":
    default:
      return new MidtransProvider();
  }
}

export type { PaymentProvider } from "@/server/adapters/payment/types";
