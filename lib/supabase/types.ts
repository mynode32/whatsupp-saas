/**
 * Hand-written subset of the generated Supabase types, covering only
 * the tables the current repository layer (lib/db/*) touches. Replace
 * with `supabase gen types typescript` output once the CLI can reach
 * this project (it needs a personal access token / Postgres port
 * access this environment doesn't have) — add tables here as each
 * later phase's repo functions need them, don't front-load all 32.
 */

export type OrgRole = "owner" | "admin" | "agent" | "viewer";

export type AutomationAction =
  | { type: "reply"; body: string }
  | { type: "tag"; tagName: string }
  | { type: "assign"; memberId: string };

export type WebWidgetConfig = {
  welcomeMessage?: string;
  color?: string;
  allowedOrigins?: string[];
};

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
      audit_logs: {
        Row: {
          id: string;
          organization_id: string;
          actor_id: string | null;
          action: string;
          target_type: string;
          target_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          actor_id?: string | null;
          action: string;
          target_type: string;
          target_id?: string | null;
          metadata?: Record<string, unknown>;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["audit_logs"]["Insert"], "organization_id">>;
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
      channel_connections: {
        Row: {
          id: string;
          organization_id: string;
          channel_type: "whatsapp" | "instagram" | "web";
          provider: "twilio" | "meta" | "native";
          external_id: string | null;
          display_name: string | null;
          credentials: WebWidgetConfig | Record<string, never>;
          status: "disconnected" | "connected" | "error";
          last_event_at: string | null;
          last_error: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          channel_type: "whatsapp" | "instagram" | "web";
          provider: "twilio" | "meta" | "native";
          external_id?: string | null;
          display_name?: string | null;
          credentials?: WebWidgetConfig | Record<string, never>;
          status?: "disconnected" | "connected" | "error";
          last_event_at?: string | null;
          last_error?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["channel_connections"]["Insert"], "organization_id">>;
        Relationships: [];
      };
      contacts: {
        Row: {
          id: string;
          organization_id: string;
          display_name: string | null;
          primary_channel: "whatsapp" | "instagram" | "web" | null;
          locale: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          display_name?: string | null;
          primary_channel?: "whatsapp" | "instagram" | "web" | null;
          locale?: string | null;
          metadata?: Record<string, unknown>;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["contacts"]["Insert"], "organization_id">>;
        Relationships: [];
      };
      contact_identities: {
        Row: {
          id: string;
          organization_id: string;
          contact_id: string;
          channel: "whatsapp" | "instagram" | "web";
          external_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          contact_id: string;
          channel: "whatsapp" | "instagram" | "web";
          external_id: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["contact_identities"]["Insert"], "organization_id">>;
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          organization_id: string;
          contact_id: string;
          channel_connection_id: string | null;
          status: "open" | "pending" | "resolved";
          priority: "low" | "normal" | "high";
          assigned_to: string | null;
          unread_count: number;
          last_message_at: string | null;
          first_response_at: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          contact_id: string;
          channel_connection_id?: string | null;
          status?: "open" | "pending" | "resolved";
          priority?: "low" | "normal" | "high";
          assigned_to?: string | null;
          unread_count?: number;
          last_message_at?: string | null;
          first_response_at?: string | null;
          resolved_at?: string | null;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["conversations"]["Insert"], "organization_id">>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          organization_id: string;
          conversation_id: string;
          direction: "inbound" | "outbound";
          sender_type: "contact" | "agent" | "ai" | "system";
          sender_id: string | null;
          body: string | null;
          provider_message_id: string | null;
          status: "queued" | "sent" | "delivered" | "read" | "failed";
          sent_at: string | null;
          delivered_at: string | null;
          read_at: string | null;
          failed_at: string | null;
          error_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          conversation_id: string;
          direction: "inbound" | "outbound";
          sender_type: "contact" | "agent" | "ai" | "system";
          sender_id?: string | null;
          body?: string | null;
          provider_message_id?: string | null;
          status?: "queued" | "sent" | "delivered" | "read" | "failed";
          sent_at?: string | null;
          delivered_at?: string | null;
          read_at?: string | null;
          failed_at?: string | null;
          error_reason?: string | null;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["messages"]["Insert"], "organization_id">>;
        Relationships: [];
      };
      webhook_events: {
        Row: {
          id: string;
          organization_id: string | null;
          contact_id: string | null;
          provider: string;
          external_event_id: string;
          payload: Record<string, unknown>;
          status: "received" | "processing" | "processed" | "failed";
          error_message: string | null;
          received_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          contact_id?: string | null;
          provider: string;
          external_event_id: string;
          payload: Record<string, unknown>;
          status?: "received" | "processing" | "processed" | "failed";
          error_message?: string | null;
          processed_at?: string | null;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["webhook_events"]["Insert"], "provider" | "external_event_id">>;
        Relationships: [];
      };
      knowledge_documents: {
        Row: {
          id: string;
          organization_id: string;
          source_id: string | null;
          title: string;
          content: string;
          category: string | null;
          tags: string[];
          status: "draft" | "published" | "archived";
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          source_id?: string | null;
          title: string;
          content?: string;
          category?: string | null;
          tags?: string[];
          status?: "draft" | "published" | "archived";
          updated_by?: string | null;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["knowledge_documents"]["Insert"], "organization_id">>;
        Relationships: [];
      };
      knowledge_chunks: {
        Row: {
          id: string;
          organization_id: string;
          document_id: string;
          chunk_index: number;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          document_id: string;
          chunk_index?: number;
          content: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["knowledge_chunks"]["Insert"], "organization_id" | "document_id">>;
        Relationships: [];
      };
      automation_rules: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          trigger_type: "keyword" | "off_hours";
          conditions: { keywords?: string[] };
          actions: AutomationAction[];
          priority: number;
          is_active: boolean;
          respects_business_hours: boolean;
          max_runs_per_conversation: number | null;
          cooldown_seconds: number | null;
          on_failure: "stop" | "retry" | "ignore";
          last_run_at: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          trigger_type: "keyword" | "off_hours";
          conditions?: { keywords?: string[] };
          actions?: AutomationAction[];
          priority?: number;
          is_active?: boolean;
          respects_business_hours?: boolean;
          max_runs_per_conversation?: number | null;
          cooldown_seconds?: number | null;
          on_failure?: "stop" | "retry" | "ignore";
          last_run_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["automation_rules"]["Insert"], "organization_id">>;
        Relationships: [];
      };
      automation_runs: {
        Row: {
          id: string;
          organization_id: string;
          rule_id: string;
          conversation_id: string | null;
          trigger_event_id: string | null;
          status: "success" | "failed" | "skipped";
          error_message: string | null;
          started_at: string;
          finished_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          rule_id: string;
          conversation_id?: string | null;
          trigger_event_id?: string | null;
          status?: "success" | "failed" | "skipped";
          error_message?: string | null;
          finished_at?: string | null;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["automation_runs"]["Insert"], "organization_id" | "rule_id">>;
        Relationships: [];
      };
      tags: {
        Row: { id: string; organization_id: string; name: string; color: string | null; created_at: string };
        Insert: { id?: string; organization_id: string; name: string; color?: string | null };
        Update: Partial<Omit<Database["public"]["Tables"]["tags"]["Insert"], "organization_id">>;
        Relationships: [];
      };
      conversation_tags: {
        Row: { organization_id: string; conversation_id: string; tag_id: string; created_at: string };
        Insert: { organization_id: string; conversation_id: string; tag_id: string };
        Update: Partial<Database["public"]["Tables"]["conversation_tags"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          link: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          link?: string | null;
          read_at?: string | null;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["notifications"]["Insert"], "organization_id" | "user_id">>;
        Relationships: [];
      };
      conversation_notes: {
        Row: {
          id: string;
          organization_id: string;
          conversation_id: string;
          author_id: string | null;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          conversation_id: string;
          author_id?: string | null;
          body: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["conversation_notes"]["Insert"], "organization_id" | "conversation_id">>;
        Relationships: [];
      };
      saved_replies: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          body: string;
          shortcut: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          body: string;
          shortcut?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["saved_replies"]["Insert"], "organization_id">>;
        Relationships: [];
      };
      automation_actions: {
        Row: {
          id: string;
          organization_id: string;
          run_id: string;
          action_type: string;
          payload: AutomationAction;
          status: "success" | "failed" | "skipped";
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          run_id: string;
          action_type: string;
          payload: AutomationAction;
          status?: "success" | "failed" | "skipped";
          error_message?: string | null;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["automation_actions"]["Insert"], "organization_id" | "run_id">>;
        Relationships: [];
      };
      rate_limit_buckets: {
        Row: { bucket_key: string; request_count: number; reset_at: string };
        Insert: { bucket_key: string; request_count: number; reset_at: string };
        Update: Partial<Database["public"]["Tables"]["rate_limit_buckets"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      consume_rate_limit: {
        Args: { input_key: string; max_requests: number; window_seconds: number };
        Returns: boolean;
      };
      record_inbound_activity: {
        Args: { target_conversation_id: string };
        Returns: undefined;
      };
      create_organization_with_chatbot: {
        Args: {
          input_name: string;
          input_slug: string;
          input_industry: string | null;
          input_default_lang: string;
          input_timezone: string;
          input_support_email: string | null;
          input_brand_voice: string | null;
          input_open_time: string | null;
          input_close_time: string | null;
          input_allowed_origin: string;
          input_welcome_message: string;
          input_widget_key: string;
        };
        Returns: string;
      };
    };
    Enums: { org_role: OrgRole };
    CompositeTypes: Record<string, never>;
  };
}
