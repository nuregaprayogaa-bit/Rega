import "server-only";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

import { db } from "@/server/db";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export type RegisterResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

/**
 * Mendaftarkan user baru (email + password). Peran default BUYER,
 * atau CONTRIBUTOR jika mendaftar sebagai kontributor.
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

  const { name, email, password, asContributor } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "Email sudah terdaftar" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: asContributor ? Role.CONTRIBUTOR : Role.BUYER,
    },
    select: { id: true },
  });

  return { ok: true, userId: user.id };
}
