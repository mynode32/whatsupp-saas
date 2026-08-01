"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
