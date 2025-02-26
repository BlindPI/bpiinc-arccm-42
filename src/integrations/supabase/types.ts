export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      certificate_requests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          recipient_name: string
          requester_id: string | null
          review_notes: string | null
          reviewer_id: string | null
          status: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          recipient_name: string
          requester_id?: string | null
          review_notes?: string | null
          reviewer_id?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          recipient_name?: string
          requester_id?: string | null
          review_notes?: string | null
          reviewer_id?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_requests_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificate_requests_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          created_at: string
          expiry_date: string | null
          id: string
          issue_date: string | null
          issued_by: string | null
          metadata: Json | null
          recipient_name: string
          status: Database["public"]["Enums"]["certificate_status"] | null
          template_id: string | null
          updated_at: string
          verification_code: string
        }
        Insert: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issued_by?: string | null
          metadata?: Json | null
          recipient_name: string
          status?: Database["public"]["Enums"]["certificate_status"] | null
          template_id?: string | null
          updated_at?: string
          verification_code: string
        }
        Update: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issued_by?: string | null
          metadata?: Json | null
          recipient_name?: string
          status?: Database["public"]["Enums"]["certificate_status"] | null
          template_id?: string | null
          updated_at?: string
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          order_position: number | null
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_position?: number | null
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_position?: number | null
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "compliance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "compliance_stats"
            referencedColumns: ["category_id"]
          },
        ]
      }
      compliance_requirements: {
        Row: {
          category_id: string | null
          certificate_template_id: string | null
          created_at: string
          description: string | null
          frequency_unit: Database["public"]["Enums"]["frequency_unit"] | null
          frequency_value: number | null
          id: string
          is_active: boolean | null
          is_recurring: boolean | null
          metadata: Json | null
          name: string
          order_position: number | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          certificate_template_id?: string | null
          created_at?: string
          description?: string | null
          frequency_unit?: Database["public"]["Enums"]["frequency_unit"] | null
          frequency_value?: number | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          metadata?: Json | null
          name: string
          order_position?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          certificate_template_id?: string | null
          created_at?: string
          description?: string | null
          frequency_unit?: Database["public"]["Enums"]["frequency_unit"] | null
          frequency_value?: number | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          metadata?: Json | null
          name?: string
          order_position?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_requirements_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "compliance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_requirements_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "compliance_stats"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "compliance_requirements_certificate_template_id_fkey"
            columns: ["certificate_template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          comments: string | null
          created_at: string
          evaluation_date: string
          evaluator_id: string
          id: string
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          evaluation_date?: string
          evaluator_id: string
          id?: string
          score: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          evaluation_date?: string
          evaluator_id?: string
          id?: string
          score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          read: boolean | null
          title: string
          type: Database["public"]["Enums"]["notification_type"] | null
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"] | null
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      role_requirements: {
        Row: {
          created_at: string
          id: string
          requirement_id: string | null
          role: string
        }
        Insert: {
          created_at?: string
          id?: string
          requirement_id?: string | null
          role: string
        }
        Update: {
          created_at?: string
          id?: string
          requirement_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_requirements_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "compliance_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      supervision_sessions: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          notes: string | null
          session_date: string
          supervisor_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes: number
          id?: string
          notes?: string | null
          session_date?: string
          supervisor_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          session_date?: string
          supervisor_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supervision_sessions_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervision_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teaching_sessions: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          notes: string | null
          session_date: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes: number
          id?: string
          notes?: string | null
          session_date?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          session_date?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teaching_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          created_at: string
          created_by: string | null
          css_content: string | null
          description: string | null
          fields:
            | Database["public"]["CompositeTypes"]["template_field"][]
            | null
          html_content: string
          id: string
          is_default: boolean | null
          name: string
          status: Database["public"]["Enums"]["template_status"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          css_content?: string | null
          description?: string | null
          fields?:
            | Database["public"]["CompositeTypes"]["template_field"][]
            | null
          html_content: string
          id?: string
          is_default?: boolean | null
          name: string
          status?: Database["public"]["Enums"]["template_status"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          css_content?: string | null
          description?: string | null
          fields?:
            | Database["public"]["CompositeTypes"]["template_field"][]
            | null
          html_content?: string
          id?: string
          is_default?: boolean | null
          name?: string
          status?: Database["public"]["Enums"]["template_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_compliance: {
        Row: {
          current_value: number | null
          id: string
          last_updated: string | null
          requirement_id: string | null
          status: Database["public"]["Enums"]["requirement_status"] | null
          user_id: string | null
        }
        Insert: {
          current_value?: number | null
          id?: string
          last_updated?: string | null
          requirement_id?: string | null
          status?: Database["public"]["Enums"]["requirement_status"] | null
          user_id?: string | null
        }
        Update: {
          current_value?: number | null
          id?: string
          last_updated?: string | null
          requirement_id?: string | null
          status?: Database["public"]["Enums"]["requirement_status"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_compliance_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "compliance_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string
          specialty: string | null
          updated_at: string | null
          years_experience: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          specialty?: string | null
          updated_at?: string | null
          years_experience?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          specialty?: string | null
          updated_at?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      user_requirements: {
        Row: {
          completed_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          notes: string | null
          requirement_id: string | null
          status: Database["public"]["Enums"]["requirement_status"] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          requirement_id?: string | null
          status?: Database["public"]["Enums"]["requirement_status"] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          requirement_id?: string | null
          status?: Database["public"]["Enums"]["requirement_status"] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_requirements_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "compliance_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_requirements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean | null
          role_type: string
          role_value: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          role_type: string
          role_value: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          role_type?: string
          role_value?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_submissions: {
        Row: {
          created_at: string
          id: string
          review_notes: string | null
          reviewer_id: string | null
          status: string
          submission_date: string
          title: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_notes?: string | null
          reviewer_id?: string | null
          status?: string
          submission_date?: string
          title: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          review_notes?: string | null
          reviewer_id?: string | null
          status?: string
          submission_date?: string
          title?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_submissions_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      compliance_stats: {
        Row: {
          category_id: string | null
          category_name: string | null
          count: number | null
          status: Database["public"]["Enums"]["requirement_status"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_roles: {
        Args: {
          user_uuid: string
        }
        Returns: {
          role_type: string
          role_value: string
        }[]
      }
      has_role: {
        Args: {
          user_uuid: string
          role_val: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      sync_missing_profiles: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "base_user" | "IT" | "IP" | "IC" | "AP" | "AD" | "SA"
      certificate_status: "ACTIVE" | "EXPIRED" | "REVOKED" | "PENDING"
      frequency_unit: "days" | "weeks" | "months" | "years"
      notification_type: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "ACTION"
      requirement_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "expired"
        | "overdue"
      template_status: "draft" | "pending_approval" | "approved" | "rejected"
    }
    CompositeTypes: {
      font_config: {
        name: string | null
        size: number | null
        is_bold: boolean | null
      }
      template_field: {
        id: string | null
        label: string | null
        type: string | null
        required: boolean | null
        placeholder: string | null
        help_text: string | null
        x: number | null
        y: number | null
        font_config: Database["public"]["CompositeTypes"]["font_config"] | null
      }
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
