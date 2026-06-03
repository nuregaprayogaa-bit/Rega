import "server-only";
import { NotificationType } from "@prisma/client";

import { db } from "@/server/db";
import { sendEmail, emailTemplate } from "@/server/adapters/email";

type NotifyInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  email?: boolean; // kirim email juga?
};

/**
 * Buat notifikasi in-app (+ email best-effort). Tidak pernah melempar error
 * agar kegagalan notifikasi tidak menggagalkan alur bisnis utama.
 */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    await db.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      },
    });

    if (input.email) {
      const user = await db.user.findUnique({
        where: { id: input.userId },
        select: { email: true },
      });
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: input.title,
          html: emailTemplate({
            heading: input.title,
            body: input.body ?? "",
            ctaLabel: input.link ? "Buka di Rega" : undefined,
            ctaUrl: input.link,
          }),
        });
      }
    }
  } catch (e) {
    console.error("[notify] gagal:", e);
  }
}

export async function listNotifications(userId: string, limit = 30) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function unreadCount(userId: string): Promise<number> {
  return db.notification.count({ where: { userId, read: false } });
}

export async function markAllRead(userId: string): Promise<void> {
  await db.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function markRead(userId: string, id: string): Promise<void> {
  await db.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });
}
