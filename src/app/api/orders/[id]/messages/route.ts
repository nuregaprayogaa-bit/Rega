import { NextResponse } from "next/server";

import { getCurrentUser } from "@/server/auth-helpers";
import { db } from "@/server/db";

// Mengembalikan daftar pesan sebuah order (untuk polling chat near-real-time).
// Hanya client/freelancer terkait yang boleh mengakses.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ messages: [] }, { status: 401 });
  const { id } = await params;

  const order = await db.order.findFirst({
    where: { id, OR: [{ clientId: user.id }, { freelancerId: user.id }] },
    select: {
      conversation: {
        select: {
          messages: {
            orderBy: { createdAt: "asc" },
            include: { sender: { select: { id: true, name: true, image: true } } },
          },
        },
      },
    },
  });
  if (!order) return NextResponse.json({ messages: [] }, { status: 404 });

  return NextResponse.json({ messages: order.conversation?.messages ?? [] });
}
