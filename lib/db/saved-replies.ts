import "server-only";
import { createClient } from "@/lib/supabase/server";
import { unwrap } from "@/lib/db/errors";

export async function listSavedReplies(organizationId: string) {
  const supabase = await createClient();
  return unwrap(
    await supabase
      .from("saved_replies")
      .select("*")
      .eq("organization_id", organizationId)
      .order("title", { ascending: true }),
  );
}
