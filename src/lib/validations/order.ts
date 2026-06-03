import { z } from "zod";

export const checkoutSchema = z.object({
  gigId: z.string().min(1),
  tier: z.enum(["BASIC", "STANDARD", "PREMIUM"]),
  requirements: z.string().max(2000).optional().default(""),
});

export const deliverySchema = z.object({
  orderId: z.string().min(1),
  message: z.string().min(3, "Tulis pesan pengiriman").max(2000),
  files: z.array(z.string().url()).max(20).default([]),
});

export const revisionSchema = z.object({
  orderId: z.string().min(1),
  message: z.string().min(5, "Jelaskan revisi yang diminta").max(2000),
});

export const messageSchema = z.object({
  orderId: z.string().min(1),
  body: z.string().min(1, "Pesan kosong").max(2000),
});

export const disputeSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(10, "Jelaskan masalahnya").max(2000),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type DeliveryInput = z.infer<typeof deliverySchema>;
export type RevisionInput = z.infer<typeof revisionSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type DisputeInput = z.infer<typeof disputeSchema>;
