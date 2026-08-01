import type { NextConfig } from "next";
import path from "path";

// Baseline CSP — 'unsafe-inline' on script/style is a deliberate
// compromise: Next.js injects inline hydration data and next-themes
// injects a tiny no-FOUC script, neither of which is nonce-wired here.
// Tightening to nonce-based CSP is a real future improvement, not this
// pass's scope. connect-src allows the Supabase project domain for the
// browser client (lib/supabase/client.ts), used by future client-side
// features (e.g. Realtime).
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  async headers() {
    return [
      {
        // Excludes /api/widget/* and /widget.js: those are meant to be
        // embedded/called cross-origin by design (CORS handled in the
        // widget routes themselves) — frame-ancestors 'none' and a
        // strict CSP there would work against that.
        source: "/((?!api/widget|widget.js).*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
