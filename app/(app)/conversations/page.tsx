"use client";

import { useState } from "react";
import { Sparkles, Zap, BookOpen, Check, Clock, Send } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/components/i18n/language-provider";
import { conversations, channelMeta, statusMeta, type Status } from "@/lib/demo/data";
import { cn } from "@/lib/utils";

const M = {
  tr: {
    title: "Konuşmalar", sub: "Her kanaldaki her mesaj, tek gelen kutusunda.",
    filters: { all: "Tümü", open: "Açık", pending: "Bekliyor", resolved: "Çözüldü" },
    empty: "Bu görünümde konuşma yok.",
    via: "·", suggested: "AI önerisi", source: "Kaynak", conf: "güven",
    send: "Tek tıkla gönder", edit: "Düzenle", handoff: "İnsana devret",
    placeholder: "Bir yanıt yaz ya da AI önerisini düzenle…", waiting: "dk bekliyor",
  },
  en: {
    title: "Conversations", sub: "Every message from every channel, in one inbox.",
    filters: { all: "All", open: "Open", pending: "Pending", resolved: "Resolved" },
    empty: "No conversations in this view.",
    via: "·", suggested: "AI suggestion", source: "Source", conf: "confidence",
    send: "Send in one tap", edit: "Edit", handoff: "Hand off",
    placeholder: "Write a reply or edit the AI suggestion…", waiting: "min waiting",
  },
};

const FILTERS: (Status | "all")[] = ["all", "open", "pending", "resolved"];

export default function ConversationsPage() {
  const { lang, t } = useLang();
  const m = M[lang];
  const [filter, setFilter] = useState<Status | "all">("all");
  const [selId, setSelId] = useState(conversations[0].id);

  const visible = filter === "all" ? conversations : conversations.filter((c) => c.status === filter);
  const sel = conversations.find((c) => c.id === selId) ?? visible[0];

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight">{m.title}</h2>
        <p className="text-sm text-muted-foreground">{m.sub}</p>
      </div>

      {/* filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = f === "all" ? conversations.length : conversations.filter((c) => c.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === f ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {m.filters[f === "all" ? "all" : f]} <span className="tnum opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        {/* list */}
        <div className="space-y-2">
          {visible.map((c) => {
            const ch = channelMeta[c.channel];
            const sm = statusMeta[c.status];
            return (
              <button
                key={c.id}
                onClick={() => setSelId(c.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border bg-card p-4 text-left shadow-soft transition-colors",
                  selId === c.id ? "border-primary ring-1 ring-primary/30" : "border-border hover:bg-muted/30",
                )}
              >
                <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
                  {c.initials}
                  <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-card ring-1 ring-border" style={{ color: `oklch(56% 0.18 ${ch.hue})` }}><Icon name={ch.icon} className="h-2.5 w-2.5" /></span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("truncate text-sm", c.unread ? "font-semibold" : "font-medium")}>{c.customer}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground tnum">{c.waitingMin}{lang === "tr" ? "dk" : "m"}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.lastMessage}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium",
                      sm.tone === "info" ? "bg-info/12 text-info" : sm.tone === "warning" ? "bg-warning/15 text-warning-foreground" : "bg-success/12 text-success")}>{t(sm.label)}</span>
                    <span className="truncate text-[11px] text-muted-foreground">{t(c.intent)}</span>
                    {c.unread && <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                </div>
              </button>
            );
          })}
          {visible.length === 0 && <p className="px-1 py-8 text-center text-sm text-muted-foreground">{m.empty}</p>}
        </div>

        {/* reply pane */}
        {sel && (
          <div className="flex flex-col rounded-2xl border border-border bg-card shadow-soft">
            {/* header */}
            <div className="flex items-center justify-between gap-3 border-b border-border p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-muted text-sm font-semibold">{sel.initials}</span>
                <div>
                  <p className="font-semibold">{sel.customer}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon name={channelMeta[sel.channel].icon} className="h-3 w-3" style={{ color: `oklch(56% 0.18 ${channelMeta[sel.channel].hue})` }} />
                    {t(channelMeta[sel.channel].label)} {m.via} {t(sel.intent)}
                  </p>
                </div>
              </div>
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium",
                statusMeta[sel.status].tone === "info" ? "bg-info/12 text-info" : statusMeta[sel.status].tone === "warning" ? "bg-warning/15 text-warning-foreground" : "bg-success/12 text-success")}>{t(statusMeta[sel.status].label)}</span>
            </div>

            {/* thread */}
            <div className="flex-1 space-y-3 p-5">
              {sel.thread.map((msg, i) => (
                <div key={i} className={cn("flex", msg.from === "agent" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[78%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed",
                    msg.from === "agent" ? "rounded-tr-md bg-primary text-primary-foreground" : "rounded-tl-md bg-muted")}>
                    {msg.ai && <span className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider opacity-70"><Sparkles className="h-3 w-3" /> AI</span>}
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* AI draft */}
            <div className="mx-5 rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 label-mono text-primary"><Sparkles className="h-3.5 w-3.5" /> {m.suggested}</p>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold tnum", sel.confidence >= 80 ? "bg-primary/12 text-primary" : "bg-warning/15 text-warning-foreground")}>{sel.confidence}% {m.conf}</span>
              </div>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-foreground/90">{sel.suggested}</p>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground"><BookOpen className="h-3.5 w-3.5" /> {m.source}: {t(sel.source)}</p>
            </div>

            {/* composer */}
            <div className="p-5">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                <input className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder={m.placeholder} />
                <Send className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {sel.confidence >= 80 ? (
                  <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition hover:opacity-90"><Zap className="h-4 w-4" /> {m.send}</button>
                ) : (
                  <button className="inline-flex items-center gap-1.5 rounded-full bg-warning/20 px-4 py-2 text-[13px] font-semibold text-warning-foreground transition hover:opacity-90"><Clock className="h-4 w-4" /> {m.handoff}</button>
                )}
                <button className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium ring-1 ring-border transition hover:bg-muted"><Check className="h-4 w-4" /> {m.edit}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
