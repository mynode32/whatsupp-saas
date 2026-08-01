import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/db/profiles";
import { getDashboardMetrics } from "@/lib/db/metrics";
import { DashboardClient } from "@/components/app/dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [profile, membership] = await Promise.all([
    getProfile(user!.id),
    supabase.from("organization_members").select("organization_id").eq("user_id", user!.id).limit(1).maybeSingle(),
  ]);

  const metrics = membership.data
    ? await getDashboardMetrics(membership.data.organization_id)
    : {
        openCount: 0,
        pendingCount: 0,
        resolvedTodayCount: 0,
        avgFirstResponseSeconds: null,
        queueByPriority: [],
        responseTimeByDay: [],
        channelMix: [],
        teamPerformance: [],
      };

  return <DashboardClient userName={profile?.full_name?.split(" ")[0] ?? ""} metrics={metrics} />;
}
