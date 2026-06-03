import "server-only";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

import { db } from "@/server/db";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export type RegisterResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

/**
 * Mendaftarkan user baru (email + password). Peran CLIENT atau FREELANCER.
 * Freelancer otomatis dibuatkan profil & dompet kosong.
 */
export async function registerUser(
  input: RegisterInput,
): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Data tidak valid",
    };
  }

  const { name, email, password, role } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "Email sudah terdaftar" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const isFreelancer = role === "FREELANCER";

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: isFreelancer ? Role.FREELANCER : Role.CLIENT,
      ...(isFreelancer
        ? {
            freelancerProfile: { create: {} },
            wallet: { create: {} },
          }
        : {}),
    },
    select: { id: true },
  });

  return { ok: true, userId: user.id };
}

/** Pastikan freelancer punya profil & dompet (dipakai saat upgrade peran). */
export async function ensureFreelancerSetup(userId: string): Promise<void> {
  await db.freelancerProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
  await db.walletAccount.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}
