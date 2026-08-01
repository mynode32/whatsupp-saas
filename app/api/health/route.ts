import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicEnv } from "@/lib/env";

/** Readiness check: confirms the app can actually reach its database, not just that the process is up. */
export async function GET() {
  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL) {
    const production = process.env.NODE_ENV === "production";
    return NextResponse.json(
      { status: production ? "error" : "ok", database: "not_configured" },
      { status: production ? 503 : 200 },
    );
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("organizations").select("id", { count: "exact", head: true });
    if (error) throw error;
    return NextResponse.json({ status: "ok", database: "reachable" });
  } catch {
    return NextResponse.json(
      { status: "error", database: "unreachable" },
      { status: 503 },
    );
  }
}
