import "server-only";
import crypto from "crypto";
// midtrans-client tidak punya tipe TS resmi.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import midtransClient from "midtrans-client";

import type {
  CreateTxParams,
  CreateTxResult,
  NotificationResult,
  PaymentProvider,
  PaymentStatus,
} from "@/server/adapters/payment/types";

function mapStatus(transactionStatus: string, fraudStatus?: string): PaymentStatus {
  if (transactionStatus === "capture") {
    return fraudStatus === "challenge" ? "PENDING" : "PAID";
  }
  if (transactionStatus === "settlement") return "PAID";
  if (transactionStatus === "pending") return "PENDING";
  if (
    transactionStatus === "deny" ||
    transactionStatus === "cancel" ||
    transactionStatus === "failure"
  )
    return "FAILED";
  if (transactionStatus === "expire") return "EXPIRED";
  return "PENDING";
}

export class MidtransProvider implements PaymentProvider {
  readonly name = "midtrans";
  private serverKey: string;
  private isProduction: boolean;

  constructor() {
    this.serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    this.isProduction = process.env.MIDTRANS_IS_SANDBOX === "false";
  }

  private snap() {
    return new midtransClient.Snap({
      isProduction: this.isProduction,
      serverKey: this.serverKey,
      clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
    });
  }

  async createTransaction(params: CreateTxParams): Promise<CreateTxResult> {
    const snap = this.snap();
    const parameter = {
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.grossAmount,
      },
      item_details: params.items.map((i) => ({
        id: i.id,
        price: i.price,
        quantity: i.quantity,
        name: i.name.slice(0, 50),
      })),
      customer_details: {
        first_name: params.customer.name ?? "Pelanggan",
        email: params.customer.email ?? undefined,
      },
      // Aktifkan metode populer di Indonesia.
      enabled_payments: [
        "qris",
        "gopay",
        "shopeepay",
        "other_va",
        "bca_va",
        "bni_va",
        "bri_va",
        "permata_va",
        "credit_card",
      ],
    };

    const tx = await snap.createTransaction(parameter);
    return {
      token: tx.token ?? null,
      redirectUrl: tx.redirect_url ?? null,
      simulated: false,
    };
  }

  async handleNotification(body: unknown): Promise<NotificationResult> {
    const n = (body ?? {}) as Record<string, string | undefined>;
    const orderId = n.order_id ?? "";
    const statusCode = n.status_code ?? "";
    const grossAmount = n.gross_amount ?? "";
    const signatureKey = n.signature_key ?? "";

    // Verifikasi signature: sha512(order_id + status_code + gross_amount + serverKey)
    const expected = crypto
      .createHash("sha512")
      .update(`${orderId}${statusCode}${grossAmount}${this.serverKey}`)
      .digest("hex");

    if (expected !== signatureKey) {
      throw new Error("Signature Midtrans tidak valid");
    }

    return {
      orderId,
      status: mapStatus(n.transaction_status ?? "", n.fraud_status),
      paymentMethod: n.payment_type,
      rawRef: n.transaction_id,
    };
  }
}
