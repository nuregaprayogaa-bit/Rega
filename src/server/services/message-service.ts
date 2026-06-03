import "server-only";
import { DisputeStatus, OrderStatus } from "@prisma/client";

import { db } from "@/server/db";
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
    select: { conversation: { select: { id: true } } },
  });
  if (!order?.conversation) return { ok: false, error: "Percakapan tidak ditemukan." };

  await db.message.create({
    data: {
      conversationId: order.conversation.id,
      senderId: userId,
      body: parsed.data.body,
    },
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
  return db.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        id: parsed.data.orderId,
        OR: [{ clientId: userId }, { freelancerId: userId }],
      },
    });
    if (!order) return { ok: false, error: "Order tidak ditemukan." };
    const disputable: OrderStatus[] = [
      OrderStatus.IN_PROGRESS,
      OrderStatus.DELIVERED,
      OrderStatus.REVISION_REQUESTED,
    ];
    if (!disputable.includes(order.status)) {
      return { ok: false, error: "Order ini tidak bisa disengketakan." };
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
    return { ok: true };
  });
}

export { DisputeStatus };
