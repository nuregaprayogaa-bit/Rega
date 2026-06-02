import { z } from "zod";

export const cartItemSchema = z.object({
  assetId: z.string().min(1),
  licenseType: z.enum(["STANDARD", "EXTENDED"]),
});

export const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Keranjang kosong").max(50),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
