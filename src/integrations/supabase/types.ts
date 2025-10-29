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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      reviews: {
        Row: {
          after_image_url: string | null
          average_rating: number | null
          before_image_url: string | null
          city: string
          created_at: string | null
          created_by: string | null
          customer_comment: string | null
          customer_firstname: string | null
          customer_id: string | null
          customer_lastname: string | null
          customer_salutation: string
          geocoded_at: string | null
          geocoding_status: string | null
          house_number: string | null
          id: string
          installation_date: string | null
          installed_by: string | null
          internal_notes: string | null
          is_published: boolean | null
          latitude: number | null
          legacy_id: number | null
          longitude: number | null
          meta_description: string | null
          meta_title: string | null
          postal_code: string | null
          product_category: string
          rating_aesthetics: number | null
          rating_consultation: number | null
          rating_fire_safety: number | null
          rating_heating_performance: number | null
          rating_installation_quality: number | null
          rating_service: number | null
          slug: string
          status: string | null
          street: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          after_image_url?: string | null
          average_rating?: number | null
          before_image_url?: string | null
          city: string
          created_at?: string | null
          created_by?: string | null
          customer_comment?: string | null
          customer_firstname?: string | null
          customer_id?: string | null
          customer_lastname?: string | null
          customer_salutation: string
          geocoded_at?: string | null
          geocoding_status?: string | null
          house_number?: string | null
          id?: string
          installation_date?: string | null
          installed_by?: string | null
          internal_notes?: string | null
          is_published?: boolean | null
          latitude?: number | null
          legacy_id?: number | null
          longitude?: number | null
          meta_description?: string | null
          meta_title?: string | null
          postal_code?: string | null
          product_category: string
          rating_aesthetics?: number | null
          rating_consultation?: number | null
          rating_fire_safety?: number | null
          rating_heating_performance?: number | null
          rating_installation_quality?: number | null
          rating_service?: number | null
          slug: string
          status?: string | null
          street?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          after_image_url?: string | null
          average_rating?: number | null
          before_image_url?: string | null
          city?: string
          created_at?: string | null
          created_by?: string | null
          customer_comment?: string | null
          customer_firstname?: string | null
          customer_id?: string | null
          customer_lastname?: string | null
          customer_salutation?: string
          geocoded_at?: string | null
          geocoding_status?: string | null
          house_number?: string | null
          id?: string
          installation_date?: string | null
          installed_by?: string | null
          internal_notes?: string | null
          is_published?: boolean | null
          latitude?: number | null
          legacy_id?: number | null
          longitude?: number | null
          meta_description?: string | null
          meta_title?: string | null
          postal_code?: string | null
          product_category?: string
          rating_aesthetics?: number | null
          rating_consultation?: number | null
          rating_fire_safety?: number | null
          rating_heating_performance?: number | null
          rating_installation_quality?: number | null
          rating_service?: number | null
          slug?: string
          status?: string | null
          street?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email: string
          firstname: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          lastname: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          firstname?: string | null
          id: string
          is_active?: boolean | null
          last_login?: string | null
          lastname?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          firstname?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          lastname?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "admin"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["user", "admin"],
    },
  },
} as const
