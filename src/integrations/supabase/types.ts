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
      certificate_audit_logs: {
        Row: {
          action: string
          certificate_id: string
          id: string
          performed_at: string | null
          performed_by: string | null
          reason: string | null
        }
        Insert: {
          action: string
          certificate_id: string
          id?: string
          performed_at?: string | null
          performed_by?: string | null
          reason?: string | null
        }
        Update: {
          action?: string
          certificate_id?: string
          id?: string
          performed_at?: string | null
          performed_by?: string | null
          reason?: string | null
        }
        Relationships: []
      }
      certificate_requests: {
        Row: {
          assessment_status: string | null
          city: string | null
          company: string | null
          course_name: string
          cpr_level: string | null
          created_at: string
          email: string | null
          expiry_date: string
          first_aid_level: string | null
          id: string
          instructor_name: string | null
          issue_date: string
          length: number | null
          location_id: string | null
          phone: string | null
          postal_code: string | null
          province: string | null
          recipient_name: string
          rejection_reason: string | null
          reviewer_id: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assessment_status?: string | null
          city?: string | null
          company?: string | null
          course_name: string
          cpr_level?: string | null
          created_at?: string
          email?: string | null
          expiry_date: string
          first_aid_level?: string | null
          id?: string
          instructor_name?: string | null
          issue_date: string
          length?: number | null
          location_id?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          recipient_name: string
          rejection_reason?: string | null
          reviewer_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assessment_status?: string | null
          city?: string | null
          company?: string | null
          course_name?: string
          cpr_level?: string | null
          created_at?: string
          email?: string | null
          expiry_date?: string
          first_aid_level?: string | null
          id?: string
          instructor_name?: string | null
          issue_date?: string
          length?: number | null
          location_id?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          recipient_name?: string
          rejection_reason?: string | null
          reviewer_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificate_requests_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_requests_backup: {
        Row: {
          assessment_status: string | null
          city: string | null
          company: string | null
          course_name: string | null
          cpr_level: string | null
          created_at: string | null
          email: string | null
          expiry_date: string | null
          first_aid_level: string | null
          id: string | null
          instructor_name: string | null
          issue_date: string | null
          length: number | null
          phone: string | null
          postal_code: string | null
          province: string | null
          recipient_name: string | null
          rejection_reason: string | null
          reviewer_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assessment_status?: string | null
          city?: string | null
          company?: string | null
          course_name?: string | null
          cpr_level?: string | null
          created_at?: string | null
          email?: string | null
          expiry_date?: string | null
          first_aid_level?: string | null
          id?: string | null
          instructor_name?: string | null
          issue_date?: string | null
          length?: number | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          recipient_name?: string | null
          rejection_reason?: string | null
          reviewer_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assessment_status?: string | null
          city?: string | null
          company?: string | null
          course_name?: string | null
          cpr_level?: string | null
          created_at?: string | null
          email?: string | null
          expiry_date?: string | null
          first_aid_level?: string | null
          id?: string | null
          instructor_name?: string | null
          issue_date?: string | null
          length?: number | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          recipient_name?: string | null
          rejection_reason?: string | null
          reviewer_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      certificate_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_default: boolean | null
          name: string
          url: string
          version: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          url: string
          version: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          url?: string
          version?: string
        }
        Relationships: []
      }
      certificate_verification_logs: {
        Row: {
          certificate_id: string | null
          id: string
          ip_address: string | null
          reason: string | null
          result: string
          user_agent: string | null
          verification_code: string
          verification_time: string | null
        }
        Insert: {
          certificate_id?: string | null
          id?: string
          ip_address?: string | null
          reason?: string | null
          result: string
          user_agent?: string | null
          verification_code: string
          verification_time?: string | null
        }
        Update: {
          certificate_id?: string | null
          id?: string
          ip_address?: string | null
          reason?: string | null
          result?: string
          user_agent?: string | null
          verification_code?: string
          verification_time?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_request_id: string | null
          certificate_url: string | null
          course_name: string
          created_at: string
          expiry_date: string
          id: string
          issue_date: string
          issued_by: string | null
          length: number | null
          location_id: string | null
          recipient_name: string
          status: string
          template_id: string | null
          updated_at: string
          verification_code: string
        }
        Insert: {
          certificate_request_id?: string | null
          certificate_url?: string | null
          course_name: string
          created_at?: string
          expiry_date: string
          id?: string
          issue_date: string
          issued_by?: string | null
          length?: number | null
          location_id?: string | null
          recipient_name: string
          status?: string
          template_id?: string | null
          updated_at?: string
          verification_code: string
        }
        Update: {
          certificate_request_id?: string | null
          certificate_url?: string | null
          course_name?: string
          created_at?: string
          expiry_date?: string
          id?: string
          issue_date?: string
          issued_by?: string | null
          length?: number | null
          location_id?: string | null
          recipient_name?: string
          status?: string
          template_id?: string | null
          updated_at?: string
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates_backup: {
        Row: {
          certificate_request_id: string | null
          certificate_url: string | null
          course_name: string | null
          created_at: string | null
          expiry_date: string | null
          id: string | null
          issue_date: string | null
          issued_by: string | null
          length: number | null
          recipient_name: string | null
          status: string | null
          template_id: string | null
          updated_at: string | null
          verification_code: string | null
        }
        Insert: {
          certificate_request_id?: string | null
          certificate_url?: string | null
          course_name?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string | null
          issue_date?: string | null
          issued_by?: string | null
          length?: number | null
          recipient_name?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          verification_code?: string | null
        }
        Update: {
          certificate_request_id?: string | null
          certificate_url?: string | null
          course_name?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string | null
          issue_date?: string | null
          issued_by?: string | null
          length?: number | null
          recipient_name?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          verification_code?: string | null
        }
        Relationships: []
      }
      course_offerings: {
        Row: {
          course_id: string
          created_at: string
          end_date: string
          id: string
          instructor_id: string | null
          location_id: string | null
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
          instructor_id?: string | null
          location_id?: string | null
          max_participants?: number
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          end_date?: string
          id?: string
          instructor_id?: string | null
          location_id?: string | null
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
            referencedRelation: "certification_requirements"
            referencedColumns: ["course_id"]
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
      course_prerequisites: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_required: boolean
          prerequisite_course_id: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_required?: boolean
          prerequisite_course_id: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_required?: boolean
          prerequisite_course_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_prerequisites_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "certification_requirements"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_prerequisites_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_completion_summary"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_prerequisites_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_prerequisites_prerequisite_course_id_fkey"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "certification_requirements"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_prerequisites_prerequisite_course_id_fkey"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "course_completion_summary"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_prerequisites_prerequisite_course_id_fkey"
            columns: ["prerequisite_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          cpr_level: string | null
          created_at: string
          created_by: string | null
          description: string | null
          expiration_months: number
          first_aid_level: string | null
          id: string
          length: number | null
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          cpr_level?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expiration_months?: number
          first_aid_level?: string | null
          id?: string
          length?: number | null
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          cpr_level?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expiration_months?: number
          first_aid_level?: string | null
          id?: string
          length?: number | null
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_requirements: {
        Row: {
          created_at: string
          description: string | null
          document_type: string
          from_role: string
          id: string
          is_mandatory: boolean
          to_role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_type: string
          from_role: string
          id?: string
          is_mandatory?: boolean
          to_role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_type?: string
          from_role?: string
          id?: string
          is_mandatory?: boolean
          to_role?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_submissions: {
        Row: {
          document_url: string | null
          feedback: string | null
          id: string
          instructor_id: string
          requirement_id: string
          reviewed_at: string | null
          reviewer_id: string | null
          status: string
          submitted_at: string
        }
        Insert: {
          document_url?: string | null
          feedback?: string | null
          id?: string
          instructor_id: string
          requirement_id: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          submitted_at?: string
        }
        Update: {
          document_url?: string | null
          feedback?: string | null
          id?: string
          instructor_id?: string
          requirement_id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          submitted_at?: string
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
      enrollments: {
        Row: {
          attendance: string | null
          attendance_notes: string | null
          course_offering_id: string
          created_at: string
          enrollment_date: string
          id: string
          status: string
          updated_at: string
          user_id: string
          waitlist_position: number | null
        }
        Insert: {
          attendance?: string | null
          attendance_notes?: string | null
          course_offering_id: string
          created_at?: string
          enrollment_date?: string
          id?: string
          status: string
          updated_at?: string
          user_id: string
          waitlist_position?: number | null
        }
        Update: {
          attendance?: string | null
          attendance_notes?: string | null
          course_offering_id?: string
          created_at?: string
          enrollment_date?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
          waitlist_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_offering_id_fkey"
            columns: ["course_offering_id"]
            isOneToOne: false
            referencedRelation: "course_offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      location_templates: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          location_id: string
          template_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          location_id: string
          template_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          location_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_templates_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_templates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          name: string
          state: string | null
          status: string
          updated_at: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name: string
          state?: string | null
          status?: string
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          state?: string | null
          status?: string
          updated_at?: string
          zip?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          browser_enabled: boolean
          category: string
          created_at: string
          email_enabled: boolean
          id: string
          in_app_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          browser_enabled?: boolean
          category: string
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          browser_enabled?: boolean
          category?: string
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          category: string
          created_at: string
          id: string
          message: string
          priority: string
          read: boolean
          read_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          category?: string
          created_at?: string
          id?: string
          message: string
          priority?: string
          read?: boolean
          read_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          priority?: string
          read?: boolean
          read_at?: string | null
          title?: string
          type?: string
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
          compliance_status: boolean | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          compliance_status?: boolean | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          compliance_status?: boolean | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      progression_paths: {
        Row: {
          created_at: string | null
          description: string | null
          from_role: string
          id: string
          title: string
          to_role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          from_role: string
          id?: string
          title: string
          to_role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          from_role?: string
          id?: string
          title?: string
          to_role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      progression_requirements: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_mandatory: boolean | null
          metadata: Json | null
          progression_path_id: string | null
          required_count: number | null
          requirement_type: string
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          metadata?: Json | null
          progression_path_id?: string | null
          required_count?: number | null
          requirement_type: string
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_mandatory?: boolean | null
          metadata?: Json | null
          progression_path_id?: string | null
          required_count?: number | null
          requirement_type?: string
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progression_requirements_progression_path_id_fkey"
            columns: ["progression_path_id"]
            isOneToOne: false
            referencedRelation: "progression_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      role_audit_submissions: {
        Row: {
          audit_date: string
          audit_document_url: string
          auditor_id: string | null
          feedback: string | null
          id: string
          reviewed_at: string | null
          status: string
          submitted_at: string
          transition_request_id: string | null
          user_id: string
        }
        Insert: {
          audit_date: string
          audit_document_url: string
          auditor_id?: string | null
          feedback?: string | null
          id?: string
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
          transition_request_id?: string | null
          user_id: string
        }
        Update: {
          audit_date?: string
          audit_document_url?: string
          auditor_id?: string | null
          feedback?: string | null
          id?: string
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
          transition_request_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_audit_submissions_auditor_id_fkey"
            columns: ["auditor_id"]
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
          {
            foreignKeyName: "role_audit_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_requirements: {
        Row: {
          created_at: string
          description: string | null
          document_requirements_count: number
          evaluation_score_required: number
          from_role: string
          has_audit_requirement: boolean
          has_exam_requirement: boolean
          has_interview_requirement: boolean
          has_video_requirement: boolean
          id: string
          min_experience_months: number
          supervision_hours_required: number
          teaching_hours_required: number
          to_role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_requirements_count?: number
          evaluation_score_required?: number
          from_role: string
          has_audit_requirement?: boolean
          has_exam_requirement?: boolean
          has_interview_requirement?: boolean
          has_video_requirement?: boolean
          id?: string
          min_experience_months?: number
          supervision_hours_required?: number
          teaching_hours_required?: number
          to_role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_requirements_count?: number
          evaluation_score_required?: number
          from_role?: string
          has_audit_requirement?: boolean
          has_exam_requirement?: boolean
          has_interview_requirement?: boolean
          has_video_requirement?: boolean
          id?: string
          min_experience_months?: number
          supervision_hours_required?: number
          teaching_hours_required?: number
          to_role?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_transition_requests: {
        Row: {
          created_at: string
          from_role: string
          id: string
          rejection_reason: string | null
          reviewer_id: string | null
          status: string
          to_role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_role: string
          id?: string
          rejection_reason?: string | null
          reviewer_id?: string | null
          status?: string
          to_role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_role?: string
          id?: string
          rejection_reason?: string | null
          reviewer_id?: string | null
          status?: string
          to_role?: string
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
          description: string | null
          feedback: string | null
          id: string
          reviewed_at: string | null
          reviewer_id: string | null
          status: string
          submitted_at: string
          title: string
          transition_request_id: string | null
          user_id: string
          video_url: string
        }
        Insert: {
          description?: string | null
          feedback?: string | null
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          submitted_at?: string
          title: string
          transition_request_id?: string | null
          user_id: string
          video_url: string
        }
        Update: {
          description?: string | null
          feedback?: string | null
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          submitted_at?: string
          title?: string
          transition_request_id?: string | null
          user_id?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_video_submissions_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_video_submissions_transition_request_id_fkey"
            columns: ["transition_request_id"]
            isOneToOne: false
            referencedRelation: "role_transition_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_video_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supervision_relationships: {
        Row: {
          created_at: string
          id: string
          status: string
          supervisee_id: string
          supervisor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          supervisee_id: string
          supervisor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          supervisee_id?: string
          supervisor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supervision_relationships_supervisee_id_fkey"
            columns: ["supervisee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervision_relationships_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supervisor_evaluations: {
        Row: {
          additional_notes: string | null
          areas_for_improvement: string
          created_at: string
          evaluator_id: string
          id: string
          instructor_id: string
          status: string
          student_feedback: string
          teaching_competency: number
          teaching_session_id: string
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          areas_for_improvement: string
          created_at?: string
          evaluator_id: string
          id?: string
          instructor_id: string
          status?: string
          student_feedback: string
          teaching_competency: number
          teaching_session_id: string
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          areas_for_improvement?: string
          created_at?: string
          evaluator_id?: string
          id?: string
          instructor_id?: string
          status?: string
          student_feedback?: string
          teaching_competency?: number
          teaching_session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supervisor_evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisor_evaluations_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      teaching_sessions: {
        Row: {
          completion_status: string
          course_id: string
          created_at: string
          hours_taught: number
          id: string
          instructor_id: string
          notes: string | null
          session_date: string
          updated_at: string
        }
        Insert: {
          completion_status?: string
          course_id: string
          created_at?: string
          hours_taught: number
          id?: string
          instructor_id: string
          notes?: string | null
          session_date: string
          updated_at?: string
        }
        Update: {
          completion_status?: string
          course_id?: string
          created_at?: string
          hours_taught?: number
          id?: string
          instructor_id?: string
          notes?: string | null
          session_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teaching_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "certification_requirements"
            referencedColumns: ["course_id"]
          },
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
          display_name: string | null
          email: string
          id: string
          password: string
          role: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          password: string
          role: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          password?: string
          role?: string
        }
        Relationships: []
      }
      user_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          initial_role: string
          invitation_token: string
          invited_by: string
          used: boolean
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          initial_role: string
          invitation_token: string
          invited_by: string
          used?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          initial_role?: string
          invitation_token?: string
          invited_by?: string
          used?: boolean
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
      user_requirement_progress: {
        Row: {
          created_at: string | null
          id: string
          progress_data: Json | null
          requirement_id: string | null
          review_date: string | null
          review_notes: string | null
          reviewer_id: string | null
          status: string
          submission_date: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          progress_data?: Json | null
          requirement_id?: string | null
          review_date?: string | null
          review_notes?: string | null
          reviewer_id?: string | null
          status: string
          submission_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          progress_data?: Json | null
          requirement_id?: string | null
          review_date?: string | null
          review_notes?: string | null
          reviewer_id?: string | null
          status?: string
          submission_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_requirement_progress_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "progression_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_supervision_relationships: {
        Row: {
          created_at: string | null
          id: string | null
          status: string | null
          supervisee_id: string | null
          supervisee_name: string | null
          supervisee_role: string | null
          supervisor_id: string | null
          supervisor_name: string | null
          supervisor_role: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supervision_relationships_supervisee_id_fkey"
            columns: ["supervisee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervision_relationships_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      active_supervisors: {
        Row: {
          supervisee_count: number | null
          supervisor_id: string | null
          supervisor_name: string | null
          supervisor_role: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supervision_relationships_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certification_requirements: {
        Row: {
          course_id: string | null
          min_sessions: number | null
          required_hours: number | null
        }
        Insert: {
          course_id?: string | null
          min_sessions?: never
          required_hours?: never
        }
        Update: {
          course_id?: string | null
          min_sessions?: never
          required_hours?: never
        }
        Relationships: []
      }
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supervision_progress: {
        Row: {
          avg_teaching_competency: number | null
          cumulative_score: number | null
          evaluation_count: number | null
          supervisee_id: string | null
          supervisor_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supervision_relationships_supervisee_id_fkey"
            columns: ["supervisee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervision_relationships_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_role_progression_eligibility: {
        Args: { user_id: string; target_role: string }
        Returns: boolean
      }
      create_new_user: {
        Args: {
          admin_user_id: string
          email: string
          initial_role: string
          password: string
          display_name?: string
        }
        Returns: {
          success: boolean
          message: string
        }[]
      }
      create_user_from_invitation: {
        Args: { invitation_token: string; password: string }
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
      generate_verification_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_auth_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      log_certificate_action: {
        Args: {
          certificate_id: string
          action_type: string
          reason_text?: string
          user_id?: string
        }
        Returns: undefined
      }
      log_certificate_verification: {
        Args: {
          cert_id: string
          verification_code_text: string
          result_status: string
          reason_text?: string
        }
        Returns: undefined
      }
      verify_certificate: {
        Args: { verification_code: string }
        Returns: {
          valid: boolean
          certificate_id: string
          recipient_name: string
          course_name: string
          issue_date: string
          expiry_date: string
          status: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
