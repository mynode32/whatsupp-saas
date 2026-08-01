"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/lib/actions/auth";

const addNoteSchema = z.object({
  conversationId: z.uuid(),
  body: z.string().min(1, "Note can't be empty"),
});

export async function addConversationNoteAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = addNoteSchema.safeParse({
    conversationId: formData.get("conversationId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: conversation } = await supabase
    .from("conversations")
    .select("organization_id")
    .eq("id", parsed.data.conversationId)
    .maybeSingle();
  if (!conversation) return { error: "Conversation not found" };

  const { error } = await supabase.from("conversation_notes").insert({
    organization_id: conversation.organization_id,
    conversation_id: parsed.data.conversationId,
    author_id: user.id,
    body: parsed.data.body,
  });
  if (error) return { error: error.message };

  revalidatePath("/conversations");
  return { success: true };
}
