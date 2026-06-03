import "server-only";
import { GigStatus, type Prisma } from "@prisma/client";

import { db } from "@/server/db";

export type GigSort = "relevan" | "terlaris" | "rating" | "termurah" | "termahal" | "terbaru";

export type SearchParams = {
  q?: string;
  category?: string; // slug
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  maxDays?: number;
  sort?: GigSort;
  page?: number;
  perPage?: number;
};

export type GigCardData = {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  ratingAvg: number;
  ratingCount: number;
  ordersCount: number;
  startingPrice: number;
  categoryName: string | null;
  freelancer: { id: string; name: string | null; image: string | null; level: string };
};

function orderBy(sort: GigSort): Prisma.GigOrderByWithRelationInput[] {
  switch (sort) {
    case "terlaris":
      return [{ ordersCount: "desc" }, { ratingAvg: "desc" }];
    case "rating":
      return [{ ratingAvg: "desc" }, { ratingCount: "desc" }];
    case "terbaru":
      return [{ createdAt: "desc" }];
    // termurah/termahal: di-sort setelah ambil harga (lihat di bawah)
    default:
      return [{ ordersCount: "desc" }, { ratingAvg: "desc" }];
  }
}

/**
 * Cari gig dengan filter (kategori, harga, rating, durasi) + sorting.
 * Harga & durasi difilter pada level paket (paket termurah / tercepat).
 */
export async function searchGigs(params: SearchParams): Promise<{
  items: GigCardData[];
  total: number;
  page: number;
  perPage: number;
}> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(48, params.perPage ?? 12);
  const sort = params.sort ?? "relevan";

  const where: Prisma.GigWhereInput = { status: GigStatus.ACTIVE };

  if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
    ];
  }
  if (params.category) where.category = { slug: params.category };
  if (params.minRating) where.ratingAvg = { gte: params.minRating };

  // Filter harga/durasi via relasi paket.
  const packageWhere: Prisma.ServicePackageWhereInput = {};
  if (params.minPrice != null) packageWhere.priceIDR = { gte: params.minPrice };
  if (params.maxPrice != null) {
    packageWhere.priceIDR = { ...(packageWhere.priceIDR as object), lte: params.maxPrice };
  }
  if (params.maxDays != null) packageWhere.deliveryDays = { lte: params.maxDays };
  if (Object.keys(packageWhere).length > 0) {
    where.packages = { some: packageWhere };
  }

  const total = await db.gig.count({ where });

  const gigs = await db.gig.findMany({
    where,
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
    orderBy: orderBy(sort),
    skip: (page - 1) * perPage,
    take: perPage,
  });

  let items: GigCardData[] = gigs.map((g) => ({
    id: g.id,
    slug: g.slug,
    title: g.title,
    coverImage: g.coverImage,
    ratingAvg: g.ratingAvg,
    ratingCount: g.ratingCount,
    ordersCount: g.ordersCount,
    startingPrice: g.packages[0]?.priceIDR ?? 0,
    categoryName: g.category?.name ?? null,
    freelancer: {
      id: g.freelancer.id,
      name: g.freelancer.name,
      image: g.freelancer.image,
      level: g.freelancer.freelancerProfile?.level ?? "NEW",
    },
  }));

  // Sorting harga dilakukan di aplikasi (berdasar harga paket termurah).
  if (sort === "termurah") items.sort((a, b) => a.startingPrice - b.startingPrice);
  if (sort === "termahal") items.sort((a, b) => b.startingPrice - a.startingPrice);

  return { items, total, page, perPage };
}

export async function listCategories() {
  return db.category.findMany({
    include: { _count: { select: { gigs: { where: { status: GigStatus.ACTIVE } } } } },
    orderBy: { name: "asc" },
  });
}

/** Gig unggulan untuk landing page. */
export async function featuredGigs(limit = 8): Promise<GigCardData[]> {
  const { items } = await searchGigs({ sort: "terlaris", perPage: limit });
  return items;
}
