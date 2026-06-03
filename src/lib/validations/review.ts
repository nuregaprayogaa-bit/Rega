import { z } from "zod";

export const reviewSchema = z.object({
  orderId: z.string().min(1),
  rating: z
    .number({ invalid_type_error: "Rating wajib" })
    .int()
    .min(1, "Beri minimal 1 bintang")
    .max(5),
  comment: z.string().max(1000).optional().default(""),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
