import "server-only";
import { OrderStatus } from "@prisma/client";

import { db } from "@/server/db";
import { reviewSchema, type ReviewInput } from "@/lib/validations/review";
import { recomputeFreelancerStats } from "@/server/services/profile-service";

/** Client memberi review untuk order yang sudah COMPLETED (sekali saja). */
export async function createReview(
  clientId: string,
  input: ReviewInput,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const { orderId, rating, comment } = parsed.data;

  const order = await db.order.findFirst({
    where: { id: orderId, clientId, status: OrderStatus.COMPLETED },
    select: { id: true, gigId: true, freelancerId: true, review: { select: { id: true } } },
  });
  if (!order) return { ok: false, error: "Order belum selesai atau tidak ditemukan." };
  if (order.review) return { ok: false, error: "Anda sudah memberi ulasan." };

  await db.$transaction(async (tx) => {
    await tx.review.create({
      data: {
        orderId: order.id,
        gigId: order.gigId,
        freelancerId: order.freelancerId,
        clientId,
        rating,
        comment: comment || null,
      },
    });
    // Perbarui agregat rating gig.
    const agg = await tx.review.aggregate({
      where: { gigId: order.gigId },
      _avg: { rating: true },
      _count: true,
    });
    await tx.gig.update({
      where: { id: order.gigId },
      data: {
        ratingAvg: Math.round((agg._avg.rating ?? 0) * 100) / 100,
        ratingCount: agg._count,
      },
    });
  });

  await recomputeFreelancerStats(order.freelancerId);
  return { ok: true };
}

/** Freelancer membalas review. */
export async function replyToReview(
  freelancerId: string,
  reviewId: string,
  reply: string,
): Promise<{ ok: boolean; error?: string }> {
  const text = reply.trim().slice(0, 1000);
  if (text.length < 1) return { ok: false, error: "Balasan kosong." };
  const res = await db.review.updateMany({
    where: { id: reviewId, freelancerId },
    data: { freelancerReply: text },
  });
  return res.count > 0 ? { ok: true } : { ok: false, error: "Review tidak ditemukan." };
}
