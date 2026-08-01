"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/create";

const statusSchema = z.object({
  conversationId: z.uuid(),
  status: z.enum(["open", "pending", "resolved"]),
});

export async function updateConversationStatusAction(formData: FormData): Promise<void> {
  const parsed = statusSchema.safeParse({
    conversationId: formData.get("conversationId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  const patch: { status: "open" | "pending" | "resolved"; resolved_at?: string | null } = {
    status: parsed.data.status,
  };
  if (parsed.data.status === "resolved") patch.resolved_at = new Date().toISOString();
  if (parsed.data.status !== "resolved") patch.resolved_at = null;

  await supabase.from("conversations").update(patch).eq("id", parsed.data.conversationId);
  revalidatePath("/conversations");
}

const readSchema = z.object({ conversationId: z.uuid() });

export async function markConversationReadAction(conversationId: string): Promise<void> {
  const parsed = readSchema.safeParse({ conversationId });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.from("conversations").update({ unread_count: 0 }).eq("id", parsed.data.conversationId);
}

const assignSchema = z.object({ conversationId: z.uuid(), assigneeId: z.uuid() });

export async function assignConversationAction(formData: FormData): Promise<void> {
  const parsed = assignSchema.safeParse({
    conversationId: formData.get("conversationId"),
    assigneeId: formData.get("assigneeId"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("conversations")
    .select("organization_id")
    .eq("id", parsed.data.conversationId)
    .maybeSingle();
  if (!existing) return;

  const { data: assigneeMembership } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", existing.organization_id)
    .eq("user_id", parsed.data.assigneeId)
    .maybeSingle();
  if (!assigneeMembership) return;

  const { data: conversation } = await supabase
    .from("conversations")
    .update({ assigned_to: parsed.data.assigneeId })
    .eq("id", parsed.data.conversationId)
    .select("id, organization_id")
    .single();
  if (!conversation) return;

  if (parsed.data.assigneeId !== user.id) {
    await createNotification({
      organizationId: conversation.organization_id,
      userId: parsed.data.assigneeId,
      type: "conversation_assigned",
      title: "A conversation was assigned to you",
      link: `/conversations?c=${conversation.id}`,
    });
  }

  revalidatePath("/conversations");
}
