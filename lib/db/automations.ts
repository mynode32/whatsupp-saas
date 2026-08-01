import "server-only";
import { createClient } from "@/lib/supabase/server";
import { unwrap } from "@/lib/db/errors";
import type { Database } from "@/lib/supabase/types";

type AutomationRule = Database["public"]["Tables"]["automation_rules"]["Row"];

export async function listRules(organizationId: string): Promise<AutomationRule[]> {
  const supabase = await createClient();
  return unwrap(
    await supabase
      .from("automation_rules")
      .select("*")
      .eq("organization_id", organizationId)
      .order("priority", { ascending: false }),
  );
}

/** Successful runs per rule in the last 7 days — real numbers, not the old demo's fake deflection %. */
export async function getRecentRunCounts(ruleIds: string[]): Promise<Map<string, number>> {
  if (ruleIds.length === 0) return new Map();
  const supabase = await createClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const rows = unwrap(
    await supabase
      .from("automation_runs")
      .select("rule_id")
      .in("rule_id", ruleIds)
      .eq("status", "success")
      .gte("created_at", since),
  );
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.rule_id, (counts.get(r.rule_id) ?? 0) + 1);
  return counts;
}
