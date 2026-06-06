import "server-only";
import { NotificationType } from "@prisma/client";

import { db } from "@/server/db";
import { notify } from "@/server/services/notification-service";

// Pasangan thread selalu diurutkan agar unik (user1Id < user2Id).
function pair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

/** Buat (atau ambil) thread chat antara dua pengguna. */
export async function getOrCreateThread(
  meId: string,
  otherId: string,
): Promise<{ ok: boolean; threadId?: string; error?: string }> {
  if (meId === otherId) return { ok: false, error: "Tidak bisa mengirim pesan ke diri sendiri." };
  const other = await db.user.findUnique({ where: { id: otherId }, select: { id: true } });
  if (!other) return { ok: false, error: "Pengguna tidak ditemukan." };

  const [u1, u2] = pair(meId, otherId);
  const thread = await db.messageThread.upsert({
    where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
    create: { user1Id: u1, user2Id: u2 },
    update: {},
    select: { id: true },
  });
  return { ok: true, threadId: thread.id };
}

const otherSelect = { id: true, name: true, image: true };

export async function listThreads(userId: string) {
  const threads = await db.messageThread.findMany({
    where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    include: {
      user1: { select: otherSelect },
      user2: { select: otherSelect },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
  });
  return threads.map((t) => {
    const other = t.user1Id === userId ? t.user2 : t.user1;
    const last = t.messages[0];
    return { id: t.id, other, lastMessage: last?.body ?? null, lastAt: t.lastMessageAt };
  });
}

export async function getThread(threadId: string, userId: string) {
  const thread = await db.messageThread.findFirst({
    where: { id: threadId, OR: [{ user1Id: userId }, { user2Id: userId }] },
    include: {
      user1: { select: otherSelect },
      user2: { select: otherSelect },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: otherSelect } },
      },
    },
  });
  if (!thread) return null;
  // Tandai pesan dari lawan sebagai terbaca.
  await db.threadMessage.updateMany({
    where: { threadId, senderId: { not: userId }, readAt: null },
    data: { readAt: new Date() },
  });
  const other = thread.user1Id === userId ? thread.user2 : thread.user1;
  return { ...thread, other };
}

export async function sendThreadMessage(
  userId: string,
  threadId: string,
  body: string,
): Promise<{ ok: boolean; error?: string }> {
  const text = body.trim().slice(0, 2000);
  if (!text) return { ok: false, error: "Pesan kosong." };

  const thread = await db.messageThread.findFirst({
    where: { id: threadId, OR: [{ user1Id: userId }, { user2Id: userId }] },
    select: { id: true, user1Id: true, user2Id: true },
  });
  if (!thread) return { ok: false, error: "Percakapan tidak ditemukan." };

  await db.$transaction([
    db.threadMessage.create({ data: { threadId, senderId: userId, body: text } }),
    db.messageThread.update({ where: { id: threadId }, data: { lastMessageAt: new Date() } }),
  ]);

  const recipientId = thread.user1Id === userId ? thread.user2Id : thread.user1Id;
  await notify({
    userId: recipientId,
    type: NotificationType.MESSAGE,
    title: "Pesan baru 💬",
    body: text.slice(0, 80),
    link: `/messages/${threadId}`,
  });
  return { ok: true };
}

/** Jumlah pesan belum dibaca (untuk badge). */
export async function unreadThreadCount(userId: string): Promise<number> {
  return db.threadMessage.count({
    where: {
      readAt: null,
      senderId: { not: userId },
      thread: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    },
  });
}

export async function getThreadMessages(threadId: string, userId: string) {
  const thread = await db.messageThread.findFirst({
    where: { id: threadId, OR: [{ user1Id: userId }, { user2Id: userId }] },
    select: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: otherSelect } },
      },
    },
  });
  return thread?.messages ?? [];
}
