import { NextResponse } from "next/server";

import { getPaymentProvider } from "@/server/adapters/payment";
import { markOrderPaid } from "@/server/services/order-service";
import { db } from "@/server/db";
import { OrderStatus } from "@prisma/client";

// Webhook notifikasi pembayaran Midtrans.
// Midtrans memanggil endpoint ini saat status transaksi berubah.
// Idempoten: markOrderPaid hanya memproses order PENDING_PAYMENT (aman dikirim ulang).
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  try {
    const provider = getPaymentProvider();
    const result = await provider.handleNotification(body);

    switch (result.status) {
      case "PAID":
        await markOrderPaid(
          result.orderId,
          result.paymentMethod ?? "midtrans",
          result.rawRef ?? result.orderId,
        );
        break;
      case "FAILED":
      case "EXPIRED":
        // Hanya batalkan jika belum dibayar.
        await db.order.updateMany({
          where: { id: result.orderId, status: OrderStatus.PENDING_PAYMENT },
          data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
        });
        break;
      default:
        // PENDING: biarkan order tetap menunggu pembayaran.
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook Midtrans error:", e);
    // 401 agar Midtrans retry jika signature gagal / error sementara.
    return NextResponse.json({ error: "Gagal memproses notifikasi" }, { status: 401 });
  }
}
