import { z } from "zod";

export const jobSchema = z
  .object({
    title: z.string().min(8, "Judul minimal 8 karakter").max(120),
    description: z.string().min(20, "Deskripsi minimal 20 karakter").max(5000),
    categoryId: z.string().optional().nullable(),
    budgetMinIDR: z
      .number({ invalid_type_error: "Anggaran harus angka" })
      .int()
      .min(0)
      .max(1_000_000_000)
      .optional(),
    budgetMaxIDR: z
      .number({ invalid_type_error: "Anggaran harus angka" })
      .int()
      .min(0)
      .max(1_000_000_000)
      .optional(),
  })
  .refine(
    (d) => d.budgetMinIDR == null || d.budgetMaxIDR == null || d.budgetMaxIDR >= d.budgetMinIDR,
    { message: "Anggaran maksimum harus ≥ minimum", path: ["budgetMaxIDR"] },
  );

export const proposalSchema = z.object({
  jobId: z.string().min(1),
  message: z.string().min(10, "Jelaskan penawaranmu (min. 10 karakter)").max(2000),
  priceIDR: z
    .number({ invalid_type_error: "Harga harus angka" })
    .int("Harga harus bilangan bulat")
    .min(5000, "Harga minimal Rp 5.000")
    .max(1_000_000_000),
});

export type JobInput = z.infer<typeof jobSchema>;
export type ProposalInput = z.infer<typeof proposalSchema>;
