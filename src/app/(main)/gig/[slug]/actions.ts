"use server";

import { requireUser } from "@/server/auth-helpers";
import { createCheckout } from "@/server/services/order-service";
import type { CheckoutInput } from "@/lib/validations/order";

export type CheckoutActionResult = {
  ok?: boolean;
  orderId?: string;
  redirectUrl?: string | null;
  error?: string;
};

export async function checkoutAction(input: CheckoutInput): Promise<CheckoutActionResult> {
  const user = await requireUser();
  const res = await createCheckout(
    { id: user.id, name: user.name, email: user.email },
    input,
  );
  if (!res.ok) return { error: res.error };
  return { ok: true, orderId: res.orderId, redirectUrl: res.redirectUrl };
}
