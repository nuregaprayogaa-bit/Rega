"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/server/auth-helpers";
import { requestPayout, savePayoutAccount } from "@/server/services/wallet-service";
import { Role } from "@prisma/client";
import type { PayoutInput, PayoutAccountInput } from "@/lib/validations/profile";

const FREELANCER = [Role.FREELANCER, Role.ADMIN];

export async function requestPayoutAction(input: PayoutInput) {
  const user = await requireRole(FREELANCER);
  const res = await requestPayout(user.id, input);
  revalidatePath("/sell/wallet");
  return res.ok ? { ok: true } : { error: res.error };
}

export async function savePayoutAccountAction(input: PayoutAccountInput) {
  const user = await requireRole(FREELANCER);
  const res = await savePayoutAccount(user.id, input);
  revalidatePath("/sell/wallet");
  return res.ok ? { ok: true } : { error: res.error };
}
