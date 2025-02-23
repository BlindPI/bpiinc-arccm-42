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
      ap_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          region: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          region?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          current_state: Json | null
          id: string
          operation: string
          previous_state: Json | null
          related_entity_id: string | null
          related_entity_type: string | null
          row_data: Json
          table_name: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          current_state?: Json | null
          id?: string
          operation: string
          previous_state?: Json | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          row_data: Json
          table_name: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          current_state?: Json | null
          id?: string
          operation?: string
          previous_state?: Json | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          row_data?: Json
          table_name?: string
        }
        Relationships: []
      }
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
      certification_requirements: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          min_sessions: number
          required_hours: number
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          min_sessions: number
          required_hours: number
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          min_sessions?: number
          required_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certification_requirements_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_completion_summary"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "certification_requirements_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_offerings: {
        Row: {
          ap_group_id: string | null
          course_id: string
          created_at: string
          end_date: string
          id: string
          instructor_id: string
          location_id: string
          max_participants: number
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          ap_group_id?: string | null
          course_id: string
          created_at?: string
          end_date: string
          id?: string
          instructor_id: string
          location_id: string
          max_participants: number
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          ap_group_id?: string | null
          course_id?: string
          created_at?: string
          end_date?: string
          id?: string
          instructor_id?: string
          location_id?: string
          max_participants?: number
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_offerings_ap_group_id_fkey"
            columns: ["ap_group_id"]
            isOneToOne: false
            referencedRelation: "ap_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_offerings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_completion_summary"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_offerings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_offerings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_offerings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
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
      document_requirements: {
        Row: {
          created_at: string
          document_type: string
          from_role: Database["public"]["Enums"]["user_role"]
          id: string
          is_mandatory: boolean
          to_role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_type: string
          from_role: Database["public"]["Enums"]["user_role"]
          id?: string
          is_mandatory?: boolean
          to_role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_type?: string
          from_role?: Database["public"]["Enums"]["user_role"]
          id?: string
          is_mandatory?: boolean
          to_role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      document_submissions: {
        Row: {
          created_at: string
          document_url: string
          id: string
          instructor_id: string
          requirement_id: string
          review_notes: string | null
          reviewer_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_url: string
          id?: string
          instructor_id: string
          requirement_id: string
          review_notes?: string | null
          reviewer_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_url?: string
          id?: string
          instructor_id?: string
          requirement_id?: string
          review_notes?: string | null
          reviewer_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_submissions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_submissions_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "document_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_submissions_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_compliance: {
        Row: {
          completed_teaching_hours: number
          compliance_notes: string | null
          created_at: string
          id: string
          instructor_id: string
          instructor_role: Database["public"]["Enums"]["user_role"]
          is_compliant: boolean
          last_compliance_check: string
          required_documents_count: number
          required_teaching_hours: number
          submitted_documents_count: number
          updated_at: string
        }
        Insert: {
          completed_teaching_hours?: number
          compliance_notes?: string | null
          created_at?: string
          id?: string
          instructor_id: string
          instructor_role: Database["public"]["Enums"]["user_role"]
          is_compliant?: boolean
          last_compliance_check?: string
          required_documents_count: number
          required_teaching_hours: number
          submitted_documents_count?: number
          updated_at?: string
        }
        Update: {
          completed_teaching_hours?: number
          compliance_notes?: string | null
          created_at?: string
          id?: string
          instructor_id?: string
          instructor_role?: Database["public"]["Enums"]["user_role"]
          is_compliant?: boolean
          last_compliance_check?: string
          required_documents_count?: number
          required_teaching_hours?: number
          submitted_documents_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_compliance_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      location_ap_groups: {
        Row: {
          ap_group_id: string | null
          created_at: string
          id: string
          location_id: string | null
          updated_at: string
        }
        Insert: {
          ap_group_id?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          updated_at?: string
        }
        Update: {
          ap_group_id?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_ap_groups_ap_group_id_fkey"
            columns: ["ap_group_id"]
            isOneToOne: false
            referencedRelation: "ap_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_ap_groups_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string
          city: string
          country: string
          created_at: string
          id: string
          name: string
          postal_code: string
          state: string
          updated_at: string
        }
        Insert: {
          address: string
          city: string
          country: string
          created_at?: string
          id?: string
          name: string
          postal_code: string
          state: string
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          country?: string
          created_at?: string
          id?: string
          name?: string
          postal_code?: string
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          compliance_notes: string | null
          compliance_status: boolean | null
          created_at: string
          display_name: string | null
          id: string
          last_compliance_check: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          compliance_notes?: string | null
          compliance_status?: boolean | null
          created_at?: string
          display_name?: string | null
          id: string
          last_compliance_check?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          compliance_notes?: string | null
          compliance_status?: boolean | null
          created_at?: string
          display_name?: string | null
          id?: string
          last_compliance_check?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      role_audit_requirements: {
        Row: {
          audit_type: Database["public"]["Enums"]["audit_type"]
          created_at: string | null
          from_role: Database["public"]["Enums"]["user_role"]
          id: string
          required_video_count: number | null
          requires_video_submissions: boolean | null
          to_role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          audit_type: Database["public"]["Enums"]["audit_type"]
          created_at?: string | null
          from_role: Database["public"]["Enums"]["user_role"]
          id?: string
          required_video_count?: number | null
          requires_video_submissions?: boolean | null
          to_role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          audit_type?: Database["public"]["Enums"]["audit_type"]
          created_at?: string | null
          from_role?: Database["public"]["Enums"]["user_role"]
          id?: string
          required_video_count?: number | null
          requires_video_submissions?: boolean | null
          to_role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      role_audit_submissions: {
        Row: {
          audit_form_url: string
          id: string
          submitted_at: string | null
          submitted_by: string | null
          transition_request_id: string | null
          updated_at: string | null
        }
        Insert: {
          audit_form_url: string
          id?: string
          submitted_at?: string | null
          submitted_by?: string | null
          transition_request_id?: string | null
          updated_at?: string | null
        }
        Update: {
          audit_form_url?: string
          id?: string
          submitted_at?: string | null
          submitted_by?: string | null
          transition_request_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_audit_submissions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_audit_submissions_transition_request_id_fkey"
            columns: ["transition_request_id"]
            isOneToOne: false
            referencedRelation: "role_transition_requests"
            referencedColumns: ["id"]
          },
        ]
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
      role_video_submissions: {
        Row: {
          audit_submission_id: string | null
          id: string
          submitted_at: string | null
          video_url: string
        }
        Insert: {
          audit_submission_id?: string | null
          id?: string
          submitted_at?: string | null
          video_url: string
        }
        Update: {
          audit_submission_id?: string | null
          id?: string
          submitted_at?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_video_submissions_audit_submission_id_fkey"
            columns: ["audit_submission_id"]
            isOneToOne: false
            referencedRelation: "role_audit_submissions"
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
      teaching_sessions: {
        Row: {
          completion_status:
            | Database["public"]["Enums"]["completion_status"]
            | null
          course_id: string
          created_at: string
          hours_taught: number
          id: string
          instructor_id: string
          session_date: string
          status: string
          updated_at: string
          verification_notes: string | null
          verifier_id: string | null
        }
        Insert: {
          completion_status?:
            | Database["public"]["Enums"]["completion_status"]
            | null
          course_id: string
          created_at?: string
          hours_taught: number
          id?: string
          instructor_id: string
          session_date: string
          status?: string
          updated_at?: string
          verification_notes?: string | null
          verifier_id?: string | null
        }
        Update: {
          completion_status?:
            | Database["public"]["Enums"]["completion_status"]
            | null
          course_id?: string
          created_at?: string
          hours_taught?: number
          id?: string
          instructor_id?: string
          session_date?: string
          status?: string
          updated_at?: string
          verification_notes?: string | null
          verifier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teaching_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_completion_summary"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "teaching_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaching_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaching_sessions_verifier_id_fkey"
            columns: ["verifier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      user_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          initial_role: Database["public"]["Enums"]["user_role"]
          invitation_token: string
          invited_by: string
          status: Database["public"]["Enums"]["invitation_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          initial_role?: Database["public"]["Enums"]["user_role"]
          invitation_token: string
          invited_by: string
          status?: Database["public"]["Enums"]["invitation_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          initial_role?: Database["public"]["Enums"]["user_role"]
          invitation_token?: string
          invited_by?: string
          status?: Database["public"]["Enums"]["invitation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      course_completion_summary: {
        Row: {
          completed_sessions: number | null
          completion_statuses: string | null
          course_id: string | null
          course_name: string | null
          instructor_id: string | null
          last_session_date: string | null
          total_hours: number | null
          total_sessions: number | null
        }
        Relationships: [
          {
            foreignKeyName: "teaching_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_new_user: {
        Args: {
          admin_user_id: string
          email: string
          initial_role: Database["public"]["Enums"]["user_role"]
          password: string
          display_name?: string
        }
        Returns: {
          success: boolean
          message: string
        }[]
      }
      create_user_from_invitation: {
        Args: {
          invitation_token: string
          password: string
        }
        Returns: {
          success: boolean
          message: string
          email: string
        }[]
      }
      generate_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: {
          user_id: string
        }
        Returns: Database["public"]["Enums"]["user_role"]
      }
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
      is_admin_or_higher: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      is_system_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      process_invitation_acceptance: {
        Args: {
          token: string
        }
        Returns: {
          success: boolean
          message: string
        }[]
      }
      validate_user_creation: {
        Args: {
          admin_user_id: string
          target_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: {
          success: boolean
          message: string
        }[]
      }
    }
    Enums: {
      audit_type: "IT_TO_IP" | "IP_TO_IC"
      certificate_request_status: "PENDING" | "APPROVED" | "REJECTED"
      certificate_status: "ACTIVE" | "EXPIRED" | "REVOKED"
      completion_status:
        | "NOT_STARTED"
        | "IN_PROGRESS"
        | "COMPLETED"
        | "CANCELLED"
      course_status: "ACTIVE" | "INACTIVE"
      invitation_status: "PENDING" | "ACCEPTED" | "EXPIRED"
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
