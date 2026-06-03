import "server-only";
import { DisputeStatus, OrderStatus } from "@prisma/client";

import { db } from "@/server/db";
import { notify } from "@/server/services/notification-service";
import { NotificationType } from "@prisma/client";
import {
  messageSchema,
  disputeSchema,
  type MessageInput,
  type DisputeInput,
} from "@/lib/validations/order";

/** Kirim pesan pada percakapan order. Hanya client/freelancer terkait. */
export async function sendMessage(
  userId: string,
  input: MessageInput,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Pesan tidak valid" };
  }
  const order = await db.order.findFirst({
    where: {
      id: parsed.data.orderId,
      OR: [{ clientId: userId }, { freelancerId: userId }],
    },
    select: {
      id: true,
      code: true,
      clientId: true,
      freelancerId: true,
      conversation: { select: { id: true } },
    },
  });
  if (!order?.conversation) return { ok: false, error: "Percakapan tidak ditemukan." };

  await db.message.create({
    data: {
      conversationId: order.conversation.id,
      senderId: userId,
      body: parsed.data.body,
    },
  });

  // Notifikasi ke lawan bicara (tanpa email agar tidak spam tiap chat).
  const recipientId = userId === order.clientId ? order.freelancerId : order.clientId;
  await notify({
    userId: recipientId,
    type: NotificationType.MESSAGE,
    title: "Pesan baru 💬",
    body: `Ada pesan baru di pesanan #${order.code}.`,
    link: `/orders/${order.id}`,
  });
  return { ok: true };
}

/** Buka sengketa untuk order yang sedang berjalan / sudah dikirim. */
export async function openDispute(
  userId: string,
  input: DisputeInput,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = disputeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const res = await db.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        id: parsed.data.orderId,
        OR: [{ clientId: userId }, { freelancerId: userId }],
      },
    });
    if (!order) return { ok: false as const, error: "Order tidak ditemukan." };
    const disputable: OrderStatus[] = [
      OrderStatus.IN_PROGRESS,
      OrderStatus.DELIVERED,
      OrderStatus.REVISION_REQUESTED,
    ];
    if (!disputable.includes(order.status)) {
      return { ok: false as const, error: "Order ini tidak bisa disengketakan." };
    }
    await tx.dispute.upsert({
      where: { orderId: order.id },
      create: { orderId: order.id, openedById: userId, reason: parsed.data.reason },
      update: {},
    });
    await tx.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.DISPUTED },
    });
    return {
      ok: true as const,
      orderId: order.id,
      code: order.code,
      clientId: order.clientId,
      freelancerId: order.freelancerId,
    };
  });

  if (res.ok) {
    const counterpartId = userId === res.clientId ? res.freelancerId : res.clientId;
    await notify({
      userId: counterpartId,
      type: NotificationType.DISPUTE,
      title: "Sengketa dibuka ⚠️",
      body: `Sengketa diajukan pada pesanan #${res.code}. Admin akan meninjau.`,
      link: `/orders/${res.orderId}`,
      email: true,
    });
    // Beri tahu semua admin.
    const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    await Promise.all(
      admins.map((a) =>
        notify({
          userId: a.id,
          type: NotificationType.DISPUTE,
          title: "Sengketa baru perlu ditinjau",
          body: `Pesanan #${res.code} disengketakan.`,
          link: `/admin`,
        }),
      ),
    );
  }
  return res.ok ? { ok: true } : res;
}

export { DisputeStatus };
