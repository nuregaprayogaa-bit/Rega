import { NextResponse } from "next/server";

import { getCurrentUser } from "@/server/auth-helpers";
import { getThreadMessages } from "@/server/services/message-thread-service";

// Polling pesan langsung (near-real-time).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ messages: [] }, { status: 401 });
  const { id } = await params;
  const messages = await getThreadMessages(id, user.id);
  return NextResponse.json({ messages });
}
