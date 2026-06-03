import "server-only";
import { GigStatus } from "@prisma/client";

import { db } from "@/server/db";

/** Toggle simpan/hapus gig dari wishlist. Mengembalikan status akhir. */
export async function toggleWishlist(
  userId: string,
  gigId: string,
): Promise<{ wishlisted: boolean }> {
  const existing = await db.wishlist.findUnique({
    where: { userId_gigId: { userId, gigId } },
  });
  if (existing) {
    await db.wishlist.delete({ where: { id: existing.id } });
    return { wishlisted: false };
  }
  // Pastikan gig valid sebelum disimpan.
  const gig = await db.gig.findUnique({ where: { id: gigId }, select: { id: true } });
  if (!gig) return { wishlisted: false };
  await db.wishlist.create({ data: { userId, gigId } });
  return { wishlisted: true };
}

export async function isWishlisted(userId: string, gigId: string): Promise<boolean> {
  const row = await db.wishlist.findUnique({
    where: { userId_gigId: { userId, gigId } },
    select: { id: true },
  });
  return !!row;
}

export async function listWishlist(userId: string) {
  return db.wishlist.findMany({
    where: { userId, gig: { status: GigStatus.ACTIVE } },
    include: {
      gig: {
        include: {
          packages: { orderBy: { priceIDR: "asc" } },
          category: { select: { name: true } },
          freelancer: {
            select: {
              id: true,
              name: true,
              image: true,
              freelancerProfile: { select: { level: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function wishlistCount(userId: string): Promise<number> {
  return db.wishlist.count({ where: { userId } });
}

/** Kumpulan gigId yang ada di wishlist user (untuk menandai kartu gig). */
export async function getWishlistedIds(
  userId: string,
  gigIds?: string[],
): Promise<Set<string>> {
  const rows = await db.wishlist.findMany({
    where: { userId, ...(gigIds ? { gigId: { in: gigIds } } : {}) },
    select: { gigId: true },
  });
  return new Set(rows.map((r) => r.gigId));
}
