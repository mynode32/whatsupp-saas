"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AuthActionState } from "@/lib/actions/auth";
import type { AutomationAction } from "@/lib/supabase/types";

const createSchema = z.object({
  organizationId: z.uuid(),
  name: z.string().min(1, "Name is required"),
  triggerType: z.enum(["keyword", "off_hours"]),
  keywords: z.string().optional(),
  replyBody: z.string().min(1, "Reply text is required"),
});

export async function createRuleAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = createSchema.safeParse({
    organizationId: formData.get("organizationId"),
    name: formData.get("name"),
    triggerType: formData.get("triggerType"),
    keywords: formData.get("keywords") || undefined,
    replyBody: formData.get("replyBody"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  if (parsed.data.triggerType === "keyword" && !parsed.data.keywords?.trim()) {
    return { error: "Enter at least one keyword" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const actions: AutomationAction[] = [{ type: "reply", body: parsed.data.replyBody }];
  const conditions =
    parsed.data.triggerType === "keyword"
      ? { keywords: parsed.data.keywords!.split(",").map((k) => k.trim()).filter(Boolean) }
      : {};

  const { error } = await supabase.from("automation_rules").insert({
    organization_id: parsed.data.organizationId,
    name: parsed.data.name,
    trigger_type: parsed.data.triggerType,
    conditions,
    actions,
    is_active: true,
    created_by: user.id,
    updated_by: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/automations");
  return { success: true };
}

const toggleSchema = z.object({ id: z.uuid(), isActive: z.enum(["true", "false"]) });

export async function toggleRuleAction(formData: FormData): Promise<void> {
  const parsed = toggleSchema.safeParse({ id: formData.get("id"), isActive: formData.get("isActive") });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.from("automation_rules").update({ is_active: parsed.data.isActive === "true" }).eq("id", parsed.data.id);
  revalidatePath("/automations");
}

const deleteSchema = z.object({ id: z.uuid() });

export async function deleteRuleAction(formData: FormData): Promise<void> {
  const parsed = deleteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.from("automation_rules").delete().eq("id", parsed.data.id);
  revalidatePath("/automations");
}
