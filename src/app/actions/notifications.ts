"use server";

import { requireUser } from "@/server/auth-helpers";
import { markAllRead, markRead } from "@/server/services/notification-service";

export async function markAllReadAction() {
  const user = await requireUser();
  await markAllRead(user.id);
  return { ok: true };
}

export async function markReadAction(id: string) {
  const user = await requireUser();
  await markRead(user.id, id);
  return { ok: true };
}
