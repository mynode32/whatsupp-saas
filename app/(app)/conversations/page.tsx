import { createClient } from "@/lib/supabase/server";
import { listConversations, getConversation, listMessages } from "@/lib/db/conversations";
import { listSavedReplies } from "@/lib/db/saved-replies";
import { listConversationNotes } from "@/lib/db/notes";
import { listTeamMembers } from "@/lib/db/team";
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
    .select("organization_id, role")
    .eq("user_id", user!.id)
    .limit(1)
    .maybeSingle();
  const isAdmin = membership?.role === "owner" || membership?.role === "admin";
  const canReply = Boolean(membership) && membership?.role !== "viewer";

  const [conversations, savedReplies, teamMembers] = membership
    ? await Promise.all([
        listConversations(membership.organization_id, statusFilter),
        listSavedReplies(membership.organization_id),
        listTeamMembers(membership.organization_id),
      ])
    : [[], [], []];

  const activeId = selectedId ?? conversations[0]?.id;
  const [selected, messages, notes] = activeId
    ? await Promise.all([getConversation(activeId), listMessages(activeId), listConversationNotes(activeId)])
    : [null, [], []];

  return (
    <ConversationsClient
      organizationId={membership?.organization_id ?? ""}
      conversations={conversations}
      statusFilter={statusFilter}
      selected={selected}
      messages={messages}
      notes={notes}
      savedReplies={savedReplies}
      teamMembers={teamMembers}
      isAdmin={isAdmin}
      canReply={canReply}
      activeId={activeId}
    />
  );
}
