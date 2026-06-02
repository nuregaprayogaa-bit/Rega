import { NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";

import { getPaymentProvider } from "@/server/adapters/payment";
import { markOrderPaid, markOrderStatus } from "@/server/services/order-service";

// Webhook notifikasi pembayaran Midtrans.
// Midtrans memanggil endpoint ini saat status transaksi berubah.
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
        await markOrderStatus(result.orderId, OrderStatus.FAILED);
        break;
      case "EXPIRED":
        await markOrderStatus(result.orderId, OrderStatus.EXPIRED);
        break;
      default:
        // PENDING: biarkan order tetap PENDING.
        break;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook Midtrans error:", e);
    // 401 agar Midtrans retry jika signature gagal / error sementara.
    return NextResponse.json({ error: "Gagal memproses notifikasi" }, { status: 401 });
  }
}
