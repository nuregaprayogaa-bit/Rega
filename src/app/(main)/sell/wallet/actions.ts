"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/server/auth-helpers";
import { requestPayout } from "@/server/services/wallet-service";
import { Role } from "@prisma/client";
import type { PayoutInput } from "@/lib/validations/profile";

export async function requestPayoutAction(input: PayoutInput) {
  const user = await requireRole([Role.FREELANCER, Role.ADMIN]);
  const res = await requestPayout(user.id, input);
  revalidatePath("/sell/wallet");
  return res.ok ? { ok: true } : { error: res.error };
}
