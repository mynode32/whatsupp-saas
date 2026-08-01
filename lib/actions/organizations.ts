"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit/log";
import { slugify } from "@/lib/text/slug";
import type { AuthActionState } from "@/lib/actions/auth";

const onboardingSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  industry: z.string().optional(),
  defaultLang: z.enum(["tr", "en"]),
  timezone: z.string().min(1),
  supportEmail: z.email().optional().or(z.literal("")),
  brandVoice: z.string().optional(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
});

export async function completeOnboardingAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = onboardingSchema.safeParse({
    businessName: formData.get("businessName"),
    industry: formData.get("industry") || undefined,
    defaultLang: formData.get("defaultLang"),
    timezone: formData.get("timezone"),
    supportEmail: formData.get("supportEmail") || "",
    brandVoice: formData.get("brandVoice") || undefined,
    openTime: formData.get("openTime") || undefined,
    closeTime: formData.get("closeTime") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const baseSlug = slugify(parsed.data.businessName) || "org";
  let organizationId: string | null = null;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 5 && !organizationId; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase
      .from("organizations")
      .insert({
        name: parsed.data.businessName,
        slug,
        industry: parsed.data.industry ?? null,
        default_lang: parsed.data.defaultLang,
        timezone: parsed.data.timezone,
        support_email: parsed.data.supportEmail || null,
        brand_voice: parsed.data.brandVoice ?? null,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (data) {
      organizationId = data.id;
    } else {
      lastError = error?.message ?? "Could not create organization";
      if (!error?.message?.includes("duplicate key")) break;
    }
  }

  if (!organizationId) return { error: lastError ?? "Could not create organization" };

  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({ organization_id: organizationId, user_id: user.id, role: "owner" });
  if (memberError) return { error: memberError.message };

  if (parsed.data.openTime && parsed.data.closeTime) {
    const rows = Array.from({ length: 7 }, (_, day) => ({
      organization_id: organizationId,
      day_of_week: day,
      open_time: parsed.data.openTime,
      close_time: parsed.data.closeTime,
      is_closed: day === 0 || day === 6, // Sun/Sat closed by default, editable later in Settings
    }));
    await supabase.from("business_hours").insert(rows);
  }

  redirect("/dashboard");
}

const updateBrandSchema = z.object({
  organizationId: z.uuid(),
  name: z.string().min(1, "Business name is required"),
  industry: z.string().optional(),
  defaultLang: z.enum(["tr", "en"]),
  timezone: z.string().min(1),
  supportEmail: z.email().optional().or(z.literal("")),
  brandVoice: z.string().optional(),
});

export async function updateOrganizationBrandAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = updateBrandSchema.safeParse({
    organizationId: formData.get("organizationId"),
    name: formData.get("name"),
    industry: formData.get("industry") || undefined,
    defaultLang: formData.get("defaultLang"),
    timezone: formData.get("timezone"),
    supportEmail: formData.get("supportEmail") || "",
    brandVoice: formData.get("brandVoice") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("organizations")
    .update({
      name: parsed.data.name,
      industry: parsed.data.industry ?? null,
      default_lang: parsed.data.defaultLang,
      timezone: parsed.data.timezone,
      support_email: parsed.data.supportEmail || null,
      brand_voice: parsed.data.brandVoice ?? null,
    })
    .eq("id", parsed.data.organizationId);
  if (error) return { error: error.message };

  await logAuditEvent({
    organizationId: parsed.data.organizationId,
    actorId: user?.id ?? null,
    action: "update_organization_settings",
    targetType: "organization",
    targetId: parsed.data.organizationId,
  });

  revalidatePath("/settings");
  return { success: true };
}

const deleteOrgSchema = z.object({ organizationId: z.uuid(), confirmName: z.string() });

/**
 * Closes the organization for good — deletes the organizations row,
 * which cascades (ON DELETE CASCADE, Faz 1 schema) through every
 * tenant table: members, conversations, messages, contacts, knowledge
 * base, automations, everything. Owner-only. The last-owner-removal
 * trigger (0012) was specifically fixed to allow this.
 */
export async function deleteOrganizationAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = deleteOrgSchema.safeParse({
    organizationId: formData.get("organizationId"),
    confirmName: formData.get("confirmName"),
  });
  if (!parsed.success) return { error: "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", parsed.data.organizationId)
    .maybeSingle();
  if (!org) return { error: "Organization not found" };
  if (parsed.data.confirmName.trim() !== org.name) {
    return { error: "Name doesn't match — type the organization name exactly to confirm." };
  }

  // Note: this audit_logs row is scoped to organization_id ON DELETE
  // CASCADE like every other tenant table, so it's destroyed along
  // with the org a moment later — it doesn't outlive the deletion it
  // describes. A durable "org was deleted" trail needs a separate,
  // non-cascading log (not built this pass).
  await logAuditEvent({
    organizationId: parsed.data.organizationId,
    actorId: user.id,
    action: "delete_organization",
    targetType: "organization",
    targetId: parsed.data.organizationId,
    metadata: { name: org.name },
  });

  const { error } = await supabase.from("organizations").delete().eq("id", parsed.data.organizationId);
  if (error) return { error: error.message };

  await supabase.auth.signOut();
  redirect("/login");
}
