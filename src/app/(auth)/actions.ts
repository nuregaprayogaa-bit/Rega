"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/server/auth";
import { registerUser } from "@/server/services/auth-service";
import type { LoginInput, RegisterInput } from "@/lib/validations/auth";

export type ActionState = { error?: string; success?: boolean };

export async function loginAction(
  input: LoginInput & { callbackUrl?: string },
): Promise<ActionState> {
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
  const result = await registerUser(input);
  if (!result.ok) {
    return { error: result.error };
  }
  return { success: true };
}
