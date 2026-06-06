"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/server/auth-helpers";
import { limitByIp } from "@/lib/rate-limit";
import {
  getOrCreateThread,
  sendThreadMessage,
} from "@/server/services/message-thread-service";

export async function startChatAction(otherUserId: string) {
  const user = await requireUser();
  return getOrCreateThread(user.id, otherUserId);
}

export async function sendDirectMessageAction(threadId: string, body: string) {
  const user = await requireUser();
  const limited = await limitByIp("dm", 30, 60_000);
  if (limited) return { ok: false, error: limited };
  const res = await sendThreadMessage(user.id, threadId, body);
  revalidatePath(`/messages/${threadId}`);
  return res;
}
