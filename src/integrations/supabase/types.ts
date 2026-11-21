export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      annotations: {
        Row: {
          body: string
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      brief_claims: {
        Row: {
          at: string
          id: string
          user_id: string
        }
        Insert: {
          at?: string
          id?: string
          user_id: string
        }
        Update: {
          at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      briefs: {
        Row: {
          caveats: string[]
          channels: string[]
          corpus_version: string
          created_at: string
          event_id: string
          id: string
          model: string
          thesis: string
          user_id: string
        }
        Insert: {
          caveats?: string[]
          channels?: string[]
          corpus_version: string
          created_at?: string
          event_id: string
          id?: string
          model: string
          thesis: string
          user_id: string
        }
        Update: {
          caveats?: string[]
          channels?: string[]
          corpus_version?: string
          created_at?: string
          event_id?: string
          id?: string
          model?: string
          thesis?: string
          user_id?: string
        }
        Relationships: []
      }
      business_profiles: {
        Row: {
          company_name: string | null
          concerns: string | null
          created_at: string
          home_node: string
          id: string
          industry_id: string
          products: string | null
          sourcing_nodes: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          concerns?: string | null
          created_at?: string
          home_node: string
          id?: string
          industry_id: string
          products?: string | null
          sourcing_nodes?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          concerns?: string | null
          created_at?: string
          home_node?: string
          id?: string
          industry_id?: string
          products?: string | null
          sourcing_nodes?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exposure_deps: {
        Row: {
          created_at: string
          id: string
          kind: string
          ref_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          ref_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          ref_id?: string
          user_id?: string
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          company: string | null
          created_at: string
          created_day: string
          email: string
          id: string
          kind: string
          message: string
          name: string
          status: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          created_day?: string
          email: string
          id?: string
          kind: string
          message: string
          name: string
          status?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          created_day?: string
          email?: string
          id?: string
          kind?: string
          message?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      observations: {
        Row: {
          as_of: string
          id: string
          key: string
          note: string | null
          ok: boolean
          payload: string
          problem: string | null
          published_at: string | null
          retrieved_at: string
          source_id: string
          status: string
        }
        Insert: {
          as_of: string
          id?: string
          key: string
          note?: string | null
          ok?: boolean
          payload: string
          problem?: string | null
          published_at?: string | null
          retrieved_at?: string
          source_id: string
          status: string
        }
        Update: {
          as_of?: string
          id?: string
          key?: string
          note?: string | null
          ok?: boolean
          payload?: string
          problem?: string | null
          published_at?: string | null
          retrieved_at?: string
          source_id?: string
          status?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          admin_note: string | null
          amount_inr: number
          billing_period: string
          created_at: string
          currency: string
          id: string
          payment_mode: string
          product: string
          reference: string
          status: string
          updated_at: string
          upi_reference: string | null
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount_inr: number
          billing_period: string
          created_at?: string
          currency?: string
          id?: string
          payment_mode: string
          product: string
          reference: string
          status?: string
          updated_at?: string
          upi_reference?: string | null
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount_inr?: number
          billing_period?: string
          created_at?: string
          currency?: string
          id?: string
          payment_mode?: string
          product?: string
          reference?: string
          status?: string
          updated_at?: string
          upi_reference?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          from_status: string | null
          id: string
          idempotency_key: string | null
          order_id: string | null
          reason: string | null
          to_status: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          idempotency_key?: string | null
          order_id?: string | null
          reason?: string | null
          to_status?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          idempotency_key?: string | null
          order_id?: string | null
          reason?: string | null
          to_status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      request_windows: {
        Row: {
          hits: number
          key_hash: string
          started_at: string
        }
        Insert: {
          hits?: number
          key_hash: string
          started_at?: string
        }
        Update: {
          hits?: number
          key_hash?: string
          started_at?: string
        }
        Relationships: []
      }
      source_locks: {
        Row: {
          attempts: number
          consecutive_failures: number
          failures: number
          finished_at: string | null
          id: string
          next_allowed_at: string
          source_id: string
          started_at: string
        }
        Insert: {
          attempts?: number
          consecutive_failures?: number
          failures?: number
          finished_at?: string | null
          id?: string
          next_allowed_at?: string
          source_id: string
          started_at?: string
        }
        Update: {
          attempts?: number
          consecutive_failures?: number
          failures?: number
          finished_at?: string | null
          id?: string
          next_allowed_at?: string
          source_id?: string
          started_at?: string
        }
        Relationships: []
      }
      source_runs: {
        Row: {
          as_of: string
          id: string
          key: string
          ok: boolean
          problem: string | null
          published_at: string | null
          reading_count: number
          retrieved_at: string
          source_id: string
          status: string
        }
        Insert: {
          as_of: string
          id?: string
          key: string
          ok: boolean
          problem?: string | null
          published_at?: string | null
          reading_count?: number
          retrieved_at?: string
          source_id: string
          status: string
        }
        Update: {
          as_of?: string
          id?: string
          key?: string
          ok?: boolean
          problem?: string | null
          published_at?: string | null
          reading_count?: number
          retrieved_at?: string
          source_id?: string
          status?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          expires_at: string | null
          id: string
          plan: string
          source_order_id: string | null
          starts_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          id?: string
          plan: string
          source_order_id?: string | null
          starts_at?: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          expires_at?: string | null
          id?: string
          plan?: string
          source_order_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_source_order_id_fkey"
            columns: ["source_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          created_at: string
          event_id: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_request_window: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number }
        Returns: Json
      }
      claim_source_refresh: {
        Args: {
          p_floor_ms: number
          p_force: boolean
          p_max_run_ms: number
          p_min_ms: number
          p_source_id: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_mfa_admin: { Args: never; Returns: boolean }
      public_source_summary: { Args: never; Returns: Json }
      reserve_brief_claim: {
        Args: {
          p_daily_limit: number
          p_interval_ms: number
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
