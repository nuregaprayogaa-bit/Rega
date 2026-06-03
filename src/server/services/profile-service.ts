import "server-only";
import { FreelancerLevel, OrderStatus } from "@prisma/client";

import { db } from "@/server/db";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";

/** Tentukan level/badge freelancer dari jumlah order selesai & rating. */
function computeLevel(completedOrders: number, ratingAvg: number): FreelancerLevel {
  if (completedOrders >= 50 && ratingAvg >= 4.8) return FreelancerLevel.TOP_RATED;
  if (completedOrders >= 20 && ratingAvg >= 4.5) return FreelancerLevel.LEVEL_2;
  if (completedOrders >= 5 && ratingAvg >= 4.0) return FreelancerLevel.LEVEL_1;
  return FreelancerLevel.NEW;
}

/**
 * Hitung ulang statistik freelancer (rating, jumlah order selesai, level)
 * dari sumber data (review & order). Dipanggil setelah order selesai / review.
 */
export async function recomputeFreelancerStats(freelancerId: string): Promise<void> {
  const [agg, completedOrders] = await Promise.all([
    db.review.aggregate({
      where: { freelancerId },
      _avg: { rating: true },
      _count: true,
    }),
    db.order.count({
      where: { freelancerId, status: OrderStatus.COMPLETED },
    }),
  ]);

  const ratingAvg = Math.round((agg._avg.rating ?? 0) * 100) / 100;
  const ratingCount = agg._count;
  const level = computeLevel(completedOrders, ratingAvg);

  await db.freelancerProfile.updateMany({
    where: { userId: freelancerId },
    data: { ratingAvg, ratingCount, completedOrders, level },
  });
}

export async function getMyProfile(userId: string) {
  return db.freelancerProfile.findUnique({ where: { userId } });
}

export async function updateProfile(
  userId: string,
  input: ProfileInput,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const { name, image, headline, bio, location, skills } = parsed.data;

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { name, image: image || null },
    }),
    db.freelancerProfile.upsert({
      where: { userId },
      create: {
        userId,
        headline: headline || null,
        bio: bio || null,
        location: location || null,
        skills,
      },
      update: {
        headline: headline || null,
        bio: bio || null,
        location: location || null,
        skills,
      },
    }),
  ]);
  return { ok: true };
}

/** Profil publik freelancer + gig aktif + review terbaru. */
export async function getPublicFreelancer(freelancerId: string) {
  const user = await db.user.findFirst({
    where: { id: freelancerId, role: { in: ["FREELANCER", "ADMIN"] } },
    select: {
      id: true,
      name: true,
      image: true,
      createdAt: true,
      freelancerProfile: true,
      gigs: {
        where: { status: "ACTIVE" },
        include: {
          packages: { orderBy: { priceIDR: "asc" } },
          category: { select: { name: true, slug: true } },
        },
        orderBy: { ordersCount: "desc" },
      },
    },
  });
  if (!user) return null;

  const reviews = await db.review.findMany({
    where: { freelancerId },
    include: {
      client: { select: { name: true, image: true } },
      gig: { select: { title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return { user, reviews };
}
