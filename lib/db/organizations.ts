import "server-only";
import { createClient } from "@/lib/supabase/server";
import { unwrap, unwrapNullable } from "@/lib/db/errors";
import type { Database } from "@/lib/supabase/types";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];
type OrganizationInsert = Database["public"]["Tables"]["organizations"]["Insert"];
type OrganizationUpdate = Database["public"]["Tables"]["organizations"]["Update"];

export async function getOrganization(id: string): Promise<Organization | null> {
  const supabase = await createClient();
  return unwrapNullable(
    await supabase.from("organizations").select("*").eq("id", id).maybeSingle(),
  );
}

export async function createOrganization(input: OrganizationInsert): Promise<Organization> {
  const supabase = await createClient();
  return unwrap(await supabase.from("organizations").insert(input).select().single());
}

export async function updateOrganization(id: string, patch: OrganizationUpdate): Promise<Organization> {
  const supabase = await createClient();
  return unwrap(
    await supabase.from("organizations").update(patch).eq("id", id).select().single(),
  );
}
