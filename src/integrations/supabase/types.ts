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
          assessment_status: string | null
          company: string | null
          course_name: string
          cpr_level: string | null
          created_at: string
          email: string | null
          expiry_date: string
          first_aid_level: string | null
          id: string
          issue_date: string
          phone: string | null
          recipient_name: string
          rejection_reason: string | null
          reviewer_id: string | null
          status: Database["public"]["Enums"]["certificate_request_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_status?: string | null
          company?: string | null
          course_name: string
          cpr_level?: string | null
          created_at?: string
          email?: string | null
          expiry_date: string
          first_aid_level?: string | null
          id?: string
          issue_date: string
          phone?: string | null
          recipient_name: string
          rejection_reason?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["certificate_request_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_status?: string | null
          company?: string | null
          course_name?: string
          cpr_level?: string | null
          created_at?: string
          email?: string | null
          expiry_date?: string
          first_aid_level?: string | null
          id?: string
          issue_date?: string
          phone?: string | null
          recipient_name?: string
          rejection_reason?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["certificate_request_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          assessment_status: string | null
          certificate_request_id: string | null
          certificate_url: string | null
          company: string | null
          course_name: string
          cpr_level: string | null
          created_at: string
          email: string | null
          expiry_date: string
          first_aid_level: string | null
          id: string
          issue_date: string
          issued_by: string | null
          phone: string | null
          recipient_name: string
          status: Database["public"]["Enums"]["certificate_status"]
          updated_at: string
        }
        Insert: {
          assessment_status?: string | null
          certificate_request_id?: string | null
          certificate_url?: string | null
          company?: string | null
          course_name: string
          cpr_level?: string | null
          created_at?: string
          email?: string | null
          expiry_date: string
          first_aid_level?: string | null
          id?: string
          issue_date: string
          issued_by?: string | null
          phone?: string | null
          recipient_name: string
          status?: Database["public"]["Enums"]["certificate_status"]
          updated_at?: string
        }
        Update: {
          assessment_status?: string | null
          certificate_request_id?: string | null
          certificate_url?: string | null
          company?: string | null
          course_name?: string
          cpr_level?: string | null
          created_at?: string
          email?: string | null
          expiry_date?: string
          first_aid_level?: string | null
          id?: string
          issue_date?: string
          issued_by?: string | null
          phone?: string | null
          recipient_name?: string
          status?: Database["public"]["Enums"]["certificate_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_certificate_request_id_fkey"
            columns: ["certificate_request_id"]
            isOneToOne: false
            referencedRelation: "certificate_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          expiration_months: number
          id: string
          name: string
          status: Database["public"]["Enums"]["course_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          expiration_months: number
          id?: string
          name: string
          status?: Database["public"]["Enums"]["course_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          expiration_months?: number
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["course_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      role_transition_requests: {
        Row: {
          created_at: string
          from_role: Database["public"]["Enums"]["user_role"]
          id: string
          reviewer_id: string | null
          status: string
          to_role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_role: Database["public"]["Enums"]["user_role"]
          id?: string
          reviewer_id?: string | null
          status?: string
          to_role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_role?: Database["public"]["Enums"]["user_role"]
          id?: string
          reviewer_id?: string | null
          status?: string
          to_role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_transition_requests_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_transition_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      team_groups: {
        Row: {
          created_at: string
          group_type: string
          id: string
          leader_id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_type: string
          id?: string
          leader_id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_type?: string
          id?: string
          leader_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_groups_leader_id_fkey"
            columns: ["leader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_hierarchies: {
        Row: {
          child_team_id: string | null
          created_at: string
          id: string
          parent_team_id: string | null
          updated_at: string
        }
        Insert: {
          child_team_id?: string | null
          created_at?: string
          id?: string
          parent_team_id?: string | null
          updated_at?: string
        }
        Update: {
          child_team_id?: string | null
          created_at?: string
          id?: string
          parent_team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_hierarchies_child_team_id_fkey"
            columns: ["child_team_id"]
            isOneToOne: false
            referencedRelation: "team_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_hierarchies_parent_team_id_fkey"
            columns: ["parent_team_id"]
            isOneToOne: false
            referencedRelation: "team_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          member_id: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      test_users: {
        Row: {
          created_at: string
          display_name: string
          email: string
          id: string
          password: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          display_name: string
          email: string
          id?: string
          password: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          password?: string
          role?: Database["public"]["Enums"]["user_role"]
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
          user_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      has_role_or_higher: {
        Args: {
          user_id: string
          min_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      is_admin_user: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      certificate_request_status: "PENDING" | "APPROVED" | "REJECTED"
      certificate_status: "ACTIVE" | "EXPIRED" | "REVOKED"
      course_status: "ACTIVE" | "INACTIVE"
      team_group_type: "SA_TEAM" | "AD_TEAM" | "AP_GROUP" | "INSTRUCTOR_GROUP"
      user_role: "SA" | "AD" | "AP" | "IC" | "IP" | "IT"
    }
    CompositeTypes: {
      [_ in never]: never
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
