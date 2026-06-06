import { NextResponse } from "next/server";
import { db } from "@/server/db";

// Endpoint ringan untuk "membangunkan" database (mencegah cold start Neon).
// Hubungkan ke uptime monitor gratis (UptimeRobot / cron-job.org) tiap ~5 menit
// agar database tetap hangat dan halaman terasa cepat.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, ts: Date.now() });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
