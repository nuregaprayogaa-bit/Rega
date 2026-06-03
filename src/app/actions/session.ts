"use server";

import { cookies } from "next/headers";
import { Role } from "@prisma/client";
import { signOut } from "@/server/auth";
import { requireUser } from "@/server/auth-helpers";
import { db } from "@/server/db";
import { ensureFreelancerSetup } from "@/server/services/auth-service";
import { SUPPORTED_LOCALES } from "@/lib/constants";

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

/**
 * Upgrade akun client yang sedang login menjadi freelancer.
 * Menyiapkan profil & dompet. Sesi disegarkan via update() di sisi client.
 */
export async function becomeFreelancerAction(): Promise<{ ok: boolean }> {
  const user = await requireUser();
  if (user.role === Role.CLIENT) {
    await db.user.update({ where: { id: user.id }, data: { role: Role.FREELANCER } });
    await ensureFreelancerSetup(user.id);
  }
  return { ok: true };
}

export async function setLocaleAction(locale: string) {
  if (!SUPPORTED_LOCALES.includes(locale as (typeof SUPPORTED_LOCALES)[number])) return;
  const store = await cookies();
  store.set("NEXT_LOCALE", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}
