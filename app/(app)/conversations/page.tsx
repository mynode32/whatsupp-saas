import { createClient } from "@/lib/supabase/server";
import { listConversations, getConversation, listMessages } from "@/lib/db/conversations";
import { ConversationsClient } from "@/components/app/conversations-client";

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; status?: string }>;
}) {
  const { c: selectedId, status } = await searchParams;
  const statusFilter = status === "open" || status === "pending" || status === "resolved" ? status : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user!.id)
    .limit(1)
    .maybeSingle();

  const conversations = membership ? await listConversations(membership.organization_id, statusFilter) : [];
  const activeId = selectedId ?? conversations[0]?.id;
  const [selected, messages] = activeId
    ? await Promise.all([getConversation(activeId), listMessages(activeId)])
    : [null, []];

  return (
    <ConversationsClient
      conversations={conversations}
      statusFilter={statusFilter}
      selected={selected}
      messages={messages}
      activeId={activeId}
    />
  );
}
