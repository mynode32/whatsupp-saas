"use client";

import { useActionState, useState } from "react";
import { Plus, ArrowRight, Loader2, Trash2 } from "lucide-react";
import { useLang } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createRuleAction, toggleRuleAction, deleteRuleAction } from "@/lib/actions/automations";
import { cn } from "@/lib/utils";
import type { AuthActionState } from "@/lib/actions/auth";
import type { Database } from "@/lib/supabase/types";

type Rule = Database["public"]["Tables"]["automation_rules"]["Row"];

const initialState: AuthActionState = {};

const M = {
  tr: {
    title: "Otomasyonlar", sub: "Tekrar eden soruları kurallarla otomatik kapat; insan gerekenler ekibe kalsın.",
    add: "Yeni kural", cancel: "Vazgeç", when: "Tetikleyici", then: "Eylem",
    active: "Aktif", paused: "Duraklatıldı", on: "Açık", off: "Kapalı",
    runs7d: "son 7 gün çalışma", statActive: "aktif kural", statTotal: "kural",
    name: "Kural adı", triggerType: "Tetikleyici türü", keyword: "Anahtar kelime(ler)",
    offHours: "Mesai dışı", keywordType: "Anahtar kelime içeriyorsa",
    keywordsPlaceholder: "örn. kargo, iade, teslimat (virgülle ayır)",
    replyBody: "Otomatik yanıt", create: "Oluştur", delete: "Sil",
    adminOnly: "Kural eklemek/değiştirmek için yönetici veya sahip olman gerekiyor.",
    empty: "Henüz kural yok.",
  },
  en: {
    title: "Automations", sub: "Auto-close repetitive asks with rules; leave the human ones for your team.",
    add: "New rule", cancel: "Cancel", when: "Trigger", then: "Action",
    active: "Active", paused: "Paused", on: "On", off: "Off",
    runs7d: "runs · last 7 days", statActive: "active rules", statTotal: "rules",
    name: "Rule name", triggerType: "Trigger type", keyword: "Keyword(s)",
    offHours: "Off hours", keywordType: "Message contains keyword",
    keywordsPlaceholder: "e.g. shipping, refund, delivery (comma-separated)",
    replyBody: "Auto-reply", create: "Create", delete: "Delete",
    adminOnly: "You need to be an admin or owner to add or change rules.",
    empty: "No rules yet.",
  },
};

export function AutomationsClient({
  organizationId,
  rules,
  runCounts,
  isAdmin,
}: {
  organizationId: string;
  rules: Rule[];
  runCounts: Record<string, number>;
  isAdmin: boolean;
}) {
  const { lang } = useLang();
  const m = M[lang];
  const [showForm, setShowForm] = useState(false);
  const [triggerType, setTriggerType] = useState<"keyword" | "off_hours">("keyword");
  const [state, formAction, pending] = useActionState(createRuleAction, initialState);

  const activeRules = rules.filter((r) => r.is_active);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">{m.title}</h2>
          <p className="text-sm text-muted-foreground">{m.sub}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowForm((s) => !s)} className="gap-2">
            <Plus className="h-4 w-4" /> {showForm ? m.cancel : m.add}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <p className="font-display text-2xl font-semibold tnum text-primary">{activeRules.length}/{rules.length}</p>
          <p className="mt-1 text-xs text-muted-foreground">{m.statActive}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <p className="font-display text-2xl font-semibold tnum text-primary">
            {Object.values(runCounts).reduce((a, b) => a + b, 0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{m.runs7d}</p>
        </div>
      </div>

      {!isAdmin && <p className="text-xs text-muted-foreground">{m.adminOnly}</p>}

      {showForm && isAdmin && (
        <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <input type="hidden" name="organizationId" value={organizationId} />
          <div className="space-y-1.5">
            <Label htmlFor="name">{m.name}</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="triggerType">{m.triggerType}</Label>
            <select
              id="triggerType"
              name="triggerType"
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value as "keyword" | "off_hours")}
              className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
            >
              <option value="keyword">{m.keywordType}</option>
              <option value="off_hours">{m.offHours}</option>
            </select>
          </div>
          {triggerType === "keyword" && (
            <div className="space-y-1.5">
              <Label htmlFor="keywords">{m.keyword}</Label>
              <Input id="keywords" name="keywords" placeholder={m.keywordsPlaceholder} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="replyBody">{m.replyBody}</Label>
            <textarea
              id="replyBody"
              name="replyBody"
              required
              rows={3}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          {state.error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
          <Button type="submit" disabled={pending} className="gap-2">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {m.create}
          </Button>
        </form>
      )}

      <ul className="space-y-3">
        {rules.map((r) => {
          const on = r.is_active;
          const replyAction = r.actions.find((a) => a.type === "reply");
          return (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:shadow-pop">
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold tracking-tight">{r.name}</h3>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", on ? "bg-success/12 text-success" : "bg-muted text-muted-foreground")}>
                      {on ? m.active : m.paused}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3 text-[13px] text-muted-foreground">
                    <span>
                      <span className="label-mono mr-1.5 text-primary/70">{m.when}</span>
                      {r.trigger_type === "keyword" ? (r.conditions.keywords ?? []).join(", ") : m.offHours}
                    </span>
                    <ArrowRight className="hidden h-3.5 w-3.5 shrink-0 sm:block" />
                    <span className="truncate">
                      <span className="label-mono mr-1.5 text-primary/70">{m.then}</span>
                      {replyAction && replyAction.type === "reply" ? replyAction.body : "—"}
                    </span>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex shrink-0 items-center gap-2">
                    <form
                      action={async (formData: FormData) => {
                        await toggleRuleAction(formData);
                      }}
                    >
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="isActive" value={(!on).toString()} />
                      <button
                        type="submit"
                        aria-label={on ? m.off : m.on}
                        className={cn("relative h-6 w-11 rounded-full transition-colors cursor-pointer", on ? "bg-primary" : "bg-muted")}
                      >
                        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all", on ? "left-[22px]" : "left-0.5")} />
                      </button>
                    </form>
                    <form
                      action={async (formData: FormData) => {
                        await deleteRuleAction(formData);
                      }}
                    >
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" aria-label={m.delete} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive cursor-pointer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
              {on && (runCounts[r.id] ?? 0) > 0 && (
                <div className="mt-4 flex items-center gap-6 border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="tnum"><span className="font-semibold text-foreground">{runCounts[r.id]}</span> {m.runs7d}</span>
                </div>
              )}
            </li>
          );
        })}
        {rules.length === 0 && <p className="px-1 py-8 text-center text-sm text-muted-foreground">{m.empty}</p>}
      </ul>
    </div>
  );
}
