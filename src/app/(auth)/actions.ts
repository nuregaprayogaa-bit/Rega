"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/server/auth";
import {
  registerUser,
  requestPasswordReset,
  resetPassword,
} from "@/server/services/auth-service";
import { limitByIp } from "@/lib/rate-limit";
import type {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@/lib/validations/auth";

export type ActionState = { error?: string; success?: boolean };

export async function loginAction(
  input: LoginInput & { callbackUrl?: string },
): Promise<ActionState> {
  // Anti brute-force: maksimal 10 percobaan / menit per IP.
  const limited = await limitByIp("login", 10, 60_000);
  if (limited) return { error: limited };

  try {
    await signIn("credentials", {
      email: input.email,
      password: input.password,
      redirectTo: input.callbackUrl || "/dashboard",
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Email atau kata sandi salah" };
      }
      return { error: "Gagal masuk. Coba lagi." };
    }
    // next-auth melempar redirect sebagai error khusus — biarkan terlempar.
    throw error;
  }
}

export async function registerAction(
  input: RegisterInput,
): Promise<ActionState> {
  // Anti spam pendaftaran: maksimal 5 / menit per IP.
  const limited = await limitByIp("register", 5, 60_000);
  if (limited) return { error: limited };

  const result = await registerUser(input);
  if (!result.ok) {
    return { error: result.error };
  }
  return { success: true };
}

export async function forgotPasswordAction(
  input: ForgotPasswordInput,
): Promise<ActionState> {
  const limited = await limitByIp("forgot", 5, 60_000);
  if (limited) return { error: limited };
  await requestPasswordReset(input);
  // Selalu sukses (anti-enumerasi).
  return { success: true };
}

export async function resetPasswordAction(
  input: ResetPasswordInput,
): Promise<ActionState> {
  const limited = await limitByIp("reset", 10, 60_000);
  if (limited) return { error: limited };
  const res = await resetPassword(input);
  return res.ok ? { success: true } : { error: res.error };
}
