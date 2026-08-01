"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit/log";

const deleteSchema = z.object({ contactId: z.uuid() });

/**
 * KVKK/GDPR right-to-erasure: deletes a contact. Cascades (FK ON
 * DELETE CASCADE, Faz 1 schema) through contact_identities,
 * conversations and messages — a full delete, not anonymization,
 * since that fully satisfies erasure without a separate content-
 * rewriting mechanism. admin+ only (contacts DELETE RLS policy).
 */
export async function deleteContactAction(formData: FormData): Promise<{ error?: string } | void> {
  const parsed = deleteSchema.safeParse({ contactId: formData.get("contactId") });
  if (!parsed.success) return { error: "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: contact } = await supabase
    .from("contacts")
    .select("organization_id")
    .eq("id", parsed.data.contactId)
    .maybeSingle();
  if (!contact) return { error: "Contact not found" };

  const { error } = await supabase.from("contacts").delete().eq("id", parsed.data.contactId);
  if (error) return { error: error.message };

  await logAuditEvent({
    organizationId: contact.organization_id,
    actorId: user?.id ?? null,
    action: "delete_contact",
    targetType: "contact",
    targetId: parsed.data.contactId,
  });

  revalidatePath("/conversations");
}
