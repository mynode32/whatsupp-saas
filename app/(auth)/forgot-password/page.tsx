"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import appConfig from "@/app.config";
import { useLang } from "@/components/i18n/language-provider";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { requestPasswordResetAction, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = {};

export default function ForgotPasswordPage() {
  const { ui } = useLang();
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);
  const checkEmail = state.success && state.message === "check-email";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-7">
        <Link href="/" className="inline-flex">
          <Logo />
        </Link>

        {checkEmail ? (
          <div className="space-y-4 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Mail className="h-6 w-6" />
            </span>
            <h2 className="font-display text-2xl font-semibold tracking-tight">{ui.checkEmailTitle}</h2>
            <p className="text-sm text-muted-foreground">{ui.checkEmailBody}</p>
            <Link href="/login" className="inline-block text-sm font-medium text-primary hover:underline underline-offset-4">
              {ui.backToLogin}
            </Link>
          </div>
        ) : (
          <>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{appConfig.name}</p>
              <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight">{ui.forgotPassword}</h2>
            </div>
            <form action={formAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">{ui.email}</Label>
                <Input id="email" name="email" type="email" placeholder="you@company.com" required />
              </div>
              {state.error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
              )}
              <Button type="submit" disabled={pending} className="w-full gap-2">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {ui.sendResetLink}
                {!pending && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="font-medium text-primary hover:underline underline-offset-4">
                {ui.backToLogin}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
