"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import appConfig from "@/app.config";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useLang } from "@/components/i18n/language-provider";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

const M = {
  tr: { empty: "Bildirim yok.", markAll: "Tümünü okundu yap", notifications: "Bildirimler" },
  en: { empty: "No notifications.", markAll: "Mark all read", notifications: "Notifications" },
};

export function Topbar({ notifications }: { notifications: Notification[] }) {
  const pathname = usePathname();
  const { t, ui, lang } = useLang();
  const m = M[lang];
  const [open, setOpen] = useState(false);
  const current = appConfig.nav.find(
    (n) => pathname === n.href || pathname.startsWith(n.href + "/"),
  );
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-5 backdrop-blur">
      <h1 className="font-display text-lg font-semibold tracking-tight">
        {current ? t(current.label) : ""}
      </h1>

      <div className="ml-auto flex items-center gap-1.5">
        <div className="hidden h-9 w-64 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground lg:flex">
          <Search className="h-4 w-4" />
          <span>{ui.search}</span>
          <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
        </div>
        <LanguageToggle className="mr-1" />

        <div className="relative">
          <button
            aria-label="Notifications"
            onClick={() => setOpen((o) => !o)}
            className="relative grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />}
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-11 z-20 w-80 rounded-xl border border-border bg-card shadow-pop">
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <span className="text-sm font-semibold">{m.notifications}</span>
                  {unreadCount > 0 && (
                    <form action={markAllNotificationsReadAction}>
                      <button type="submit" className="text-xs font-medium text-primary hover:underline cursor-pointer">{m.markAll}</button>
                    </form>
                  )}
                </div>
                <ul className="max-h-96 overflow-y-auto">
                  {notifications.map((n) => (
                    <li key={n.id} className={cn("border-b border-border px-4 py-3 last:border-0", !n.read_at && "bg-primary/[0.03]")}>
                      <form action={markNotificationReadAction}>
                        <input type="hidden" name="id" value={n.id} />
                        <button type="submit" className="w-full text-left cursor-pointer">
                          <p className="text-sm font-medium">{n.title}</p>
                          {n.body && <p className="mt-0.5 truncate text-xs text-muted-foreground">{n.body}</p>}
                          <p className="mt-1 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString(lang === "tr" ? "tr-TR" : "en-US")}</p>
                        </button>
                      </form>
                      {n.link && (
                        <Link href={n.link} className="mt-1 inline-block text-xs text-primary hover:underline" onClick={() => setOpen(false)}>
                          →
                        </Link>
                      )}
                    </li>
                  ))}
                  {notifications.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">{m.empty}</li>}
                </ul>
              </div>
            </>
          )}
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}
