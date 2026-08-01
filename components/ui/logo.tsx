import { cn } from "@/lib/utils";
import appConfig from "@/app.config";

/** mynode logomark — a chat bubble with an AI spark inside. Indigo→sky. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} role="img" aria-label={appConfig.name}>
      <defs>
        <linearGradient id="yg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#yg)" />
      <rect width="40" height="40" rx="11" fill="#fff" opacity="0.06" />
      {/* chat bubble */}
      <path
        d="M11 13.5a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-9.2L12 28.5v-4a3 3 0 0 1-1-2.2z"
        fill="#fff"
        opacity="0.95"
      />
      {/* AI spark */}
      <path
        d="M20 13.4l1.35 3.25L24.6 18l-3.25 1.35L20 22.6l-1.35-3.25L15.4 18l3.25-1.35z"
        fill="url(#yg)"
      />
      <circle cx="25.2" cy="14.6" r="1.1" fill="url(#yg)" />
    </svg>
  );
}

export function Logo({
  className,
  withWordmark = true,
  onDark = false,
}: {
  className?: string;
  withWordmark?: boolean;
  onDark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="h-8 w-8 shrink-0" />
      {withWordmark && (
        <span
          className={cn(
            "font-display text-lg font-semibold tracking-tight",
            onDark ? "text-sidebar-foreground" : "text-foreground",
          )}
        >
          {appConfig.name}
        </span>
      )}
    </span>
  );
}
