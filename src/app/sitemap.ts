import type { MetadataRoute } from "next";

import { db } from "@/server/db";
import { GigStatus } from "@prisma/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/search",
    "/jobs",
    "/cara-kerja",
    "/tentang",
    "/faq",
    "/kontak",
    "/syarat-ketentuan",
    "/kebijakan-privasi",
    "/login",
    "/register",
  ].map((path) => ({
    url: `${APP_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.6,
  }));

  let gigRoutes: MetadataRoute.Sitemap = [];
  try {
    const gigs = await db.gig.findMany({
      where: { status: GigStatus.ACTIVE },
      select: { slug: true, updatedAt: true },
      take: 1000,
    });
    gigRoutes = gigs.map((g) => ({
      url: `${APP_URL}/gig/${g.slug}`,
      lastModified: g.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // DB belum siap saat build awal — abaikan.
  }

  return [...staticRoutes, ...gigRoutes];
}
