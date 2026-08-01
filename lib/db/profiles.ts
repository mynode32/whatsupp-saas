import "server-only";
import { createClient } from "@/lib/supabase/server";
import { unwrap, unwrapNullable } from "@/lib/db/errors";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  return unwrapNullable(
    await supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
  );
}

export async function updateProfile(userId: string, patch: ProfileUpdate): Promise<Profile> {
  const supabase = await createClient();
  return unwrap(
    await supabase.from("profiles").update(patch).eq("id", userId).select().single(),
  );
}
