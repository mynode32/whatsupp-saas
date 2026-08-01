import { createClient } from "@/lib/supabase/server";
import { listRules, getRecentRunCounts } from "@/lib/db/automations";
import { AutomationsClient } from "@/components/app/automations-client";

export default async function AutomationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user!.id)
    .limit(1)
    .maybeSingle();

  const rules = membership ? await listRules(membership.organization_id) : [];
  const runCountsMap = await getRecentRunCounts(rules.map((r) => r.id));
  const runCounts = Object.fromEntries(runCountsMap);
  const isAdmin = membership?.role === "owner" || membership?.role === "admin";

  return (
    <AutomationsClient
      organizationId={membership?.organization_id ?? ""}
      rules={rules}
      runCounts={runCounts}
      isAdmin={isAdmin}
    />
  );
}
