"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, ArrowDownRight, Sparkles, Zap, BookOpen, Check, Clock, Star, Gauge, TrendingUp } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/components/i18n/language-provider";
import {
  kpis, extraKpis, heroWaiting, heroHandledToday, heroAvgResponseSec, responseTrend, dashInsight,
  channelMix, topIntents, agents, activity, conversations, channelMeta, statusMeta, sla,
  responseByDay, csatTrend, intentDetail, agentPerf,
} from "@/lib/demo/data";

function Sparkline({ data }: { data: number[] }) {
  const w = 320, h = 60, max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / (max - min || 1)) * (h - 8) - 4]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full" preserveAspectRatio="none">
      <defs><linearGradient id="yspark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--color-sidebar-active)" stopOpacity="0.4" /><stop offset="1" stopColor="var(--color-sidebar-active)" stopOpacity="0" /></linearGradient></defs>
      <path d={`${line} L${w} ${h} L0 ${h} Z`} fill="url(#yspark)" />
      <path d={line} fill="none" stroke="var(--color-sidebar-active)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.5" fill="var(--color-sidebar-active)" />
    </svg>
  );
}

export default function YanitlaDashboard() {
  const { lang, t } = useLang();
  const queue = conversations.filter((c) => c.status !== "resolved");
  const [selId, setSelId] = useState(queue[0].id);
  const sel = conversations.find((c) => c.id === selId) ?? queue[0];
  const channelTotal = channelMix.reduce((s, c) => s + c.value, 0);
  const allKpis = [...kpis, ...extraKpis];
  const rtMax = Math.max(...responseByDay.map((d) => d.sec));
  const rtBestIdx = responseByDay.reduce((b, d, i, a) => (d.sec < a[b].sec ? i : b), 0);
  const csatMax = 5, csatMin = 4;
  const intentMaxVol = Math.max(...intentDetail.map((i) => i.volume));

  const m = {
    tr: {
      hi: "Merhaba Elif", today: "Bugün · 13 Haziran",
      waitingPre: "konuşma yanıt bekliyor", handled: "bugün çözülen", avg: "ort. ilk yanıt",
      responseTitle: "Yanıt süresi · bugün", responseSub: "saniye / saat",
      inbox: "Gelen kutusu", inboxSub: "AI önerisini gör, tek tıkla gönder", all: "Tümü",
      suggested: "AI önerisi", source: "Kaynak", conf: "güven", send: "Tek tıkla gönder", edit: "Düzenle", handoff: "İnsana devret",
      channels: "Kanal dağılımı", intents: "En çok sorulanlar", auto: "otomatik", manual: "insan",
      agents: "Vardiyadaki ekip", open: "açık", online: "çevrimiçi", offline: "çevrimdışı",
      activity: "Son hareketler", waiting: "dk bekliyor",
      slaTitle: "SLA & kuyruk", slaWithin: "hedef içinde yanıt", slaTarget: "ilk yanıt hedefi",
      slaBreach: "SLA riski", slaOldest: "en eski bekleyen", slaQueue: "Önceliğe göre kuyruk",
      rtTitle: "Yanıt süresi · son 7 gün", rtSub: "ilk yanıta kadar saniye", rtBest: "en iyi gün", rtDelta: "geçen haftaya göre",
      csatTitle: "Memnuniyet eğilimi", csatSub: "CSAT · son 7 gün", csatNow: "şu an", csatOf: "5 üzerinden",
      intentTitle: "Konu kırılımı", intentSub: "hacim · AI ile çözüm · ort. süre", intentVol: "hacim", intentDef: "AI", intentAvg: "ort",
      perfTitle: "Ekip performansı · bugün", perfHandled: "çözülen", perfAvg: "ort. süre", perfCsat: "CSAT",
      slaLoad: "Kuyruk yükü", slaResolved: "bugün çözülen", slaAuto: "otomasyonla", slaPeak: "yoğun saat",
    },
    en: {
      hi: "Hi Elif", today: "Today · June 13",
      waitingPre: "chats waiting for a reply", handled: "resolved today", avg: "avg first response",
      responseTitle: "Response time · today", responseSub: "seconds / hour",
      inbox: "Inbox", inboxSub: "See the AI draft, send in one tap", all: "All",
      suggested: "AI suggestion", source: "Source", conf: "confidence", send: "Send in one tap", edit: "Edit", handoff: "Hand off",
      channels: "Channel mix", intents: "Top questions", auto: "auto", manual: "human",
      agents: "Team on shift", open: "open", online: "online", offline: "offline",
      activity: "Recent activity", waiting: "min waiting",
      slaTitle: "SLA & queue", slaWithin: "answered within target", slaTarget: "first-response target",
      slaBreach: "at SLA risk", slaOldest: "oldest waiting", slaQueue: "Queue by priority",
      rtTitle: "Response time · last 7 days", rtSub: "seconds to first reply", rtBest: "best day", rtDelta: "vs last week",
      csatTitle: "Satisfaction trend", csatSub: "CSAT · last 7 days", csatNow: "now", csatOf: "out of 5",
      intentTitle: "Intent breakdown", intentSub: "volume · deflected · avg time", intentVol: "volume", intentDef: "AI", intentAvg: "avg",
      perfTitle: "Team performance · today", perfHandled: "handled", perfAvg: "avg time", perfCsat: "CSAT",
      slaLoad: "Queue load", slaResolved: "resolved today", slaAuto: "by automation", slaPeak: "peak hour",
    },
  }[lang];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">{m.hi} 👋</h2>
          <p className="label-mono text-muted-foreground">{m.today}</p>
        </div>
        <Link href="/conversations" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
          <Icon name="messages-square" className="h-4 w-4" /> {m.inbox}
        </Link>
      </div>

      {/* HERO — live waiting + today stats + response sparkline */}
      <section className="relative overflow-hidden rounded-3xl border border-sidebar-border bg-sidebar p-7 text-sidebar-foreground glow lg:p-8" style={{ backgroundImage: "var(--grad-hero)" }}>
        <span className="blob -right-10 -top-16 h-56 w-56 bg-primary/40 drift" aria-hidden />
        <div className="relative grid gap-7 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="flex items-center gap-2 label-mono text-sidebar-muted">
              <span className="h-2 w-2 rounded-full bg-sidebar-active pulse-dot" /> {m.today.split("·")[0]}
            </p>
            <p className="mt-2 font-display text-5xl font-semibold tracking-tight lg:text-6xl">
              <span className="text-sidebar-active tnum">{heroWaiting}</span> {m.waitingPre}
            </p>
            <div className="mt-3"><Sparkline data={responseTrend} /></div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/[0.05] p-3 ring-1 ring-white/10">
                <p className="label-mono text-sidebar-muted">{m.handled}</p>
                <p className="mt-1 font-display text-xl font-semibold tnum">{heroHandledToday}</p>
              </div>
              <div className="rounded-xl bg-white/[0.05] p-3 ring-1 ring-white/10">
                <p className="label-mono text-sidebar-muted">{m.avg}</p>
                <p className="mt-1 font-display text-xl font-semibold tnum">{heroAvgResponseSec} sn</p>
              </div>
              <div className="rounded-xl bg-white/[0.05] p-3 ring-1 ring-white/10">
                <p className="label-mono text-sidebar-muted">{m.online}</p>
                <p className="mt-1 font-display text-xl font-semibold tnum">{agents.filter((a) => a.online).length}/{agents.length}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
              <p className="flex items-center gap-1.5 label-mono opacity-80"><Sparkles className="h-3.5 w-3.5" /> {t(kpis[3].label)}</p>
              <p className="mt-1 font-display text-4xl font-semibold tnum">{kpis[3].value}</p>
              <p className="mt-1 text-xs opacity-80">{t(kpis[3].hint)}</p>
            </div>
            <div className="flex items-start gap-2.5 rounded-2xl bg-white/[0.05] p-4 ring-1 ring-white/10">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sidebar-active" />
              <p className="text-[13px] leading-relaxed text-sidebar-foreground/85">{t(dashInsight)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* KPI row */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {allKpis.map((k) => {
          const up = (k.delta ?? 0) >= 0;
          return (
            <div key={t(k.label)} className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-pop">
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon name={k.icon} className="h-[18px] w-[18px]" /></span>
                {k.delta !== undefined && (
                  <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tnum ${up ? "bg-success/12 text-success" : "bg-muted text-muted-foreground"}`}>
                    {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{Math.abs(k.delta)}%
                  </span>
                )}
              </div>
              <p className="mt-3 font-display text-2xl font-semibold tnum">{k.value}</p>
              <p className="text-sm font-medium">{t(k.label)}</p>
              <p className="text-xs text-muted-foreground">{t(k.hint)}</p>
            </div>
          );
        })}
      </section>

      {/* SLA & QUEUE band */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.4fr]">
        <div className="flex items-center gap-5 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="relative h-24 w-24 shrink-0">
            <svg viewBox="0 0 84 84" className="h-24 w-24 -rotate-90">
              <circle cx="42" cy="42" r="34" fill="none" stroke="var(--color-muted)" strokeWidth="8" />
              <circle cx="42" cy="42" r="34" fill="none" stroke="var(--color-primary)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(sla.withinTarget / 100) * 2 * Math.PI * 34} ${2 * Math.PI * 34}`} />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="font-display text-xl font-semibold tnum">%{sla.withinTarget}</p>
                <p className="label-mono text-muted-foreground">SLA</p>
              </div>
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-lg font-semibold tracking-tight">{m.slaTitle}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{m.slaWithin}</p>
            <p className="mt-2 text-xs text-muted-foreground tnum">{m.slaTarget}: &lt; {sla.target}{lang === "tr" ? " sn" : "s"} · {m.slaOldest}: {sla.oldestWaitMin}{lang === "tr" ? " dk" : "m"}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold tracking-tight">{m.slaQueue}</h3>
            {sla.breaching > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive"><span className="h-1.5 w-1.5 rounded-full bg-destructive pulse-dot" /> {sla.breaching} {m.slaBreach}</span>}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {sla.queueByPriority.map((q) => (
              <div key={t(q.label)} className={`rounded-xl p-4 ${q.tone === "destructive" ? "bg-destructive/8" : q.tone === "info" ? "bg-info/8" : "bg-muted/60"}`}>
                <p className={`font-display text-3xl font-semibold tnum ${q.tone === "destructive" ? "text-destructive" : q.tone === "info" ? "text-info" : "text-muted-foreground"}`}>{q.count}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t(q.label)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4 text-center">
            <div><p className="font-display text-lg font-semibold tnum">{heroHandledToday}</p><p className="text-[11px] text-muted-foreground">{m.slaResolved}</p></div>
            <div><p className="font-display text-lg font-semibold tnum text-primary">%72</p><p className="text-[11px] text-muted-foreground">{m.slaAuto}</p></div>
            <div><p className="font-display text-lg font-semibold tnum">13:00</p><p className="text-[11px] text-muted-foreground">{m.slaPeak}</p></div>
          </div>
        </div>
      </section>

      {/* RESPONSE TIME (7d) + CSAT TREND */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* response time over time — bars */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold tracking-tight">{m.rtTitle}</h3>
              <p className="text-xs text-muted-foreground">{m.rtSub}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2.5 py-1 text-[11px] font-semibold text-success"><ArrowDownRight className="h-3 w-3" /> -57% {m.rtDelta}</span>
          </div>
          <div className="flex h-40 items-end gap-2.5">
            {responseByDay.map((d, i) => {
              const h = (d.sec / rtMax) * 100;
              const best = i === rtBestIdx;
              return (
                <div key={t(d.day)} className="group flex flex-1 flex-col items-center gap-2">
                  <span className="text-[11px] font-semibold tnum text-muted-foreground opacity-0 transition group-hover:opacity-100">{d.sec}{lang === "tr" ? "sn" : "s"}</span>
                  <div className="flex w-full flex-1 items-end">
                    <div className={`w-full rounded-t-lg transition-all ${best ? "bg-primary" : "bg-primary/30 group-hover:bg-primary/55"}`} style={{ height: `${h}%` }} />
                  </div>
                  <span className="label-mono text-muted-foreground normal-case tracking-normal">{t(d.day)}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-primary" /> {m.rtBest}: {t(responseByDay[rtBestIdx].day)} · {responseByDay[rtBestIdx].sec}{lang === "tr" ? " sn" : "s"}</span>
          </div>
        </div>

        {/* CSAT trend — sparkline + ring */}
        <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold tracking-tight">{m.csatTitle}</h3>
              <p className="text-xs text-muted-foreground">{m.csatSub}</p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Star className="h-[18px] w-[18px]" /></span>
          </div>
          <div className="mt-4 flex items-end gap-3">
            <p className="font-display text-5xl font-semibold tnum text-primary">{csatTrend[csatTrend.length - 1]}</p>
            <p className="pb-2 text-xs text-muted-foreground">/ {m.csatOf}</p>
            <span className="mb-1.5 ml-auto inline-flex items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-[11px] font-semibold text-success"><TrendingUp className="h-3 w-3" /> +0.6</span>
          </div>
          <div className="mt-4 flex-1">
            <svg viewBox="0 0 300 70" className="h-20 w-full" preserveAspectRatio="none">
              <defs><linearGradient id="csatg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--color-primary)" stopOpacity="0.35" /><stop offset="1" stopColor="var(--color-primary)" stopOpacity="0" /></linearGradient></defs>
              {(() => {
                const pts = csatTrend.map((v, i) => [(i / (csatTrend.length - 1)) * 300, 66 - ((v - csatMin) / (csatMax - csatMin || 1)) * 58]);
                const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
                return (<>
                  <path d={`${line} L300 70 L0 70 Z`} fill="url(#csatg)" />
                  <path d={line} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3.5" fill="var(--color-primary)" />
                </>);
              })()}
            </svg>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground tnum">
            <span>4.2</span><span>{m.csatNow}: {csatTrend[csatTrend.length - 1]}</span>
          </div>
        </div>
      </section>

      {/* SIGNATURE WIDGET — inbox + AI-suggested reply preview */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        {/* conversation list */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold tracking-tight">{m.inbox}</h3>
              <p className="text-xs text-muted-foreground">{m.inboxSub}</p>
            </div>
            <Link href="/conversations" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">{m.all} <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </div>
          <ul className="space-y-1.5">
            {queue.map((c) => {
              const ch = channelMeta[c.channel];
              return (
                <li key={c.id}>
                  <button onClick={() => setSelId(c.id)} className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors ${selId === c.id ? "bg-primary/[0.06] ring-1 ring-primary/30" : "hover:bg-muted/60"}`}>
                    <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
                      {c.initials}
                      <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-card ring-1 ring-border" style={{ color: `oklch(56% 0.18 ${ch.hue})` }}><Icon name={ch.icon} className="h-2.5 w-2.5" /></span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`truncate text-sm ${c.unread ? "font-semibold" : "font-medium"}`}>{c.customer}</p>
                        {c.unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{c.lastMessage}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground tnum">{c.waitingMin}{lang === "tr" ? "dk" : "m"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* AI-suggested reply preview */}
        <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-muted text-sm font-semibold">{sel.initials}</span>
              <div>
                <p className="text-sm font-semibold">{sel.customer}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon name={channelMeta[sel.channel].icon} className="h-3 w-3" style={{ color: `oklch(56% 0.18 ${channelMeta[sel.channel].hue})` }} /> {t(channelMeta[sel.channel].label)} · {t(sel.intent)}
                </p>
              </div>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusMeta[sel.status].tone === "info" ? "bg-info/12 text-info" : statusMeta[sel.status].tone === "warning" ? "bg-warning/15 text-warning-foreground" : "bg-success/12 text-success"}`}>{t(statusMeta[sel.status].label)}</span>
          </div>

          {/* incoming thread */}
          <div className="mt-4 space-y-2 rounded-xl bg-muted/40 p-3.5">
            {sel.thread.slice(-2).map((msg, i) => (
              <div key={i} className={`flex ${msg.from === "agent" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${msg.from === "agent" ? "rounded-tr-md bg-primary text-primary-foreground" : "rounded-tl-md bg-card ring-1 ring-border"}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* AI draft */}
          <div className="mt-3 flex-1 rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 label-mono text-primary"><Sparkles className="h-3.5 w-3.5" /> {m.suggested}</p>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tnum ${sel.confidence >= 80 ? "bg-primary/12 text-primary" : "bg-warning/15 text-warning-foreground"}`}>{sel.confidence}% {m.conf}</span>
            </div>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-foreground/90">{sel.suggested}</p>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground"><BookOpen className="h-3.5 w-3.5" /> {m.source}: {t(sel.source)}</p>
          </div>

          {/* actions */}
          <div className="mt-3 flex flex-wrap gap-2">
            {sel.confidence >= 80 ? (
              <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition hover:opacity-90"><Zap className="h-4 w-4" /> {m.send}</button>
            ) : (
              <button className="inline-flex items-center gap-1.5 rounded-full bg-warning/20 px-4 py-2 text-[13px] font-semibold text-warning-foreground transition hover:opacity-90"><Clock className="h-4 w-4" /> {m.handoff}</button>
            )}
            <button className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium ring-1 ring-border transition hover:bg-muted"><Check className="h-4 w-4" /> {m.edit}</button>
          </div>
        </div>
      </section>

      {/* PER-INTENT BREAKDOWN + AGENT PERFORMANCE */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        {/* intent breakdown */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold tracking-tight">{m.intentTitle}</h3>
              <p className="text-xs text-muted-foreground">{m.intentSub}</p>
            </div>
          </div>
          <ul className="space-y-3">
            {intentDetail.map((it) => (
              <li key={t(it.label)} className="grid grid-cols-[1.6fr_auto] items-center gap-3">
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{t(it.label)}</p>
                    <span className="shrink-0 text-xs text-muted-foreground tnum">{it.volume}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${(it.volume / intentMaxVol) * 100}%`, background: `oklch(60% 0.16 ${it.tone})` }} />
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-right">
                  <div className="w-12">
                    <p className={`font-display text-sm font-semibold tnum ${it.deflect >= 50 ? "text-success" : "text-muted-foreground"}`}>%{it.deflect}</p>
                    <p className="label-mono text-muted-foreground normal-case tracking-normal">{m.intentDef}</p>
                  </div>
                  <div className="w-10">
                    <p className="font-display text-sm font-semibold tnum">{it.avgSec}{lang === "tr" ? "sn" : "s"}</p>
                    <p className="label-mono text-muted-foreground normal-case tracking-normal">{m.intentAvg}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* agent performance */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            <h3 className="font-display text-lg font-semibold tracking-tight">{m.perfTitle}</h3>
          </div>
          <div className="mb-2 grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b border-border pb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span />
            <span className="w-10 text-right">{m.perfHandled}</span>
            <span className="w-12 text-right">{m.perfAvg}</span>
            <span className="w-9 text-right">{m.perfCsat}</span>
          </div>
          <ul className="space-y-2.5 pt-2">
            {agentPerf.map((a) => (
              <li key={a.name} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold">
                    {a.initials}
                    <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-card ${a.online ? "bg-success" : "bg-muted-foreground/50"}`} />
                  </span>
                  <span className="truncate text-sm font-medium">{a.name}</span>
                </div>
                <span className="w-10 text-right text-sm font-semibold tnum">{a.handled}</span>
                <span className="w-12 text-right text-sm tnum text-muted-foreground">{a.avgSec}{lang === "tr" ? "sn" : "s"}</span>
                <span className="inline-flex w-9 items-center justify-end gap-0.5 text-sm font-semibold tnum text-primary"><Star className="h-3 w-3 fill-primary" />{a.csat}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Channels + intents + agents */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* channel mix */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="mb-4 font-display text-lg font-semibold tracking-tight">{m.channels}</h3>
          <ul className="space-y-3.5">
            {channelMix.map((c) => {
              const pct = Math.round((c.value / channelTotal) * 100);
              return (
                <li key={c.channel}>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: `oklch(94% 0.05 ${c.hue})`, color: `oklch(48% 0.16 ${c.hue})` }}><Icon name={c.icon} className="h-4 w-4" /></span>
                    <span className="flex-1 font-medium">{t(c.label)}</span>
                    <span className="tnum text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: `oklch(60% 0.16 ${c.hue})` }} /></div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* top intents */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="mb-4 font-display text-lg font-semibold tracking-tight">{m.intents}</h3>
          <ul className="space-y-2.5">
            {topIntents.map((it) => (
              <li key={t(it.label)} className="flex items-center gap-3 text-sm">
                <span className="w-9 shrink-0 font-display font-semibold tnum text-primary">{it.share}%</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{t(it.label)}</p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary/70" style={{ width: `${(it.share / topIntents[0].share) * 100}%` }} /></div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${it.auto ? "bg-success/12 text-success" : "bg-muted text-muted-foreground"}`}>{it.auto ? m.auto : m.manual}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* agents + activity */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="mb-4 font-display text-lg font-semibold tracking-tight">{m.agents}</h3>
          <ul className="space-y-2.5">
            {agents.map((a) => (
              <li key={a.name} className="flex items-center gap-3">
                <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
                  {a.initials}
                  <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-card ${a.online ? "bg-success" : "bg-muted-foreground/50"}`} />
                </span>
                <span className="flex-1 truncate text-sm font-medium">{a.name}</span>
                <span className="tnum text-xs text-muted-foreground">{a.open} {m.open}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-border pt-3">
            <p className="mb-2 label-mono text-muted-foreground">{m.activity}</p>
            <ul className="space-y-2">
              {activity.slice(0, 3).map((ac) => (
                <li key={ac.id} className="flex gap-2 text-xs leading-relaxed">
                  <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${ac.tone === "success" ? "bg-success" : ac.tone === "warning" ? "bg-warning" : "bg-info"}`} />
                  <span className="text-muted-foreground"><span className="font-medium text-foreground">{ac.who}</span> {t(ac.action)} <span className="text-foreground/80">{ac.target}</span></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
