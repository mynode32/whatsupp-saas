"use client";

import Link from "next/link";
import { Send, MessageCircle } from "lucide-react";
import { useLang } from "@/components/i18n/language-provider";
import { sendMessageAction } from "@/lib/actions/messages";
import { updateConversationStatusAction } from "@/lib/actions/conversations";
import { cn } from "@/lib/utils";
import type { ConversationListItem } from "@/lib/db/conversations";
import type { Database } from "@/lib/supabase/types";

type Message = Database["public"]["Tables"]["messages"]["Row"];

const M = {
  tr: {
    title: "Konuşmalar", sub: "WhatsApp'tan gelen her mesaj, tek gelen kutusunda.",
    filters: { all: "Tümü", open: "Açık", pending: "Bekliyor", resolved: "Çözüldü" },
    empty: "Bu görünümde konuşma yok.",
    emptyAll: "Henüz mesaj yok. WhatsApp'tan bir mesaj geldiğinde burada görünecek.",
    placeholder: "Bir yanıt yaz…", send: "Gönder",
    markResolved: "Çözüldü olarak işaretle", reopen: "Yeniden aç",
  },
  en: {
    title: "Conversations", sub: "Every WhatsApp message, in one inbox.",
    filters: { all: "All", open: "Open", pending: "Pending", resolved: "Resolved" },
    empty: "No conversations in this view.",
    emptyAll: "No messages yet. They'll show up here once WhatsApp messages arrive.",
    placeholder: "Write a reply…", send: "Send",
    markResolved: "Mark resolved", reopen: "Reopen",
  },
};

export function ConversationsClient({
  conversations,
  statusFilter,
  selected,
  messages,
  activeId,
}: {
  conversations: ConversationListItem[];
  statusFilter?: "open" | "pending" | "resolved";
  selected: { id: string; status: "open" | "pending" | "resolved"; contactName: string } | null;
  messages: Message[];
  activeId?: string;
}) {
  const { lang } = useLang();
  const m = M[lang];

  const counts = {
    all: conversations.length,
    open: conversations.filter((c) => c.status === "open").length,
    pending: conversations.filter((c) => c.status === "pending").length,
    resolved: conversations.filter((c) => c.status === "resolved").length,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight">{m.title}</h2>
        <p className="text-sm text-muted-foreground">{m.sub}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "open", "pending", "resolved"] as const).map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/conversations" : `/conversations?status=${f}`}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              (statusFilter ?? "all") === f ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {m.filters[f]} <span className="tnum opacity-70">{counts[f]}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        {/* list */}
        <div className="space-y-2">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/conversations?c=${c.id}${statusFilter ? `&status=${statusFilter}` : ""}`}
              className={cn(
                "flex w-full items-start gap-3 rounded-2xl border bg-card p-4 text-left shadow-soft transition-colors",
                activeId === c.id ? "border-primary ring-1 ring-primary/30" : "border-border hover:bg-muted/30",
              )}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
                {c.contactName.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn("truncate text-sm", c.unreadCount > 0 ? "font-semibold" : "font-medium")}>{c.contactName}</p>
                  {c.unreadCount > 0 && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    c.status === "open" ? "bg-info/12 text-info" : c.status === "pending" ? "bg-warning/15 text-warning-foreground" : "bg-success/12 text-success",
                  )}>
                    {m.filters[c.status]}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {conversations.length === 0 && (
            <p className="px-1 py-8 text-center text-sm text-muted-foreground">
              {statusFilter ? m.empty : m.emptyAll}
            </p>
          )}
        </div>

        {/* thread */}
        {selected ? (
          <div className="flex flex-col rounded-2xl border border-border bg-card shadow-soft">
            <div className="flex items-center justify-between gap-3 border-b border-border p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-muted text-sm font-semibold">
                  {selected.contactName.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="font-semibold">{selected.contactName}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MessageCircle className="h-3 w-3" /> WhatsApp
                  </p>
                </div>
              </div>
              <form action={updateConversationStatusAction}>
                <input type="hidden" name="conversationId" value={selected.id} />
                <input type="hidden" name="status" value={selected.status === "resolved" ? "open" : "resolved"} />
                <button type="submit" className="rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 ring-border transition hover:bg-muted cursor-pointer">
                  {selected.status === "resolved" ? m.reopen : m.markResolved}
                </button>
              </form>
            </div>

            <div className="flex-1 space-y-3 p-5">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex", msg.direction === "outbound" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[78%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed",
                    msg.direction === "outbound" ? "rounded-tr-md bg-primary text-primary-foreground" : "rounded-tl-md bg-muted",
                  )}>
                    {msg.body}
                    <span className={cn("mt-1 block text-[10px] opacity-60", msg.status === "failed" && "text-destructive")}>
                      {msg.status}
                      {msg.error_reason ? ` · ${msg.error_reason}` : ""}
                    </span>
                  </div>
                </div>
              ))}
              {messages.length === 0 && <p className="text-center text-sm text-muted-foreground">{m.empty}</p>}
            </div>

            <div className="p-5">
              <form
                action={async (formData: FormData) => {
                  await sendMessageAction({}, formData);
                }}
                className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2"
              >
                <input type="hidden" name="conversationId" value={selected.id} />
                <input name="body" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder={m.placeholder} required />
                <button type="submit" aria-label={m.send} className="text-muted-foreground hover:text-primary cursor-pointer">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border p-16 text-sm text-muted-foreground">
            {m.emptyAll}
          </div>
        )}
      </div>
    </div>
  );
}
