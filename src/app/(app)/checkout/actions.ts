"use server";

import { requireUser } from "@/server/auth-helpers";
import { createCheckout, type CheckoutResult } from "@/server/services/order-service";
import type { CartItemInput } from "@/lib/validations/order";

export async function checkoutAction(
  items: CartItemInput[],
): Promise<CheckoutResult> {
  const user = await requireUser("/cart");
  return createCheckout(
    { id: user.id, name: user.name, email: user.email },
    { items },
  );
}
