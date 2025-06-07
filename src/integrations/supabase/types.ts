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
      access_patterns: {
        Row: {
          action: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          metadata: Json | null
          page_path: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          page_path: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          page_path?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_patterns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "access_patterns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "access_patterns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_dashboard_metrics: {
        Row: {
          change_percentage: number | null
          created_at: string | null
          current_value: number | null
          display_order: number | null
          id: string
          is_active: boolean | null
          metric_label: string
          metric_type: string
          period_end: string | null
          period_start: string | null
          previous_value: number | null
          trend: string | null
          updated_at: string | null
        }
        Insert: {
          change_percentage?: number | null
          created_at?: string | null
          current_value?: number | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          metric_label: string
          metric_type: string
          period_end?: string | null
          period_start?: string | null
          previous_value?: number | null
          trend?: string | null
          updated_at?: string | null
        }
        Update: {
          change_percentage?: number | null
          created_at?: string | null
          current_value?: number | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          metric_label?: string
          metric_type?: string
          period_end?: string | null
          period_start?: string | null
          previous_value?: number | null
          trend?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      analytics_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          data: Json
          expires_at: string
          id: string
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          data: Json
          expires_at: string
          id?: string
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          data?: Json
          expires_at?: string
          id?: string
        }
        Relationships: []
      }
      analytics_reports: {
        Row: {
          configuration: Json
          created_at: string | null
          created_by: string | null
          id: string
          is_automated: boolean | null
          name: string
          report_type: string
          schedule_config: Json | null
          updated_at: string | null
        }
        Insert: {
          configuration?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_automated?: boolean | null
          name: string
          report_type: string
          schedule_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          configuration?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_automated?: boolean | null
          name?: string
          report_type?: string
          schedule_config?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "analytics_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "analytics_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_integrations: {
        Row: {
          authentication_config: Json | null
          configuration: Json
          created_at: string | null
          created_by: string | null
          endpoint_url: string
          id: string
          integration_type: string
          is_active: boolean | null
          name: string
          rate_limit: number | null
          updated_at: string | null
        }
        Insert: {
          authentication_config?: Json | null
          configuration?: Json
          created_at?: string | null
          created_by?: string | null
          endpoint_url: string
          id?: string
          integration_type: string
          is_active?: boolean | null
          name: string
          rate_limit?: number | null
          updated_at?: string | null
        }
        Update: {
          authentication_config?: Json | null
          configuration?: Json
          created_at?: string | null
          created_by?: string | null
          endpoint_url?: string
          id?: string
          integration_type?: string
          is_active?: boolean | null
          name?: string
          rate_limit?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_integrations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "api_integrations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "api_integrations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_types: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          session_id: string | null
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          session_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          session_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      authorized_providers: {
        Row: {
          address: string | null
          approval_date: string | null
          approved_by: string | null
          certification_levels: Json | null
          compliance_score: number | null
          contact_email: string | null
          contact_phone: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string
          description: string | null
          id: number
          logo_url: string | null
          metadata: Json | null
          name: string
          performance_rating: number | null
          primary_location_id: string | null
          provider_name: string
          provider_team_id: string | null
          provider_type: string | null
          provider_url: string
          specializations: Json | null
          status: string | null
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          approval_date?: string | null
          approved_by?: string | null
          certification_levels?: Json | null
          compliance_score?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          description?: string | null
          id?: number
          logo_url?: string | null
          metadata?: Json | null
          name: string
          performance_rating?: number | null
          primary_location_id?: string | null
          provider_name: string
          provider_team_id?: string | null
          provider_type?: string | null
          provider_url: string
          specializations?: Json | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          approval_date?: string | null
          approved_by?: string | null
          certification_levels?: Json | null
          compliance_score?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          description?: string | null
          id?: number
          logo_url?: string | null
          metadata?: Json | null
          name?: string
          performance_rating?: number | null
          primary_location_id?: string | null
          provider_name?: string
          provider_team_id?: string | null
          provider_type?: string | null
          provider_url?: string
          specializations?: Json | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "authorized_providers_primary_location_id_fkey"
            columns: ["primary_location_id"]
            isOneToOne: true
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authorized_providers_provider_team_id_fkey"
            columns: ["provider_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_executions: {
        Row: {
          completed_at: string | null
          error_message: string | null
          execution_data: Json
          id: string
          result: Json | null
          rule_id: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          execution_data: Json
          id?: string
          result?: Json | null
          rule_id?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          execution_data?: Json
          id?: string
          result?: Json | null
          rule_id?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_executions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          actions: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_executed: string | null
          name: string
          rule_type: string
          trigger_conditions: Json
          updated_at: string | null
        }
        Insert: {
          actions: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed?: string | null
          name: string
          rule_type: string
          trigger_conditions: Json
          updated_at?: string | null
        }
        Update: {
          actions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed?: string | null
          name?: string
          rule_type?: string
          trigger_conditions?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "automation_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "automation_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_audit_logs: {
        Row: {
          action: string
          certificate_id: string
          email_recipient: string | null
          email_template_id: string | null
          id: string
          performed_at: string | null
          performed_by: string | null
          reason: string | null
        }
        Insert: {
          action: string
          certificate_id: string
          email_recipient?: string | null
          email_template_id?: string | null
          id?: string
          performed_at?: string | null
          performed_by?: string | null
          reason?: string | null
        }
        Update: {
          action?: string
          certificate_id?: string
          email_recipient?: string | null
          email_template_id?: string | null
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
          batch_id: string | null
          batch_name: string | null
          city: string | null
          company: string | null
          course_name: string
          cpr_level: string | null
          created_at: string
          email: string | null
          expiry_date: string
          first_aid_level: string | null
          generation_attempts: number | null
          generation_error: string | null
          id: string
          instructor_level: string | null
          instructor_name: string | null
          issue_date: string
          last_generation_attempt: string | null
          length: number | null
          location_id: string | null
          phone: string | null
          postal_code: string | null
          province: string | null
          recipient_email: string | null
          recipient_name: string
          rejection_reason: string | null
          reviewer_id: string | null
          roster_id: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assessment_status?: string | null
          batch_id?: string | null
          batch_name?: string | null
          city?: string | null
          company?: string | null
          course_name: string
          cpr_level?: string | null
          created_at?: string
          email?: string | null
          expiry_date: string
          first_aid_level?: string | null
          generation_attempts?: number | null
          generation_error?: string | null
          id?: string
          instructor_level?: string | null
          instructor_name?: string | null
          issue_date: string
          last_generation_attempt?: string | null
          length?: number | null
          location_id?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          recipient_email?: string | null
          recipient_name: string
          rejection_reason?: string | null
          reviewer_id?: string | null
          roster_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assessment_status?: string | null
          batch_id?: string | null
          batch_name?: string | null
          city?: string | null
          company?: string | null
          course_name?: string
          cpr_level?: string | null
          created_at?: string
          email?: string | null
          expiry_date?: string
          first_aid_level?: string | null
          generation_attempts?: number | null
          generation_error?: string | null
          id?: string
          instructor_level?: string | null
          instructor_name?: string | null
          issue_date?: string
          last_generation_attempt?: string | null
          length?: number | null
          location_id?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          recipient_email?: string | null
          recipient_name?: string
          rejection_reason?: string | null
          reviewer_id?: string | null
          roster_id?: string | null
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
          {
            foreignKeyName: "certificate_requests_roster_id_fkey"
            columns: ["roster_id"]
            isOneToOne: false
            referencedRelation: "rosters"
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
          batch_email_id: string | null
          batch_id: string | null
          batch_name: string | null
          certificate_request_id: string | null
          certificate_url: string | null
          course_name: string
          created_at: string
          email_status: string | null
          expiry_date: string
          generation_status: string | null
          id: string
          instructor_level: string | null
          instructor_name: string | null
          is_batch_emailed: boolean | null
          issue_date: string
          issued_by: string | null
          last_emailed_at: string | null
          length: number | null
          location_id: string | null
          recipient_email: string | null
          recipient_name: string
          roster_id: string | null
          status: string
          template_id: string | null
          thumbnail_status: string | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string | null
          verification_code: string
        }
        Insert: {
          batch_email_id?: string | null
          batch_id?: string | null
          batch_name?: string | null
          certificate_request_id?: string | null
          certificate_url?: string | null
          course_name: string
          created_at?: string
          email_status?: string | null
          expiry_date: string
          generation_status?: string | null
          id?: string
          instructor_level?: string | null
          instructor_name?: string | null
          is_batch_emailed?: boolean | null
          issue_date: string
          issued_by?: string | null
          last_emailed_at?: string | null
          length?: number | null
          location_id?: string | null
          recipient_email?: string | null
          recipient_name: string
          roster_id?: string | null
          status?: string
          template_id?: string | null
          thumbnail_status?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string | null
          verification_code: string
        }
        Update: {
          batch_email_id?: string | null
          batch_id?: string | null
          batch_name?: string | null
          certificate_request_id?: string | null
          certificate_url?: string | null
          course_name?: string
          created_at?: string
          email_status?: string | null
          expiry_date?: string
          generation_status?: string | null
          id?: string
          instructor_level?: string | null
          instructor_name?: string | null
          is_batch_emailed?: boolean | null
          issue_date?: string
          issued_by?: string | null
          last_emailed_at?: string | null
          length?: number | null
          location_id?: string | null
          recipient_email?: string | null
          recipient_name?: string
          roster_id?: string | null
          status?: string
          template_id?: string | null
          thumbnail_status?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string | null
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_batch_email_id_fkey"
            columns: ["batch_email_id"]
            isOneToOne: false
            referencedRelation: "email_batch_operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_roster_id_fkey"
            columns: ["roster_id"]
            isOneToOne: false
            referencedRelation: "rosters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_certificates_certificate_request_id"
            columns: ["certificate_request_id"]
            isOneToOne: false
            referencedRelation: "certificate_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      certification_levels: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      certification_verification_requests: {
        Row: {
          certificate_id: string
          created_at: string
          id: string
          rejection_reason: string | null
          requested_by: string
          requester_organization: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          verification_purpose: string
        }
        Insert: {
          certificate_id: string
          created_at?: string
          id?: string
          rejection_reason?: string | null
          requested_by: string
          requester_organization?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          verification_purpose: string
        }
        Update: {
          certificate_id?: string
          created_at?: string
          id?: string
          rejection_reason?: string | null
          requested_by?: string
          requester_organization?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          verification_purpose?: string
        }
        Relationships: [
          {
            foreignKeyName: "certification_verification_requests_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_verification_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "certification_verification_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "certification_verification_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_verification_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "certification_verification_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "certification_verification_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      completed_requirements: {
        Row: {
          completion_date: string
          created_at: string
          id: string
          requirement_id: string
          requirement_name: string
          updated_at: string
          user_id: string
          verification_notes: string | null
          verified_by: string | null
        }
        Insert: {
          completion_date?: string
          created_at?: string
          id?: string
          requirement_id: string
          requirement_name: string
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verified_by?: string | null
        }
        Update: {
          completion_date?: string
          created_at?: string
          id?: string
          requirement_id?: string
          requirement_name?: string
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "completed_requirements_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "progression_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "completed_requirements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "completed_requirements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "completed_requirements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "completed_requirements_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "completed_requirements_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "completed_requirements_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_assessments: {
        Row: {
          assessment_name: string
          assessment_status: string | null
          assessment_type: string | null
          assessor_id: string | null
          compliance_percentage: number | null
          created_at: string | null
          created_by: string | null
          end_date: string | null
          findings: Json | null
          framework_id: string | null
          id: string
          overall_score: number | null
          recommendations: string | null
          scope_description: string | null
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          assessment_name: string
          assessment_status?: string | null
          assessment_type?: string | null
          assessor_id?: string | null
          compliance_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          findings?: Json | null
          framework_id?: string | null
          id?: string
          overall_score?: number | null
          recommendations?: string | null
          scope_description?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment_name?: string
          assessment_status?: string | null
          assessment_type?: string | null
          assessor_id?: string | null
          compliance_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          findings?: Json | null
          framework_id?: string | null
          id?: string
          overall_score?: number | null
          recommendations?: string | null
          scope_description?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      compliance_frameworks: {
        Row: {
          assessment_criteria: Json | null
          created_at: string | null
          framework_description: string | null
          framework_name: string
          framework_version: string | null
          id: string
          is_active: boolean | null
          requirements: Json | null
          updated_at: string | null
        }
        Insert: {
          assessment_criteria?: Json | null
          created_at?: string | null
          framework_description?: string | null
          framework_name: string
          framework_version?: string | null
          id?: string
          is_active?: boolean | null
          requirements?: Json | null
          updated_at?: string | null
        }
        Update: {
          assessment_criteria?: Json | null
          created_at?: string | null
          framework_description?: string | null
          framework_name?: string
          framework_version?: string | null
          id?: string
          is_active?: boolean | null
          requirements?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      compliance_issues: {
        Row: {
          created_at: string
          description: string
          due_date: string | null
          id: string
          issue_type: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          issue_type: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          issue_type?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_issues_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_issues_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_issues_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_issues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_issues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_issues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      configuration_audit_log: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          configuration_id: string | null
          created_at: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          configuration_id?: string | null
          created_at?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          configuration_id?: string | null
          created_at?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "configuration_audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "configuration_audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "configuration_audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "configuration_audit_log_configuration_id_fkey"
            columns: ["configuration_id"]
            isOneToOne: false
            referencedRelation: "system_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      course_approval_requests: {
        Row: {
          approver_id: string | null
          course_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          notes: string | null
          provider_id: string
          request_date: string | null
          requester_id: string
          response_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          approver_id?: string | null
          course_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          provider_id: string
          request_date?: string | null
          requester_id: string
          response_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          approver_id?: string | null
          course_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          provider_id?: string
          request_date?: string | null
          requester_id?: string
          response_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      course_certification_values: {
        Row: {
          certification_type: string
          certification_value: string
          course_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          certification_type: string
          certification_value: string
          course_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          certification_type?: string
          certification_value?: string
          course_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_certification_values_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "certification_requirements"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_certification_values_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_completion_summary"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_certification_values_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          attendance: string | null
          attendance_notes: string | null
          course_schedule_id: string | null
          created_at: string | null
          enrollment_date: string | null
          id: string
          status: string | null
          updated_at: string | null
          user_id: string | null
          waitlist_position: number | null
        }
        Insert: {
          attendance?: string | null
          attendance_notes?: string | null
          course_schedule_id?: string | null
          created_at?: string | null
          enrollment_date?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          waitlist_position?: number | null
        }
        Update: {
          attendance?: string | null
          attendance_notes?: string | null
          course_schedule_id?: string | null
          created_at?: string | null
          enrollment_date?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          waitlist_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_schedule_id_fkey"
            columns: ["course_schedule_id"]
            isOneToOne: false
            referencedRelation: "course_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "course_enrollments_user_id_fkey"
            columns: ["user_id"]
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
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "course_offerings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
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
      course_schedules: {
        Row: {
          course_id: string | null
          created_at: string | null
          current_enrollment: number | null
          end_date: string
          id: string
          instructor_id: string | null
          location_id: string | null
          max_capacity: number | null
          recurring_pattern: Json | null
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          current_enrollment?: number | null
          end_date: string
          id?: string
          instructor_id?: string | null
          location_id?: string | null
          max_capacity?: number | null
          recurring_pattern?: Json | null
          start_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          current_enrollment?: number | null
          end_date?: string
          id?: string
          instructor_id?: string | null
          location_id?: string | null
          max_capacity?: number | null
          recurring_pattern?: Json | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "certification_requirements"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_completion_summary"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "course_schedules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_schedules_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "course_schedules_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "course_schedules_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_schedules_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      course_type_certification_levels: {
        Row: {
          certification_level_id: string
          course_type_id: string
          created_at: string
          id: string
        }
        Insert: {
          certification_level_id: string
          course_type_id: string
          created_at?: string
          id?: string
        }
        Update: {
          certification_level_id?: string
          course_type_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_type_certification_levels_certification_level_id_fkey"
            columns: ["certification_level_id"]
            isOneToOne: false
            referencedRelation: "certification_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_type_certification_levels_course_type_id_fkey"
            columns: ["course_type_id"]
            isOneToOne: false
            referencedRelation: "course_types"
            referencedColumns: ["id"]
          },
        ]
      }
      course_types: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          assessment_type_id: string | null
          auto_notifications: boolean | null
          capacity: number | null
          course_type_id: string | null
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
          assessment_type_id?: string | null
          auto_notifications?: boolean | null
          capacity?: number | null
          course_type_id?: string | null
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
          assessment_type_id?: string | null
          auto_notifications?: boolean | null
          capacity?: number | null
          course_type_id?: string | null
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
            foreignKeyName: "courses_assessment_type_id_fkey"
            columns: ["assessment_type_id"]
            isOneToOne: false
            referencedRelation: "assessment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_course_type_id_fkey"
            columns: ["course_type_id"]
            isOneToOne: false
            referencedRelation: "course_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "courses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_accounts: {
        Row: {
          account_name: string
          account_status: string | null
          account_type: string | null
          annual_revenue: number | null
          assigned_to: string | null
          billing_address: string | null
          billing_city: string | null
          billing_country: string | null
          billing_postal_code: string | null
          billing_state: string | null
          company_size: string | null
          converted_from_lead_id: string | null
          created_at: string | null
          created_by: string | null
          fax: string | null
          id: string
          industry: string | null
          last_activity_date: string | null
          notes: string | null
          parent_account_id: string | null
          phone: string | null
          primary_contact_id: string | null
          shipping_address: string | null
          shipping_city: string | null
          shipping_country: string | null
          shipping_postal_code: string | null
          shipping_state: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          account_name: string
          account_status?: string | null
          account_type?: string | null
          annual_revenue?: number | null
          assigned_to?: string | null
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          company_size?: string | null
          converted_from_lead_id?: string | null
          created_at?: string | null
          created_by?: string | null
          fax?: string | null
          id?: string
          industry?: string | null
          last_activity_date?: string | null
          notes?: string | null
          parent_account_id?: string | null
          phone?: string | null
          primary_contact_id?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          account_name?: string
          account_status?: string | null
          account_type?: string | null
          annual_revenue?: number | null
          assigned_to?: string | null
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          company_size?: string | null
          converted_from_lead_id?: string | null
          created_at?: string | null
          created_by?: string | null
          fax?: string | null
          id?: string
          industry?: string | null
          last_activity_date?: string | null
          notes?: string | null
          parent_account_id?: string | null
          phone?: string | null
          primary_contact_id?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_accounts_primary_contact_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          activity_date: string | null
          activity_type: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          lead_id: string | null
          opportunity_id: string | null
          outcome: string | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          activity_date?: string | null
          activity_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          opportunity_id?: string | null
          outcome?: string | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          activity_date?: string | null
          activity_type?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          opportunity_id?: string | null
          outcome?: string | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_analytics_cache: {
        Row: {
          cache_data: Json
          cache_key: string
          created_at: string | null
          expires_at: string
          id: string
        }
        Insert: {
          cache_data: Json
          cache_key: string
          created_at?: string | null
          expires_at: string
          id?: string
        }
        Update: {
          cache_data?: Json
          cache_key?: string
          created_at?: string | null
          expires_at?: string
          id?: string
        }
        Relationships: []
      }
      crm_assignment_rules: {
        Row: {
          assigned_user_id: string | null
          assignment_type: string | null
          created_at: string | null
          criteria: Json
          id: string
          is_active: boolean | null
          priority: number | null
          rule_description: string | null
          rule_name: string
          updated_at: string | null
        }
        Insert: {
          assigned_user_id?: string | null
          assignment_type?: string | null
          created_at?: string | null
          criteria: Json
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_description?: string | null
          rule_name: string
          updated_at?: string | null
        }
        Update: {
          assigned_user_id?: string | null
          assignment_type?: string | null
          created_at?: string | null
          criteria?: Json
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_description?: string | null
          rule_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_contacts: {
        Row: {
          account_id: string | null
          contact_status: string | null
          converted_from_lead_id: string | null
          created_at: string | null
          created_by: string | null
          department: string | null
          do_not_call: boolean | null
          do_not_email: boolean | null
          email: string
          first_name: string | null
          id: string
          last_activity_date: string | null
          last_name: string | null
          lead_source: string | null
          mobile_phone: string | null
          notes: string | null
          phone: string | null
          preferred_contact_method: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          contact_status?: string | null
          converted_from_lead_id?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          do_not_call?: boolean | null
          do_not_email?: boolean | null
          email: string
          first_name?: string | null
          id?: string
          last_activity_date?: string | null
          last_name?: string | null
          lead_source?: string | null
          mobile_phone?: string | null
          notes?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          contact_status?: string | null
          converted_from_lead_id?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          do_not_call?: boolean | null
          do_not_email?: boolean | null
          email?: string
          first_name?: string | null
          id?: string
          last_activity_date?: string | null
          last_name?: string | null
          lead_source?: string | null
          mobile_phone?: string | null
          notes?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_account_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_conversion_audit: {
        Row: {
          after_data: Json
          before_data: Json
          conversion_date: string | null
          conversion_options: Json | null
          conversion_type: string
          converted_by: string
          created_entities: Json
          error_details: string | null
          id: string
          lead_id: string
          notes: string | null
          success: boolean | null
        }
        Insert: {
          after_data: Json
          before_data: Json
          conversion_date?: string | null
          conversion_options?: Json | null
          conversion_type: string
          converted_by: string
          created_entities: Json
          error_details?: string | null
          id?: string
          lead_id: string
          notes?: string | null
          success?: boolean | null
        }
        Update: {
          after_data?: Json
          before_data?: Json
          conversion_date?: string | null
          conversion_options?: Json | null
          conversion_type?: string
          converted_by?: string
          created_entities?: Json
          error_details?: string | null
          id?: string
          lead_id?: string
          notes?: string | null
          success?: boolean | null
        }
        Relationships: []
      }
      crm_conversion_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          priority: number | null
          rule_description: string | null
          rule_name: string
          updated_at: string | null
        }
        Insert: {
          actions: Json
          conditions: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_description?: string | null
          rule_name: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_description?: string | null
          rule_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_email_campaigns: {
        Row: {
          bounced_count: number | null
          campaign_cost: number | null
          campaign_name: string
          campaign_type: string | null
          clicked_count: number | null
          created_at: string | null
          created_by: string | null
          delivered_count: number | null
          email_content: string | null
          id: string
          leads_generated: number | null
          opened_count: number | null
          revenue_attributed: number | null
          scheduled_date: string | null
          sent_date: string | null
          status: string | null
          subject_line: string | null
          target_audience: string | null
          total_recipients: number | null
          unsubscribed_count: number | null
          updated_at: string | null
        }
        Insert: {
          bounced_count?: number | null
          campaign_cost?: number | null
          campaign_name: string
          campaign_type?: string | null
          clicked_count?: number | null
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          email_content?: string | null
          id?: string
          leads_generated?: number | null
          opened_count?: number | null
          revenue_attributed?: number | null
          scheduled_date?: string | null
          sent_date?: string | null
          status?: string | null
          subject_line?: string | null
          target_audience?: string | null
          total_recipients?: number | null
          unsubscribed_count?: number | null
          updated_at?: string | null
        }
        Update: {
          bounced_count?: number | null
          campaign_cost?: number | null
          campaign_name?: string
          campaign_type?: string | null
          clicked_count?: number | null
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          email_content?: string | null
          id?: string
          leads_generated?: number | null
          opened_count?: number | null
          revenue_attributed?: number | null
          scheduled_date?: string | null
          sent_date?: string | null
          status?: string | null
          subject_line?: string | null
          target_audience?: string | null
          total_recipients?: number | null
          unsubscribed_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_lead_scoring_rules: {
        Row: {
          created_at: string | null
          field_name: string
          field_value: string
          id: string
          is_active: boolean | null
          operator: string
          rule_description: string | null
          rule_name: string
          score_points: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          field_name: string
          field_value: string
          id?: string
          is_active?: boolean | null
          operator: string
          rule_description?: string | null
          rule_name: string
          score_points: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          field_name?: string
          field_value?: string
          id?: string
          is_active?: boolean | null
          operator?: string
          rule_description?: string | null
          rule_name?: string
          score_points?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_leads: {
        Row: {
          assigned_to: string | null
          company_name: string | null
          created_at: string | null
          created_by: string | null
          email: string
          first_name: string | null
          id: string
          job_title: string | null
          last_contact_date: string | null
          last_name: string | null
          lead_score: number | null
          lead_source: string | null
          lead_status: string | null
          lead_type: string | null
          phone: string | null
          qualification_notes: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          email: string
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_contact_date?: string | null
          last_name?: string | null
          lead_score?: number | null
          lead_source?: string | null
          lead_status?: string | null
          lead_type?: string | null
          phone?: string | null
          qualification_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          first_name?: string | null
          id?: string
          job_title?: string | null
          last_contact_date?: string | null
          last_name?: string | null
          lead_score?: number | null
          lead_source?: string | null
          lead_status?: string | null
          lead_type?: string | null
          phone?: string | null
          qualification_notes?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_opportunities: {
        Row: {
          assigned_to: string | null
          close_date: string | null
          created_at: string | null
          created_by: string | null
          estimated_value: number | null
          expected_close_date: string | null
          id: string
          lead_id: string | null
          next_steps: string | null
          opportunity_name: string
          opportunity_status: string | null
          opportunity_type: string | null
          pipeline_stage_id: string | null
          preferred_ap_id: string | null
          probability: number | null
          stage: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          close_date?: string | null
          created_at?: string | null
          created_by?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          next_steps?: string | null
          opportunity_name: string
          opportunity_status?: string | null
          opportunity_type?: string | null
          pipeline_stage_id?: string | null
          preferred_ap_id?: string | null
          probability?: number | null
          stage?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          close_date?: string | null
          created_at?: string | null
          created_by?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          next_steps?: string | null
          opportunity_name?: string
          opportunity_status?: string | null
          opportunity_type?: string | null
          pipeline_stage_id?: string | null
          preferred_ap_id?: string | null
          probability?: number | null
          stage?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_opportunities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipeline_stages: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          required_fields: string[] | null
          stage_color: string | null
          stage_description: string | null
          stage_name: string
          stage_order: number
          stage_probability: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          required_fields?: string[] | null
          stage_color?: string | null
          stage_description?: string | null
          stage_name: string
          stage_order: number
          stage_probability?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          required_fields?: string[] | null
          stage_color?: string | null
          stage_description?: string | null
          stage_name?: string
          stage_order?: number
          stage_probability?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_revenue_records: {
        Row: {
          amount: number
          ap_location_id: string | null
          certificate_count: number | null
          commission_amount: number | null
          commission_rate: number | null
          created_at: string | null
          id: string
          opportunity_id: string | null
          participant_count: number | null
          revenue_date: string
          revenue_type: string | null
          sales_rep_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          ap_location_id?: string | null
          certificate_count?: number | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          opportunity_id?: string | null
          participant_count?: number | null
          revenue_date: string
          revenue_type?: string | null
          sales_rep_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          ap_location_id?: string | null
          certificate_count?: number | null
          commission_amount?: number | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          opportunity_id?: string | null
          participant_count?: number | null
          revenue_date?: string
          revenue_type?: string | null
          sales_rep_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_revenue_records_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_stage_transitions: {
        Row: {
          created_at: string | null
          from_stage: string | null
          id: string
          notes: string | null
          opportunity_id: string
          probability_change: number | null
          to_stage: string
          transition_date: string | null
          transition_reason: string | null
          user_id: string | null
          value_change: number | null
        }
        Insert: {
          created_at?: string | null
          from_stage?: string | null
          id?: string
          notes?: string | null
          opportunity_id: string
          probability_change?: number | null
          to_stage: string
          transition_date?: string | null
          transition_reason?: string | null
          user_id?: string | null
          value_change?: number | null
        }
        Update: {
          created_at?: string | null
          from_stage?: string | null
          id?: string
          notes?: string | null
          opportunity_id?: string
          probability_change?: number | null
          to_stage?: string
          transition_date?: string | null
          transition_reason?: string | null
          user_id?: string | null
          value_change?: number | null
        }
        Relationships: []
      }
      crm_tasks: {
        Row: {
          assigned_to: string | null
          completed_date: string | null
          created_at: string | null
          created_by: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          notes: string | null
          opportunity_id: string | null
          priority: string | null
          status: string | null
          tags: string[] | null
          task_description: string | null
          task_title: string
          task_type: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_date?: string | null
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          opportunity_id?: string | null
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          task_description?: string | null
          task_title: string
          task_type?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_date?: string | null
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          opportunity_id?: string | null
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          task_description?: string | null
          task_title?: string
          task_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_trigger_log: {
        Row: {
          actions_executed: Json | null
          error_details: string | null
          executed_at: string | null
          id: string
          lead_id: string | null
          results: Json | null
          rule_id: string | null
          rule_name: string | null
          success: boolean | null
          trigger_type: string
        }
        Insert: {
          actions_executed?: Json | null
          error_details?: string | null
          executed_at?: string | null
          id?: string
          lead_id?: string | null
          results?: Json | null
          rule_id?: string | null
          rule_name?: string | null
          success?: boolean | null
          trigger_type: string
        }
        Update: {
          actions_executed?: Json | null
          error_details?: string | null
          executed_at?: string | null
          id?: string
          lead_id?: string | null
          results?: Json | null
          rule_id?: string | null
          rule_name?: string | null
          success?: boolean | null
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_trigger_log_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "crm_conversion_rules"
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
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "document_submissions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
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
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "document_submissions_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
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
      email_batch_operations: {
        Row: {
          batch_name: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          failed_emails: number
          id: string
          is_visible: boolean | null
          processed_certificates: number
          status: string
          successful_emails: number
          total_certificates: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          batch_name?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          failed_emails?: number
          id?: string
          is_visible?: boolean | null
          processed_certificates?: number
          status?: string
          successful_emails?: number
          total_certificates?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          batch_name?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          failed_emails?: number
          id?: string
          is_visible?: boolean | null
          processed_certificates?: number
          status?: string
          successful_emails?: number
          total_certificates?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      instructor_certifications: {
        Row: {
          certification_name: string
          certification_number: string | null
          certification_type: string
          created_at: string
          expiry_date: string
          id: string
          instructor_id: string
          issue_date: string
          issuing_authority: string | null
          status: string
          updated_at: string
        }
        Insert: {
          certification_name: string
          certification_number?: string | null
          certification_type: string
          created_at?: string
          expiry_date: string
          id?: string
          instructor_id: string
          issue_date: string
          issuing_authority?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          certification_name?: string
          certification_number?: string | null
          certification_type?: string
          created_at?: string
          expiry_date?: string
          id?: string
          instructor_id?: string
          issue_date?: string
          issuing_authority?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_certifications_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "instructor_certifications_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "instructor_certifications_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_compliance_checks: {
        Row: {
          check_date: string | null
          check_type: string
          checked_by: string | null
          created_at: string | null
          due_date: string | null
          id: string
          instructor_id: string | null
          notes: string | null
          resolved_at: string | null
          score: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          check_date?: string | null
          check_type: string
          checked_by?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          instructor_id?: string | null
          notes?: string | null
          resolved_at?: string | null
          score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          check_date?: string | null
          check_type?: string
          checked_by?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          instructor_id?: string | null
          notes?: string | null
          resolved_at?: string | null
          score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_compliance_checks_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "instructor_compliance_checks_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "instructor_compliance_checks_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instructor_compliance_checks_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "instructor_compliance_checks_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "instructor_compliance_checks_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instructors: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          metadata: Json | null
          provider_id: number
          role: string
          specializations: Json | null
          start_date: string | null
          status: string
          supervisor_id: string | null
          teaching_hours: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          provider_id: number
          role?: string
          specializations?: Json | null
          start_date?: string | null
          status?: string
          supervisor_id?: string | null
          teaching_hours?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          provider_id?: number
          role?: string
          specializations?: Json | null
          start_date?: string | null
          status?: string
          supervisor_id?: string | null
          teaching_hours?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructors_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "authorized_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      location_email_templates: {
        Row: {
          body_template: string
          created_at: string
          id: string
          is_default: boolean
          location_id: string
          name: string
          subject_template: string
          updated_at: string
        }
        Insert: {
          body_template: string
          created_at?: string
          id?: string
          is_default?: boolean
          location_id: string
          name: string
          subject_template?: string
          updated_at?: string
        }
        Update: {
          body_template?: string
          created_at?: string
          id?: string
          is_default?: boolean
          location_id?: string
          name?: string
          subject_template?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_email_templates_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
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
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          state: string | null
          status: string
          updated_at: string
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      notification_badges: {
        Row: {
          badge_count: number
          id: string
          last_updated: string | null
          page_path: string
          user_id: string
        }
        Insert: {
          badge_count?: number
          id?: string
          last_updated?: string | null
          page_path: string
          user_id: string
        }
        Update: {
          badge_count?: number
          id?: string
          last_updated?: string | null
          page_path?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_digests: {
        Row: {
          created_at: string | null
          digest_type: string
          id: string
          is_enabled: boolean | null
          last_sent_at: string | null
          next_scheduled_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          digest_type: string
          id?: string
          is_enabled?: boolean | null
          last_sent_at?: string | null
          next_scheduled_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          digest_type?: string
          id?: string
          is_enabled?: boolean | null
          last_sent_at?: string | null
          next_scheduled_at?: string | null
          updated_at?: string | null
          user_id?: string
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
          notification_type_id: string | null
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
          notification_type_id?: string | null
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
          notification_type_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_notification_type_id_fkey"
            columns: ["notification_type_id"]
            isOneToOne: false
            referencedRelation: "notification_types"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_queue: {
        Row: {
          category: string | null
          created_at: string
          error: string | null
          id: string
          notification_id: string
          priority: string | null
          processed_at: string | null
          status: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          error?: string | null
          id?: string
          notification_id: string
          priority?: string | null
          processed_at?: string | null
          status?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          error?: string | null
          id?: string
          notification_id?: string
          priority?: string | null
          processed_at?: string | null
          status?: string
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
      notification_types: {
        Row: {
          category: string
          created_at: string | null
          default_priority: string
          description: string | null
          display_name: string
          icon: string | null
          id: string
          requires_email: boolean
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          default_priority?: string
          description?: string | null
          display_name: string
          icon?: string | null
          id: string
          requires_email?: boolean
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          default_priority?: string
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          requires_email?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          badge_count: number | null
          category: string
          created_at: string
          id: string
          is_dismissed: boolean | null
          message: string
          metadata: Json | null
          priority: string
          read: boolean
          read_at: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          badge_count?: number | null
          category?: string
          created_at?: string
          id?: string
          is_dismissed?: boolean | null
          message: string
          metadata?: Json | null
          priority?: string
          read?: boolean
          read_at?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          badge_count?: number | null
          category?: string
          created_at?: string
          id?: string
          is_dismissed?: boolean | null
          message?: string
          metadata?: Json | null
          priority?: string
          read?: boolean
          read_at?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
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
          job_title: string | null
          organization: string | null
          phone: string | null
          role: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          compliance_status?: boolean | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          job_title?: string | null
          organization?: string | null
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          compliance_status?: boolean | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          job_title?: string | null
          organization?: string | null
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_duplicate: {
        Row: {
          compliance_status: boolean | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          job_title: string | null
          organization: string | null
          phone: string | null
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
          job_title?: string | null
          organization?: string | null
          phone?: string | null
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
          job_title?: string | null
          organization?: string | null
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      progression_history: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          evaluation_score: number | null
          from_role: string
          id: string
          requirements_met: Json | null
          status: string | null
          to_role: string
          trigger_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          evaluation_score?: number | null
          from_role: string
          id?: string
          requirements_met?: Json | null
          status?: string | null
          to_role: string
          trigger_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          evaluation_score?: number | null
          from_role?: string
          id?: string
          requirements_met?: Json | null
          status?: string | null
          to_role?: string
          trigger_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progression_history_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "progression_history_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "progression_history_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progression_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "progression_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "progression_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      progression_triggers: {
        Row: {
          approval_required: boolean | null
          automation_rules: Json
          created_at: string | null
          from_role: string
          id: string
          min_hours_required: number | null
          required_assessments: string[] | null
          required_courses: string[] | null
          to_role: string
          updated_at: string | null
        }
        Insert: {
          approval_required?: boolean | null
          automation_rules: Json
          created_at?: string | null
          from_role: string
          id?: string
          min_hours_required?: number | null
          required_assessments?: string[] | null
          required_courses?: string[] | null
          to_role: string
          updated_at?: string | null
        }
        Update: {
          approval_required?: boolean | null
          automation_rules?: Json
          created_at?: string | null
          from_role?: string
          id?: string
          min_hours_required?: number | null
          required_assessments?: string[] | null
          required_courses?: string[] | null
          to_role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      provider_navigation_configs: {
        Row: {
          config_overrides: Json
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          provider_id: number | null
          updated_at: string | null
        }
        Insert: {
          config_overrides?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          provider_id?: number | null
          updated_at?: string | null
        }
        Update: {
          config_overrides?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          provider_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_navigation_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "provider_navigation_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "provider_navigation_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_navigation_configs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "authorized_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_performance: {
        Row: {
          certificates_issued: number | null
          compliance_score: number | null
          courses_conducted: number | null
          created_at: string | null
          id: string
          location_id: string | null
          performance_period: string
          provider_id: number | null
          recorded_date: string | null
          revenue_generated: number | null
          student_satisfaction_score: number | null
          team_id: string | null
        }
        Insert: {
          certificates_issued?: number | null
          compliance_score?: number | null
          courses_conducted?: number | null
          created_at?: string | null
          id?: string
          location_id?: string | null
          performance_period: string
          provider_id?: number | null
          recorded_date?: string | null
          revenue_generated?: number | null
          student_satisfaction_score?: number | null
          team_id?: string | null
        }
        Update: {
          certificates_issued?: number | null
          compliance_score?: number | null
          courses_conducted?: number | null
          created_at?: string | null
          id?: string
          location_id?: string | null
          performance_period?: string
          provider_id?: number | null
          recorded_date?: string | null
          revenue_generated?: number | null
          student_satisfaction_score?: number | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_performance_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_performance_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "authorized_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_performance_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_team_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assignment_role: string
          created_at: string | null
          id: string
          oversight_level: string | null
          provider_id: number | null
          status: string | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_role: string
          created_at?: string | null
          id?: string
          oversight_level?: string | null
          provider_id?: number | null
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_role?: string
          created_at?: string | null
          id?: string
          oversight_level?: string | null
          provider_id?: number | null
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_provider_team_assignments_assigned_by"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_provider_team_assignments_assigned_by"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_provider_team_assignments_assigned_by"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_provider_team_assignments_provider_id"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "authorized_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_provider_team_assignments_team_id"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_team_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "provider_team_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "provider_team_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_team_assignments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "authorized_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_team_assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
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
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "role_audit_submissions_auditor_id_fkey"
            columns: ["auditor_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
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
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "role_audit_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
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
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "role_transition_requests_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
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
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "role_transition_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
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
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "role_video_submissions_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
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
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "role_video_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
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
      roster_uploads: {
        Row: {
          course_name: string
          created_at: string | null
          expiry_date: string
          failed_records: number | null
          id: string
          issue_date: string
          name: string
          processed_records: number | null
          status: string | null
          successful_records: number | null
          total_records: number | null
          updated_at: string | null
          uploaded_by: string
        }
        Insert: {
          course_name: string
          created_at?: string | null
          expiry_date: string
          failed_records?: number | null
          id?: string
          issue_date: string
          name: string
          processed_records?: number | null
          status?: string | null
          successful_records?: number | null
          total_records?: number | null
          updated_at?: string | null
          uploaded_by: string
        }
        Update: {
          course_name?: string
          created_at?: string | null
          expiry_date?: string
          failed_records?: number | null
          id?: string
          issue_date?: string
          name?: string
          processed_records?: number | null
          status?: string | null
          successful_records?: number | null
          total_records?: number | null
          updated_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_uploads_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "roster_uploads_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "roster_uploads_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rosters: {
        Row: {
          certificate_count: number | null
          course_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          instructor_name: string | null
          issue_date: string | null
          location_id: string | null
          metadata: Json | null
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          certificate_count?: number | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          instructor_name?: string | null
          issue_date?: string | null
          location_id?: string | null
          metadata?: Json | null
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          certificate_count?: number | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          instructor_name?: string | null
          issue_date?: string | null
          location_id?: string | null
          metadata?: Json | null
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rosters_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "certification_requirements"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "rosters_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_completion_summary"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "rosters_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rosters_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string | null
          event_data: Json
          event_type: string
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data: Json
          event_type: string
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "security_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "security_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session_attendance: {
        Row: {
          arrival_time: string | null
          attendance_status: string | null
          created_at: string | null
          departure_time: string | null
          id: string
          notes: string | null
          recorded_by: string | null
          student_id: string | null
          teaching_session_id: string | null
          updated_at: string | null
        }
        Insert: {
          arrival_time?: string | null
          attendance_status?: string | null
          created_at?: string | null
          departure_time?: string | null
          id?: string
          notes?: string | null
          recorded_by?: string | null
          student_id?: string | null
          teaching_session_id?: string | null
          updated_at?: string | null
        }
        Update: {
          arrival_time?: string | null
          attendance_status?: string | null
          created_at?: string | null
          departure_time?: string | null
          id?: string
          notes?: string | null
          recorded_by?: string | null
          student_id?: string | null
          teaching_session_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "session_attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "session_attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "session_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "session_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendance_teaching_session_id_fkey"
            columns: ["teaching_session_id"]
            isOneToOne: false
            referencedRelation: "evaluable_teaching_sessions"
            referencedColumns: ["teaching_session_id"]
          },
          {
            foreignKeyName: "session_attendance_teaching_session_id_fkey"
            columns: ["teaching_session_id"]
            isOneToOne: false
            referencedRelation: "teaching_sessions"
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
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "supervision_relationships_supervisee_id_fkey"
            columns: ["supervisee_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
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
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "supervision_relationships_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
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
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "supervisor_evaluations_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
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
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "supervisor_evaluations_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
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
      system_configurations: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          data_type: string
          description: string | null
          id: string
          is_public: boolean | null
          key: string
          requires_restart: boolean | null
          updated_at: string | null
          validation_rules: Json | null
          value: Json
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          data_type: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          key: string
          requires_restart?: boolean | null
          updated_at?: string | null
          validation_rules?: Json | null
          value: Json
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          data_type?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          key?: string
          requires_restart?: boolean | null
          updated_at?: string | null
          validation_rules?: Json | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_configurations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "system_configurations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "system_configurations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_events: {
        Row: {
          affected_users: number | null
          created_at: string | null
          event_category: string | null
          event_data: Json | null
          event_description: string | null
          event_type: string
          id: string
          resolved: boolean | null
          resolved_at: string | null
          severity: string | null
          source_component: string | null
        }
        Insert: {
          affected_users?: number | null
          created_at?: string | null
          event_category?: string | null
          event_data?: Json | null
          event_description?: string | null
          event_type: string
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string | null
          source_component?: string | null
        }
        Update: {
          affected_users?: number | null
          created_at?: string | null
          event_category?: string | null
          event_data?: Json | null
          event_description?: string | null
          event_type?: string
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string | null
          source_component?: string | null
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          created_at: string | null
          id: string
          measurement_date: string | null
          metadata: Json | null
          metric_category: string | null
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          measurement_date?: string | null
          metadata?: Json | null
          metric_category?: string | null
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          measurement_date?: string | null
          metadata?: Json | null
          metric_category?: string | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
        }
        Relationships: []
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
      teaching_logs: {
        Row: {
          course_id: string
          created_at: string
          hours: number
          id: string
          instructor_id: string
          notes: string | null
          session_date: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          hours?: number
          id?: string
          instructor_id: string
          notes?: string | null
          session_date: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          hours?: number
          id?: string
          instructor_id?: string
          notes?: string | null
          session_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teaching_logs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "certification_requirements"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "teaching_logs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_completion_summary"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "teaching_logs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaching_logs_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "teaching_logs_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "teaching_logs_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teaching_sessions: {
        Row: {
          assessment_conducted: boolean | null
          attendance_count: number | null
          attendees: string[] | null
          completion_status: string
          compliance_status: string | null
          course_id: string
          course_schedule_id: string | null
          created_at: string
          duration_minutes: number | null
          hours_taught: number
          id: string
          instructor_id: string
          materials_used: Json | null
          notes: string | null
          session_date: string
          session_notes: string | null
          teaching_hours_credit: number | null
          updated_at: string
        }
        Insert: {
          assessment_conducted?: boolean | null
          attendance_count?: number | null
          attendees?: string[] | null
          completion_status?: string
          compliance_status?: string | null
          course_id: string
          course_schedule_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          hours_taught: number
          id?: string
          instructor_id: string
          materials_used?: Json | null
          notes?: string | null
          session_date: string
          session_notes?: string | null
          teaching_hours_credit?: number | null
          updated_at?: string
        }
        Update: {
          assessment_conducted?: boolean | null
          attendance_count?: number | null
          attendees?: string[] | null
          completion_status?: string
          compliance_status?: string | null
          course_id?: string
          course_schedule_id?: string | null
          created_at?: string
          duration_minutes?: number | null
          hours_taught?: number
          id?: string
          instructor_id?: string
          materials_used?: Json | null
          notes?: string | null
          session_date?: string
          session_notes?: string | null
          teaching_hours_credit?: number | null
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
            foreignKeyName: "teaching_sessions_course_schedule_id_fkey"
            columns: ["course_schedule_id"]
            isOneToOne: false
            referencedRelation: "course_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaching_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "teaching_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
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
      team_location_assignments: {
        Row: {
          assignment_type: string | null
          created_at: string | null
          end_date: string | null
          id: string
          location_id: string | null
          start_date: string | null
          team_id: string | null
        }
        Insert: {
          assignment_type?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          location_id?: string | null
          start_date?: string | null
          team_id?: string | null
        }
        Update: {
          assignment_type?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          location_id?: string | null
          start_date?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_team_location_assignments_location_id"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_team_location_assignments_team_id"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_location_assignments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_location_assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          assignment_end_date: string | null
          assignment_start_date: string | null
          created_at: string | null
          id: string
          location_assignment: string | null
          permissions: Json | null
          role: string
          team_id: string
          team_position: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assignment_end_date?: string | null
          assignment_start_date?: string | null
          created_at?: string | null
          id?: string
          location_assignment?: string | null
          permissions?: Json | null
          role?: string
          team_id: string
          team_position?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assignment_end_date?: string | null
          assignment_start_date?: string | null
          created_at?: string | null
          id?: string
          location_assignment?: string | null
          permissions?: Json | null
          role?: string
          team_id?: string
          team_position?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_team_members_location_assignment"
            columns: ["location_assignment"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_team_members_team_id"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_team_members_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_team_members_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_team_members_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_location_assignment_fkey"
            columns: ["location_assignment"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_navigation_configs: {
        Row: {
          config_overrides: Json
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          role_type: string
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          config_overrides?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          role_type: string
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          config_overrides?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          role_type?: string
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_navigation_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_navigation_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_navigation_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_navigation_configs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_performance_metrics: {
        Row: {
          id: string
          location_id: string | null
          metadata: Json | null
          metric_period: string
          metric_type: string
          metric_value: number
          recorded_by: string | null
          recorded_date: string | null
          team_id: string | null
        }
        Insert: {
          id?: string
          location_id?: string | null
          metadata?: Json | null
          metric_period: string
          metric_type: string
          metric_value: number
          recorded_by?: string | null
          recorded_date?: string | null
          team_id?: string | null
        }
        Update: {
          id?: string
          location_id?: string | null
          metadata?: Json | null
          metric_period?: string
          metric_type?: string
          metric_value?: number
          recorded_by?: string | null
          recorded_date?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_team_performance_metrics_location_id"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_team_performance_metrics_recorded_by"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_team_performance_metrics_recorded_by"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_team_performance_metrics_recorded_by"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_team_performance_metrics_team_id"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_performance_metrics_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_performance_metrics_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_performance_metrics_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_performance_metrics_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_performance_metrics_team_id_fkey"
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
          current_metrics: Json | null
          description: string | null
          id: string
          location_id: string | null
          metadata: Json | null
          monthly_targets: Json | null
          name: string
          parent_id: string | null
          performance_score: number | null
          provider_id: number | null
          status: string | null
          team_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          current_metrics?: Json | null
          description?: string | null
          id?: string
          location_id?: string | null
          metadata?: Json | null
          monthly_targets?: Json | null
          name: string
          parent_id?: string | null
          performance_score?: number | null
          provider_id?: number | null
          status?: string | null
          team_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_metrics?: Json | null
          description?: string | null
          id?: string
          location_id?: string | null
          metadata?: Json | null
          monthly_targets?: Json | null
          name?: string
          parent_id?: string | null
          performance_score?: number | null
          provider_id?: number | null
          status?: string | null
          team_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_teams_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_teams_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_teams_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_teams_location_id"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_teams_parent_id"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_teams_provider_id"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "authorized_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "authorized_providers"
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
      user_activity_metrics: {
        Row: {
          actions_performed: number | null
          activity_count: number | null
          activity_date: string | null
          activity_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          pages_visited: number | null
          session_duration_minutes: number | null
          user_id: string | null
        }
        Insert: {
          actions_performed?: number | null
          activity_count?: number | null
          activity_date?: string | null
          activity_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          pages_visited?: number | null
          session_duration_minutes?: number | null
          user_id?: string | null
        }
        Update: {
          actions_performed?: number | null
          activity_count?: number | null
          activity_date?: string | null
          activity_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          pages_visited?: number | null
          session_duration_minutes?: number | null
          user_id?: string | null
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
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "user_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
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
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          password: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          password: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          password?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          integration_id: string | null
          next_retry_at: string | null
          payload: Json
          response_body: string | null
          response_status: number | null
          retry_count: number | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          integration_id?: string | null
          next_retry_at?: string | null
          payload: Json
          response_body?: string | null
          response_status?: number | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          integration_id?: string | null
          next_retry_at?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "api_integrations"
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
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "supervision_relationships_supervisee_id_fkey"
            columns: ["supervisee_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
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
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "supervision_relationships_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
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
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "supervision_relationships_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
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
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "teaching_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
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
      crm_conversion_analytics: {
        Row: {
          accounts_created: number | null
          avg_days_to_convert: number | null
          contacts_created: number | null
          failed_conversions: number | null
          full_conversions: number | null
          month: string | null
          opportunities_created: number | null
          total_conversions: number | null
        }
        Relationships: []
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
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "teaching_sessions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
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
      instructor_teaching_load: {
        Row: {
          display_name: string | null
          instructor_id: string | null
          month_year: string | null
          role: string | null
          total_hours_credit: number | null
          total_minutes: number | null
          total_sessions: number | null
        }
        Relationships: []
      }
      instructor_workload_summary: {
        Row: {
          compliance_percentage: number | null
          display_name: string | null
          hours_this_month: number | null
          instructor_id: string | null
          role: string | null
          sessions_this_month: number | null
          total_hours_all_time: number | null
          total_sessions_all_time: number | null
        }
        Relationships: []
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
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "supervision_relationships_supervisee_id_fkey"
            columns: ["supervisee_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
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
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "supervision_relationships_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
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
      assign_provider_to_team: {
        Args: {
          p_provider_id: number
          p_team_id: string
          p_assignment_role: string
          p_oversight_level: string
          p_assigned_by: string
        }
        Returns: string
      }
      auto_assign_lead: {
        Args: { lead_id: string }
        Returns: string
      }
      backup_configurations: {
        Args: Record<PropertyKey, never>
        Returns: {
          configuration_data: Json
        }[]
      }
      calculate_lead_score: {
        Args: { lead_id: string }
        Returns: number
      }
      calculate_teaching_hours_credit: {
        Args: { p_session_id: string }
        Returns: number
      }
      check_instructor_availability: {
        Args: {
          p_instructor_id: string
          p_start_time: string
          p_duration_minutes: number
        }
        Returns: boolean
      }
      check_lead_conversion_eligibility: {
        Args: { lead_uuid: string }
        Returns: {
          eligible: boolean
          errors: string[]
          warnings: string[]
        }[]
      }
      check_role_progression_eligibility: {
        Args: { user_id: string; target_role: string }
        Returns: boolean
      }
      check_schedule_conflicts: {
        Args: {
          p_instructor_id: string
          p_start_date: string
          p_end_date: string
          p_exclude_schedule_id?: string
        }
        Returns: {
          conflict_id: string
          conflict_start: string
          conflict_end: string
        }[]
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
      evaluate_progression_eligibility: {
        Args: { p_user_id: string; p_target_role: string }
        Returns: Json
      }
      execute_automation_rule: {
        Args: { p_rule_id: string }
        Returns: Json
      }
      fix_roster_certificate_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          fixed_roster_id: string
          old_count: number
          new_count: number
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
      get_certificate_status_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          status: string
          count: number
        }[]
      }
      get_certificate_trend_data: {
        Args: { p_days?: number; p_group_by?: string }
        Returns: {
          period_start: string
          total_certificates: number
          active_certificates: number
          growth_rate: number
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_monthly_certificate_counts: {
        Args: { months_limit?: number }
        Returns: {
          month: string
          count: number
        }[]
      }
      get_notification_badges: {
        Args: { p_user_id: string }
        Returns: {
          page_path: string
          badge_count: number
        }[]
      }
      get_pipeline_metrics: {
        Args: { pipeline_type_param?: string }
        Returns: {
          stage_name: string
          opportunity_count: number
          total_value: number
          avg_probability: number
        }[]
      }
      get_provider_location_kpis: {
        Args: { p_provider_id: number }
        Returns: {
          total_instructors: number
          active_instructors: number
          total_courses: number
          certificates_issued: number
          compliance_score: number
          performance_rating: number
        }[]
      }
      get_provider_location_teams: {
        Args: { p_provider_id: number }
        Returns: {
          team_id: string
          team_name: string
          team_description: string
          location_name: string
          member_count: number
          performance_score: number
        }[]
      }
      get_provider_team_assignments: {
        Args: { p_provider_id: number }
        Returns: {
          id: string
          provider_id: number
          team_id: string
          assignment_role: string
          oversight_level: string
          assigned_by: string
          assigned_at: string
          status: string
          team_name: string
          team_location: string
        }[]
      }
      get_revenue_metrics: {
        Args: { start_date?: string; end_date?: string }
        Returns: {
          total_revenue: number
          certificate_revenue: number
          corporate_revenue: number
          ap_setup_revenue: number
          transaction_count: number
        }[]
      }
      get_roster_statistics: {
        Args: { roster_id: string }
        Returns: {
          total_certificates: number
          active_certificates: number
          expired_certificates: number
          revoked_certificates: number
        }[]
      }
      get_team_performance_summary: {
        Args: { p_team_id: string; p_period?: string }
        Returns: {
          team_id: string
          location_name: string
          total_certificates: number
          total_courses: number
          avg_satisfaction: number
          compliance_score: number
          performance_trend: number
        }[]
      }
      get_top_certificate_courses: {
        Args: { limit_count?: number }
        Returns: {
          course_name: string
          count: number
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      is_team_admin: {
        Args: { team_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { team_uuid: string; user_uuid: string }
        Returns: boolean
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
      mark_page_notifications_as_read: {
        Args: { p_user_id: string; p_page_path: string }
        Returns: undefined
      }
      refresh_conversion_analytics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      safe_backfill_certificate_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_conversion_system: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      test_restored_crm_features: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      test_simple_crm_insert: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      validate_configuration_value: {
        Args: { p_data_type: string; p_value: Json; p_validation_rules?: Json }
        Returns: boolean
      }
      validate_roster_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          roster_id: string
          roster_name: string
          stored_count: number
          actual_count: number
          discrepancy: number
        }[]
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
