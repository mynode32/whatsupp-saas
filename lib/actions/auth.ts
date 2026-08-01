"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import { isRateLimited } from "@/lib/rate-limit";

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export type AuthActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

const emailSchema = z.email();
const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

const signUpSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  email: emailSchema,
  password: passwordSchema,
});

export async function signUpAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  if (isRateLimited(`signup:${await clientIp()}`, 10)) {
    return { error: "Too many attempts. Try again in a minute." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) return { error: error.message };

  // Email confirmation is on: no session yet, user must click the email link.
  if (!data.session) {
    return { success: true, message: "check-email" };
  }

  redirect("/dashboard");
}

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export async function signInAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  if (isRateLimited(`signin:${parsed.data.email.toLowerCase()}`, 10)) {
    return { error: "Too many attempts. Try again in a minute." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const emailOnlySchema = z.object({ email: emailSchema });

export async function requestPasswordResetAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = emailOnlySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  if (isRateLimited(`reset:${parsed.data.email.toLowerCase()}`, 5)) {
    return { success: true, message: "check-email" }; // don't reveal rate limiting to a potential attacker either
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
  });
  // Don't reveal whether the email exists — same success message either way.
  if (error) return { error: error.message };
  return { success: true, message: "check-email" };
}

const newPasswordSchema = z.object({ password: passwordSchema });

export async function updatePasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = newPasswordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };

  redirect("/dashboard");
}
