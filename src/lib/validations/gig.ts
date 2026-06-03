import { z } from "zod";

const packageSchema = z.object({
  tier: z.enum(["BASIC", "STANDARD", "PREMIUM"]),
  title: z.string().min(2, "Judul paket wajib").max(80),
  description: z.string().min(5, "Deskripsi paket wajib").max(500),
  priceIDR: z
    .number({ invalid_type_error: "Harga wajib angka" })
    .int("Harga harus bilangan bulat")
    .min(5000, "Harga minimal Rp 5.000")
    .max(500_000_000, "Harga terlalu besar"),
  deliveryDays: z
    .number({ invalid_type_error: "Durasi wajib angka" })
    .int()
    .min(1, "Minimal 1 hari")
    .max(180, "Maksimal 180 hari"),
  revisions: z
    .number({ invalid_type_error: "Revisi wajib angka" })
    .int()
    .min(0)
    .max(99),
  deliverables: z.array(z.string().min(1)).max(15).default([]),
});

export const gigSchema = z.object({
  title: z.string().min(8, "Judul minimal 8 karakter").max(120),
  description: z.string().min(30, "Deskripsi minimal 30 karakter").max(5000),
  categoryId: z.string().min(1, "Pilih kategori"),
  subcategoryId: z.string().optional().nullable(),
  coverImage: z
    .string()
    .url("URL gambar tidak valid")
    .optional()
    .or(z.literal("")),
  gallery: z.array(z.string().url()).max(8).default([]),
  packages: z
    .array(packageSchema)
    .min(1, "Minimal satu paket")
    .max(3)
    .refine(
      (pkgs) => new Set(pkgs.map((p) => p.tier)).size === pkgs.length,
      "Tier paket tidak boleh duplikat",
    ),
});

export type GigInput = z.infer<typeof gigSchema>;
export type PackageInput = z.infer<typeof packageSchema>;
