"use client";

import { useActionState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import appConfig from "@/app.config";
import { useLang } from "@/components/i18n/language-provider";
import { Logo } from "@/components/ui/logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { completeOnboardingAction } from "@/lib/actions/organizations";
import type { AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = {};

export default function OnboardingPage() {
  const { ui, lang } = useLang();
  const [state, formAction, pending] = useActionState(completeOnboardingAction, initialState);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg space-y-6">
        <Logo />
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{ui.onboardingTitle}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{ui.onboardingSubtitle}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{appConfig.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="businessName">{ui.businessName}</Label>
                <Input id="businessName" name="businessName" required />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="industry">{ui.industry}</Label>
                  <Input id="industry" name="industry" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="defaultLang">{ui.defaultLang}</Label>
                  <select
                    id="defaultLang"
                    name="defaultLang"
                    defaultValue={lang}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="timezone">{ui.timezone}</Label>
                  <Input id="timezone" name="timezone" defaultValue="Europe/Istanbul" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="supportEmail">{ui.supportEmail}</Label>
                  <Input id="supportEmail" name="supportEmail" type="email" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="brandVoice">{ui.brandVoice}</Label>
                <Input id="brandVoice" name="brandVoice" placeholder={ui.brandVoicePlaceholder} />
              </div>

              <div className="space-y-1.5">
                <Label>{ui.workingHours}</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="openTime" className="text-xs font-normal text-muted-foreground">{ui.openTime}</Label>
                    <Input id="openTime" name="openTime" type="time" defaultValue="09:00" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="closeTime" className="text-xs font-normal text-muted-foreground">{ui.closeTime}</Label>
                    <Input id="closeTime" name="closeTime" type="time" defaultValue="18:00" />
                  </div>
                </div>
              </div>

              {state.error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
              )}

              <Button type="submit" disabled={pending} className="w-full gap-2">
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {ui.finishSetup}
                {!pending && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
