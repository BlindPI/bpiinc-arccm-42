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
      audit_log: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          current_state: Json | null
          id: string
          impersonation_details: Json | null
          is_impersonated: boolean | null
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
          impersonation_details?: Json | null
          is_impersonated?: boolean | null
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
          impersonation_details?: Json | null
          is_impersonated?: boolean | null
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
            referencedRelation: "instructor_compliance_detail"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "certificates_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_summary"
            referencedColumns: ["instructor_id"]
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
      compliance_check_history: {
        Row: {
          check_date: string
          checked_by: string
          details: Json
          id: string
          instructor_id: string
          status: boolean
        }
        Insert: {
          check_date?: string
          checked_by: string
          details: Json
          id?: string
          instructor_id: string
          status: boolean
        }
        Update: {
          check_date?: string
          checked_by?: string
          details?: Json
          id?: string
          instructor_id?: string
          status?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "compliance_check_history_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_detail"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_check_history_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_check_history_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_check_history_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_detail"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_check_history_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_check_history_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_offerings: {
        Row: {
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
            referencedRelation: "instructor_compliance_detail"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "course_offerings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_summary"
            referencedColumns: ["instructor_id"]
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
      document_notifications: {
        Row: {
          document_submission_id: string | null
          id: string
          message: string
          notification_type: string
          recipient_id: string | null
          sent_at: string | null
        }
        Insert: {
          document_submission_id?: string | null
          id?: string
          message: string
          notification_type: string
          recipient_id?: string | null
          sent_at?: string | null
        }
        Update: {
          document_submission_id?: string | null
          id?: string
          message?: string
          notification_type?: string
          recipient_id?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_notifications_document_submission_id_fkey"
            columns: ["document_submission_id"]
            isOneToOne: false
            referencedRelation: "document_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_detail"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "document_notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "document_notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_requirements: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          created_at: string
          document_type: string
          from_role: Database["public"]["Enums"]["user_role"]
          id: string
          is_mandatory: boolean
          to_role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          document_type: string
          from_role: Database["public"]["Enums"]["user_role"]
          id?: string
          is_mandatory?: boolean
          to_role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
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
      document_review_history: {
        Row: {
          created_at: string | null
          document_submission_id: string | null
          feedback: string | null
          id: string
          reviewer_id: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          document_submission_id?: string | null
          feedback?: string | null
          id?: string
          reviewer_id?: string | null
          status: string
        }
        Update: {
          created_at?: string | null
          document_submission_id?: string | null
          feedback?: string | null
          id?: string
          reviewer_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_review_history_document_submission_id_fkey"
            columns: ["document_submission_id"]
            isOneToOne: false
            referencedRelation: "document_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_review_history_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_detail"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "document_review_history_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "document_review_history_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_submissions: {
        Row: {
          created_at: string
          document_url: string
          expiry_date: string | null
          feedback_text: string | null
          id: string
          instructor_id: string
          last_notification_sent: string | null
          last_verification_date: string | null
          notification_count: number | null
          requirement_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: string
          updated_at: string
          verification_status: Json | null
        }
        Insert: {
          created_at?: string
          document_url: string
          expiry_date?: string | null
          feedback_text?: string | null
          id?: string
          instructor_id: string
          last_notification_sent?: string | null
          last_verification_date?: string | null
          notification_count?: number | null
          requirement_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          updated_at?: string
          verification_status?: Json | null
        }
        Update: {
          created_at?: string
          document_url?: string
          expiry_date?: string | null
          feedback_text?: string | null
          id?: string
          instructor_id?: string
          last_notification_sent?: string | null
          last_verification_date?: string | null
          notification_count?: number | null
          requirement_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          updated_at?: string
          verification_status?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_submissions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_detail"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "document_submissions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_summary"
            referencedColumns: ["instructor_id"]
          },
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
            referencedRelation: "instructor_compliance_detail"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "document_submissions_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_summary"
            referencedColumns: ["instructor_id"]
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
      document_verification_rules: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          created_at: string
          document_type: string
          expiry_notification_days: number[] | null
          expiry_required: boolean | null
          id: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["document_category"]
          created_at?: string
          document_type: string
          expiry_notification_days?: number[] | null
          expiry_required?: boolean | null
          id?: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          document_type?: string
          expiry_notification_days?: number[] | null
          expiry_required?: boolean | null
          id?: string
          updated_at?: string
        }
        Relationships: []
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
            referencedRelation: "instructor_compliance_detail"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "instructor_compliance_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "instructor_compliance_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "instructor_compliance_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "profiles"
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
      notification_queue: {
        Row: {
          created_at: string | null
          id: string
          last_attempted_at: string | null
          notification_id: string
          recipient_id: string
          retry_count: number | null
          status: Database["public"]["Enums"]["notification_status"] | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_attempted_at?: string | null
          notification_id: string
          recipient_id: string
          retry_count?: number | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          created_at?: string | null
          id?: string
          last_attempted_at?: string | null
          notification_id?: string
          recipient_id?: string
          retry_count?: number | null
          status?: Database["public"]["Enums"]["notification_status"] | null
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          email_sent_at: string | null
          id: string
          message: string
          metadata: Json | null
          read_at: string | null
          recipient_id: string
          status: Database["public"]["Enums"]["notification_status"] | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email_sent_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read_at?: string | null
          recipient_id: string
          status?: Database["public"]["Enums"]["notification_status"] | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email_sent_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read_at?: string | null
          recipient_id?: string
          status?: Database["public"]["Enums"]["notification_status"] | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
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
            referencedRelation: "instructor_compliance_detail"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "role_audit_submissions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_summary"
            referencedColumns: ["instructor_id"]
          },
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
            referencedRelation: "instructor_compliance_detail"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "role_transition_requests_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_summary"
            referencedColumns: ["instructor_id"]
          },
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
            referencedRelation: "instructor_compliance_detail"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "role_transition_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_summary"
            referencedColumns: ["instructor_id"]
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
      supervisor_evaluations: {
        Row: {
          additional_notes: string | null
          areas_for_improvement: string | null
          created_at: string | null
          evaluator_id: string
          id: string
          instructor_id: string
          status: Database["public"]["Enums"]["evaluation_status"] | null
          student_feedback: string | null
          teaching_competency: number | null
          teaching_session_id: string
          updated_at: string | null
        }
        Insert: {
          additional_notes?: string | null
          areas_for_improvement?: string | null
          created_at?: string | null
          evaluator_id: string
          id?: string
          instructor_id: string
          status?: Database["public"]["Enums"]["evaluation_status"] | null
          student_feedback?: string | null
          teaching_competency?: number | null
          teaching_session_id: string
          updated_at?: string | null
        }
        Update: {
          additional_notes?: string | null
          areas_for_improvement?: string | null
          created_at?: string | null
          evaluator_id?: string
          id?: string
          instructor_id?: string
          status?: Database["public"]["Enums"]["evaluation_status"] | null
          student_feedback?: string | null
          teaching_competency?: number | null
          teaching_session_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supervisor_evaluations_teaching_session_id_fkey"
            columns: ["teaching_session_id"]
            isOneToOne: false
            referencedRelation: "evaluable_teaching_sessions"
            referencedColumns: ["teaching_session_id"]
          },
          {
            foreignKeyName: "supervisor_evaluations_teaching_session_id_fkey"
            columns: ["teaching_session_id"]
            isOneToOne: false
            referencedRelation: "teaching_sessions"
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
            referencedRelation: "instructor_compliance_detail"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "teaching_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_summary"
            referencedColumns: ["instructor_id"]
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
            referencedRelation: "instructor_compliance_detail"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "teaching_sessions_verifier_id_fkey"
            columns: ["verifier_id"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_summary"
            referencedColumns: ["instructor_id"]
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
      team_members: {
        Row: {
          created_at: string | null
          id: string
          role: string
          team_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          team_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          team_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          metadata: Json | null
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "teams"
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
            referencedRelation: "instructor_compliance_detail"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "user_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "user_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_requirements: {
        Row: {
          created_at: string
          id: string
          required_count: number
          role_transition_from: Database["public"]["Enums"]["user_role"]
          role_transition_to: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          required_count?: number
          role_transition_from: Database["public"]["Enums"]["user_role"]
          role_transition_to: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          required_count?: number
          role_transition_from?: Database["public"]["Enums"]["user_role"]
          role_transition_to?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      video_submissions: {
        Row: {
          feedback_text: string | null
          id: string
          instructor_id: string | null
          requirement_id: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: string
          submitted_at: string | null
          video_url: string
        }
        Insert: {
          feedback_text?: string | null
          id?: string
          instructor_id?: string | null
          requirement_id?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          submitted_at?: string | null
          video_url: string
        }
        Update: {
          feedback_text?: string | null
          id?: string
          instructor_id?: string | null
          requirement_id?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          submitted_at?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_submissions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_detail"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "video_submissions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "video_submissions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_submissions_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "video_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_submissions_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_detail"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "video_submissions_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "video_submissions_reviewer_id_fkey"
            columns: ["reviewer_id"]
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
            referencedRelation: "instructor_compliance_detail"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "teaching_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "teaching_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluable_teaching_sessions: {
        Row: {
          course_name: string | null
          evaluation_id: string | null
          instructor_id: string | null
          instructor_name: string | null
          session_date: string | null
          teaching_session_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teaching_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_detail"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "teaching_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_compliance_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "teaching_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_compliance_detail: {
        Row: {
          current_role: Database["public"]["Enums"]["user_role"] | null
          display_name: string | null
          documents: Json | null
          instructor_id: string | null
          is_compliant: boolean | null
        }
        Relationships: []
      }
      instructor_compliance_summary: {
        Row: {
          approved_documents: number | null
          completed_sessions: number | null
          current_role: Database["public"]["Enums"]["user_role"] | null
          display_name: string | null
          document_completion_percentage: number | null
          instructor_id: string | null
          required_documents: number | null
          required_videos: number | null
          submitted_videos: number | null
          teaching_hours: number | null
          video_completion_percentage: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_and_send_compliance_warnings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_expiring_documents: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
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
      has_admin_role: {
        Args: {
          user_id: string
        }
        Returns: boolean
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
      is_accessible_team: {
        Args: {
          team_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      is_admin_or_higher: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      is_impersonating: {
        Args: {
          metadata: Json
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
      document_category: "LICENSE" | "INSURANCE" | "CERTIFICATION" | "OTHER"
      evaluation_status: "PENDING" | "SUBMITTED" | "APPROVED" | "REJECTED"
      impersonation_action:
        | "IMPERSONATION_START"
        | "IMPERSONATION_END"
        | "IMPERSONATION_ACTION"
      invitation_status: "PENDING" | "ACCEPTED" | "EXPIRED"
      notification_status: "PENDING" | "SENT" | "FAILED" | "READ"
      notification_type:
        | "DOCUMENT_EXPIRING"
        | "DOCUMENT_EXPIRED"
        | "DOCUMENT_APPROVED"
        | "DOCUMENT_REJECTED"
        | "COMPLIANCE_WARNING"
        | "TEACHING_MILESTONE"
        | "EVALUATION_SUBMITTED"
        | "ROLE_TRANSITION_UPDATE"
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
