/**
 * Hand-written subset of the generated Supabase types, covering only
 * the tables the current repository layer (lib/db/*) touches. Replace
 * with `supabase gen types typescript` output once the CLI can reach
 * this project (it needs a personal access token / Postgres port
 * access this environment doesn't have) — add tables here as each
 * later phase's repo functions need them, don't front-load all 32.
 */

export type OrgRole = "owner" | "admin" | "agent" | "viewer";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          industry: string | null;
          default_lang: string;
          timezone: string;
          support_email: string | null;
          brand_voice: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          industry?: string | null;
          default_lang?: string;
          timezone?: string;
          support_email?: string | null;
          brand_voice?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["profiles"]["Insert"], "id">>;
        Relationships: [];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: OrgRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: OrgRole;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["organization_members"]["Insert"], "organization_id" | "user_id">>;
        Relationships: [];
      };
      invitations: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          role: OrgRole;
          invited_by: string;
          token: string;
          status: "pending" | "accepted" | "revoked" | "expired";
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          role?: OrgRole;
          invited_by: string;
          status?: "pending" | "accepted" | "revoked" | "expired";
        };
        Update: Partial<Omit<Database["public"]["Tables"]["invitations"]["Insert"], "organization_id">>;
        Relationships: [];
      };
      business_hours: {
        Row: {
          id: string;
          organization_id: string;
          day_of_week: number;
          open_time: string | null;
          close_time: string | null;
          is_closed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          day_of_week: number;
          open_time?: string | null;
          close_time?: string | null;
          is_closed?: boolean;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["business_hours"]["Insert"], "organization_id" | "day_of_week">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { org_role: OrgRole };
    CompositeTypes: Record<string, never>;
  };
}
