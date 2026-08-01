"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import type { DashboardMetrics } from "@/lib/db/metrics";

const M = {
  tr: {
    hi: "Merhaba", inbox: "Gelen kutusu",
    open: "Açık", pending: "Bekliyor", resolvedToday: "Bugün çözülen", avgResponse: "Ort. ilk yanıt", team: "Ekip üyesi",
    noData: "—",
    queueTitle: "Önceliğe göre kuyruk", high: "Yüksek", normal: "Normal", low: "Düşük",
    rtTitle: "Yanıt süresi · son 7 gün", rtSub: "ilk yanıta kadar saniye", rtEmpty: "Henüz yeterli veri yok.",
    channelTitle: "Kanal dağılımı",
    perfTitle: "Ekip performansı", perfHandled: "çözülen", perfAvg: "ort. süre",
    sec: "sn", min: "dk",
  },
  en: {
    hi: "Hi", inbox: "Inbox",
    open: "Open", pending: "Pending", resolvedToday: "Resolved today", avgResponse: "Avg first response", team: "Team members",
    noData: "—",
    queueTitle: "Queue by priority", high: "High", normal: "Normal", low: "Low",
    rtTitle: "Response time · last 7 days", rtSub: "seconds to first reply", rtEmpty: "Not enough data yet.",
    channelTitle: "Channel mix",
    perfTitle: "Team performance", perfHandled: "handled", perfAvg: "avg time",
    sec: "s", min: "m",
  },
};

function formatSeconds(sec: number | null, lang: "tr" | "en"): string {
  if (sec === null) return "—";
  if (sec < 60) return `${Math.round(sec)}${M[lang].sec}`;
  return `${Math.round(sec / 60)}${M[lang].min}`;
}

export function DashboardClient({ userName, metrics }: { userName: string; metrics: DashboardMetrics }) {
  const { lang } = useLang();
  const m = M[lang];

  const kpis = [
    { icon: "inbox", label: m.open, value: metrics.openCount },
    { icon: "clock", label: m.pending, value: metrics.pendingCount },
    { icon: "check-circle-2", label: m.resolvedToday, value: metrics.resolvedTodayCount },
    { icon: "zap", label: m.avgResponse, value: formatSeconds(metrics.avgFirstResponseSeconds, lang) },
    { icon: "users", label: m.team, value: metrics.teamPerformance.length },
  ];

  const maxQueue = Math.max(1, ...metrics.queueByPriority.map((q) => q.count));
  const maxRt = Math.max(1, ...metrics.responseTimeByDay.map((d) => d.avgSeconds ?? 0));
  const hasResponseData = metrics.responseTimeByDay.some((d) => d.avgSeconds !== null);
  const channelTotal = metrics.channelMix.reduce((s, c) => s + c.count, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold tracking-tight">{m.hi}{userName ? ` ${userName}` : ""} 👋</h2>
        <Link href="/conversations" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
          <Icon name="messages-square" className="h-4 w-4" /> {m.inbox}
        </Link>
      </div>

      {/* KPI row */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon name={k.icon} className="h-[18px] w-[18px]" /></span>
            <p className="mt-3 font-display text-2xl font-semibold tnum">{k.value}</p>
            <p className="text-sm font-medium text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* queue by priority */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-display text-lg font-semibold tracking-tight">{m.queueTitle}</h3>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {metrics.queueByPriority.map((q) => (
              <div key={q.priority} className={cn("rounded-xl p-4", q.priority === "high" ? "bg-destructive/8" : q.priority === "normal" ? "bg-info/8" : "bg-muted/60")}>
                <p className={cn("font-display text-3xl font-semibold tnum", q.priority === "high" ? "text-destructive" : q.priority === "normal" ? "text-info" : "text-muted-foreground")}>{q.count}</p>
                <p className="mt-1 text-xs text-muted-foreground">{m[q.priority]}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/5">
                  <div className="h-full rounded-full bg-current opacity-40" style={{ width: `${(q.count / maxQueue) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* channel mix */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-display text-lg font-semibold tracking-tight">{m.channelTitle}</h3>
          {channelTotal === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{m.rtEmpty}</p>
          ) : (
            <ul className="mt-4 space-y-3.5">
              {metrics.channelMix.map((c) => {
                const pct = Math.round((c.count / channelTotal) * 100);
                return (
                  <li key={c.channel}>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="flex-1 font-medium capitalize">{c.channel}</span>
                      <span className="tnum text-muted-foreground">{pct}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* response time 7d */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-display text-lg font-semibold tracking-tight">{m.rtTitle}</h3>
          <p className="text-xs text-muted-foreground">{m.rtSub}</p>
          {!hasResponseData ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">{m.rtEmpty}</p>
          ) : (
            <div className="mt-5 flex h-32 items-end gap-2.5">
              {metrics.responseTimeByDay.map((d) => {
                const h = d.avgSeconds !== null ? (d.avgSeconds / maxRt) * 100 : 0;
                return (
                  <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex w-full flex-1 items-end">
                      <div className="w-full rounded-t-lg bg-primary/60" style={{ height: `${h}%`, minHeight: d.avgSeconds !== null ? "4px" : "0" }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{d.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* team performance */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-display text-lg font-semibold tracking-tight">{m.perfTitle}</h3>
          <ul className="mt-4 space-y-2.5">
            {metrics.teamPerformance.map((a) => (
              <li key={a.userId} className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
                <span className="truncate text-sm font-medium">{a.name}</span>
                <span className="w-14 text-right text-sm tnum"><span className="font-semibold">{a.handled}</span> {m.perfHandled}</span>
                <span className="w-14 text-right text-sm tnum text-muted-foreground">{formatSeconds(a.avgResolutionSeconds, lang)}</span>
              </li>
            ))}
            {metrics.teamPerformance.length === 0 && <p className="text-sm text-muted-foreground">{m.rtEmpty}</p>}
          </ul>
        </div>
      </section>
    </div>
  );
}
