"use client";

import { useActionState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useLang } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";
import { acceptInvitationAction } from "@/lib/actions/members";
import type { AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = {};

export function AcceptInviteForm({ token, orgName, role }: { token: string; orgName: string; role: string }) {
  const { ui } = useLang();
  const [state, formAction, pending] = useActionState(acceptInvitationAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <p className="text-sm text-muted-foreground">
        {orgName} · <span className="font-medium text-foreground">{role}</span>
      </p>
      {state.error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" disabled={pending} className="w-full gap-2">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {ui.getStarted}
        {!pending && <ArrowRight className="h-4 w-4" />}
      </Button>
    </form>
  );
}
