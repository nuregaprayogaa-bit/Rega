import "server-only";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

import { db } from "@/server/db";
import { sendEmail, emailTemplate } from "@/server/adapters/email";
import {
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

// ============================================================
// RESET KATA SANDI (lupa password)
// ============================================================

/**
 * Mulai proses reset: buat token & kirim email berisi link.
 * Selalu mengembalikan ok (anti-enumerasi: tidak membocorkan apakah email terdaftar).
 */
export async function requestPasswordReset(
  input: ForgotPasswordInput,
): Promise<{ ok: boolean }> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: true };
  const email = parsed.data.email.toLowerCase();

  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 jam
    // Hapus token lama untuk email ini, lalu buat baru.
    await db.verificationToken.deleteMany({ where: { identifier: email } });
    await db.verificationToken.create({ data: { identifier: email, token, expires } });

    const link = `${APP_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: email,
      subject: "Atur ulang kata sandi Worq",
      html: emailTemplate({
        heading: "Atur ulang kata sandi",
        body: "Kami menerima permintaan untuk mengatur ulang kata sandimu. Klik tombol di bawah (berlaku 1 jam). Abaikan email ini jika kamu tidak meminta.",
        ctaLabel: "Atur ulang kata sandi",
        ctaUrl: `/reset-password?token=${token}`,
      }),
    });
    // Juga catat ke log (berguna saat email belum dikonfigurasi).
    console.info(`[reset-password] link untuk ${email}: ${link}`);
  }
  return { ok: true };
}

/** Selesaikan reset: validasi token & ganti kata sandi. */
export async function resetPassword(
  input: ResetPasswordInput,
): Promise<{ ok: boolean; error?: string }> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const { token, password } = parsed.data;

  const row = await db.verificationToken.findFirst({ where: { token } });
  if (!row || row.expires < new Date()) {
    return { ok: false, error: "Link tidak valid atau sudah kedaluwarsa. Minta link baru." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.update({
    where: { email: row.identifier },
    data: { passwordHash },
  });
  await db.verificationToken.deleteMany({ where: { identifier: row.identifier } });
  return { ok: true };
}
