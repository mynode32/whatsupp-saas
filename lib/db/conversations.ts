import "server-only";
import { createClient } from "@/lib/supabase/server";
import { unwrap, unwrapNullable } from "@/lib/db/errors";
import type { Database } from "@/lib/supabase/types";

type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
type Contact = Database["public"]["Tables"]["contacts"]["Row"];

export type ConversationListItem = {
  id: string;
  status: "open" | "pending" | "resolved";
  unreadCount: number;
  lastMessageAt: string | null;
  contactName: string;
};

export async function listConversations(organizationId: string, status?: "open" | "pending" | "resolved") {
  const supabase = await createClient();
  let query = supabase
    .from("conversations")
    .select("id, status, unread_count, last_message_at, contact_id")
    .eq("organization_id", organizationId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(50);
  if (status) query = query.eq("status", status);

  const rows = unwrap(await query);
  if (rows.length === 0) return [];

  const contactIds = [...new Set(rows.map((r) => r.contact_id))];
  const contacts = unwrap(await supabase.from("contacts").select("id, display_name").in("id", contactIds));
  const nameById = new Map(contacts.map((c) => [c.id, c.display_name]));

  return rows.map(
    (r): ConversationListItem => ({
      id: r.id,
      status: r.status,
      unreadCount: r.unread_count,
      lastMessageAt: r.last_message_at,
      contactName: nameById.get(r.contact_id) ?? "Unknown",
    }),
  );
}

export async function getConversation(
  conversationId: string,
): Promise<{ id: string; status: Conversation["status"]; contactName: string; assignedTo: string | null } | null> {
  const supabase = await createClient();
  const conversation: Conversation | null = unwrapNullable(
    await supabase.from("conversations").select("*").eq("id", conversationId).maybeSingle(),
  );
  if (!conversation) return null;

  const contact: Contact | null = unwrapNullable(
    await supabase.from("contacts").select("*").eq("id", conversation.contact_id).maybeSingle(),
  );

  return {
    id: conversation.id,
    status: conversation.status,
    contactName: contact?.display_name ?? "Unknown",
    assignedTo: conversation.assigned_to,
  };
}

export async function listMessages(conversationId: string) {
  const supabase = await createClient();
  return unwrap(
    await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
  );
}
