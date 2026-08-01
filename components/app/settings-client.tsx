"use client";

import { useActionState } from "react";
import { CheckCircle2, CircleDashed, Loader2, X } from "lucide-react";
import appConfig from "@/app.config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/components/i18n/language-provider";
import { updateOrganizationBrandAction } from "@/lib/actions/organizations";
import { connectTwilioAction } from "@/lib/actions/channels";
import {
  inviteMemberAction,
  cancelInvitationAction,
  updateMemberRoleAction,
  removeMemberAction,
} from "@/lib/actions/members";
import type { AuthActionState } from "@/lib/actions/auth";
import type { TeamMember } from "@/lib/db/team";
import type { Database, OrgRole } from "@/lib/supabase/types";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];
type Invitation = Database["public"]["Tables"]["invitations"]["Row"];
type ChannelConnection = Database["public"]["Tables"]["channel_connections"]["Row"];

const initialState: AuthActionState = {};

export function SettingsClient({
  connected,
  organization,
  members,
  invitations,
  channels,
  currentUserId,
  currentUserRole,
}: {
  connected: Record<string, boolean>;
  organization: Organization | null;
  members: TeamMember[];
  invitations: Invitation[];
  channels: ChannelConnection[];
  currentUserId: string;
  currentUserRole: OrgRole;
}) {
  const { t, ui } = useLang();
  const isAdmin = currentUserRole === "owner" || currentUserRole === "admin";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* App brand (from app.config.ts — read only, change via /setup) */}
      <Card>
        <CardHeader>
          <CardTitle>{ui.brand}</CardTitle>
          <p className="text-sm text-muted-foreground">{ui.brandHint}</p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{ui.productName}</Label>
            <Input defaultValue={appConfig.name} readOnly />
          </div>
          <div className="space-y-1.5">
            <Label>{ui.domain}</Label>
            <Input defaultValue={appConfig.domain} readOnly />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{ui.tagline}</Label>
            <Input defaultValue={t(appConfig.tagline)} readOnly />
          </div>
        </CardContent>
      </Card>

      {/* Organization (real, editable) */}
      {organization && (
        <OrganizationCard organization={organization} isAdmin={isAdmin} />
      )}

      {/* Channels */}
      {organization && isAdmin && (
        <ChannelsCard organizationId={organization.id} channels={channels} />
      )}

      {/* Team */}
      {organization && (
        <TeamCard
          organizationId={organization.id}
          members={members}
          invitations={invitations}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
      )}

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>{ui.integrations}</CardTitle>
          <p className="text-sm text-muted-foreground">{ui.integrationsHint}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {appConfig.integrations.map((it) => (
            <div key={it.key} className="flex items-center gap-4 rounded-lg border border-border p-4">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-muted-foreground">
                <Icon name="plug" className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{it.name}</p>
                  {it.required && <Badge tone="warning">{ui.required}</Badge>}
                </div>
                <p className="truncate text-sm text-muted-foreground">{it.purpose}</p>
              </div>
              {connected[it.key] ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
                  <CheckCircle2 className="h-4 w-4" /> {ui.connected}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <CircleDashed className="h-4 w-4" /> {ui.demoMode}
                </span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function OrganizationCard({ organization, isAdmin }: { organization: Organization; isAdmin: boolean }) {
  const { ui } = useLang();
  const [state, formAction, pending] = useActionState(updateOrganizationBrandAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ui.organization}</CardTitle>
        <p className="text-sm text-muted-foreground">{ui.organizationHint}</p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="organizationId" value={organization.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">{ui.businessName}</Label>
              <Input id="name" name="name" defaultValue={organization.name} readOnly={!isAdmin} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="industry">{ui.industry}</Label>
              <Input id="industry" name="industry" defaultValue={organization.industry ?? ""} readOnly={!isAdmin} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="defaultLang">{ui.defaultLang}</Label>
              <select
                id="defaultLang"
                name="defaultLang"
                defaultValue={organization.default_lang}
                disabled={!isAdmin}
                className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm disabled:opacity-50"
              >
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timezone">{ui.timezone}</Label>
              <Input id="timezone" name="timezone" defaultValue={organization.timezone} readOnly={!isAdmin} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supportEmail">{ui.supportEmail}</Label>
              <Input id="supportEmail" name="supportEmail" type="email" defaultValue={organization.support_email ?? ""} readOnly={!isAdmin} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brandVoice">{ui.brandVoice}</Label>
              <Input id="brandVoice" name="brandVoice" defaultValue={organization.brand_voice ?? ""} readOnly={!isAdmin} />
            </div>
          </div>

          {state.error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
          )}
          {state.success && (
            <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{ui.saved}</p>
          )}

          {isAdmin && (
            <div className="flex justify-end">
              <Button type="submit" disabled={pending} className="gap-2">
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {ui.saveChanges}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function ChannelsCard({ organizationId, channels }: { organizationId: string; channels: ChannelConnection[] }) {
  const { ui } = useLang();
  const [state, formAction, pending] = useActionState(connectTwilioAction, initialState);
  const whatsapp = channels.find((c) => c.channel_type === "whatsapp");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ui.channels}</CardTitle>
        <p className="text-sm text-muted-foreground">{ui.channelsHint}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 rounded-lg border border-border p-4">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-muted-foreground">
            <Icon name="message-circle" className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">WhatsApp (Twilio)</p>
            <p className="truncate text-sm text-muted-foreground">
              {whatsapp?.external_id ?? ui.notConnected}
              {whatsapp?.last_error ? ` · ${whatsapp.last_error}` : ""}
            </p>
          </div>
          {whatsapp?.status === "connected" ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
              <CheckCircle2 className="h-4 w-4" /> {ui.connected}
            </span>
          ) : whatsapp?.status === "error" ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive">
              <CircleDashed className="h-4 w-4" /> {ui.connectionError}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <CircleDashed className="h-4 w-4" /> {ui.notConnected}
            </span>
          )}
        </div>

        <form action={formAction} className="flex items-center gap-3">
          <input type="hidden" name="organizationId" value={organizationId} />
          <Button type="submit" variant="outline" disabled={pending} className="gap-2">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {ui.testConnection}
          </Button>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}

const roleKey: Record<OrgRole, "roleOwner" | "roleAdmin" | "roleAgent" | "roleViewer"> = {
  owner: "roleOwner",
  admin: "roleAdmin",
  agent: "roleAgent",
  viewer: "roleViewer",
};

function TeamCard({
  organizationId,
  members,
  invitations,
  currentUserId,
  isAdmin,
}: {
  organizationId: string;
  members: TeamMember[];
  invitations: Invitation[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const { ui } = useLang();
  const [inviteState, inviteAction, invitePending] = useActionState(inviteMemberAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ui.team}</CardTitle>
        <p className="text-sm text-muted-foreground">{ui.teamHint}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-4 rounded-lg border border-border p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
                {(m.fullName || m.email || "?").slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {m.fullName || m.email} {m.userId === currentUserId && <span className="text-muted-foreground">({ui.you})</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">{m.email}</p>
              </div>
              {isAdmin && m.userId !== currentUserId ? (
                <form
                  action={async (formData: FormData) => {
                    await updateMemberRoleAction(initialState, formData);
                  }}
                  className="shrink-0"
                >
                  <input type="hidden" name="memberId" value={m.id} />
                  <select
                    name="role"
                    defaultValue={m.role === "owner" ? "admin" : m.role}
                    disabled={m.role === "owner"}
                    onChange={(e) => e.currentTarget.form?.requestSubmit()}
                    className="h-8 rounded-md border border-input bg-card px-2 text-xs disabled:opacity-50"
                  >
                    <option value="admin">{ui.roleAdmin}</option>
                    <option value="agent">{ui.roleAgent}</option>
                    <option value="viewer">{ui.roleViewer}</option>
                  </select>
                </form>
              ) : (
                <Badge tone="neutral" className="shrink-0">
                  {ui[roleKey[m.role]]}
                </Badge>
              )}
              {isAdmin && m.userId !== currentUserId && m.role !== "owner" && (
                <form
                  action={async (formData: FormData) => {
                    await removeMemberAction(initialState, formData);
                  }}
                >
                  <input type="hidden" name="memberId" value={m.id} />
                  <button type="submit" className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive cursor-pointer" aria-label={ui.removeMember}>
                    <X className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>

        {!isAdmin && <p className="text-xs text-muted-foreground">{ui.adminOnlySection}</p>}

        {isAdmin && (
          <>
            {invitations.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{ui.pendingInvites}</p>
                {invitations.map((inv) => (
                  <div key={inv.id} className="flex items-center gap-3 rounded-lg border border-dashed border-border p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{inv.email}</p>
                    </div>
                    <Badge tone="neutral">{ui[roleKey[inv.role]]}</Badge>
                    <form
                      action={async (formData: FormData) => {
                        await cancelInvitationAction(initialState, formData);
                      }}
                    >
                      <input type="hidden" name="invitationId" value={inv.id} />
                      <button type="submit" className="text-xs font-medium text-muted-foreground hover:text-destructive cursor-pointer">
                        {ui.cancelInvite}
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}

            <form action={inviteAction} className="flex items-end gap-2">
              <input type="hidden" name="organizationId" value={organizationId} />
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="inviteEmail">{ui.inviteEmail}</Label>
                <Input id="inviteEmail" name="email" type="email" placeholder="teammate@company.com" required />
              </div>
              <select name="role" defaultValue="agent" className="h-10 rounded-lg border border-input bg-card px-3 text-sm">
                <option value="admin">{ui.roleAdmin}</option>
                <option value="agent">{ui.roleAgent}</option>
                <option value="viewer">{ui.roleViewer}</option>
              </select>
              <Button type="submit" disabled={invitePending} className="gap-2">
                {invitePending && <Loader2 className="h-4 w-4 animate-spin" />}
                {ui.sendInvite}
              </Button>
            </form>
            {inviteState.error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{inviteState.error}</p>
            )}
            {inviteState.success && (
              <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
                {inviteState.message === "invited" ? ui.saved : inviteState.message}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
