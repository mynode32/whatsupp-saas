"use client";

import { useState } from "react";
import { Plus, ArrowRight } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/components/i18n/language-provider";
import { automations as seed, type AutomationStatus } from "@/lib/demo/data";
import { cn } from "@/lib/utils";

const M = {
  tr: {
    title: "Otomasyonlar", sub: "Tekrar eden soruları kurallarla otomatik kapat; insan gerekenler ekibe kalsın.",
    add: "Yeni kural", when: "Tetikleyici", then: "Eylem", active: "Aktif", paused: "Duraklatıldı",
    runs: "son 7 gün çalışma", deflect: "otomatik çözüm", on: "Açık", off: "Kapalı",
    statRuns: "7 günde çalışan", statDeflect: "ortalama otomatik çözüm", statActive: "aktif kural",
  },
  en: {
    title: "Automations", sub: "Auto-close repetitive asks with rules; leave the human ones for your team.",
    add: "New rule", when: "Trigger", then: "Action", active: "Active", paused: "Paused",
    runs: "runs · last 7 days", deflect: "deflected", on: "On", off: "Off",
    statRuns: "runs in 7 days", statDeflect: "average deflection", statActive: "active rules",
  },
};

export default function AutomationsPage() {
  const { lang, t } = useLang();
  const m = M[lang];
  const [rules, setRules] = useState(seed);

  const toggle = (id: string) =>
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, status: (r.status === "active" ? "paused" : "active") as AutomationStatus } : r)));

  const totalRuns = rules.reduce((s, r) => s + r.runs7d, 0);
  const activeRules = rules.filter((r) => r.status === "active");
  const avgDeflect = Math.round(activeRules.reduce((s, r) => s + r.deflect, 0) / (activeRules.length || 1));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">{m.title}</h2>
          <p className="text-sm text-muted-foreground">{m.sub}</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
          <Plus className="h-4 w-4" /> {m.add}
        </button>
      </div>

      {/* stat strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { v: totalRuns.toLocaleString(), l: m.statRuns },
          { v: `%${avgDeflect}`, l: m.statDeflect },
          { v: `${activeRules.length}/${rules.length}`, l: m.statActive },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="font-display text-2xl font-semibold tnum text-primary">{s.v}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>

      {/* rules */}
      <ul className="space-y-3">
        {rules.map((r) => {
          const on = r.status === "active";
          return (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:shadow-pop">
              <div className="flex items-start gap-4">
                <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl", on ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                  <Icon name={r.icon} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold tracking-tight">{t(r.name)}</h3>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", on ? "bg-success/12 text-success" : "bg-muted text-muted-foreground")}>{on ? m.active : m.paused}</span>
                  </div>
                  <div className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3 text-[13px] text-muted-foreground">
                    <span><span className="label-mono mr-1.5 text-primary/70">{m.when}</span>{t(r.trigger)}</span>
                    <ArrowRight className="hidden h-3.5 w-3.5 shrink-0 sm:block" />
                    <span><span className="label-mono mr-1.5 text-primary/70">{m.then}</span>{t(r.action)}</span>
                  </div>
                </div>
                {/* toggle */}
                <button
                  onClick={() => toggle(r.id)}
                  aria-label={on ? m.off : m.on}
                  className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", on ? "bg-primary" : "bg-muted")}
                >
                  <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all", on ? "left-[22px]" : "left-0.5")} />
                </button>
              </div>
              {on && r.runs7d > 0 && (
                <div className="mt-4 flex items-center gap-6 border-t border-border pt-3 text-xs text-muted-foreground">
                  <span className="tnum"><span className="font-semibold text-foreground">{r.runs7d.toLocaleString()}</span> {m.runs}</span>
                  <span className="tnum"><span className="font-semibold text-foreground">%{r.deflect}</span> {m.deflect}</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
