import "server-only";
import { createClient } from "@/lib/supabase/server";
import { unwrap } from "@/lib/db/errors";

export async function listNotifications(userId: string, limit = 20) {
  const supabase = await createClient();
  return unwrap(
    await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
  );
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}
