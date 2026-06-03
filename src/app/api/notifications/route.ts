import { NextResponse } from "next/server";

import { getCurrentUser } from "@/server/auth-helpers";
import { listNotifications, unreadCount } from "@/server/services/notification-service";

// Dipakai lonceng notifikasi untuk polling (near-real-time).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ items: [], unread: 0 });

  const [items, unread] = await Promise.all([
    listNotifications(user.id, 15),
    unreadCount(user.id),
  ]);
  return NextResponse.json({ items, unread });
}
