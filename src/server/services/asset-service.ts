import "server-only";
import {
  AssetStatus,
  AssetType,
  LicenseType,
  Prisma,
  type SensitiveFlag,
} from "@prisma/client";

import { db } from "@/server/db";
import { slugify } from "@/lib/slug";
import { createAssetSchema, type CreateAssetInput } from "@/lib/validations/asset";
import {
  isStorageConfigured,
  getObjectBuffer,
  putObject,
} from "@/server/adapters/storage/s3";
import { makePreview, makeWatermarked, readImageMeta } from "@/server/adapters/media/image";

const EXTENDED_MULTIPLIER_FALLBACK = 3;

export type CreateAssetResult =
  | { ok: true; assetId: string }
  | { ok: false; error: string };

/**
 * Membuat asset baru milik kontributor. Status awal selalu PENDING.
 * Jika storage dikonfigurasi & tipe PHOTO: hasilkan preview + watermark dari
 * file asli. Jika belum, simpan metadata dengan placeholder (mode demo).
 */
export async function createAsset(
  contributorId: string,
  input: CreateAssetInput,
): Promise<CreateAssetResult> {
  const parsed = createAssetSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Data tidak valid",
    };
  }
  const data = parsed.data;

  const extLicense = await db.license.findUnique({
    where: { type: LicenseType.EXTENDED },
  });
  const extMultiplier = extLicense
    ? Number(extLicense.priceMultiplier)
    : EXTENDED_MULTIPLIER_FALLBACK;
  const priceExtended = Math.round(data.priceStandard * extMultiplier);

  let previewKey: string | null = null;
  let watermarkedKey: string | null = null;
  let width = data.width ?? null;
  let height = data.height ?? null;

  // Pemrosesan gambar hanya jika storage aktif & file foto.
  if (isStorageConfigured() && data.type === AssetType.PHOTO) {
    try {
      const original = await getObjectBuffer(data.originalFileKey);
      const meta = await readImageMeta(original);
      width = meta.width || width;
      height = meta.height || height;

      const base = data.originalFileKey.replace(/\.[^/.]+$/, "");
      previewKey = `${base}_preview.jpg`;
      watermarkedKey = `${base}_wm.jpg`;

      const [preview, watermarked] = await Promise.all([
        makePreview(original),
        makeWatermarked(original),
      ]);
      await Promise.all([
        putObject(previewKey, preview, "image/jpeg"),
        putObject(watermarkedKey, watermarked, "image/jpeg"),
      ]);
    } catch (e) {
      console.error("Gagal memproses gambar:", e);
      return {
        ok: false,
        error: "Gagal memproses gambar. Periksa konfigurasi storage.",
      };
    }
  }

  const categoryId = data.categorySlug
    ? (await db.category.findUnique({ where: { slug: data.categorySlug } }))?.id ?? null
    : null;

  const asset = await db.asset.create({
    data: {
      contributorId,
      type: data.type,
      title: data.title,
      description: data.description || null,
      status: AssetStatus.PENDING,
      sensitiveFlags: data.sensitiveFlags as SensitiveFlag[],
      originalFileKey: data.originalFileKey,
      previewFileKey: previewKey,
      watermarkedFileKey: watermarkedKey,
      width,
      height,
      durationSec: data.durationSec ?? null,
      categoryId,
      prices: {
        create: [
          { licenseType: LicenseType.STANDARD, amountIDR: data.priceStandard },
          { licenseType: LicenseType.EXTENDED, amountIDR: priceExtended },
        ],
      },
      tags: {
        create: data.tags.map((name) => ({
          tag: {
            connectOrCreate: {
              where: { name: name.toLowerCase() },
              create: { name: name.toLowerCase(), slug: slugify(name) },
            },
          },
        })),
      },
    },
    select: { id: true },
  });

  return { ok: true, assetId: asset.id };
}

export type CatalogFilters = {
  q?: string;
  type?: AssetType;
  categorySlug?: string;
  page?: number;
  perPage?: number;
};

const assetCardSelect = {
  id: true,
  title: true,
  type: true,
  width: true,
  height: true,
  previewFileKey: true,
  watermarkedFileKey: true,
  category: { select: { name: true, slug: true } },
  prices: { select: { licenseType: true, amountIDR: true } },
} satisfies Prisma.AssetSelect;

/** Daftar asset APPROVED untuk katalog publik, dengan filter & pencarian. */
export async function listApprovedAssets(filters: CatalogFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = Math.min(48, filters.perPage ?? 24);

  const where: Prisma.AssetWhereInput = {
    status: AssetStatus.APPROVED,
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.categorySlug
      ? { category: { slug: filters.categorySlug } }
      : {}),
    ...(filters.q
      ? {
          OR: [
            { title: { contains: filters.q, mode: "insensitive" } },
            { description: { contains: filters.q, mode: "insensitive" } },
            {
              tags: {
                some: {
                  tag: { name: { contains: filters.q, mode: "insensitive" } },
                },
              },
            },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    db.asset.findMany({
      where,
      select: assetCardSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.asset.count({ where }),
  ]);

  return { items, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

/** Detail asset APPROVED untuk halaman publik. */
export async function getApprovedAsset(id: string) {
  return db.asset.findFirst({
    where: { id, status: AssetStatus.APPROVED },
    include: {
      category: true,
      prices: true,
      tags: { include: { tag: true } },
      contributor: { select: { id: true, name: true } },
    },
  });
}

/** Asset milik kontributor (semua status). */
export async function listContributorAssets(contributorId: string) {
  return db.asset.findMany({
    where: { contributorId },
    select: { ...assetCardSelect, status: true, rejectionReason: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}
