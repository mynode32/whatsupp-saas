import "server-only";
import { createClient } from "@/lib/supabase/server";

export type DashboardMetrics = {
  openCount: number;
  pendingCount: number;
  resolvedTodayCount: number;
  avgFirstResponseSeconds: number | null;
  queueByPriority: { priority: "high" | "normal" | "low"; count: number }[];
  responseTimeByDay: { date: string; avgSeconds: number | null }[];
  channelMix: { channel: string; count: number }[];
  teamPerformance: { userId: string; name: string; handled: number; avgResolutionSeconds: number | null }[];
};

/**
 * All metrics computed directly from conversations/messages — no
 * CSAT (no survey feature exists), no intent breakdown or AI
 * deflection rate (no AI yet, Faz 5). Day boundaries are UTC, not the
 * org's local timezone — a deliberate MVP simplification.
 */
export async function getDashboardMetrics(organizationId: string): Promise<DashboardMetrics> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("conversations")
    .select("id, status, priority, assigned_to, created_at, first_response_at, resolved_at, contact_id")
    .eq("organization_id", organizationId);
  const convs = data ?? [];

  const openCount = convs.filter((c) => c.status === "open").length;
  const pendingCount = convs.filter((c) => c.status === "pending").length;

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const resolvedTodayCount = convs.filter(
    (c) => c.status === "resolved" && c.resolved_at && new Date(c.resolved_at) >= todayStart,
  ).length;

  const withFirstResponse = convs.filter(
    (c): c is typeof c & { first_response_at: string } => c.first_response_at !== null,
  );
  const responseSeconds = (c: (typeof withFirstResponse)[number]) =>
    (new Date(c.first_response_at).getTime() - new Date(c.created_at).getTime()) / 1000;
  const avgFirstResponseSeconds = withFirstResponse.length
    ? Math.round(withFirstResponse.reduce((sum, c) => sum + responseSeconds(c), 0) / withFirstResponse.length)
    : null;

  const queueByPriority = (["high", "normal", "low"] as const).map((priority) => ({
    priority,
    count: convs.filter((c) => (c.status === "open" || c.status === "pending") && c.priority === priority).length,
  }));

  const responseTimeByDay: DashboardMetrics["responseTimeByDay"] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    dayStart.setUTCDate(dayStart.getUTCDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const dayConvs = withFirstResponse.filter((c) => {
      const t = new Date(c.first_response_at).getTime();
      return t >= dayStart.getTime() && t < dayEnd.getTime();
    });
    const avgSeconds = dayConvs.length
      ? Math.round(dayConvs.reduce((s, c) => s + responseSeconds(c), 0) / dayConvs.length)
      : null;
    responseTimeByDay.push({ date: dayStart.toISOString().slice(0, 10), avgSeconds });
  }

  let channelMix: DashboardMetrics["channelMix"] = [];
  const contactIds = [...new Set(convs.map((c) => c.contact_id))];
  if (contactIds.length) {
    const { data: contacts } = await supabase.from("contacts").select("id, primary_channel").in("id", contactIds);
    const channelByContact = new Map((contacts ?? []).map((c) => [c.id, c.primary_channel ?? "unknown"]));
    const counts = new Map<string, number>();
    for (const c of convs) {
      const ch = channelByContact.get(c.contact_id) ?? "unknown";
      counts.set(ch, (counts.get(ch) ?? 0) + 1);
    }
    channelMix = [...counts.entries()].map(([channel, count]) => ({ channel, count }));
  }

  let teamPerformance: DashboardMetrics["teamPerformance"] = [];
  const { data: members } = await supabase.from("organization_members").select("user_id").eq("organization_id", organizationId);
  const memberIds = (members ?? []).map((m) => m.user_id);
  if (memberIds.length) {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", memberIds);
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
    teamPerformance = memberIds.map((userId) => {
      const resolved = convs.filter((c) => c.assigned_to === userId && c.status === "resolved" && c.resolved_at);
      const avgResolutionSeconds = resolved.length
        ? Math.round(
            resolved.reduce((s, c) => s + (new Date(c.resolved_at!).getTime() - new Date(c.created_at).getTime()) / 1000, 0) /
              resolved.length,
          )
        : null;
      return { userId, name: nameById.get(userId) ?? "—", handled: resolved.length, avgResolutionSeconds };
    });
  }

  return { openCount, pendingCount, resolvedTodayCount, avgFirstResponseSeconds, queueByPriority, responseTimeByDay, channelMix, teamPerformance };
}
