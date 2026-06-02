// Abstraksi payment gateway agar mudah ganti provider (Midtrans -> Xendit).

export type CreateTxParams = {
  orderId: string;
  grossAmount: number; // total termasuk PPN (rupiah, integer)
  customer: { name?: string | null; email?: string | null };
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
};

export type CreateTxResult = {
  // token Snap (Midtrans) atau id transaksi
  token: string | null;
  // URL redirect pembayaran (jika ada)
  redirectUrl: string | null;
  // true jika ini mode simulasi (tanpa gateway nyata)
  simulated: boolean;
};

export type PaymentStatus = "PAID" | "PENDING" | "FAILED" | "EXPIRED";

export type NotificationResult = {
  orderId: string;
  status: PaymentStatus;
  paymentMethod?: string;
  rawRef?: string;
};

export interface PaymentProvider {
  readonly name: string;
  createTransaction(params: CreateTxParams): Promise<CreateTxResult>;
  /** Verifikasi & parse notifikasi webhook. Throw jika signature tidak valid. */
  handleNotification(body: unknown): Promise<NotificationResult>;
}
