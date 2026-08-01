"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import appConfig from "@/app.config";
import { Logo } from "@/components/ui/logo";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/lib/actions/auth";

export function Sidebar({ userName, userEmail }: { userName: string; userEmail: string }) {
  const pathname = usePathname();
  const { t, ui } = useLang();
  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("") || userEmail.slice(0, 2).toUpperCase();

  return (
    <aside className="hidden bg-sidebar text-sidebar-foreground md:flex md:w-64 md:flex-col">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Link href="/dashboard">
          <Logo onDark />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="label-mono px-3 pb-2 pt-1 text-sidebar-muted">{ui.account === "Hesap" ? "Menü" : "Menu"}</p>
        {appConfig.nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-active text-white shadow-sm"
                  : "text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground",
              )}
            >
              <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
              {t(item.label)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-sm font-semibold">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userName || userEmail}</p>
            <p className="truncate text-xs text-sidebar-muted">{ui.account}</p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              aria-label={ui.logout}
              className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-sidebar-muted transition-colors hover:bg-white/5 hover:text-sidebar-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
