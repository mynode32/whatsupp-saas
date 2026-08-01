import "server-only";
import { createClient } from "@/lib/supabase/server";
import { unwrap } from "@/lib/db/errors";

export async function listConversationNotes(conversationId: string) {
  const supabase = await createClient();
  return unwrap(
    await supabase
      .from("conversation_notes")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
  );
}
