import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(80),
  image: z.string().url("URL foto tidak valid").optional().or(z.literal("")),
  headline: z.string().max(120).optional().or(z.literal("")),
  bio: z.string().max(2000).optional().or(z.literal("")),
  location: z.string().max(80).optional().or(z.literal("")),
  skills: z.array(z.string().min(1).max(40)).max(20).default([]),
});

export const payoutSchema = z.object({
  amountIDR: z
    .number({ invalid_type_error: "Jumlah wajib angka" })
    .int()
    .min(1, "Jumlah tidak valid"),
  bankName: z.string().min(2, "Nama bank wajib").max(60),
  accountName: z.string().min(2, "Nama pemilik rekening wajib").max(80),
  accountNo: z.string().min(4, "Nomor rekening wajib").max(40),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type PayoutInput = z.infer<typeof payoutSchema>;
