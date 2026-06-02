import { z } from "zod";

export const assetTypeEnum = z.enum(["PHOTO", "VIDEO"]);
export const licenseTypeEnum = z.enum(["STANDARD", "EXTENDED"]);

export const createAssetSchema = z.object({
  type: assetTypeEnum,
  title: z.string().min(4, "Judul minimal 4 karakter").max(140),
  description: z.string().max(2000).optional().or(z.literal("")),
  categorySlug: z.string().optional().or(z.literal("")),
  // tag dipisah koma di form, diproses jadi array
  tags: z.array(z.string().min(1).max(40)).max(30).default([]),
  priceStandard: z
    .number({ invalid_type_error: "Harga harus angka" })
    .int()
    .min(1000, "Harga minimal Rp 1.000")
    .max(100_000_000),
  // file keys hasil presigned upload
  originalFileKey: z.string().min(1, "File belum diunggah"),
  width: z.number().int().nonnegative().optional(),
  height: z.number().int().nonnegative().optional(),
  durationSec: z.number().int().nonnegative().optional(),
  sensitiveFlags: z
    .array(z.enum(["SARA", "POLITIK", "DEWASA"]))
    .default([]),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;

export const presignSchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1).max(120),
  type: assetTypeEnum,
});

export const moderationSchema = z.object({
  assetId: z.string().min(1),
  action: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().max(500).optional(),
});
