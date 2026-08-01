import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** Admin+ only CSV export of the org's conversations — logged to audit_logs. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, status, priority, created_at, first_response_at, resolved_at, contact_id")
    .eq("organization_id", membership.organization_id)
    .order("created_at", { ascending: false });

  const contactIds = [...new Set((conversations ?? []).map((c) => c.contact_id))];
  const { data: contacts } = contactIds.length
    ? await supabase.from("contacts").select("id, display_name").in("id", contactIds)
    : { data: [] };
  const nameById = new Map((contacts ?? []).map((c) => [c.id, c.display_name ?? ""]));

  const header = ["id", "contact", "status", "priority", "created_at", "first_response_at", "resolved_at"];
  const rows = (conversations ?? []).map((c) =>
    [c.id, nameById.get(c.contact_id) ?? "", c.status, c.priority, c.created_at, c.first_response_at ?? "", c.resolved_at ?? ""]
      .map((v) => csvEscape(String(v)))
      .join(","),
  );
  const csv = [header.join(","), ...rows].join("\n");

  // audit_logs has no client insert policy (append-only, service-role
  // only) — even though this route already verified the caller is
  // admin+, the log entry itself must go through the admin client.
  const admin = createAdminClient();
  await admin.from("audit_logs").insert({
    organization_id: membership.organization_id,
    actor_id: user.id,
    action: "export_conversations_csv",
    target_type: "organization",
    target_id: membership.organization_id,
    metadata: { row_count: rows.length },
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="conversations-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
