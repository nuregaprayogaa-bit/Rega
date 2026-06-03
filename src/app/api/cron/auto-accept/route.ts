import { NextResponse } from "next/server";
import { autoAcceptDueOrders } from "@/server/services/order-service";

// Endpoint terjadwal: menyelesaikan otomatis order yang sudah dikirim (DELIVERED)
// dan melewati batas auto-accept. Lindungi dengan CRON_SECRET di header
// "Authorization: Bearer <secret>" (mis. dipanggil Vercel Cron).
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
    }
  }
  const count = await autoAcceptDueOrders();
  return NextResponse.json({ ok: true, autoAccepted: count });
}
