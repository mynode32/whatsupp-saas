import "server-only";
import { createClient } from "@/lib/supabase/server";
import { unwrap, unwrapNullable } from "@/lib/db/errors";
import type { Database } from "@/lib/supabase/types";

type Member = Database["public"]["Tables"]["organization_members"]["Row"];
type MemberInsert = Database["public"]["Tables"]["organization_members"]["Insert"];
type MemberUpdate = Database["public"]["Tables"]["organization_members"]["Update"];

export async function listMembers(organizationId: string): Promise<Member[]> {
  const supabase = await createClient();
  return unwrap(
    await supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true }),
  );
}

export async function getMembership(organizationId: string, userId: string): Promise<Member | null> {
  const supabase = await createClient();
  return unwrapNullable(
    await supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .maybeSingle(),
  );
}

export async function addMember(input: MemberInsert): Promise<Member> {
  const supabase = await createClient();
  return unwrap(await supabase.from("organization_members").insert(input).select().single());
}

export async function updateMemberRole(id: string, patch: MemberUpdate): Promise<Member> {
  const supabase = await createClient();
  return unwrap(
    await supabase.from("organization_members").update(patch).eq("id", id).select().single(),
  );
}

export async function removeMember(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("organization_members").delete().eq("id", id);
  if (error) throw error;
}
