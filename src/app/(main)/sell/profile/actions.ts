"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/server/auth-helpers";
import { updateProfile } from "@/server/services/profile-service";
import { Role } from "@prisma/client";
import type { ProfileInput } from "@/lib/validations/profile";

export async function updateProfileAction(input: ProfileInput) {
  const user = await requireRole([Role.FREELANCER, Role.ADMIN]);
  const res = await updateProfile(user.id, input);
  revalidatePath("/sell/profile");
  return res.ok ? { ok: true } : { error: res.error };
}
