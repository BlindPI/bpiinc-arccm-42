export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
      alert_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          rule_name: string
          rule_type: string
          updated_at: string | null
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          rule_name: string
          rule_type: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          rule_name?: string
          rule_type?: string
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
      analytics_warehouse: {
        Row: {
          aggregation_level: string | null
          created_at: string | null
          dimensions: Json | null
          id: string
          metric_category: string
          metric_date: string
          metric_name: string
          metric_value: number
          updated_at: string | null
        }
        Insert: {
          aggregation_level?: string | null
          created_at?: string | null
          dimensions?: Json | null
          id?: string
          metric_category: string
          metric_date: string
          metric_name: string
          metric_value: number
          updated_at?: string | null
        }
        Update: {
          aggregation_level?: string | null
          created_at?: string | null
          dimensions?: Json | null
          id?: string
          metric_category?: string
          metric_date?: string
          metric_name?: string
          metric_value?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      ap_user_location_assignments: {
        Row: {
          ap_user_id: string
          assigned_at: string | null
          assigned_by: string | null
          assignment_role: string | null
          created_at: string | null
          end_date: string | null
          id: string
          location_id: string
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ap_user_id: string
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_role?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          location_id: string
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ap_user_id?: string
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_role?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          location_id?: string
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ap_user_location_assignments_ap_user_id_fkey"
            columns: ["ap_user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ap_user_location_assignments_ap_user_id_fkey"
            columns: ["ap_user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "ap_user_location_assignments_ap_user_id_fkey"
            columns: ["ap_user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "ap_user_location_assignments_ap_user_id_fkey"
            columns: ["ap_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_user_location_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ap_user_location_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "ap_user_location_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "ap_user_location_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap_user_location_assignments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
      approval_chains: {
        Row: {
          chain_name: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          steps: Json
          updated_at: string | null
          workflow_type: string
        }
        Insert: {
          chain_name: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          steps: Json
          updated_at?: string | null
          workflow_type: string
        }
        Update: {
          chain_name?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          steps?: Json
          updated_at?: string | null
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_chains_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "approval_chains_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "approval_chains_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "approval_chains_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          approval_history: Json | null
          chain_id: string | null
          created_at: string | null
          current_step: number | null
          id: string
          request_data: Json
          request_type: string
          requested_by: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approval_history?: Json | null
          chain_id?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          request_data: Json
          request_type: string
          requested_by: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approval_history?: Json | null
          chain_id?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          request_data?: Json
          request_type?: string
          requested_by?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "approval_chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "approval_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "approval_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "approval_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_workflows: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          steps: Json
          updated_at: string | null
          workflow_name: string
          workflow_type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          steps?: Json
          updated_at?: string | null
          workflow_name: string
          workflow_type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          steps?: Json
          updated_at?: string | null
          workflow_name?: string
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "approval_workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "approval_workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "approval_workflows_created_by_fkey"
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
      assignment_conflicts: {
        Row: {
          auto_resolvable: boolean | null
          conflict_description: string
          conflict_type: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          resolution_options: Json | null
          resolved_at: string | null
          severity: string
          suggested_resolution: string | null
          workflow_id: string
        }
        Insert: {
          auto_resolvable?: boolean | null
          conflict_description: string
          conflict_type: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          resolution_options?: Json | null
          resolved_at?: string | null
          severity: string
          suggested_resolution?: string | null
          workflow_id: string
        }
        Update: {
          auto_resolvable?: boolean | null
          conflict_description?: string
          conflict_type?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          resolution_options?: Json | null
          resolved_at?: string | null
          severity?: string
          suggested_resolution?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_conflicts_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "provider_assignment_workflows"
            referencedColumns: ["id"]
          },
        ]
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
      audit_trail: {
        Row: {
          action_performed: string
          after_state: Json | null
          before_state: Json | null
          change_summary: string | null
          compliance_flags: Json | null
          created_at: string | null
          entity_id: string
          entity_type: string
          event_type: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          risk_level: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_performed: string
          after_state?: Json | null
          before_state?: Json | null
          change_summary?: string | null
          compliance_flags?: Json | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          event_type: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_performed?: string
          after_state?: Json | null
          before_state?: Json | null
          change_summary?: string | null
          compliance_flags?: Json | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          event_type?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          risk_level?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_trail_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_trail_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "audit_trail_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "audit_trail_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      authorized_providers: {
        Row: {
          address: string | null
          approval_date: string | null
          approved_by: string | null
          assignment_type: string | null
          compliance_score: number | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          id: string
          location_id: string | null
          name: string
          performance_rating: number | null
          primary_location_id: string | null
          provider_name: string | null
          provider_type: string | null
          provider_url: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          approval_date?: string | null
          approved_by?: string | null
          assignment_type?: string | null
          compliance_score?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location_id?: string | null
          name: string
          performance_rating?: number | null
          primary_location_id?: string | null
          provider_name?: string | null
          provider_type?: string | null
          provider_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          approval_date?: string | null
          approved_by?: string | null
          assignment_type?: string | null
          compliance_score?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          location_id?: string | null
          name?: string
          performance_rating?: number | null
          primary_location_id?: string | null
          provider_name?: string | null
          provider_type?: string | null
          provider_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "authorized_providers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authorized_providers_primary_location_id_fkey"
            columns: ["primary_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authorized_providers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "authorized_providers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "authorized_providers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "authorized_providers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_authorized_providers_primary_location_id"
            columns: ["primary_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_authorized_providers_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_authorized_providers_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_authorized_providers_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_authorized_providers_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      authorized_providers_backup: {
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
          created_at: string | null
          description: string | null
          id: number | null
          logo_url: string | null
          metadata: Json | null
          name: string | null
          performance_rating: number | null
          primary_location_id: string | null
          provider_name: string | null
          provider_team_id: string | null
          provider_type: string | null
          provider_url: string | null
          specializations: Json | null
          status: string | null
          updated_at: string | null
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
          created_at?: string | null
          description?: string | null
          id?: number | null
          logo_url?: string | null
          metadata?: Json | null
          name?: string | null
          performance_rating?: number | null
          primary_location_id?: string | null
          provider_name?: string | null
          provider_team_id?: string | null
          provider_type?: string | null
          provider_url?: string | null
          specializations?: Json | null
          status?: string | null
          updated_at?: string | null
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
          created_at?: string | null
          description?: string | null
          id?: number | null
          logo_url?: string | null
          metadata?: Json | null
          name?: string | null
          performance_rating?: number | null
          primary_location_id?: string | null
          provider_name?: string | null
          provider_team_id?: string | null
          provider_type?: string | null
          provider_url?: string | null
          specializations?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      authorized_providers_backup_20250621: {
        Row: {
          address: string | null
          approval_date: string | null
          approved_by: string | null
          assignment_type: string | null
          compliance_score: number | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          id: string | null
          location_id: string | null
          name: string | null
          performance_rating: number | null
          primary_location_id: string | null
          provider_name: string | null
          provider_type: string | null
          provider_url: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          approval_date?: string | null
          approved_by?: string | null
          assignment_type?: string | null
          compliance_score?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          location_id?: string | null
          name?: string | null
          performance_rating?: number | null
          primary_location_id?: string | null
          provider_name?: string | null
          provider_type?: string | null
          provider_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          approval_date?: string | null
          approved_by?: string | null
          assignment_type?: string | null
          compliance_score?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          location_id?: string | null
          name?: string | null
          performance_rating?: number | null
          primary_location_id?: string | null
          provider_name?: string | null
          provider_type?: string | null
          provider_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
      availability_bookings: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          billable_hours: number | null
          booking_date: string
          booking_type: Database["public"]["Enums"]["booking_type"]
          bulk_operation_id: string | null
          course_id: string | null
          course_offering_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string
          hours_credited: number | null
          id: string
          requires_approval: boolean | null
          start_time: string
          status: string
          team_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_date?: string | null
          approved_by?: string | null
          billable_hours?: number | null
          booking_date: string
          booking_type: Database["public"]["Enums"]["booking_type"]
          bulk_operation_id?: string | null
          course_id?: string | null
          course_offering_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time: string
          hours_credited?: number | null
          id?: string
          requires_approval?: boolean | null
          start_time: string
          status?: string
          team_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_date?: string | null
          approved_by?: string | null
          billable_hours?: number | null
          booking_date?: string
          booking_type?: Database["public"]["Enums"]["booking_type"]
          bulk_operation_id?: string | null
          course_id?: string | null
          course_offering_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string
          hours_credited?: number | null
          id?: string
          requires_approval?: boolean | null
          start_time?: string
          status?: string
          team_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_bookings_bulk_operation_id_fkey"
            columns: ["bulk_operation_id"]
            isOneToOne: false
            referencedRelation: "bulk_operation_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_bookings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "certification_requirements"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "availability_bookings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "course_completion_summary"
            referencedColumns: ["course_id"]
          },
          {
            foreignKeyName: "availability_bookings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_bookings_course_offering_id_fkey"
            columns: ["course_offering_id"]
            isOneToOne: false
            referencedRelation: "course_offerings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "availability_bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "availability_bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "availability_bookings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_bookings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "availability_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "availability_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "availability_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_change_approvals: {
        Row: {
          approval_reason: string | null
          approval_status: string
          approved_by: string | null
          change_id: string
          created_at: string
          id: string
          processed_at: string | null
          requested_at: string
          requested_changes: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_reason?: string | null
          approval_status?: string
          approved_by?: string | null
          change_id: string
          created_at?: string
          id?: string
          processed_at?: string | null
          requested_at?: string
          requested_changes: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_reason?: string | null
          approval_status?: string
          approved_by?: string | null
          change_id?: string
          created_at?: string
          id?: string
          processed_at?: string | null
          requested_at?: string
          requested_changes?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      availability_exceptions: {
        Row: {
          availability_type: Database["public"]["Enums"]["availability_type"]
          created_at: string
          end_time: string | null
          exception_date: string
          id: string
          reason: string | null
          start_time: string | null
          user_id: string
        }
        Insert: {
          availability_type: Database["public"]["Enums"]["availability_type"]
          created_at?: string
          end_time?: string | null
          exception_date: string
          id?: string
          reason?: string | null
          start_time?: string | null
          user_id: string
        }
        Update: {
          availability_type?: Database["public"]["Enums"]["availability_type"]
          created_at?: string
          end_time?: string | null
          exception_date?: string
          id?: string
          reason?: string | null
          start_time?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_exceptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "availability_exceptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "availability_exceptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "availability_exceptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_permissions: {
        Row: {
          expires_at: string | null
          granted_at: string
          grantee_id: string
          grantor_id: string
          id: string
          is_active: boolean
          location_id: string | null
          permission_type: Database["public"]["Enums"]["permission_type"]
          target_user_id: string | null
          team_id: string | null
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string
          grantee_id: string
          grantor_id: string
          id?: string
          is_active?: boolean
          location_id?: string | null
          permission_type: Database["public"]["Enums"]["permission_type"]
          target_user_id?: string | null
          team_id?: string | null
        }
        Update: {
          expires_at?: string | null
          granted_at?: string
          grantee_id?: string
          grantor_id?: string
          id?: string
          is_active?: boolean
          location_id?: string | null
          permission_type?: Database["public"]["Enums"]["permission_type"]
          target_user_id?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_permissions_grantee_id_fkey"
            columns: ["grantee_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "availability_permissions_grantee_id_fkey"
            columns: ["grantee_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "availability_permissions_grantee_id_fkey"
            columns: ["grantee_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "availability_permissions_grantee_id_fkey"
            columns: ["grantee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_permissions_grantor_id_fkey"
            columns: ["grantor_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "availability_permissions_grantor_id_fkey"
            columns: ["grantor_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "availability_permissions_grantor_id_fkey"
            columns: ["grantor_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "availability_permissions_grantor_id_fkey"
            columns: ["grantor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_permissions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_permissions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "availability_permissions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "availability_permissions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "availability_permissions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_permissions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      backend_function_status: {
        Row: {
          alerts_enabled: boolean | null
          category: string | null
          created_at: string | null
          critical_function: boolean | null
          description: string | null
          error_message: string | null
          failed_calls: number | null
          function_name: string
          health_score: number | null
          id: string
          is_connected: boolean | null
          last_checked: string | null
          last_failure_at: string | null
          last_success_at: string | null
          metadata: Json | null
          response_time_ms: number | null
          status: string | null
          success_rate: number | null
          total_calls: number | null
          updated_at: string | null
        }
        Insert: {
          alerts_enabled?: boolean | null
          category?: string | null
          created_at?: string | null
          critical_function?: boolean | null
          description?: string | null
          error_message?: string | null
          failed_calls?: number | null
          function_name: string
          health_score?: number | null
          id?: string
          is_connected?: boolean | null
          last_checked?: string | null
          last_failure_at?: string | null
          last_success_at?: string | null
          metadata?: Json | null
          response_time_ms?: number | null
          status?: string | null
          success_rate?: number | null
          total_calls?: number | null
          updated_at?: string | null
        }
        Update: {
          alerts_enabled?: boolean | null
          category?: string | null
          created_at?: string | null
          critical_function?: boolean | null
          description?: string | null
          error_message?: string | null
          failed_calls?: number | null
          function_name?: string
          health_score?: number | null
          id?: string
          is_connected?: boolean | null
          last_checked?: string | null
          last_failure_at?: string | null
          last_success_at?: string | null
          metadata?: Json | null
          response_time_ms?: number | null
          status?: string | null
          success_rate?: number | null
          total_calls?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      background_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          id: string
          job_data: Json
          job_name: string
          job_type: string
          max_retries: number | null
          priority: number | null
          retry_count: number | null
          scheduled_for: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          job_data: Json
          job_name: string
          job_type: string
          max_retries?: number | null
          priority?: number | null
          retry_count?: number | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          job_data?: Json
          job_name?: string
          job_type?: string
          max_retries?: number | null
          priority?: number | null
          retry_count?: number | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "background_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "background_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "background_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "background_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_operation_queue: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_log: Json | null
          id: string
          operation_id: string
          operation_type: string
          processed_count: number | null
          scheduled_data: Json
          started_at: string | null
          status: string
          target_users: string[]
          total_count: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_log?: Json | null
          id?: string
          operation_id: string
          operation_type: string
          processed_count?: number | null
          scheduled_data?: Json
          started_at?: string | null
          status?: string
          target_users: string[]
          total_count: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_log?: Json | null
          id?: string
          operation_id?: string
          operation_type?: string
          processed_count?: number | null
          scheduled_data?: Json
          started_at?: string | null
          status?: string
          target_users?: string[]
          total_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      bulk_operations: {
        Row: {
          can_rollback: boolean | null
          completed_at: string | null
          created_at: string | null
          error_log: Json | null
          failed_items: number | null
          id: string
          initiated_by: string
          operation_data: Json
          operation_name: string
          operation_type: string
          processed_items: number | null
          progress_percentage: number | null
          rollback_data: Json | null
          started_at: string | null
          status: string | null
          total_items: number
          updated_at: string | null
        }
        Insert: {
          can_rollback?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          error_log?: Json | null
          failed_items?: number | null
          id?: string
          initiated_by: string
          operation_data: Json
          operation_name: string
          operation_type: string
          processed_items?: number | null
          progress_percentage?: number | null
          rollback_data?: Json | null
          started_at?: string | null
          status?: string | null
          total_items: number
          updated_at?: string | null
        }
        Update: {
          can_rollback?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          error_log?: Json | null
          failed_items?: number | null
          id?: string
          initiated_by?: string
          operation_data?: Json
          operation_name?: string
          operation_type?: string
          processed_items?: number | null
          progress_percentage?: number | null
          rollback_data?: Json | null
          started_at?: string | null
          status?: string | null
          total_items?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bulk_operations_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bulk_operations_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "bulk_operations_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "bulk_operations_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cache_entries: {
        Row: {
          access_count: number | null
          cache_data: Json
          cache_key: string
          cache_namespace: string
          cache_tags: string[] | null
          created_at: string | null
          expires_at: string | null
          id: string
          last_accessed: string | null
          ttl_seconds: number | null
        }
        Insert: {
          access_count?: number | null
          cache_data: Json
          cache_key: string
          cache_namespace: string
          cache_tags?: string[] | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_accessed?: string | null
          ttl_seconds?: number | null
        }
        Update: {
          access_count?: number | null
          cache_data?: Json
          cache_key?: string
          cache_namespace?: string
          cache_tags?: string[] | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_accessed?: string | null
          ttl_seconds?: number | null
        }
        Relationships: []
      }
      cache_invalidation_log: {
        Row: {
          affected_count: number | null
          cache_keys: string[]
          cache_tags: string[] | null
          created_at: string | null
          id: string
          invalidation_type: string
          reason: string | null
          triggered_by: string | null
        }
        Insert: {
          affected_count?: number | null
          cache_keys: string[]
          cache_tags?: string[] | null
          created_at?: string | null
          id?: string
          invalidation_type: string
          reason?: string | null
          triggered_by?: string | null
        }
        Update: {
          affected_count?: number | null
          cache_keys?: string[]
          cache_tags?: string[] | null
          created_at?: string | null
          id?: string
          invalidation_type?: string
          reason?: string | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cache_invalidation_log_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cache_invalidation_log_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "cache_invalidation_log_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "cache_invalidation_log_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_operations: {
        Row: {
          completed_at: string | null
          created_at: string
          error_log: Json | null
          file_name: string | null
          file_path: string | null
          id: string
          operation_type: string
          processed_count: number | null
          settings: Json | null
          started_at: string | null
          status: string | null
          total_count: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_log?: Json | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          operation_type: string
          processed_count?: number | null
          settings?: Json | null
          started_at?: string | null
          status?: string | null
          total_count?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_log?: Json | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          operation_type?: string
          processed_count?: number | null
          settings?: Json | null
          started_at?: string | null
          status?: string | null
          total_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      calendar_sync_events: {
        Row: {
          availability_booking_id: string | null
          conflict_data: Json | null
          created_at: string
          event_end: string
          event_start: string
          event_title: string | null
          external_calendar_id: string | null
          external_event_id: string
          id: string
          integration_id: string
          last_synced_at: string | null
          sync_direction: string | null
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          availability_booking_id?: string | null
          conflict_data?: Json | null
          created_at?: string
          event_end: string
          event_start: string
          event_title?: string | null
          external_calendar_id?: string | null
          external_event_id: string
          id?: string
          integration_id: string
          last_synced_at?: string | null
          sync_direction?: string | null
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          availability_booking_id?: string | null
          conflict_data?: Json | null
          created_at?: string
          event_end?: string
          event_start?: string
          event_title?: string | null
          external_calendar_id?: string | null
          external_event_id?: string
          id?: string
          integration_id?: string
          last_synced_at?: string | null
          sync_direction?: string | null
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_sync_events_availability_booking_id_fkey"
            columns: ["availability_booking_id"]
            isOneToOne: false
            referencedRelation: "availability_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_sync_events_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "external_calendar_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_metrics: {
        Row: {
          bounce_rate: number | null
          bounced_count: number | null
          campaign_id: string | null
          click_rate: number | null
          clicked_count: number | null
          created_at: string | null
          delivered_count: number | null
          id: string
          open_rate: number | null
          opened_count: number | null
          sent_count: number | null
          unsubscribe_rate: number | null
          unsubscribed_count: number | null
          updated_at: string | null
        }
        Insert: {
          bounce_rate?: number | null
          bounced_count?: number | null
          campaign_id?: string | null
          click_rate?: number | null
          clicked_count?: number | null
          created_at?: string | null
          delivered_count?: number | null
          id?: string
          open_rate?: number | null
          opened_count?: number | null
          sent_count?: number | null
          unsubscribe_rate?: number | null
          unsubscribed_count?: number | null
          updated_at?: string | null
        }
        Update: {
          bounce_rate?: number | null
          bounced_count?: number | null
          campaign_id?: string | null
          click_rate?: number | null
          clicked_count?: number | null
          created_at?: string | null
          delivered_count?: number | null
          id?: string
          open_rate?: number | null
          opened_count?: number | null
          sent_count?: number | null
          unsubscribe_rate?: number | null
          unsubscribed_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_metrics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_settings: {
        Row: {
          created_at: string | null
          default_from_email: string
          default_from_name: string
          default_reply_to: string
          enable_auto_unsubscribe: boolean
          enable_tracking: boolean
          id: string
          max_send_rate: number
          send_time_optimization: boolean
          timezone_handling: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_from_email?: string
          default_from_name?: string
          default_reply_to?: string
          enable_auto_unsubscribe?: boolean
          enable_tracking?: boolean
          id?: string
          max_send_rate?: number
          send_time_optimization?: boolean
          timezone_handling?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_from_email?: string
          default_from_name?: string
          default_reply_to?: string
          enable_auto_unsubscribe?: boolean
          enable_tracking?: boolean
          id?: string
          max_send_rate?: number
          send_time_optimization?: boolean
          timezone_handling?: string
          updated_at?: string | null
        }
        Relationships: []
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
      certificate_notifications: {
        Row: {
          batch_id: string | null
          certificate_request_id: string | null
          created_at: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          id: string
          message: string
          notification_type: string
          read: boolean | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          batch_id?: string | null
          certificate_request_id?: string | null
          created_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          message: string
          notification_type: string
          read?: boolean | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          batch_id?: string | null
          certificate_request_id?: string | null
          created_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          message?: string
          notification_type?: string
          read?: boolean | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_notifications_certificate_request_id_fkey"
            columns: ["certificate_request_id"]
            isOneToOne: false
            referencedRelation: "certificate_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_requests: {
        Row: {
          assessment_status: string | null
          batch_id: string | null
          batch_name: string | null
          calculated_status: string | null
          city: string | null
          company: string | null
          completion_date: string | null
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
          notes: string | null
          online_completion_date: string | null
          pass_threshold: number | null
          phone: string | null
          postal_code: string | null
          practical_completion_date: string | null
          practical_score: number | null
          practical_weight: number | null
          province: string | null
          recipient_email: string | null
          recipient_name: string
          rejection_reason: string | null
          requires_both_scores: boolean | null
          reviewer_id: string | null
          roster_id: string | null
          status: string
          total_score: number | null
          updated_at: string
          user_id: string | null
          written_score: number | null
          written_weight: number | null
        }
        Insert: {
          assessment_status?: string | null
          batch_id?: string | null
          batch_name?: string | null
          calculated_status?: string | null
          city?: string | null
          company?: string | null
          completion_date?: string | null
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
          notes?: string | null
          online_completion_date?: string | null
          pass_threshold?: number | null
          phone?: string | null
          postal_code?: string | null
          practical_completion_date?: string | null
          practical_score?: number | null
          practical_weight?: number | null
          province?: string | null
          recipient_email?: string | null
          recipient_name: string
          rejection_reason?: string | null
          requires_both_scores?: boolean | null
          reviewer_id?: string | null
          roster_id?: string | null
          status?: string
          total_score?: number | null
          updated_at?: string
          user_id?: string | null
          written_score?: number | null
          written_weight?: number | null
        }
        Update: {
          assessment_status?: string | null
          batch_id?: string | null
          batch_name?: string | null
          calculated_status?: string | null
          city?: string | null
          company?: string | null
          completion_date?: string | null
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
          notes?: string | null
          online_completion_date?: string | null
          pass_threshold?: number | null
          phone?: string | null
          postal_code?: string | null
          practical_completion_date?: string | null
          practical_score?: number | null
          practical_weight?: number | null
          province?: string | null
          recipient_email?: string | null
          recipient_name?: string
          rejection_reason?: string | null
          requires_both_scores?: boolean | null
          reviewer_id?: string | null
          roster_id?: string | null
          status?: string
          total_score?: number | null
          updated_at?: string
          user_id?: string | null
          written_score?: number | null
          written_weight?: number | null
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
      communication_sessions: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          initiator_id: string | null
          participant_ids: string[]
          recording_enabled: boolean | null
          recording_url: string | null
          session_data: Json | null
          session_status: string | null
          session_type: string
          started_at: string | null
          webrtc_session_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          initiator_id?: string | null
          participant_ids: string[]
          recording_enabled?: boolean | null
          recording_url?: string | null
          session_data?: Json | null
          session_status?: string | null
          session_type: string
          started_at?: string | null
          webrtc_session_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          initiator_id?: string | null
          participant_ids?: string[]
          recording_enabled?: boolean | null
          recording_url?: string | null
          session_data?: Json | null
          session_status?: string | null
          session_type?: string
          started_at?: string | null
          webrtc_session_id?: string | null
        }
        Relationships: []
      }
      communications: {
        Row: {
          account_id: string | null
          automation_triggered: boolean | null
          bcc_addresses: string[] | null
          campaign_id: string | null
          cc_addresses: string[] | null
          clicked_at: string | null
          communication_type: string
          contact_id: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          delivered_at: string | null
          from_address: string | null
          id: string
          lead_id: string | null
          opened_at: string | null
          opportunity_id: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
          template_id: string | null
          to_address: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          automation_triggered?: boolean | null
          bcc_addresses?: string[] | null
          campaign_id?: string | null
          cc_addresses?: string[] | null
          clicked_at?: string | null
          communication_type?: string
          contact_id?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          delivered_at?: string | null
          from_address?: string | null
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          opportunity_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_id?: string | null
          to_address?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          automation_triggered?: boolean | null
          bcc_addresses?: string[] | null
          campaign_id?: string | null
          cc_addresses?: string[] | null
          clicked_at?: string | null
          communication_type?: string
          contact_id?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          delivered_at?: string | null
          from_address?: string | null
          id?: string
          lead_id?: string | null
          opened_at?: string | null
          opportunity_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_id?: string | null
          to_address?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communications_lead_id"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_communications_account_id"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_communications_contact_id"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_communications_opportunity_id"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
      compliance_actions: {
        Row: {
          action_type: string
          assigned_by: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          metric_id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          assigned_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metric_id: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          assigned_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metric_id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_actions_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_actions_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_actions_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_actions_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_actions_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_actions_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_actions_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_actions_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_actions_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "compliance_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_activity_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          requirement_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          requirement_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          requirement_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_advanced_reports: {
        Row: {
          aggregation_rules: Json | null
          created_at: string | null
          created_by: string | null
          data_sources: Json
          filters_config: Json | null
          generation_status: string | null
          id: string
          is_active: boolean | null
          last_generated: string | null
          next_generation: string | null
          output_formats: Json | null
          recipients: Json | null
          report_category: string
          report_name: string
          report_template: string | null
          report_type: string
          retention_days: number | null
          schedule_config: Json | null
          updated_at: string | null
          visualization_config: Json | null
        }
        Insert: {
          aggregation_rules?: Json | null
          created_at?: string | null
          created_by?: string | null
          data_sources?: Json
          filters_config?: Json | null
          generation_status?: string | null
          id?: string
          is_active?: boolean | null
          last_generated?: string | null
          next_generation?: string | null
          output_formats?: Json | null
          recipients?: Json | null
          report_category: string
          report_name: string
          report_template?: string | null
          report_type: string
          retention_days?: number | null
          schedule_config?: Json | null
          updated_at?: string | null
          visualization_config?: Json | null
        }
        Update: {
          aggregation_rules?: Json | null
          created_at?: string | null
          created_by?: string | null
          data_sources?: Json
          filters_config?: Json | null
          generation_status?: string | null
          id?: string
          is_active?: boolean | null
          last_generated?: string | null
          next_generation?: string | null
          output_formats?: Json | null
          recipients?: Json | null
          report_category?: string
          report_name?: string
          report_template?: string | null
          report_type?: string
          retention_days?: number | null
          schedule_config?: Json | null
          updated_at?: string | null
          visualization_config?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_advanced_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_advanced_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_advanced_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_advanced_reports_created_by_fkey"
            columns: ["created_by"]
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
      compliance_audit_events: {
        Row: {
          created_at: string | null
          description: string
          event_type: string
          id: string
          metadata: Json | null
          performed_by: string | null
          target_user_id: string | null
          target_user_name: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          event_type: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          target_user_id?: string | null
          target_user_name?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          target_user_id?: string | null
          target_user_name?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_audit_events_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_audit_events_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_audit_events_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_audit_events_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_audit_events_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_audit_events_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_audit_events_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_audit_events_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_audit_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_audit_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_audit_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_audit_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_audit_log: {
        Row: {
          audit_type: string
          created_at: string | null
          id: string
          metric_id: string | null
          new_value: Json | null
          notes: string | null
          old_value: Json | null
          performed_by: string | null
          user_id: string
        }
        Insert: {
          audit_type: string
          created_at?: string | null
          id?: string
          metric_id?: string | null
          new_value?: Json | null
          notes?: string | null
          old_value?: Json | null
          performed_by?: string | null
          user_id: string
        }
        Update: {
          audit_type?: string
          created_at?: string | null
          id?: string
          metric_id?: string | null
          new_value?: Json | null
          notes?: string | null
          old_value?: Json | null
          performed_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_audit_log_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "compliance_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_audit_trail: {
        Row: {
          action_type: string
          created_at: string | null
          details: Json
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          details?: Json
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          details?: Json
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_audit_trail_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_audit_trail_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_audit_trail_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_audit_trail_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_benchmarks: {
        Row: {
          benchmark_category: string | null
          benchmark_name: string
          benchmark_type: string
          best_practice_threshold: number | null
          bottom_quartile: number | null
          calculation_method: string | null
          created_at: string | null
          data_sources: Json | null
          effective_date: string
          expiry_date: string | null
          id: string
          industry_standard: number | null
          is_active: boolean | null
          metric_unit: string | null
          organization_average: number | null
          top_quartile: number | null
          updated_at: string | null
        }
        Insert: {
          benchmark_category?: string | null
          benchmark_name: string
          benchmark_type: string
          best_practice_threshold?: number | null
          bottom_quartile?: number | null
          calculation_method?: string | null
          created_at?: string | null
          data_sources?: Json | null
          effective_date: string
          expiry_date?: string | null
          id?: string
          industry_standard?: number | null
          is_active?: boolean | null
          metric_unit?: string | null
          organization_average?: number | null
          top_quartile?: number | null
          updated_at?: string | null
        }
        Update: {
          benchmark_category?: string | null
          benchmark_name?: string
          benchmark_type?: string
          best_practice_threshold?: number | null
          bottom_quartile?: number | null
          calculation_method?: string | null
          created_at?: string | null
          data_sources?: Json | null
          effective_date?: string
          expiry_date?: string | null
          id?: string
          industry_standard?: number | null
          is_active?: boolean | null
          metric_unit?: string | null
          organization_average?: number | null
          top_quartile?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      compliance_bulk_operations: {
        Row: {
          completed_at: string | null
          error_log: string[] | null
          id: string
          initiated_by: string | null
          operation_params: Json
          operation_type: string
          progress_count: number | null
          results: Json | null
          started_at: string | null
          status: string | null
          target_users: string[]
          total_count: number
        }
        Insert: {
          completed_at?: string | null
          error_log?: string[] | null
          id?: string
          initiated_by?: string | null
          operation_params?: Json
          operation_type: string
          progress_count?: number | null
          results?: Json | null
          started_at?: string | null
          status?: string | null
          target_users: string[]
          total_count: number
        }
        Update: {
          completed_at?: string | null
          error_log?: string[] | null
          id?: string
          initiated_by?: string | null
          operation_params?: Json
          operation_type?: string
          progress_count?: number | null
          results?: Json | null
          started_at?: string | null
          status?: string | null
          target_users?: string[]
          total_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "compliance_bulk_operations_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_bulk_operations_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_bulk_operations_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_bulk_operations_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_dashboard_configs: {
        Row: {
          created_at: string | null
          dashboard_name: string
          id: string
          is_default: boolean | null
          is_shared: boolean | null
          layout_config: Json
          refresh_interval: number | null
          updated_at: string | null
          user_id: string | null
          widget_config: Json
        }
        Insert: {
          created_at?: string | null
          dashboard_name: string
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          layout_config?: Json
          refresh_interval?: number | null
          updated_at?: string | null
          user_id?: string | null
          widget_config?: Json
        }
        Update: {
          created_at?: string | null
          dashboard_name?: string
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          layout_config?: Json
          refresh_interval?: number | null
          updated_at?: string | null
          user_id?: string | null
          widget_config?: Json
        }
        Relationships: [
          {
            foreignKeyName: "compliance_dashboard_configs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_dashboard_configs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_dashboard_configs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_dashboard_configs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_document_requirements: {
        Row: {
          auto_expire_days: number | null
          created_at: string | null
          description: string | null
          document_type: string
          example_files: string[] | null
          id: string
          max_file_size_mb: number | null
          metric_id: string
          required_file_types: string[] | null
          requires_expiry_date: boolean | null
          updated_at: string | null
        }
        Insert: {
          auto_expire_days?: number | null
          created_at?: string | null
          description?: string | null
          document_type: string
          example_files?: string[] | null
          id?: string
          max_file_size_mb?: number | null
          metric_id: string
          required_file_types?: string[] | null
          requires_expiry_date?: boolean | null
          updated_at?: string | null
        }
        Update: {
          auto_expire_days?: number | null
          created_at?: string | null
          description?: string | null
          document_type?: string
          example_files?: string[] | null
          id?: string
          max_file_size_mb?: number | null
          metric_id?: string
          required_file_types?: string[] | null
          requires_expiry_date?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_document_requirements_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "compliance_metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_document_reviews: {
        Row: {
          created_at: string | null
          document_id: string
          id: string
          review_notes: string | null
          review_status: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_id: string
          id?: string
          review_notes?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string
          id?: string
          review_notes?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_document_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_document_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_document_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_document_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_document_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_document_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_document_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_document_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_documents: {
        Row: {
          created_at: string | null
          expiry_date: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          is_current: boolean | null
          metric_id: string
          rejection_reason: string | null
          updated_at: string | null
          upload_date: string | null
          user_id: string
          verification_notes: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          expiry_date?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          is_current?: boolean | null
          metric_id: string
          rejection_reason?: string | null
          updated_at?: string | null
          upload_date?: string | null
          user_id: string
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          expiry_date?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          is_current?: boolean | null
          metric_id?: string
          rejection_reason?: string | null
          updated_at?: string | null
          upload_date?: string | null
          user_id?: string
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_documents_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "compliance_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_escalation_rules: {
        Row: {
          action_config: Json
          action_type: string
          delay_hours: number
          escalation_level: number
          id: string
          is_active: boolean | null
          notification_template_id: string | null
          trigger_condition: string
          workflow_id: string | null
        }
        Insert: {
          action_config?: Json
          action_type: string
          delay_hours: number
          escalation_level: number
          id?: string
          is_active?: boolean | null
          notification_template_id?: string | null
          trigger_condition: string
          workflow_id?: string | null
        }
        Update: {
          action_config?: Json
          action_type?: string
          delay_hours?: number
          escalation_level?: number
          id?: string
          is_active?: boolean | null
          notification_template_id?: string | null
          trigger_condition?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_escalation_rules_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "compliance_workflows"
            referencedColumns: ["id"]
          },
        ]
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
      compliance_intelligence_insights: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          actionable_recommendations: Json | null
          confidence_score: number | null
          created_at: string | null
          entity_id: string | null
          entity_type: string
          expiry_date: string | null
          id: string
          insight_category: string
          insight_date: string
          insight_description: string
          insight_severity: string
          insight_title: string
          insight_type: string
          is_acknowledged: boolean | null
          resolution_notes: string | null
          resolution_status: string | null
          supporting_data: Json | null
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actionable_recommendations?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          expiry_date?: string | null
          id?: string
          insight_category: string
          insight_date: string
          insight_description: string
          insight_severity: string
          insight_title: string
          insight_type: string
          is_acknowledged?: boolean | null
          resolution_notes?: string | null
          resolution_status?: string | null
          supporting_data?: Json | null
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actionable_recommendations?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          expiry_date?: string | null
          id?: string
          insight_category?: string
          insight_date?: string
          insight_description?: string
          insight_severity?: string
          insight_title?: string
          insight_type?: string
          is_acknowledged?: boolean | null
          resolution_notes?: string | null
          resolution_status?: string | null
          supporting_data?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_intelligence_insights_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_intelligence_insights_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_intelligence_insights_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_intelligence_insights_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
      compliance_metrics: {
        Row: {
          applicable_tiers: string | null
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          measurement_type: string
          name: string
          required_for_basic: boolean | null
          required_for_robust: boolean | null
          required_for_roles: string[] | null
          target_value: Json | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          applicable_tiers?: string | null
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          measurement_type?: string
          name: string
          required_for_basic?: boolean | null
          required_for_robust?: boolean | null
          required_for_roles?: string[] | null
          target_value?: Json | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          applicable_tiers?: string | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          measurement_type?: string
          name?: string
          required_for_basic?: boolean | null
          required_for_robust?: boolean | null
          required_for_roles?: string[] | null
          target_value?: Json | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_metrics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_metrics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_metrics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_metrics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_notification_queue: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          notification_type: string
          priority: number | null
          recipient_user_id: string | null
          scheduled_for: string | null
          sender_user_id: string | null
          sent_at: string | null
          status: string | null
          subject: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notification_type: string
          priority?: number | null
          recipient_user_id?: string | null
          scheduled_for?: string | null
          sender_user_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string
          priority?: number | null
          recipient_user_id?: string | null
          scheduled_for?: string | null
          sender_user_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_notification_queue_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_notification_queue_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_notification_queue_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_notification_queue_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_notification_queue_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_notification_queue_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_notification_queue_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_notification_queue_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_real_time_monitoring: {
        Row: {
          alert_frequency_minutes: number | null
          alert_status: string | null
          consecutive_violations: number | null
          created_at: string | null
          current_value: number
          entity_id: string | null
          entity_type: string
          id: string
          is_active: boolean | null
          last_alert_sent: string | null
          metric_being_monitored: string
          monitor_name: string
          monitor_type: string
          monitoring_config: Json | null
          threshold_critical: number | null
          threshold_warning: number | null
          updated_at: string | null
        }
        Insert: {
          alert_frequency_minutes?: number | null
          alert_status?: string | null
          consecutive_violations?: number | null
          created_at?: string | null
          current_value: number
          entity_id?: string | null
          entity_type: string
          id?: string
          is_active?: boolean | null
          last_alert_sent?: string | null
          metric_being_monitored: string
          monitor_name: string
          monitor_type: string
          monitoring_config?: Json | null
          threshold_critical?: number | null
          threshold_warning?: number | null
          updated_at?: string | null
        }
        Update: {
          alert_frequency_minutes?: number | null
          alert_status?: string | null
          consecutive_violations?: number | null
          created_at?: string | null
          current_value?: number
          entity_id?: string | null
          entity_type?: string
          id?: string
          is_active?: boolean | null
          last_alert_sent?: string | null
          metric_being_monitored?: string
          monitor_name?: string
          monitor_type?: string
          monitoring_config?: Json | null
          threshold_critical?: number | null
          threshold_warning?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      compliance_records: {
        Row: {
          assigned_to: string | null
          attachments: string[] | null
          completion_date: string | null
          compliance_data: Json | null
          compliance_status: string | null
          created_at: string | null
          due_date: string | null
          id: string
          priority_level: string | null
          record_description: string | null
          record_title: string
          record_type: string
          reviewer_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          attachments?: string[] | null
          completion_date?: string | null
          compliance_data?: Json | null
          compliance_status?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          priority_level?: string | null
          record_description?: string | null
          record_title: string
          record_type: string
          reviewer_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          attachments?: string[] | null
          completion_date?: string | null
          compliance_data?: Json | null
          compliance_status?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          priority_level?: string | null
          record_description?: string | null
          record_title?: string
          record_type?: string
          reviewer_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      compliance_report_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          output_format: string | null
          parameters: Json
          query_config: Json
          template_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          output_format?: string | null
          parameters?: Json
          query_config?: Json
          template_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          output_format?: string | null
          parameters?: Json
          query_config?: Json
          template_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_report_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_report_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_report_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_report_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_reports: {
        Row: {
          completed_at: string | null
          created_at: string | null
          expires_at: string | null
          file_path: string | null
          generated_by: string | null
          generation_status: string | null
          id: string
          parameters_used: Json | null
          report_data: Json
          report_name: string
          template_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          file_path?: string | null
          generated_by?: string | null
          generation_status?: string | null
          id?: string
          parameters_used?: Json | null
          report_data?: Json
          report_name: string
          template_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          file_path?: string | null
          generated_by?: string | null
          generation_status?: string | null
          id?: string
          parameters_used?: Json | null
          report_data?: Json
          report_name?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_reports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "compliance_report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_requirements: {
        Row: {
          approval_required: boolean | null
          audit_frequency_days: number | null
          auto_assign_rules: Json | null
          category: string | null
          change_log: Json | null
          color_code: string | null
          completion_criteria: Json | null
          compliance_weight: number | null
          created_at: string | null
          created_by: string | null
          deactivated_at: string | null
          deactivated_by: string | null
          description: string | null
          difficulty_level: string | null
          display_order: number | null
          document_required: boolean | null
          due_days_from_assignment: number | null
          escalation_rules: Json | null
          estimated_completion_time: number | null
          external_link_required: boolean | null
          form_template: Json | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_mandatory: boolean | null
          name: string
          notification_settings: Json | null
          points_value: number | null
          prerequisites: Json | null
          related_requirements: Json | null
          renewal_frequency_months: number | null
          requirement_type: string
          supervisor_review_required: boolean | null
          tier_level: string | null
          updated_at: string | null
          updated_by: string | null
          validation_rules: Json | null
          version: number | null
        }
        Insert: {
          approval_required?: boolean | null
          audit_frequency_days?: number | null
          auto_assign_rules?: Json | null
          category?: string | null
          change_log?: Json | null
          color_code?: string | null
          completion_criteria?: Json | null
          compliance_weight?: number | null
          created_at?: string | null
          created_by?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          display_order?: number | null
          document_required?: boolean | null
          due_days_from_assignment?: number | null
          escalation_rules?: Json | null
          estimated_completion_time?: number | null
          external_link_required?: boolean | null
          form_template?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          name: string
          notification_settings?: Json | null
          points_value?: number | null
          prerequisites?: Json | null
          related_requirements?: Json | null
          renewal_frequency_months?: number | null
          requirement_type: string
          supervisor_review_required?: boolean | null
          tier_level?: string | null
          updated_at?: string | null
          updated_by?: string | null
          validation_rules?: Json | null
          version?: number | null
        }
        Update: {
          approval_required?: boolean | null
          audit_frequency_days?: number | null
          auto_assign_rules?: Json | null
          category?: string | null
          change_log?: Json | null
          color_code?: string | null
          completion_criteria?: Json | null
          compliance_weight?: number | null
          created_at?: string | null
          created_by?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          description?: string | null
          difficulty_level?: string | null
          display_order?: number | null
          document_required?: boolean | null
          due_days_from_assignment?: number | null
          escalation_rules?: Json | null
          estimated_completion_time?: number | null
          external_link_required?: boolean | null
          form_template?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          name?: string
          notification_settings?: Json | null
          points_value?: number | null
          prerequisites?: Json | null
          related_requirements?: Json | null
          renewal_frequency_months?: number | null
          requirement_type?: string
          supervisor_review_required?: boolean | null
          tier_level?: string | null
          updated_at?: string | null
          updated_by?: string | null
          validation_rules?: Json | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_compliance_requirements_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_compliance_requirements_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_compliance_requirements_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_compliance_requirements_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_compliance_requirements_deactivated_by"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_compliance_requirements_deactivated_by"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_compliance_requirements_deactivated_by"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_compliance_requirements_deactivated_by"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_compliance_requirements_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_compliance_requirements_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_compliance_requirements_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_compliance_requirements_updated_by"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_requirements_templates: {
        Row: {
          created_at: string | null
          custom_due_days: number | null
          id: string
          is_mandatory: boolean | null
          requirement_id: string | null
          template_id: string | null
        }
        Insert: {
          created_at?: string | null
          custom_due_days?: number | null
          id?: string
          is_mandatory?: boolean | null
          requirement_id?: string | null
          template_id?: string | null
        }
        Update: {
          created_at?: string | null
          custom_due_days?: number | null
          id?: string
          is_mandatory?: boolean | null
          requirement_id?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_requirements_templates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "compliance_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_risk_assessments: {
        Row: {
          assessment_date: string
          assessment_name: string
          assessment_notes: string | null
          assessor_id: string | null
          created_at: string | null
          current_controls: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          mitigation_strategies: Json | null
          next_review_date: string | null
          remediation_plan: Json | null
          residual_risk_score: number | null
          risk_category: string
          risk_impact: number
          risk_level: string | null
          risk_probability: number
          risk_score: number | null
          updated_at: string | null
        }
        Insert: {
          assessment_date: string
          assessment_name: string
          assessment_notes?: string | null
          assessor_id?: string | null
          created_at?: string | null
          current_controls?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          mitigation_strategies?: Json | null
          next_review_date?: string | null
          remediation_plan?: Json | null
          residual_risk_score?: number | null
          risk_category: string
          risk_impact: number
          risk_level?: string | null
          risk_probability: number
          risk_score?: number | null
          updated_at?: string | null
        }
        Update: {
          assessment_date?: string
          assessment_name?: string
          assessment_notes?: string | null
          assessor_id?: string | null
          created_at?: string | null
          current_controls?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          mitigation_strategies?: Json | null
          next_review_date?: string | null
          remediation_plan?: Json | null
          residual_risk_score?: number | null
          risk_category?: string
          risk_impact?: number
          risk_level?: string | null
          risk_probability?: number
          risk_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_risk_assessments_assessor_id_fkey"
            columns: ["assessor_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_risk_assessments_assessor_id_fkey"
            columns: ["assessor_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_risk_assessments_assessor_id_fkey"
            columns: ["assessor_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_risk_assessments_assessor_id_fkey"
            columns: ["assessor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_risk_scores: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          last_assessment: string | null
          mitigation_recommendations: Json | null
          next_assessment_due: string | null
          risk_factors: Json
          risk_level: string
          risk_score: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          last_assessment?: string | null
          mitigation_recommendations?: Json | null
          next_assessment_due?: string | null
          risk_factors: Json
          risk_level: string
          risk_score: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          last_assessment?: string | null
          mitigation_recommendations?: Json | null
          next_assessment_due?: string | null
          risk_factors?: Json
          risk_level?: string
          risk_score?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      compliance_rules: {
        Row: {
          auto_remediation: Json | null
          created_at: string | null
          created_by: string | null
          entity_types: string[]
          id: string
          is_active: boolean | null
          notification_config: Json | null
          rule_category: string
          rule_description: string | null
          rule_logic: Json
          rule_name: string
          severity: string | null
          updated_at: string | null
        }
        Insert: {
          auto_remediation?: Json | null
          created_at?: string | null
          created_by?: string | null
          entity_types: string[]
          id?: string
          is_active?: boolean | null
          notification_config?: Json | null
          rule_category: string
          rule_description?: string | null
          rule_logic: Json
          rule_name: string
          severity?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_remediation?: Json | null
          created_at?: string | null
          created_by?: string | null
          entity_types?: string[]
          id?: string
          is_active?: boolean | null
          notification_config?: Json | null
          rule_category?: string
          rule_description?: string | null
          rule_logic?: Json
          rule_name?: string
          severity?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_system_health: {
        Row: {
          component_name: string
          created_at: string | null
          error_details: string | null
          health_status: string
          id: string
          last_check: string | null
          metrics: Json
          recovery_actions: Json | null
        }
        Insert: {
          component_name: string
          created_at?: string | null
          error_details?: string | null
          health_status: string
          id?: string
          last_check?: string | null
          metrics?: Json
          recovery_actions?: Json | null
        }
        Update: {
          component_name?: string
          created_at?: string | null
          error_details?: string | null
          health_status?: string
          id?: string
          last_check?: string | null
          metrics?: Json
          recovery_actions?: Json | null
        }
        Relationships: []
      }
      compliance_templates: {
        Row: {
          color_scheme: string | null
          created_at: string | null
          description: string | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          role: string
          template_name: string
          tier: string
          ui_config: Json | null
          updated_at: string | null
        }
        Insert: {
          color_scheme?: string | null
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          role: string
          template_name: string
          tier: string
          ui_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          color_scheme?: string | null
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          template_name?: string
          tier?: string
          ui_config?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      compliance_tier_history: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          new_tier: string
          old_tier: string | null
          requirements_affected: number | null
          user_id: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_tier: string
          old_tier?: string | null
          requirements_affected?: number | null
          user_id?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_tier?: string
          old_tier?: string | null
          requirements_affected?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_tier_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_tier_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_tier_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_tier_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_tier_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_tier_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_tier_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_tier_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_tiers: {
        Row: {
          assigned_at: string | null
          completed_requirements: number | null
          completion_percentage: number | null
          id: string
          last_updated: string | null
          tier: string
          total_requirements: number | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          completed_requirements?: number | null
          completion_percentage?: number | null
          id?: string
          last_updated?: string | null
          tier?: string
          total_requirements?: number | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          completed_requirements?: number | null
          completion_percentage?: number | null
          id?: string
          last_updated?: string | null
          tier?: string
          total_requirements?: number | null
          user_id?: string
        }
        Relationships: []
      }
      compliance_trend_analysis: {
        Row: {
          analysis_date: string
          analysis_period: string
          analysis_type: string
          created_at: string | null
          current_value: number
          entity_id: string | null
          entity_type: string
          id: string
          insights: Json | null
          metric_name: string
          next_period_prediction: number | null
          prediction_confidence: number | null
          previous_period_value: number | null
          trend_data: Json | null
          trend_direction: string
          trend_strength: number | null
          variance_percentage: number | null
        }
        Insert: {
          analysis_date: string
          analysis_period: string
          analysis_type: string
          created_at?: string | null
          current_value: number
          entity_id?: string | null
          entity_type: string
          id?: string
          insights?: Json | null
          metric_name: string
          next_period_prediction?: number | null
          prediction_confidence?: number | null
          previous_period_value?: number | null
          trend_data?: Json | null
          trend_direction: string
          trend_strength?: number | null
          variance_percentage?: number | null
        }
        Update: {
          analysis_date?: string
          analysis_period?: string
          analysis_type?: string
          created_at?: string | null
          current_value?: number
          entity_id?: string | null
          entity_type?: string
          id?: string
          insights?: Json | null
          metric_name?: string
          next_period_prediction?: number | null
          prediction_confidence?: number | null
          previous_period_value?: number | null
          trend_data?: Json | null
          trend_direction?: string
          trend_strength?: number | null
          variance_percentage?: number | null
        }
        Relationships: []
      }
      compliance_violations: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          detected_at: string | null
          entity_id: string
          entity_type: string
          id: string
          remediation_actions: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          rule_id: string | null
          severity: string
          status: string | null
          updated_at: string | null
          violation_description: string | null
          violation_type: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          detected_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          remediation_actions?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          rule_id?: string | null
          severity: string
          status?: string | null
          updated_at?: string | null
          violation_description?: string | null
          violation_type: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          detected_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          remediation_actions?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          rule_id?: string | null
          severity?: string
          status?: string | null
          updated_at?: string | null
          violation_description?: string | null
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_violations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_violations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_violations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_violations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_violations_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_violations_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_violations_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_violations_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_violations_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "compliance_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_workflow_executions: {
        Row: {
          completed_at: string | null
          context_data: Json | null
          current_stage: number | null
          escalated_at: string | null
          escalation_level: number | null
          id: string
          started_at: string | null
          status: string | null
          trigger_event: string
          triggered_by_user_id: string | null
          workflow_id: string | null
        }
        Insert: {
          completed_at?: string | null
          context_data?: Json | null
          current_stage?: number | null
          escalated_at?: string | null
          escalation_level?: number | null
          id?: string
          started_at?: string | null
          status?: string | null
          trigger_event: string
          triggered_by_user_id?: string | null
          workflow_id?: string | null
        }
        Update: {
          completed_at?: string | null
          context_data?: Json | null
          current_stage?: number | null
          escalated_at?: string | null
          escalation_level?: number | null
          id?: string
          started_at?: string | null
          status?: string | null
          trigger_event?: string
          triggered_by_user_id?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_workflow_executions_triggered_by_user_id_fkey"
            columns: ["triggered_by_user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_workflow_executions_triggered_by_user_id_fkey"
            columns: ["triggered_by_user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_workflow_executions_triggered_by_user_id_fkey"
            columns: ["triggered_by_user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_workflow_executions_triggered_by_user_id_fkey"
            columns: ["triggered_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "compliance_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_workflows: {
        Row: {
          automation_config: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          escalation_rules: Json
          id: string
          is_active: boolean | null
          name: string
          trigger_conditions: Json
          updated_at: string | null
        }
        Insert: {
          automation_config?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          escalation_rules?: Json
          id?: string
          is_active?: boolean | null
          name: string
          trigger_conditions?: Json
          updated_at?: string | null
        }
        Update: {
          automation_config?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          escalation_rules?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_conditions?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "compliance_workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "compliance_workflows_created_by_fkey"
            columns: ["created_by"]
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
          automation_rules: Json | null
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
          health_score: number | null
          id: string
          industry: string | null
          last_activity_date: string | null
          lead_conversion_date: string | null
          notes: string | null
          parent_account_id: string | null
          phone: string | null
          primary_contact_id: string | null
          priority: number | null
          shipping_address: string | null
          shipping_city: string | null
          shipping_country: string | null
          shipping_postal_code: string | null
          shipping_state: string | null
          tier: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          account_name: string
          account_status?: string | null
          account_type?: string | null
          annual_revenue?: number | null
          assigned_to?: string | null
          automation_rules?: Json | null
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
          health_score?: number | null
          id?: string
          industry?: string | null
          last_activity_date?: string | null
          lead_conversion_date?: string | null
          notes?: string | null
          parent_account_id?: string | null
          phone?: string | null
          primary_contact_id?: string | null
          priority?: number | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          tier?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          account_name?: string
          account_status?: string | null
          account_type?: string | null
          annual_revenue?: number | null
          assigned_to?: string | null
          automation_rules?: Json | null
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
          health_score?: number | null
          id?: string
          industry?: string | null
          last_activity_date?: string | null
          lead_conversion_date?: string | null
          notes?: string | null
          parent_account_id?: string | null
          phone?: string | null
          primary_contact_id?: string | null
          priority?: number | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          tier?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_crm_accounts_primary_contact_id"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          account_id: string | null
          activity_date: string | null
          activity_type: string | null
          automation_triggered: boolean | null
          completed: boolean | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          opportunity_id: string | null
          outcome: string | null
          parent_activity_id: string | null
          priority: string | null
          status: string | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          activity_date?: string | null
          activity_type?: string | null
          automation_triggered?: boolean | null
          completed?: boolean | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          opportunity_id?: string | null
          outcome?: string | null
          parent_activity_id?: string | null
          priority?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          activity_date?: string | null
          activity_type?: string | null
          automation_triggered?: boolean | null
          completed?: boolean | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          opportunity_id?: string | null
          outcome?: string | null
          parent_activity_id?: string | null
          priority?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_parent_activity_id_fkey"
            columns: ["parent_activity_id"]
            isOneToOne: false
            referencedRelation: "crm_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_activities_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_activities_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_activities_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_activities_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_crm_activities_lead_id"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_crm_activities_opportunity_id"
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
      crm_analytics_reports: {
        Row: {
          configuration: Json
          created_at: string | null
          created_by: string | null
          id: string
          is_automated: boolean | null
          report_name: string
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
          report_name: string
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
          report_name?: string
          report_type?: string
          schedule_config?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_analytics_warehouse: {
        Row: {
          aggregation_level: string | null
          created_at: string | null
          dimensions: Json | null
          id: string
          metadata: Json | null
          metric_category: string
          metric_date: string
          metric_name: string
          metric_value: number
          updated_at: string | null
        }
        Insert: {
          aggregation_level?: string | null
          created_at?: string | null
          dimensions?: Json | null
          id?: string
          metadata?: Json | null
          metric_category: string
          metric_date: string
          metric_name: string
          metric_value: number
          updated_at?: string | null
        }
        Update: {
          aggregation_level?: string | null
          created_at?: string | null
          dimensions?: Json | null
          id?: string
          metadata?: Json | null
          metric_category?: string
          metric_date?: string
          metric_name?: string
          metric_value?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_assignment_performance: {
        Row: {
          assignment_date: string | null
          availability_status: string | null
          avg_response_time: unknown | null
          created_at: string | null
          current_load: number | null
          id: string
          leads_assigned: number | null
          leads_contacted: number | null
          leads_converted: number | null
          leads_qualified: number | null
          max_capacity: number | null
          quality_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assignment_date?: string | null
          availability_status?: string | null
          avg_response_time?: unknown | null
          created_at?: string | null
          current_load?: number | null
          id?: string
          leads_assigned?: number | null
          leads_contacted?: number | null
          leads_converted?: number | null
          leads_qualified?: number | null
          max_capacity?: number | null
          quality_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assignment_date?: string | null
          availability_status?: string | null
          avg_response_time?: unknown | null
          created_at?: string | null
          current_load?: number | null
          id?: string
          leads_assigned?: number | null
          leads_contacted?: number | null
          leads_converted?: number | null
          leads_qualified?: number | null
          max_capacity?: number | null
          quality_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      crm_assignment_rules: {
        Row: {
          assigned_user_id: string | null
          assignment_type: string | null
          automation_enabled: boolean | null
          created_at: string | null
          criteria: Json
          escalation_rules: Json | null
          id: string
          is_active: boolean | null
          priority: number | null
          rule_description: string | null
          rule_name: string
          updated_at: string | null
          working_hours: Json | null
        }
        Insert: {
          assigned_user_id?: string | null
          assignment_type?: string | null
          automation_enabled?: boolean | null
          created_at?: string | null
          criteria?: Json
          escalation_rules?: Json | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_description?: string | null
          rule_name: string
          updated_at?: string | null
          working_hours?: Json | null
        }
        Update: {
          assigned_user_id?: string | null
          assignment_type?: string | null
          automation_enabled?: boolean | null
          created_at?: string | null
          criteria?: Json
          escalation_rules?: Json | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_description?: string | null
          rule_name?: string
          updated_at?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_assignment_rules_assigned_user"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_assignment_rules_assigned_user"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_assignment_rules_assigned_user"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_assignment_rules_assigned_user"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_campaign_enrollments: {
        Row: {
          campaign_id: string | null
          completion_date: string | null
          current_step: number | null
          engagement_score: number | null
          enrollment_date: string | null
          enrollment_status: string | null
          id: string
          last_interaction: string | null
          lead_id: string | null
          metadata: Json | null
        }
        Insert: {
          campaign_id?: string | null
          completion_date?: string | null
          current_step?: number | null
          engagement_score?: number | null
          enrollment_date?: string | null
          enrollment_status?: string | null
          id?: string
          last_interaction?: string | null
          lead_id?: string | null
          metadata?: Json | null
        }
        Update: {
          campaign_id?: string | null
          completion_date?: string | null
          current_step?: number | null
          engagement_score?: number | null
          enrollment_date?: string | null
          enrollment_status?: string | null
          id?: string
          last_interaction?: string | null
          lead_id?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_campaign_enrollments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "crm_nurturing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_campaign_enrollments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_campaign_performance: {
        Row: {
          campaign_id: string | null
          cost_per_lead: number | null
          created_at: string | null
          emails_bounced: number | null
          emails_clicked: number | null
          emails_delivered: number | null
          emails_opened: number | null
          emails_sent: number | null
          engagement_score: number | null
          id: string
          leads_generated: number | null
          opportunities_created: number | null
          performance_date: string | null
          revenue_generated: number | null
          roi_percentage: number | null
          unsubscribes: number | null
        }
        Insert: {
          campaign_id?: string | null
          cost_per_lead?: number | null
          created_at?: string | null
          emails_bounced?: number | null
          emails_clicked?: number | null
          emails_delivered?: number | null
          emails_opened?: number | null
          emails_sent?: number | null
          engagement_score?: number | null
          id?: string
          leads_generated?: number | null
          opportunities_created?: number | null
          performance_date?: string | null
          revenue_generated?: number | null
          roi_percentage?: number | null
          unsubscribes?: number | null
        }
        Update: {
          campaign_id?: string | null
          cost_per_lead?: number | null
          created_at?: string | null
          emails_bounced?: number | null
          emails_clicked?: number | null
          emails_delivered?: number | null
          emails_opened?: number | null
          emails_sent?: number | null
          engagement_score?: number | null
          id?: string
          leads_generated?: number | null
          opportunities_created?: number | null
          performance_date?: string | null
          revenue_generated?: number | null
          roi_percentage?: number | null
          unsubscribes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_campaign_performance_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "crm_email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_communications: {
        Row: {
          attachments: string[] | null
          communication_content: string | null
          communication_status: string | null
          communication_type: string
          completed_at: string | null
          created_at: string | null
          direction: string | null
          duration_minutes: number | null
          id: string
          lead_id: string | null
          metadata: Json | null
          next_action: string | null
          outcome: string | null
          scheduled_at: string | null
          subject: string | null
          user_id: string | null
        }
        Insert: {
          attachments?: string[] | null
          communication_content?: string | null
          communication_status?: string | null
          communication_type: string
          completed_at?: string | null
          created_at?: string | null
          direction?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          next_action?: string | null
          outcome?: string | null
          scheduled_at?: string | null
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          attachments?: string[] | null
          communication_content?: string | null
          communication_status?: string | null
          communication_type?: string
          completed_at?: string | null
          created_at?: string | null
          direction?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          next_action?: string | null
          outcome?: string | null
          scheduled_at?: string | null
          subject?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_crm_communications_lead"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          account_id: string | null
          automation_rules: Json | null
          communication_preferences: Json | null
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
          lead_conversion_date: string | null
          lead_source: string | null
          mobile_phone: string | null
          notes: string | null
          phone: string | null
          preferred_contact_method: string | null
          priority: number | null
          social_profiles: Json | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          automation_rules?: Json | null
          communication_preferences?: Json | null
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
          lead_conversion_date?: string | null
          lead_source?: string | null
          mobile_phone?: string | null
          notes?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          priority?: number | null
          social_profiles?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          automation_rules?: Json | null
          communication_preferences?: Json | null
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
          lead_conversion_date?: string | null
          lead_source?: string | null
          mobile_phone?: string | null
          notes?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          priority?: number | null
          social_profiles?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_email_campaigns: {
        Row: {
          ab_test_config: Json | null
          automation_rules: Json | null
          bounced_count: number | null
          campaign_cost: number | null
          campaign_name: string
          campaign_type: string | null
          clicked_count: number | null
          created_at: string | null
          created_by: string | null
          delivered_count: number | null
          email_content: string | null
          email_template_id: string | null
          geographic_targeting: string[] | null
          id: string
          industry_targeting: string[] | null
          leads_generated: number | null
          opened_count: number | null
          opportunities_created: number | null
          personalization_fields: Json | null
          priority: number | null
          revenue_attributed: number | null
          scheduled_date: string | null
          segment_criteria: Json | null
          sent_date: string | null
          status: string | null
          subject_line: string | null
          target_audience: string | null
          target_segments: Json | null
          total_recipients: number | null
          unsubscribed_count: number | null
          updated_at: string | null
        }
        Insert: {
          ab_test_config?: Json | null
          automation_rules?: Json | null
          bounced_count?: number | null
          campaign_cost?: number | null
          campaign_name: string
          campaign_type?: string | null
          clicked_count?: number | null
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          email_content?: string | null
          email_template_id?: string | null
          geographic_targeting?: string[] | null
          id?: string
          industry_targeting?: string[] | null
          leads_generated?: number | null
          opened_count?: number | null
          opportunities_created?: number | null
          personalization_fields?: Json | null
          priority?: number | null
          revenue_attributed?: number | null
          scheduled_date?: string | null
          segment_criteria?: Json | null
          sent_date?: string | null
          status?: string | null
          subject_line?: string | null
          target_audience?: string | null
          target_segments?: Json | null
          total_recipients?: number | null
          unsubscribed_count?: number | null
          updated_at?: string | null
        }
        Update: {
          ab_test_config?: Json | null
          automation_rules?: Json | null
          bounced_count?: number | null
          campaign_cost?: number | null
          campaign_name?: string
          campaign_type?: string | null
          clicked_count?: number | null
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          email_content?: string | null
          email_template_id?: string | null
          geographic_targeting?: string[] | null
          id?: string
          industry_targeting?: string[] | null
          leads_generated?: number | null
          opened_count?: number | null
          opportunities_created?: number | null
          personalization_fields?: Json | null
          priority?: number | null
          revenue_attributed?: number | null
          scheduled_date?: string | null
          segment_criteria?: Json | null
          sent_date?: string | null
          status?: string | null
          subject_line?: string | null
          target_audience?: string | null
          target_segments?: Json | null
          total_recipients?: number | null
          unsubscribed_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_campaigns_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_campaigns_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_campaigns_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_campaigns_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_email_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          design_data: Json | null
          email_content: string
          id: string
          is_active: boolean | null
          personalization_fields: Json | null
          subject_line: string
          template_name: string
          template_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          design_data?: Json | null
          email_content: string
          id?: string
          is_active?: boolean | null
          personalization_fields?: Json | null
          subject_line: string
          template_name: string
          template_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          design_data?: Json | null
          email_content?: string
          id?: string
          is_active?: boolean | null
          personalization_fields?: Json | null
          subject_line?: string
          template_name?: string
          template_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_lead_activity_tracking: {
        Row: {
          activity_date: string | null
          activity_details: Json
          activity_type: string
          automation_triggered: boolean | null
          created_at: string | null
          engagement_score: number | null
          id: string
          lead_id: string | null
          triggered_by_rule_id: string | null
        }
        Insert: {
          activity_date?: string | null
          activity_details?: Json
          activity_type: string
          automation_triggered?: boolean | null
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          lead_id?: string | null
          triggered_by_rule_id?: string | null
        }
        Update: {
          activity_date?: string | null
          activity_details?: Json
          activity_type?: string
          automation_triggered?: boolean | null
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          lead_id?: string | null
          triggered_by_rule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_activity_tracking_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lead_assignment_history: {
        Row: {
          assigned_from: string | null
          assigned_to: string
          assignment_reason: string | null
          assignment_rule_id: string | null
          created_at: string | null
          id: string
          lead_id: string | null
          workload_balance_data: Json | null
        }
        Insert: {
          assigned_from?: string | null
          assigned_to: string
          assignment_reason?: string | null
          assignment_rule_id?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          workload_balance_data?: Json | null
        }
        Update: {
          assigned_from?: string | null
          assigned_to?: string
          assignment_reason?: string | null
          assignment_rule_id?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          workload_balance_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_assignment_history_assignment_rule_id_fkey"
            columns: ["assignment_rule_id"]
            isOneToOne: false
            referencedRelation: "crm_assignment_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_assignment_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lead_automation_rules: {
        Row: {
          actions: Json
          created_at: string | null
          created_by: string | null
          execution_count: number | null
          execution_schedule: string | null
          id: string
          is_active: boolean | null
          last_execution: string | null
          priority: number | null
          rule_description: string | null
          rule_name: string
          trigger_conditions: Json
          updated_at: string | null
        }
        Insert: {
          actions?: Json
          created_at?: string | null
          created_by?: string | null
          execution_count?: number | null
          execution_schedule?: string | null
          id?: string
          is_active?: boolean | null
          last_execution?: string | null
          priority?: number | null
          rule_description?: string | null
          rule_name: string
          trigger_conditions?: Json
          updated_at?: string | null
        }
        Update: {
          actions?: Json
          created_at?: string | null
          created_by?: string | null
          execution_count?: number | null
          execution_schedule?: string | null
          id?: string
          is_active?: boolean | null
          last_execution?: string | null
          priority?: number | null
          rule_description?: string | null
          rule_name?: string
          trigger_conditions?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_lead_lifecycle_stages: {
        Row: {
          automation_triggers: Json | null
          created_at: string | null
          escalation_rules: Json | null
          id: string
          is_active: boolean | null
          required_actions: Json | null
          stage_description: string | null
          stage_name: string
          stage_order: number
          time_limits: Json | null
          updated_at: string | null
        }
        Insert: {
          automation_triggers?: Json | null
          created_at?: string | null
          escalation_rules?: Json | null
          id?: string
          is_active?: boolean | null
          required_actions?: Json | null
          stage_description?: string | null
          stage_name: string
          stage_order?: number
          time_limits?: Json | null
          updated_at?: string | null
        }
        Update: {
          automation_triggers?: Json | null
          created_at?: string | null
          escalation_rules?: Json | null
          id?: string
          is_active?: boolean | null
          required_actions?: Json | null
          stage_description?: string | null
          stage_name?: string
          stage_order?: number
          time_limits?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_lead_nurturing_campaigns: {
        Row: {
          automation_rules: Json | null
          campaign_description: string | null
          campaign_name: string
          created_at: string | null
          created_by: string | null
          email_sequence: Json
          end_date: string | null
          id: string
          is_active: boolean | null
          start_date: string | null
          success_metrics: Json | null
          target_criteria: Json
          updated_at: string | null
        }
        Insert: {
          automation_rules?: Json | null
          campaign_description?: string | null
          campaign_name: string
          created_at?: string | null
          created_by?: string | null
          email_sequence?: Json
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          start_date?: string | null
          success_metrics?: Json | null
          target_criteria?: Json
          updated_at?: string | null
        }
        Update: {
          automation_rules?: Json | null
          campaign_description?: string | null
          campaign_name?: string
          created_at?: string | null
          created_by?: string | null
          email_sequence?: Json
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          start_date?: string | null
          success_metrics?: Json | null
          target_criteria?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_lead_nurturing_enrollments: {
        Row: {
          campaign_id: string | null
          completion_date: string | null
          created_at: string | null
          current_step: number | null
          engagement_metrics: Json | null
          enrollment_date: string | null
          id: string
          lead_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          completion_date?: string | null
          created_at?: string | null
          current_step?: number | null
          engagement_metrics?: Json | null
          enrollment_date?: string | null
          id?: string
          lead_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          completion_date?: string | null
          created_at?: string | null
          current_step?: number | null
          engagement_metrics?: Json | null
          enrollment_date?: string | null
          id?: string
          lead_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_nurturing_enrollments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "crm_lead_nurturing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_nurturing_enrollments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lead_scoring_history: {
        Row: {
          calculation_details: Json | null
          created_at: string | null
          id: string
          lead_id: string | null
          new_score: number
          previous_score: number | null
          score_change: number | null
          scoring_rule_id: string | null
          trigger_event: string | null
        }
        Insert: {
          calculation_details?: Json | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          new_score: number
          previous_score?: number | null
          score_change?: number | null
          scoring_rule_id?: string | null
          trigger_event?: string | null
        }
        Update: {
          calculation_details?: Json | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          new_score?: number
          previous_score?: number | null
          score_change?: number | null
          scoring_rule_id?: string | null
          trigger_event?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_lead_scoring_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_lead_scoring_history_scoring_rule_id_fkey"
            columns: ["scoring_rule_id"]
            isOneToOne: false
            referencedRelation: "crm_lead_scoring_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lead_scoring_rules: {
        Row: {
          automation_enabled: boolean | null
          conditions: Json | null
          created_at: string | null
          created_by: string | null
          field_name: string
          field_value: string
          id: string
          is_active: boolean | null
          operator: string
          priority: number | null
          rule_category: string | null
          rule_description: string | null
          rule_name: string
          score_points: number
          updated_at: string | null
        }
        Insert: {
          automation_enabled?: boolean | null
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          field_name: string
          field_value: string
          id?: string
          is_active?: boolean | null
          operator: string
          priority?: number | null
          rule_category?: string | null
          rule_description?: string | null
          rule_name: string
          score_points: number
          updated_at?: string | null
        }
        Update: {
          automation_enabled?: boolean | null
          conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          field_name?: string
          field_value?: string
          id?: string
          is_active?: boolean | null
          operator?: string
          priority?: number | null
          rule_category?: string | null
          rule_description?: string | null
          rule_name?: string
          score_points?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_scoring_rules_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_scoring_rules_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_scoring_rules_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_scoring_rules_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lead_workflows: {
        Row: {
          created_at: string | null
          created_by: string | null
          execution_priority: number | null
          failure_handling: Json | null
          id: string
          is_active: boolean | null
          success_metrics: Json | null
          trigger_conditions: Json
          updated_at: string | null
          workflow_description: string | null
          workflow_name: string
          workflow_steps: Json
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          execution_priority?: number | null
          failure_handling?: Json | null
          id?: string
          is_active?: boolean | null
          success_metrics?: Json | null
          trigger_conditions?: Json
          updated_at?: string | null
          workflow_description?: string | null
          workflow_name: string
          workflow_steps?: Json
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          execution_priority?: number | null
          failure_handling?: Json | null
          id?: string
          is_active?: boolean | null
          success_metrics?: Json | null
          trigger_conditions?: Json
          updated_at?: string | null
          workflow_description?: string | null
          workflow_name?: string
          workflow_steps?: Json
        }
        Relationships: []
      }
      crm_leads: {
        Row: {
          annual_revenue_range: string | null
          assigned_to: string | null
          automation_rules: Json | null
          budget_range: string | null
          certification_requirements: string | null
          city: string | null
          company_name: string | null
          company_size: string | null
          conversion_date: string | null
          converted_to_account_id: string | null
          converted_to_contact_id: string | null
          created_at: string | null
          created_by: string | null
          decision_timeline: string | null
          email: string
          estimated_participant_count: number | null
          first_name: string | null
          id: string
          industry: string | null
          job_title: string | null
          last_activity_date: string | null
          last_contact_date: string | null
          last_name: string | null
          lead_score: number | null
          lead_source: string | null
          lead_status: string | null
          lead_type: string | null
          linkedin_profile: string | null
          mobile_phone: string | null
          notes: string | null
          phone: string | null
          postal_code: string | null
          preferred_training_format: string | null
          priority: number | null
          province: string | null
          qualification_notes: string | null
          referral_source: string | null
          training_urgency: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          annual_revenue_range?: string | null
          assigned_to?: string | null
          automation_rules?: Json | null
          budget_range?: string | null
          certification_requirements?: string | null
          city?: string | null
          company_name?: string | null
          company_size?: string | null
          conversion_date?: string | null
          converted_to_account_id?: string | null
          converted_to_contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          decision_timeline?: string | null
          email: string
          estimated_participant_count?: number | null
          first_name?: string | null
          id?: string
          industry?: string | null
          job_title?: string | null
          last_activity_date?: string | null
          last_contact_date?: string | null
          last_name?: string | null
          lead_score?: number | null
          lead_source?: string | null
          lead_status?: string | null
          lead_type?: string | null
          linkedin_profile?: string | null
          mobile_phone?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_training_format?: string | null
          priority?: number | null
          province?: string | null
          qualification_notes?: string | null
          referral_source?: string | null
          training_urgency?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          annual_revenue_range?: string | null
          assigned_to?: string | null
          automation_rules?: Json | null
          budget_range?: string | null
          certification_requirements?: string | null
          city?: string | null
          company_name?: string | null
          company_size?: string | null
          conversion_date?: string | null
          converted_to_account_id?: string | null
          converted_to_contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          decision_timeline?: string | null
          email?: string
          estimated_participant_count?: number | null
          first_name?: string | null
          id?: string
          industry?: string | null
          job_title?: string | null
          last_activity_date?: string | null
          last_contact_date?: string | null
          last_name?: string | null
          lead_score?: number | null
          lead_source?: string | null
          lead_status?: string | null
          lead_type?: string | null
          linkedin_profile?: string | null
          mobile_phone?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_training_format?: string | null
          priority?: number | null
          province?: string | null
          qualification_notes?: string | null
          referral_source?: string | null
          training_urgency?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_converted_to_account_id_fkey"
            columns: ["converted_to_account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_converted_to_contact_id_fkey"
            columns: ["converted_to_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_nurturing_campaigns: {
        Row: {
          campaign_name: string
          campaign_steps: Json
          campaign_type: string | null
          created_at: string | null
          created_by: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          personalization_rules: Json | null
          scheduling_config: Json | null
          start_date: string | null
          target_criteria: Json
          updated_at: string | null
        }
        Insert: {
          campaign_name: string
          campaign_steps?: Json
          campaign_type?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          personalization_rules?: Json | null
          scheduling_config?: Json | null
          start_date?: string | null
          target_criteria?: Json
          updated_at?: string | null
        }
        Update: {
          campaign_name?: string
          campaign_steps?: Json
          campaign_type?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          personalization_rules?: Json | null
          scheduling_config?: Json | null
          start_date?: string | null
          target_criteria?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_opportunities: {
        Row: {
          account_id: string | null
          account_name: string | null
          amount_in_pipeline: number | null
          assigned_to: string | null
          automation_rules: Json | null
          campaign_id: string | null
          close_date: string | null
          competitor_analysis: Json | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          estimated_value: number | null
          expected_close_date: string | null
          forecast_category: string | null
          id: string
          lead_id: string | null
          lead_source: string | null
          loss_reason: string | null
          next_step: string | null
          opportunity_name: string
          opportunity_status: string | null
          opportunity_type: string | null
          pipeline_stage_id: string | null
          preferred_ap_id: string | null
          priority: number | null
          probability: number | null
          reason_won_lost: string | null
          stage: string | null
          type: string | null
          updated_at: string | null
          weighted_amount: number | null
        }
        Insert: {
          account_id?: string | null
          account_name?: string | null
          amount_in_pipeline?: number | null
          assigned_to?: string | null
          automation_rules?: Json | null
          campaign_id?: string | null
          close_date?: string | null
          competitor_analysis?: Json | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          forecast_category?: string | null
          id?: string
          lead_id?: string | null
          lead_source?: string | null
          loss_reason?: string | null
          next_step?: string | null
          opportunity_name: string
          opportunity_status?: string | null
          opportunity_type?: string | null
          pipeline_stage_id?: string | null
          preferred_ap_id?: string | null
          priority?: number | null
          probability?: number | null
          reason_won_lost?: string | null
          stage?: string | null
          type?: string | null
          updated_at?: string | null
          weighted_amount?: number | null
        }
        Update: {
          account_id?: string | null
          account_name?: string | null
          amount_in_pipeline?: number | null
          assigned_to?: string | null
          automation_rules?: Json | null
          campaign_id?: string | null
          close_date?: string | null
          competitor_analysis?: Json | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          forecast_category?: string | null
          id?: string
          lead_id?: string | null
          lead_source?: string | null
          loss_reason?: string | null
          next_step?: string | null
          opportunity_name?: string
          opportunity_status?: string | null
          opportunity_type?: string | null
          pipeline_stage_id?: string | null
          preferred_ap_id?: string | null
          priority?: number | null
          probability?: number | null
          reason_won_lost?: string | null
          stage?: string | null
          type?: string | null
          updated_at?: string | null
          weighted_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_opportunities_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "crm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_opportunity_stage_history: {
        Row: {
          automation_triggered: boolean | null
          change_reason: string | null
          changed_by: string | null
          from_stage_id: string | null
          id: string
          opportunity_id: string | null
          stage_change_date: string | null
          stage_notes: string | null
          time_in_previous_stage: unknown | null
          to_stage_id: string | null
        }
        Insert: {
          automation_triggered?: boolean | null
          change_reason?: string | null
          changed_by?: string | null
          from_stage_id?: string | null
          id?: string
          opportunity_id?: string | null
          stage_change_date?: string | null
          stage_notes?: string | null
          time_in_previous_stage?: unknown | null
          to_stage_id?: string | null
        }
        Update: {
          automation_triggered?: boolean | null
          change_reason?: string | null
          changed_by?: string | null
          from_stage_id?: string | null
          id?: string
          opportunity_id?: string | null
          stage_change_date?: string | null
          stage_notes?: string | null
          time_in_previous_stage?: unknown | null
          to_stage_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_opportunity_stage_history_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunity_stage_history_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunity_stage_history_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipeline_stages: {
        Row: {
          automation_rules: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_closed: boolean | null
          pipeline_type: string | null
          probability_percentage: number | null
          required_fields: string[] | null
          stage_color: string | null
          stage_description: string | null
          stage_name: string
          stage_order: number
          stage_probability: number | null
          updated_at: string | null
        }
        Insert: {
          automation_rules?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_closed?: boolean | null
          pipeline_type?: string | null
          probability_percentage?: number | null
          required_fields?: string[] | null
          stage_color?: string | null
          stage_description?: string | null
          stage_name: string
          stage_order: number
          stage_probability?: number | null
          updated_at?: string | null
        }
        Update: {
          automation_rules?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_closed?: boolean | null
          pipeline_type?: string | null
          probability_percentage?: number | null
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
      crm_realtime_metrics: {
        Row: {
          calculation_source: string | null
          expires_at: string | null
          id: string
          last_calculated: string | null
          metric_key: string
          metric_value: Json
        }
        Insert: {
          calculation_source?: string | null
          expires_at?: string | null
          id?: string
          last_calculated?: string | null
          metric_key: string
          metric_value: Json
        }
        Update: {
          calculation_source?: string | null
          expires_at?: string | null
          id?: string
          last_calculated?: string | null
          metric_key?: string
          metric_value?: Json
        }
        Relationships: []
      }
      crm_revenue_forecasts: {
        Row: {
          actual_amount: number | null
          confidence_level: number | null
          created_at: string | null
          created_by: string | null
          forecast_date: string
          forecast_method: string | null
          forecast_period: string
          forecasted_amount: number
          id: string
          notes: string | null
          updated_at: string | null
          variance_amount: number | null
          variance_percentage: number | null
        }
        Insert: {
          actual_amount?: number | null
          confidence_level?: number | null
          created_at?: string | null
          created_by?: string | null
          forecast_date: string
          forecast_method?: string | null
          forecast_period: string
          forecasted_amount?: number
          id?: string
          notes?: string | null
          updated_at?: string | null
          variance_amount?: number | null
          variance_percentage?: number | null
        }
        Update: {
          actual_amount?: number | null
          confidence_level?: number | null
          created_at?: string | null
          created_by?: string | null
          forecast_date?: string
          forecast_method?: string | null
          forecast_period?: string
          forecasted_amount?: number
          id?: string
          notes?: string | null
          updated_at?: string | null
          variance_amount?: number | null
          variance_percentage?: number | null
        }
        Relationships: []
      }
      crm_revenue_records: {
        Row: {
          amount: number
          ap_location_id: string | null
          campaign_id: string | null
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
          campaign_id?: string | null
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
          campaign_id?: string | null
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
            foreignKeyName: "fk_crm_tasks_lead_id"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_crm_tasks_opportunity_id"
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
        Relationships: []
      }
      crm_workflow_executions: {
        Row: {
          completed_at: string | null
          current_step: number | null
          error_details: Json | null
          execution_data: Json | null
          execution_status: string | null
          id: string
          lead_id: string | null
          max_retries: number | null
          retry_count: number | null
          started_at: string | null
          step_results: Json | null
          workflow_id: string | null
        }
        Insert: {
          completed_at?: string | null
          current_step?: number | null
          error_details?: Json | null
          execution_data?: Json | null
          execution_status?: string | null
          id?: string
          lead_id?: string | null
          max_retries?: number | null
          retry_count?: number | null
          started_at?: string | null
          step_results?: Json | null
          workflow_id?: string | null
        }
        Update: {
          completed_at?: string | null
          current_step?: number | null
          error_details?: Json | null
          execution_data?: Json | null
          execution_status?: string | null
          id?: string
          lead_id?: string | null
          max_retries?: number | null
          retry_count?: number | null
          started_at?: string | null
          step_results?: Json | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_workflow_executions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "crm_lead_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_team_analytics: {
        Row: {
          analysis_date: string
          comparison_type: string
          created_at: string | null
          id: string
          improvement_recommendations: Json | null
          performance_rankings: Json
          team_comparisons: Json
        }
        Insert: {
          analysis_date: string
          comparison_type: string
          created_at?: string | null
          id?: string
          improvement_recommendations?: Json | null
          performance_rankings: Json
          team_comparisons: Json
        }
        Update: {
          analysis_date?: string
          comparison_type?: string
          created_at?: string | null
          id?: string
          improvement_recommendations?: Json | null
          performance_rankings?: Json
          team_comparisons?: Json
        }
        Relationships: []
      }
      data_export_requests: {
        Row: {
          created_at: string | null
          data_categories: string[]
          date_range_end: string | null
          date_range_start: string | null
          download_count: number | null
          estimated_records: number | null
          export_expires_at: string | null
          export_file_url: string | null
          export_format: string | null
          id: string
          justification: string
          provider_id: string | null
          request_type: string
          requested_at: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data_categories: string[]
          date_range_end?: string | null
          date_range_start?: string | null
          download_count?: number | null
          estimated_records?: number | null
          export_expires_at?: string | null
          export_file_url?: string | null
          export_format?: string | null
          id?: string
          justification: string
          provider_id?: string | null
          request_type: string
          requested_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data_categories?: string[]
          date_range_end?: string | null
          date_range_start?: string | null
          download_count?: number | null
          estimated_records?: number | null
          export_expires_at?: string | null
          export_file_url?: string | null
          export_format?: string | null
          id?: string
          justification?: string
          provider_id?: string | null
          request_type?: string
          requested_at?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_export_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "authorized_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_export_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "data_export_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "data_export_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "data_export_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_export_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "data_export_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "data_export_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "data_export_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_retention_policies: {
        Row: {
          applicable_conditions: Json | null
          created_at: string | null
          created_by: string | null
          data_type: string
          deletion_method: string | null
          id: string
          is_active: boolean | null
          policy_name: string
          retention_period_days: number
          updated_at: string | null
        }
        Insert: {
          applicable_conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          data_type: string
          deletion_method?: string | null
          id?: string
          is_active?: boolean | null
          policy_name: string
          retention_period_days: number
          updated_at?: string | null
        }
        Update: {
          applicable_conditions?: Json | null
          created_at?: string | null
          created_by?: string | null
          data_type?: string
          deletion_method?: string | null
          id?: string
          is_active?: boolean | null
          policy_name?: string
          retention_period_days?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_retention_policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "data_retention_policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "data_retention_policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "data_retention_policies_created_by_fkey"
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
      email_campaigns: {
        Row: {
          automation_rules: Json | null
          bounced_count: number | null
          campaign_name: string
          campaign_type: string
          clicked_count: number | null
          content: string
          created_at: string | null
          created_by: string | null
          delivered_count: number | null
          from_email: string | null
          html_content: string | null
          id: string
          opened_count: number | null
          reply_to_email: string | null
          send_date: string | null
          sender_email: string
          sender_name: string
          status: string
          subject: string | null
          subject_line: string
          target_audience: Json | null
          total_recipients: number | null
          tracking_enabled: boolean | null
          unsubscribed_count: number | null
          updated_at: string | null
        }
        Insert: {
          automation_rules?: Json | null
          bounced_count?: number | null
          campaign_name: string
          campaign_type: string
          clicked_count?: number | null
          content: string
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          from_email?: string | null
          html_content?: string | null
          id?: string
          opened_count?: number | null
          reply_to_email?: string | null
          send_date?: string | null
          sender_email: string
          sender_name: string
          status?: string
          subject?: string | null
          subject_line: string
          target_audience?: Json | null
          total_recipients?: number | null
          tracking_enabled?: boolean | null
          unsubscribed_count?: number | null
          updated_at?: string | null
        }
        Update: {
          automation_rules?: Json | null
          bounced_count?: number | null
          campaign_name?: string
          campaign_type?: string
          clicked_count?: number | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          from_email?: string | null
          html_content?: string | null
          id?: string
          opened_count?: number | null
          reply_to_email?: string | null
          send_date?: string | null
          sender_email?: string
          sender_name?: string
          status?: string
          subject?: string | null
          subject_line?: string
          target_audience?: Json | null
          total_recipients?: number | null
          tracking_enabled?: boolean | null
          unsubscribed_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          bounced_at: string | null
          campaign_id: string | null
          clicked_at: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          recipient_email: string
          sent_at: string | null
          status: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          bounced_at?: string | null
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          recipient_email: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          bounced_at?: string | null
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          recipient_email?: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          created_by: string | null
          design_data: Json | null
          email_content: string | null
          html_content: string | null
          html_template: string | null
          id: string
          is_active: boolean | null
          name: string | null
          personalization_fields: Json | null
          subject_line: string
          subject_template: string | null
          template_name: string
          template_type: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          design_data?: Json | null
          email_content?: string | null
          html_content?: string | null
          html_template?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          personalization_fields?: Json | null
          subject_line: string
          subject_template?: string | null
          template_name: string
          template_type: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          design_data?: Json | null
          email_content?: string | null
          html_content?: string | null
          html_template?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          personalization_fields?: Json | null
          subject_line?: string
          subject_template?: string | null
          template_name?: string
          template_type?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          address: string | null
          contact_name: string
          created_at: string | null
          email: string | null
          id: string
          is_primary: boolean | null
          primary_phone: string
          relationship: string
          secondary_phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          contact_name: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          primary_phone: string
          relationship: string
          secondary_phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          contact_name?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          primary_phone?: string
          relationship?: string
          secondary_phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "emergency_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "emergency_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "emergency_contacts_user_id_fkey"
            columns: ["user_id"]
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
          student_profile_id: string | null
          thinkific_completion_date: string | null
          thinkific_passed: boolean | null
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
          student_profile_id?: string | null
          thinkific_completion_date?: string | null
          thinkific_passed?: boolean | null
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
          student_profile_id?: string | null
          thinkific_completion_date?: string | null
          thinkific_passed?: boolean | null
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
          {
            foreignKeyName: "fk_enrollments_student_profile_id"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_enrollment_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_analytics_cache: {
        Row: {
          cache_data: Json
          cache_key: string
          cache_type: string
          created_at: string | null
          expires_at: string
          id: string
        }
        Insert: {
          cache_data: Json
          cache_key: string
          cache_type: string
          created_at?: string | null
          expires_at: string
          id?: string
        }
        Update: {
          cache_data?: Json
          cache_key?: string
          cache_type?: string
          created_at?: string | null
          expires_at?: string
          id?: string
        }
        Relationships: []
      }
      enterprise_compliance_metrics: {
        Row: {
          compliance_status: string | null
          created_at: string | null
          id: string
          location_id: string | null
          measurement_date: string
          metric_type: string
          metric_value: number
          provider_id: number | null
          team_id: string | null
          threshold_value: number | null
        }
        Insert: {
          compliance_status?: string | null
          created_at?: string | null
          id?: string
          location_id?: string | null
          measurement_date?: string
          metric_type: string
          metric_value: number
          provider_id?: number | null
          team_id?: string | null
          threshold_value?: number | null
        }
        Update: {
          compliance_status?: string | null
          created_at?: string | null
          id?: string
          location_id?: string | null
          measurement_date?: string
          metric_type?: string
          metric_value?: number
          provider_id?: number | null
          team_id?: string | null
          threshold_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_compliance_metrics_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_compliance_metrics_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      export_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          expires_at: string | null
          export_status: string | null
          export_type: string
          file_path: string | null
          file_size: number | null
          filter_criteria: Json | null
          id: string
          record_count: number | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          export_status?: string | null
          export_type: string
          file_path?: string | null
          file_size?: number | null
          filter_criteria?: Json | null
          id?: string
          record_count?: number | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          export_status?: string | null
          export_type?: string
          file_path?: string | null
          file_size?: number | null
          filter_criteria?: Json | null
          id?: string
          record_count?: number | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      external_approval_systems: {
        Row: {
          authentication_config: Json
          created_at: string | null
          created_by: string | null
          endpoint_url: string
          id: string
          is_active: boolean | null
          last_sync: string | null
          system_name: string
          system_type: string
          updated_at: string | null
          webhook_config: Json | null
        }
        Insert: {
          authentication_config: Json
          created_at?: string | null
          created_by?: string | null
          endpoint_url: string
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          system_name: string
          system_type: string
          updated_at?: string | null
          webhook_config?: Json | null
        }
        Update: {
          authentication_config?: Json
          created_at?: string | null
          created_by?: string | null
          endpoint_url?: string
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          system_name?: string
          system_type?: string
          updated_at?: string | null
          webhook_config?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "external_approval_systems_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "external_approval_systems_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "external_approval_systems_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "external_approval_systems_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      external_calendar_integrations: {
        Row: {
          access_token: string | null
          created_at: string
          error_message: string | null
          id: string
          last_sync_at: string | null
          provider_email: string
          provider_type: string
          refresh_token: string | null
          sync_enabled: boolean
          sync_settings: Json | null
          sync_status: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          provider_email: string
          provider_type: string
          refresh_token?: string | null
          sync_enabled?: boolean
          sync_settings?: Json | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          provider_email?: string
          provider_type?: string
          refresh_token?: string | null
          sync_enabled?: boolean
          sync_settings?: Json | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      file_attachments: {
        Row: {
          download_count: number | null
          expires_at: string | null
          file_size: number
          file_type: string
          id: string
          is_public: boolean | null
          metadata: Json | null
          mime_type: string
          original_filename: string
          storage_bucket: string | null
          storage_path: string
          stored_filename: string
          uploaded_at: string | null
          uploader_id: string | null
          virus_scan_status: string | null
        }
        Insert: {
          download_count?: number | null
          expires_at?: string | null
          file_size: number
          file_type: string
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          mime_type: string
          original_filename: string
          storage_bucket?: string | null
          storage_path: string
          stored_filename: string
          uploaded_at?: string | null
          uploader_id?: string | null
          virus_scan_status?: string | null
        }
        Update: {
          download_count?: number | null
          expires_at?: string | null
          file_size?: number
          file_type?: string
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          mime_type?: string
          original_filename?: string
          storage_bucket?: string | null
          storage_path?: string
          stored_filename?: string
          uploaded_at?: string | null
          uploader_id?: string | null
          virus_scan_status?: string | null
        }
        Relationships: []
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
          provider_id: string
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
          provider_id: string
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
          provider_id?: string
          role?: string
          specializations?: Json | null
          start_date?: string | null
          status?: string
          supervisor_id?: string | null
          teaching_hours?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      invitation_email_logs: {
        Row: {
          created_at: string | null
          delivery_details: Json | null
          delivery_status: string | null
          email_body: string | null
          email_subject: string | null
          email_type: string
          id: string
          invitation_id: string
          sent_at: string | null
          sent_to: string
        }
        Insert: {
          created_at?: string | null
          delivery_details?: Json | null
          delivery_status?: string | null
          email_body?: string | null
          email_subject?: string | null
          email_type: string
          id?: string
          invitation_id: string
          sent_at?: string | null
          sent_to: string
        }
        Update: {
          created_at?: string | null
          delivery_details?: Json | null
          delivery_status?: string | null
          email_body?: string | null
          email_subject?: string | null
          email_type?: string
          id?: string
          invitation_id?: string
          sent_at?: string | null
          sent_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_email_logs_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "team_member_invitations"
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
      location_performance_heatmaps: {
        Row: {
          activity_density: number | null
          analysis_period_end: string
          analysis_period_start: string
          compliance_rating: number | null
          created_at: string | null
          heat_intensity: number | null
          id: string
          location_id: string | null
          performance_score: number
          risk_factors: Json | null
        }
        Insert: {
          activity_density?: number | null
          analysis_period_end: string
          analysis_period_start: string
          compliance_rating?: number | null
          created_at?: string | null
          heat_intensity?: number | null
          id?: string
          location_id?: string | null
          performance_score: number
          risk_factors?: Json | null
        }
        Update: {
          activity_density?: number | null
          analysis_period_end?: string
          analysis_period_start?: string
          compliance_rating?: number | null
          created_at?: string | null
          heat_intensity?: number | null
          id?: string
          location_id?: string | null
          performance_score?: number
          risk_factors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "location_performance_heatmaps_location_id_fkey"
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
      member_activity_logs: {
        Row: {
          activity_description: string | null
          activity_type: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          activity_description?: string | null
          activity_type: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          activity_description?: string | null
          activity_type?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "member_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "member_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "member_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_compliance_status: {
        Row: {
          checked_by: string | null
          compliance_data: Json | null
          created_at: string | null
          id: string
          last_checked: string | null
          next_due_date: string | null
          requirement_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          checked_by?: string | null
          compliance_data?: Json | null
          created_at?: string | null
          id?: string
          last_checked?: string | null
          next_due_date?: string | null
          requirement_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          checked_by?: string | null
          compliance_data?: Json | null
          created_at?: string | null
          id?: string
          last_checked?: string | null
          next_due_date?: string | null
          requirement_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_compliance_status_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "member_compliance_status_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "member_compliance_status_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "member_compliance_status_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_compliance_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "member_compliance_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "member_compliance_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "member_compliance_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_skills: {
        Row: {
          certification_date: string | null
          certified: boolean | null
          created_at: string | null
          expiry_date: string | null
          id: string
          metadata: Json | null
          proficiency_level: number | null
          skill_name: string
          updated_at: string | null
          user_id: string | null
          verified_by: string | null
        }
        Insert: {
          certification_date?: string | null
          certified?: boolean | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          metadata?: Json | null
          proficiency_level?: number | null
          skill_name: string
          updated_at?: string | null
          user_id?: string | null
          verified_by?: string | null
        }
        Update: {
          certification_date?: string | null
          certified?: boolean | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          metadata?: Json | null
          proficiency_level?: number | null
          skill_name?: string
          updated_at?: string | null
          user_id?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "member_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "member_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "member_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_skills_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "member_skills_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "member_skills_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "member_skills_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_search_index: {
        Row: {
          channel_type: string | null
          created_at: string | null
          id: string
          message_id: string
          message_timestamp: string | null
          message_type: string
          recipient_ids: string[]
          search_content: string
          search_vector: unknown | null
          sender_id: string | null
          tags: string[] | null
        }
        Insert: {
          channel_type?: string | null
          created_at?: string | null
          id?: string
          message_id: string
          message_timestamp?: string | null
          message_type: string
          recipient_ids: string[]
          search_content: string
          search_vector?: unknown | null
          sender_id?: string | null
          tags?: string[] | null
        }
        Update: {
          channel_type?: string | null
          created_at?: string | null
          id?: string
          message_id?: string
          message_timestamp?: string | null
          message_type?: string
          recipient_ids?: string[]
          search_content?: string
          search_vector?: unknown | null
          sender_id?: string | null
          tags?: string[] | null
        }
        Relationships: []
      }
      notification_delivery_log: {
        Row: {
          content_summary: string | null
          created_at: string
          delivered_at: string | null
          delivery_address: string | null
          delivery_method: string
          error_message: string | null
          id: string
          message_id: string | null
          notification_type: string
          status: string | null
          user_id: string
        }
        Insert: {
          content_summary?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_method: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          notification_type: string
          status?: string | null
          user_id: string
        }
        Update: {
          content_summary?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_method?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          notification_type?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          delivery_address: string | null
          delivery_method: string
          enabled: boolean
          id: string
          notification_type: string
          settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_address?: string | null
          delivery_method: string
          enabled?: boolean
          id?: string
          notification_type: string
          settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_address?: string | null
          delivery_method?: string
          enabled?: boolean
          id?: string
          notification_type?: string
          settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_template_variables: {
        Row: {
          created_at: string | null
          default_value: string | null
          description: string | null
          id: string
          is_required: boolean | null
          template_id: string
          validation_rules: Json | null
          variable_name: string
          variable_type: string
        }
        Insert: {
          created_at?: string | null
          default_value?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          template_id: string
          validation_rules?: Json | null
          variable_name: string
          variable_type: string
        }
        Update: {
          created_at?: string | null
          default_value?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          template_id?: string
          validation_rules?: Json | null
          variable_name?: string
          variable_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_template_variables_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          approval_required: boolean | null
          approved_at: string | null
          approved_by: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          default_metadata: Json | null
          delivery_channels: Json | null
          email_body_template: string | null
          email_subject_template: string | null
          id: string
          is_active: boolean | null
          is_system_template: boolean | null
          localization: Json | null
          message_template: string
          personalization_rules: Json | null
          priority: string | null
          push_template: string | null
          sms_template: string | null
          template_name: string
          template_type: string
          template_version: string | null
          title_template: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          approval_required?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          default_metadata?: Json | null
          delivery_channels?: Json | null
          email_body_template?: string | null
          email_subject_template?: string | null
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          localization?: Json | null
          message_template: string
          personalization_rules?: Json | null
          priority?: string | null
          push_template?: string | null
          sms_template?: string | null
          template_name: string
          template_type: string
          template_version?: string | null
          title_template: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          approval_required?: boolean | null
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          default_metadata?: Json | null
          delivery_channels?: Json | null
          email_body_template?: string | null
          email_subject_template?: string | null
          id?: string
          is_active?: boolean | null
          is_system_template?: boolean | null
          localization?: Json | null
          message_template?: string
          personalization_rules?: Json | null
          priority?: string | null
          push_template?: string | null
          sms_template?: string | null
          template_name?: string
          template_type?: string
          template_version?: string | null
          title_template?: string
          updated_at?: string | null
          variables?: Json | null
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
      offline_sync_queue: {
        Row: {
          conflict_resolution: Json | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          operation_data: Json
          operation_type: string
          sync_status: string | null
          synced_at: string | null
          user_id: string | null
        }
        Insert: {
          conflict_resolution?: Json | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          operation_data: Json
          operation_type: string
          sync_status?: string | null
          synced_at?: string | null
          user_id?: string | null
        }
        Update: {
          conflict_resolution?: Json | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          operation_data?: Json
          operation_type?: string
          sync_status?: string | null
          synced_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offline_sync_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "offline_sync_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "offline_sync_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "offline_sync_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          created_at: string | null
          endpoint_path: string | null
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          metric_unit: string | null
          metric_value: number
          request_id: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint_path?: string | null
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          metric_unit?: string | null
          metric_value: number
          request_id?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint_path?: string | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          metric_unit?: string | null
          metric_value?: number
          request_id?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "performance_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "performance_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "performance_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_health_metrics: {
        Row: {
          calculated_at: string | null
          conversion_rate: number
          coverage_ratio: number
          created_at: string | null
          health_score_value: number
          health_status: string
          id: string
          pipeline_volume: number
          quality_score: number
          updated_at: string | null
          user_id: string | null
          velocity_score: number
        }
        Insert: {
          calculated_at?: string | null
          conversion_rate: number
          coverage_ratio: number
          created_at?: string | null
          health_score_value: number
          health_status?: string
          id?: string
          pipeline_volume: number
          quality_score: number
          updated_at?: string | null
          user_id?: string | null
          velocity_score: number
        }
        Update: {
          calculated_at?: string | null
          conversion_rate?: number
          coverage_ratio?: number
          created_at?: string | null
          health_score_value?: number
          health_status?: string
          id?: string
          pipeline_volume?: number
          quality_score?: number
          updated_at?: string | null
          user_id?: string | null
          velocity_score?: number
        }
        Relationships: []
      }
      predictive_models: {
        Row: {
          accuracy_score: number | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          last_trained: string | null
          model_name: string
          model_parameters: Json
          model_type: string
          target_metric: string
          training_data_config: Json
          updated_at: string | null
        }
        Insert: {
          accuracy_score?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_trained?: string | null
          model_name: string
          model_parameters: Json
          model_type: string
          target_metric: string
          training_data_config: Json
          updated_at?: string | null
        }
        Update: {
          accuracy_score?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_trained?: string | null
          model_name?: string
          model_parameters?: Json
          model_type?: string
          target_metric?: string
          training_data_config?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "predictive_models_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "predictive_models_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "predictive_models_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "predictive_models_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          certifications_count: number | null
          compliance_notes: string | null
          compliance_reminder_frequency: number | null
          compliance_score: number | null
          compliance_status: boolean | null
          compliance_tier: string | null
          created_at: string
          department: string | null
          display_name: string | null
          email: string | null
          id: string
          job_title: string | null
          last_compliance_check: string | null
          last_login: string | null
          last_training_date: string | null
          location_id: string | null
          next_training_due: string | null
          organization: string | null
          pending_actions: number | null
          performance_score: number | null
          phone: string | null
          role: string
          status: string
          supervisor_id: string | null
          team_count: number | null
          tier_upgrade_eligible: boolean | null
          tier_upgrade_requested_at: string | null
          training_hours: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          certifications_count?: number | null
          compliance_notes?: string | null
          compliance_reminder_frequency?: number | null
          compliance_score?: number | null
          compliance_status?: boolean | null
          compliance_tier?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          job_title?: string | null
          last_compliance_check?: string | null
          last_login?: string | null
          last_training_date?: string | null
          location_id?: string | null
          next_training_due?: string | null
          organization?: string | null
          pending_actions?: number | null
          performance_score?: number | null
          phone?: string | null
          role?: string
          status?: string
          supervisor_id?: string | null
          team_count?: number | null
          tier_upgrade_eligible?: boolean | null
          tier_upgrade_requested_at?: string | null
          training_hours?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          certifications_count?: number | null
          compliance_notes?: string | null
          compliance_reminder_frequency?: number | null
          compliance_score?: number | null
          compliance_status?: boolean | null
          compliance_tier?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          job_title?: string | null
          last_compliance_check?: string | null
          last_login?: string | null
          last_training_date?: string | null
          location_id?: string | null
          next_training_due?: string | null
          organization?: string | null
          pending_actions?: number | null
          performance_score?: number | null
          phone?: string | null
          role?: string
          status?: string
          supervisor_id?: string | null
          team_count?: number | null
          tier_upgrade_eligible?: boolean | null
          tier_upgrade_requested_at?: string | null
          training_hours?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "profiles_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "profiles_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
      provider_assignment_workflows: {
        Row: {
          ap_user_conflicts: Json | null
          assignment_summary: Json | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string | null
          current_step: number
          failure_reason: string | null
          id: string
          initiated_by: string
          location_availability: Json | null
          provider_configuration: Json | null
          selected_ap_user_id: string | null
          selected_location_id: string | null
          started_at: string | null
          team_assignments: Json | null
          updated_at: string | null
          validation_results: Json | null
          workflow_status: string
          workflow_type: string
        }
        Insert: {
          ap_user_conflicts?: Json | null
          assignment_summary?: Json | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_step?: number
          failure_reason?: string | null
          id?: string
          initiated_by: string
          location_availability?: Json | null
          provider_configuration?: Json | null
          selected_ap_user_id?: string | null
          selected_location_id?: string | null
          started_at?: string | null
          team_assignments?: Json | null
          updated_at?: string | null
          validation_results?: Json | null
          workflow_status?: string
          workflow_type?: string
        }
        Update: {
          ap_user_conflicts?: Json | null
          assignment_summary?: Json | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_step?: number
          failure_reason?: string | null
          id?: string
          initiated_by?: string
          location_availability?: Json | null
          provider_configuration?: Json | null
          selected_ap_user_id?: string | null
          selected_location_id?: string | null
          started_at?: string | null
          team_assignments?: Json | null
          updated_at?: string | null
          validation_results?: Json | null
          workflow_status?: string
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_assignment_workflows_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "provider_assignment_workflows_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "provider_assignment_workflows_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "provider_assignment_workflows_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_assignment_workflows_selected_ap_user_id_fkey"
            columns: ["selected_ap_user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "provider_assignment_workflows_selected_ap_user_id_fkey"
            columns: ["selected_ap_user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "provider_assignment_workflows_selected_ap_user_id_fkey"
            columns: ["selected_ap_user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "provider_assignment_workflows_selected_ap_user_id_fkey"
            columns: ["selected_ap_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_assignment_workflows_selected_location_id_fkey"
            columns: ["selected_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_location_assignments: {
        Row: {
          assigned_by: string | null
          assignment_role: string | null
          created_at: string | null
          end_date: string | null
          id: string
          location_id: string
          provider_id: string
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_by?: string | null
          assignment_role?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          location_id: string
          provider_id: string
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string | null
          assignment_role?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          location_id?: string
          provider_id?: string
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_provider_location_assignments_assigned_by"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_provider_location_assignments_assigned_by"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_provider_location_assignments_assigned_by"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_provider_location_assignments_assigned_by"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_provider_location_assignments_location_id"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_provider_location_assignments_provider_id"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "authorized_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_navigation_configs: {
        Row: {
          config_overrides: Json
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          provider_id: string
          updated_at: string | null
        }
        Insert: {
          config_overrides?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          provider_id?: string
          updated_at?: string | null
        }
        Update: {
          config_overrides?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_navigation_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
      provider_notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          notification_type: string
          priority: string | null
          provider_id: string
          read_at: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          notification_type: string
          priority?: string | null
          provider_id: string
          read_at?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string
          priority?: string | null
          provider_id?: string
          read_at?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_notifications_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
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
            foreignKeyName: "provider_performance_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_performance_metrics: {
        Row: {
          average_satisfaction_score: number | null
          certificates_issued: number | null
          compliance_score: number | null
          courses_conducted: number | null
          created_at: string | null
          id: string
          locations_served: number | null
          measurement_period: string
          performance_rating: number | null
          provider_id: string
          team_members_managed: number | null
          updated_at: string | null
        }
        Insert: {
          average_satisfaction_score?: number | null
          certificates_issued?: number | null
          compliance_score?: number | null
          courses_conducted?: number | null
          created_at?: string | null
          id?: string
          locations_served?: number | null
          measurement_period?: string
          performance_rating?: number | null
          provider_id: string
          team_members_managed?: number | null
          updated_at?: string | null
        }
        Update: {
          average_satisfaction_score?: number | null
          certificates_issued?: number | null
          compliance_score?: number | null
          courses_conducted?: number | null
          created_at?: string | null
          id?: string
          locations_served?: number | null
          measurement_period?: string
          performance_rating?: number | null
          provider_id?: string
          team_members_managed?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_provider_performance_metrics_provider_id"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "authorized_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_settings: {
        Row: {
          api_access_enabled: boolean | null
          assessment_data_retention_days: number | null
          audit_trail_retention_days: number | null
          auto_assignment_enabled: boolean | null
          auto_reporting_enabled: boolean | null
          batch_processing_retention_days: number | null
          branding_logo_url: string | null
          branding_primary_color: string | null
          branding_secondary_color: string | null
          bulk_operation_limit: number | null
          certificate_data_retention_days: number | null
          communication_records_retention_days: number | null
          compliance_reminder_days: number | null
          created_at: string
          dashboard_layout: Json | null
          default_assignment_role: string | null
          delegation_permissions: Json | null
          display_name: string | null
          email_templates: Json | null
          export_format: string | null
          external_integrations: Json | null
          id: string
          language_preference: string | null
          location_specific_settings: Json | null
          notification_preferences: Json | null
          operating_hours: Json | null
          performance_targets: Json | null
          personal_data_retention_days: number | null
          preferred_communication_method: string | null
          provider_id: string | null
          reporting_schedule: string | null
          session_timeout_minutes: number | null
          team_naming_convention: string | null
          theme_preferences: Json | null
          timezone: string | null
          two_factor_enabled: boolean | null
          updated_at: string
          user_id: string
          workflow_triggers: Json | null
        }
        Insert: {
          api_access_enabled?: boolean | null
          assessment_data_retention_days?: number | null
          audit_trail_retention_days?: number | null
          auto_assignment_enabled?: boolean | null
          auto_reporting_enabled?: boolean | null
          batch_processing_retention_days?: number | null
          branding_logo_url?: string | null
          branding_primary_color?: string | null
          branding_secondary_color?: string | null
          bulk_operation_limit?: number | null
          certificate_data_retention_days?: number | null
          communication_records_retention_days?: number | null
          compliance_reminder_days?: number | null
          created_at?: string
          dashboard_layout?: Json | null
          default_assignment_role?: string | null
          delegation_permissions?: Json | null
          display_name?: string | null
          email_templates?: Json | null
          export_format?: string | null
          external_integrations?: Json | null
          id?: string
          language_preference?: string | null
          location_specific_settings?: Json | null
          notification_preferences?: Json | null
          operating_hours?: Json | null
          performance_targets?: Json | null
          personal_data_retention_days?: number | null
          preferred_communication_method?: string | null
          provider_id?: string | null
          reporting_schedule?: string | null
          session_timeout_minutes?: number | null
          team_naming_convention?: string | null
          theme_preferences?: Json | null
          timezone?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id: string
          workflow_triggers?: Json | null
        }
        Update: {
          api_access_enabled?: boolean | null
          assessment_data_retention_days?: number | null
          audit_trail_retention_days?: number | null
          auto_assignment_enabled?: boolean | null
          auto_reporting_enabled?: boolean | null
          batch_processing_retention_days?: number | null
          branding_logo_url?: string | null
          branding_primary_color?: string | null
          branding_secondary_color?: string | null
          bulk_operation_limit?: number | null
          certificate_data_retention_days?: number | null
          communication_records_retention_days?: number | null
          compliance_reminder_days?: number | null
          created_at?: string
          dashboard_layout?: Json | null
          default_assignment_role?: string | null
          delegation_permissions?: Json | null
          display_name?: string | null
          email_templates?: Json | null
          export_format?: string | null
          external_integrations?: Json | null
          id?: string
          language_preference?: string | null
          location_specific_settings?: Json | null
          notification_preferences?: Json | null
          operating_hours?: Json | null
          performance_targets?: Json | null
          personal_data_retention_days?: number | null
          preferred_communication_method?: string | null
          provider_id?: string | null
          reporting_schedule?: string | null
          session_timeout_minutes?: number | null
          team_naming_convention?: string | null
          theme_preferences?: Json | null
          timezone?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string
          user_id?: string
          workflow_triggers?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_settings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "authorized_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "provider_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "provider_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "provider_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_team_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assignment_role: string | null
          assignment_type: string | null
          created_at: string | null
          end_date: string | null
          id: string
          oversight_level: string | null
          provider_id: string
          start_date: string
          status: string | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_role?: string | null
          assignment_type?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          oversight_level?: string | null
          provider_id: string
          start_date?: string
          status?: string | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_role?: string | null
          assignment_type?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          oversight_level?: string | null
          provider_id?: string
          start_date?: string
          status?: string | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_provider_team_assignments_assigned_by"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
        ]
      }
      provider_team_performance: {
        Row: {
          average_satisfaction_score: number | null
          certifications_issued: number | null
          completion_rate: number | null
          compliance_score: number | null
          courses_delivered: number | null
          created_at: string | null
          id: string
          measurement_period: string
          provider_id: string | null
          team_id: string | null
        }
        Insert: {
          average_satisfaction_score?: number | null
          certifications_issued?: number | null
          completion_rate?: number | null
          compliance_score?: number | null
          courses_delivered?: number | null
          created_at?: string | null
          id?: string
          measurement_period: string
          provider_id?: string | null
          team_id?: string | null
        }
        Update: {
          average_satisfaction_score?: number | null
          certifications_issued?: number | null
          completion_rate?: number | null
          compliance_score?: number | null
          courses_delivered?: number | null
          created_at?: string | null
          id?: string
          measurement_period?: string
          provider_id?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_team_performance_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_team_performance_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_training_capabilities: {
        Row: {
          certification_types: string[] | null
          course_category: string
          created_at: string | null
          equipment_requirements: Json | null
          id: string
          location_restrictions: string[] | null
          max_team_size: number | null
          provider_id: string | null
          updated_at: string | null
        }
        Insert: {
          certification_types?: string[] | null
          course_category: string
          created_at?: string | null
          equipment_requirements?: Json | null
          id?: string
          location_restrictions?: string[] | null
          max_team_size?: number | null
          provider_id?: string | null
          updated_at?: string | null
        }
        Update: {
          certification_types?: string[] | null
          course_category?: string
          created_at?: string | null
          equipment_requirements?: Json | null
          id?: string
          location_restrictions?: string[] | null
          max_team_size?: number | null
          provider_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_training_capabilities_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          address: string | null
          compliance_score: number | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          performance_rating: number | null
          primary_location_id: string | null
          provider_type: string | null
          status: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          compliance_score?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          performance_rating?: number | null
          primary_location_id?: string | null
          provider_type?: string | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          compliance_score?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          performance_rating?: number | null
          primary_location_id?: string | null
          provider_type?: string | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "providers_primary_location_id_fkey"
            columns: ["primary_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      realtime_metrics: {
        Row: {
          category: string
          created_at: string | null
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string | null
          metric_value: number
          recorded_at: string
          unit: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type?: string | null
          metric_value: number
          recorded_at?: string
          unit?: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string | null
          metric_value?: number
          recorded_at?: string
          unit?: string
        }
        Relationships: []
      }
      regulatory_reports: {
        Row: {
          acknowledgment_received: boolean | null
          created_at: string | null
          created_by: string | null
          id: string
          regulatory_body: string
          report_data: Json
          report_name: string
          report_status: string | null
          report_type: string
          reporting_period_end: string
          reporting_period_start: string
          submission_deadline: string | null
          submission_method: string | null
          submission_reference: string | null
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string | null
        }
        Insert: {
          acknowledgment_received?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          regulatory_body: string
          report_data: Json
          report_name: string
          report_status?: string | null
          report_type: string
          reporting_period_end: string
          reporting_period_start: string
          submission_deadline?: string | null
          submission_method?: string | null
          submission_reference?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Update: {
          acknowledgment_received?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          regulatory_body?: string
          report_data?: Json
          report_name?: string
          report_status?: string | null
          report_type?: string
          reporting_period_end?: string
          reporting_period_start?: string
          submission_deadline?: string | null
          submission_method?: string | null
          submission_reference?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "regulatory_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "regulatory_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "regulatory_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regulatory_reports_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "regulatory_reports_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "regulatory_reports_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "regulatory_reports_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      report_executions: {
        Row: {
          completed_at: string | null
          error_message: string | null
          executed_by: string | null
          execution_status: string | null
          file_format: string | null
          file_path: string | null
          id: string
          report_id: string | null
          result_data: Json | null
          started_at: string | null
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          executed_by?: string | null
          execution_status?: string | null
          file_format?: string | null
          file_path?: string | null
          id?: string
          report_id?: string | null
          result_data?: Json | null
          started_at?: string | null
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          executed_by?: string | null
          execution_status?: string | null
          file_format?: string | null
          file_path?: string | null
          id?: string
          report_id?: string | null
          result_data?: Json | null
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_executions_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "report_executions_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "report_executions_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "report_executions_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_executions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "analytics_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_subscriptions: {
        Row: {
          created_at: string | null
          delivery_config: Json | null
          delivery_method: string | null
          frequency: string | null
          id: string
          is_active: boolean | null
          last_delivered: string | null
          next_delivery: string | null
          report_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_config?: Json | null
          delivery_method?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          last_delivered?: string | null
          next_delivery?: string | null
          report_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_config?: Json | null
          delivery_method?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          last_delivered?: string | null
          next_delivery?: string | null
          report_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_subscriptions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "analytics_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "report_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "report_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "report_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_availability: {
        Row: {
          active_assignments: number | null
          availability_status: string
          capacity_current: number
          capacity_maximum: number
          created_at: string | null
          id: string
          last_updated: string | null
          max_concurrent_assignments: number | null
          max_locations_per_user: number | null
          max_teams_per_location: number | null
          pending_assignments: number | null
          resource_id: string
          resource_type: string
          scheduled_assignments: number | null
          utilization_percentage: number | null
        }
        Insert: {
          active_assignments?: number | null
          availability_status: string
          capacity_current?: number
          capacity_maximum?: number
          created_at?: string | null
          id?: string
          last_updated?: string | null
          max_concurrent_assignments?: number | null
          max_locations_per_user?: number | null
          max_teams_per_location?: number | null
          pending_assignments?: number | null
          resource_id: string
          resource_type: string
          scheduled_assignments?: number | null
          utilization_percentage?: number | null
        }
        Update: {
          active_assignments?: number | null
          availability_status?: string
          capacity_current?: number
          capacity_maximum?: number
          created_at?: string | null
          id?: string
          last_updated?: string | null
          max_concurrent_assignments?: number | null
          max_locations_per_user?: number | null
          max_teams_per_location?: number | null
          pending_assignments?: number | null
          resource_id?: string
          resource_type?: string
          scheduled_assignments?: number | null
          utilization_percentage?: number | null
        }
        Relationships: []
      }
      risk_assessments: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          identified_by: string | null
          impact_score: number | null
          likelihood_score: number | null
          mitigation_deadline: string | null
          mitigation_plan: string | null
          owner_id: string | null
          review_date: string | null
          risk_category: string
          risk_description: string | null
          risk_level: string | null
          risk_name: string
          risk_score: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          identified_by?: string | null
          impact_score?: number | null
          likelihood_score?: number | null
          mitigation_deadline?: string | null
          mitigation_plan?: string | null
          owner_id?: string | null
          review_date?: string | null
          risk_category: string
          risk_description?: string | null
          risk_level?: string | null
          risk_name: string
          risk_score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          identified_by?: string | null
          impact_score?: number | null
          likelihood_score?: number | null
          mitigation_deadline?: string | null
          mitigation_plan?: string | null
          owner_id?: string | null
          review_date?: string | null
          risk_category?: string
          risk_description?: string | null
          risk_level?: string | null
          risk_name?: string
          risk_score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_assessments_identified_by_fkey"
            columns: ["identified_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "risk_assessments_identified_by_fkey"
            columns: ["identified_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "risk_assessments_identified_by_fkey"
            columns: ["identified_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "risk_assessments_identified_by_fkey"
            columns: ["identified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_assessments_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "risk_assessments_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "risk_assessments_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "risk_assessments_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_mitigation_actions: {
        Row: {
          action_description: string | null
          action_name: string
          action_type: string
          actual_cost: number | null
          assigned_to: string | null
          completion_date: string | null
          cost_estimate: number | null
          created_at: string | null
          due_date: string | null
          effectiveness_rating: number | null
          id: string
          priority: string | null
          risk_assessment_id: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          action_description?: string | null
          action_name: string
          action_type: string
          actual_cost?: number | null
          assigned_to?: string | null
          completion_date?: string | null
          cost_estimate?: number | null
          created_at?: string | null
          due_date?: string | null
          effectiveness_rating?: number | null
          id?: string
          priority?: string | null
          risk_assessment_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          action_description?: string | null
          action_name?: string
          action_type?: string
          actual_cost?: number | null
          assigned_to?: string | null
          completion_date?: string | null
          cost_estimate?: number | null
          created_at?: string | null
          due_date?: string | null
          effectiveness_rating?: number | null
          id?: string
          priority?: string | null
          risk_assessment_id?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_mitigation_actions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "risk_mitigation_actions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "risk_mitigation_actions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "risk_mitigation_actions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_mitigation_actions_risk_assessment_id_fkey"
            columns: ["risk_assessment_id"]
            isOneToOne: false
            referencedRelation: "risk_assessments"
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
      roster_enrollments: {
        Row: {
          attendance_status: string | null
          created_at: string | null
          enrollment_date: string | null
          id: string
          notes: string | null
          online_completion_date: string | null
          online_completion_status: string | null
          practical_completion_date: string | null
          practical_completion_status: string | null
          roster_id: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          attendance_status?: string | null
          created_at?: string | null
          enrollment_date?: string | null
          id?: string
          notes?: string | null
          online_completion_date?: string | null
          online_completion_status?: string | null
          practical_completion_date?: string | null
          practical_completion_status?: string | null
          roster_id: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          attendance_status?: string | null
          created_at?: string | null
          enrollment_date?: string | null
          id?: string
          notes?: string | null
          online_completion_date?: string | null
          online_completion_status?: string | null
          practical_completion_date?: string | null
          practical_completion_status?: string | null
          roster_id?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roster_enrollments_roster_id_fkey"
            columns: ["roster_id"]
            isOneToOne: false
            referencedRelation: "student_rosters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_enrollment_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_export_logs: {
        Row: {
          batch_upload_id: string | null
          export_data: Json | null
          export_format: string | null
          export_status: string | null
          exported_at: string | null
          exported_by: string | null
          file_name: string | null
          id: string
          notes: string | null
          roster_id: string
        }
        Insert: {
          batch_upload_id?: string | null
          export_data?: Json | null
          export_format?: string | null
          export_status?: string | null
          exported_at?: string | null
          exported_by?: string | null
          file_name?: string | null
          id?: string
          notes?: string | null
          roster_id: string
        }
        Update: {
          batch_upload_id?: string | null
          export_data?: Json | null
          export_format?: string | null
          export_status?: string | null
          exported_at?: string | null
          exported_by?: string | null
          file_name?: string | null
          id?: string
          notes?: string | null
          roster_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roster_export_logs_exported_by_fkey"
            columns: ["exported_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "roster_export_logs_exported_by_fkey"
            columns: ["exported_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "roster_export_logs_exported_by_fkey"
            columns: ["exported_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "roster_export_logs_exported_by_fkey"
            columns: ["exported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_export_logs_roster_id_fkey"
            columns: ["roster_id"]
            isOneToOne: false
            referencedRelation: "student_rosters"
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
      search_analytics: {
        Row: {
          created_at: string | null
          id: string
          results_count: number | null
          search_duration_ms: number | null
          search_filters: Json | null
          search_query: string
          selected_result_id: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          results_count?: number | null
          search_duration_ms?: number | null
          search_filters?: Json | null
          search_query: string
          selected_result_id?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          results_count?: number | null
          search_duration_ms?: number | null
          search_filters?: Json | null
          search_query?: string
          selected_result_id?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "search_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "search_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "search_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      search_index: {
        Row: {
          boost_score: number | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          search_content: string
          search_vector: unknown | null
          updated_at: string | null
        }
        Insert: {
          boost_score?: number | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          search_content: string
          search_vector?: unknown | null
          updated_at?: string | null
        }
        Update: {
          boost_score?: number | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          search_content?: string
          search_vector?: unknown | null
          updated_at?: string | null
        }
        Relationships: []
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
      student_enrollment_profiles: {
        Row: {
          assessment_status: string | null
          city: string | null
          company: string | null
          completion_status: string | null
          course_length: number | null
          cpr_level: string | null
          created_at: string | null
          display_name: string | null
          email: string
          enrollment_status: string | null
          external_student_id: string | null
          first_aid_level: string | null
          first_name: string | null
          id: string
          import_date: string | null
          imported_from: string | null
          instructor_name: string | null
          is_active: boolean | null
          last_name: string | null
          last_sync_date: string | null
          location_id: string | null
          notes: string | null
          online_completed_at: string | null
          phone: string | null
          postal_code: string | null
          practical_completed_at: string | null
          province: string | null
          student_metadata: Json | null
          sync_status: string | null
          thinkific_user_id: string | null
          updated_at: string | null
        }
        Insert: {
          assessment_status?: string | null
          city?: string | null
          company?: string | null
          completion_status?: string | null
          course_length?: number | null
          cpr_level?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          enrollment_status?: string | null
          external_student_id?: string | null
          first_aid_level?: string | null
          first_name?: string | null
          id?: string
          import_date?: string | null
          imported_from?: string | null
          instructor_name?: string | null
          is_active?: boolean | null
          last_name?: string | null
          last_sync_date?: string | null
          location_id?: string | null
          notes?: string | null
          online_completed_at?: string | null
          phone?: string | null
          postal_code?: string | null
          practical_completed_at?: string | null
          province?: string | null
          student_metadata?: Json | null
          sync_status?: string | null
          thinkific_user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment_status?: string | null
          city?: string | null
          company?: string | null
          completion_status?: string | null
          course_length?: number | null
          cpr_level?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          enrollment_status?: string | null
          external_student_id?: string | null
          first_aid_level?: string | null
          first_name?: string | null
          id?: string
          import_date?: string | null
          imported_from?: string | null
          instructor_name?: string | null
          is_active?: boolean | null
          last_name?: string | null
          last_sync_date?: string | null
          location_id?: string | null
          notes?: string | null
          online_completed_at?: string | null
          phone?: string | null
          postal_code?: string | null
          practical_completed_at?: string | null
          province?: string | null
          student_metadata?: Json | null
          sync_status?: string | null
          thinkific_user_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollment_profiles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      student_rosters: {
        Row: {
          course_name: string
          created_at: string | null
          created_by: string | null
          current_enrollment: number | null
          id: string
          instructor_id: string | null
          location_id: string | null
          max_capacity: number | null
          roster_name: string
          roster_status: string | null
          scheduled_end_date: string | null
          scheduled_start_date: string | null
          updated_at: string | null
        }
        Insert: {
          course_name: string
          created_at?: string | null
          created_by?: string | null
          current_enrollment?: number | null
          id?: string
          instructor_id?: string | null
          location_id?: string | null
          max_capacity?: number | null
          roster_name: string
          roster_status?: string | null
          scheduled_end_date?: string | null
          scheduled_start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          course_name?: string
          created_at?: string | null
          created_by?: string | null
          current_enrollment?: number | null
          id?: string
          instructor_id?: string | null
          location_id?: string | null
          max_capacity?: number | null
          roster_name?: string
          roster_status?: string | null
          scheduled_end_date?: string | null
          scheduled_start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_rosters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "student_rosters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "student_rosters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "student_rosters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_rosters_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "student_rosters_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "student_rosters_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "student_rosters_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_rosters_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
          data_type?: string
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
      system_health_checks: {
        Row: {
          check_name: string
          check_type: string
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          response_time_ms: number | null
          status: string
        }
        Insert: {
          check_name: string
          check_type: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          status: string
        }
        Update: {
          check_name?: string
          check_type?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          status?: string
        }
        Relationships: []
      }
      system_health_snapshots: {
        Row: {
          active_alerts_count: number | null
          component_scores: Json
          created_at: string | null
          critical_issues: Json | null
          id: string
          overall_health_score: number
          performance_summary: Json | null
          resource_utilization: Json | null
          snapshot_timestamp: string
          snapshot_type: string | null
        }
        Insert: {
          active_alerts_count?: number | null
          component_scores?: Json
          created_at?: string | null
          critical_issues?: Json | null
          id?: string
          overall_health_score: number
          performance_summary?: Json | null
          resource_utilization?: Json | null
          snapshot_timestamp?: string
          snapshot_type?: string | null
        }
        Update: {
          active_alerts_count?: number | null
          component_scores?: Json
          created_at?: string | null
          critical_issues?: Json | null
          id?: string
          overall_health_score?: number
          performance_summary?: Json | null
          resource_utilization?: Json | null
          snapshot_timestamp?: string
          snapshot_type?: string | null
        }
        Relationships: []
      }
      system_metric_aggregations: {
        Row: {
          aggregated_value: number
          aggregation_period: string
          aggregation_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          metric_name: string
          period_end: string
          period_start: string
          sample_count: number | null
        }
        Insert: {
          aggregated_value: number
          aggregation_period: string
          aggregation_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name: string
          period_end: string
          period_start: string
          sample_count?: number | null
        }
        Update: {
          aggregated_value?: number
          aggregation_period?: string
          aggregation_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          period_end?: string
          period_start?: string
          sample_count?: number | null
        }
        Relationships: []
      }
      system_metric_alerts: {
        Row: {
          alert_condition: string
          alert_name: string
          alert_severity: string | null
          alert_status: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          metric_name: string
          notification_channels: Json | null
          threshold_value: number
          trigger_count: number | null
          updated_at: string | null
        }
        Insert: {
          alert_condition: string
          alert_name: string
          alert_severity?: string | null
          alert_status?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          metric_name: string
          notification_channels?: Json | null
          threshold_value: number
          trigger_count?: number | null
          updated_at?: string | null
        }
        Update: {
          alert_condition?: string
          alert_name?: string
          alert_severity?: string | null
          alert_status?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          metric_name?: string
          notification_channels?: Json | null
          threshold_value?: number
          trigger_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_metric_alerts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "system_metric_alerts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "system_metric_alerts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "system_metric_alerts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_metrics: {
        Row: {
          aggregation_period: string | null
          anomaly_score: number | null
          created_at: string | null
          environment: string | null
          expires_at: string | null
          id: string
          is_anomaly: boolean | null
          measurement_timestamp: string
          metadata: Json | null
          metric_category: string
          metric_name: string
          metric_type: string
          metric_unit: string | null
          metric_value: number | null
          source_component: string | null
          source_instance: string | null
          tags: Json | null
        }
        Insert: {
          aggregation_period?: string | null
          anomaly_score?: number | null
          created_at?: string | null
          environment?: string | null
          expires_at?: string | null
          id?: string
          is_anomaly?: boolean | null
          measurement_timestamp?: string
          metadata?: Json | null
          metric_category?: string
          metric_name: string
          metric_type?: string
          metric_unit?: string | null
          metric_value?: number | null
          source_component?: string | null
          source_instance?: string | null
          tags?: Json | null
        }
        Update: {
          aggregation_period?: string | null
          anomaly_score?: number | null
          created_at?: string | null
          environment?: string | null
          expires_at?: string | null
          id?: string
          is_anomaly?: boolean | null
          measurement_timestamp?: string
          metadata?: Json | null
          metric_category?: string
          metric_name?: string
          metric_type?: string
          metric_unit?: string | null
          metric_value?: number | null
          source_component?: string | null
          source_instance?: string | null
          tags?: Json | null
        }
        Relationships: []
      }
      system_performance_baselines: {
        Row: {
          baseline_date: string
          baseline_deviation: number | null
          baseline_period: string
          baseline_value: number
          calculated_at: string | null
          confidence_interval: number | null
          created_at: string | null
          id: string
          is_current: boolean | null
          metric_name: string
          sample_size: number | null
        }
        Insert: {
          baseline_date: string
          baseline_deviation?: number | null
          baseline_period: string
          baseline_value: number
          calculated_at?: string | null
          confidence_interval?: number | null
          created_at?: string | null
          id?: string
          is_current?: boolean | null
          metric_name: string
          sample_size?: number | null
        }
        Update: {
          baseline_date?: string
          baseline_deviation?: number | null
          baseline_period?: string
          baseline_value?: number
          calculated_at?: string | null
          confidence_interval?: number | null
          created_at?: string | null
          id?: string
          is_current?: boolean | null
          metric_name?: string
          sample_size?: number | null
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
      system_usage_patterns: {
        Row: {
          created_at: string | null
          error_count: number | null
          feature_name: string
          id: string
          pattern_data: Json | null
          peak_usage_hour: number | null
          success_rate: number | null
          total_duration_seconds: number | null
          unique_users: number | null
          usage_count: number | null
          usage_date: string
        }
        Insert: {
          created_at?: string | null
          error_count?: number | null
          feature_name: string
          id?: string
          pattern_data?: Json | null
          peak_usage_hour?: number | null
          success_rate?: number | null
          total_duration_seconds?: number | null
          unique_users?: number | null
          usage_count?: number | null
          usage_date: string
        }
        Update: {
          created_at?: string | null
          error_count?: number | null
          feature_name?: string
          id?: string
          pattern_data?: Json | null
          peak_usage_hour?: number | null
          success_rate?: number | null
          total_duration_seconds?: number | null
          unique_users?: number | null
          usage_count?: number | null
          usage_date?: string
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
      team_approval_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approver_comments: string | null
          created_at: string | null
          current_step: number | null
          id: string
          rejected_reason: string | null
          request_data: Json
          request_type: string
          requested_by: string | null
          status: string | null
          team_id: string | null
          updated_at: string | null
          workflow_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approver_comments?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          rejected_reason?: string | null
          request_data?: Json
          request_type: string
          requested_by?: string | null
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
          workflow_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approver_comments?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          rejected_reason?: string | null
          request_data?: Json
          request_type?: string
          requested_by?: string | null
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_approval_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_approval_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_approval_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_approval_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_approval_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_approval_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_approval_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_approval_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_approval_requests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_approval_requests_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "team_approval_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      team_approval_workflows: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          steps: Json
          team_id: string | null
          updated_at: string | null
          workflow_name: string
          workflow_type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          steps?: Json
          team_id?: string | null
          updated_at?: string | null
          workflow_name: string
          workflow_type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          steps?: Json
          team_id?: string | null
          updated_at?: string | null
          workflow_name?: string
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_approval_workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_approval_workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_approval_workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_approval_workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_approval_workflows_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_availability_permissions: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_by: string | null
          id: string
          manager_id: string
          permission_level: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          manager_id: string
          permission_level?: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          manager_id?: string
          permission_level?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_availability_permissions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_bulk_operations: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_details: string | null
          id: string
          operation_data: Json
          operation_type: string
          performed_by: string | null
          results: Json | null
          status: string | null
          team_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_details?: string | null
          id?: string
          operation_data?: Json
          operation_type: string
          performed_by?: string | null
          results?: Json | null
          status?: string | null
          team_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_details?: string | null
          id?: string
          operation_data?: Json
          operation_type?: string
          performed_by?: string | null
          results?: Json | null
          status?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_bulk_operations_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_bulk_operations_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_bulk_operations_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_bulk_operations_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_bulk_operations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_governance_rules: {
        Row: {
          approval_required: boolean | null
          approver_roles: string[] | null
          conditions: Json
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          rule_name: string
          rule_type: string
          team_id: string | null
          threshold_values: Json | null
          updated_at: string | null
        }
        Insert: {
          approval_required?: boolean | null
          approver_roles?: string[] | null
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          rule_name: string
          rule_type: string
          team_id?: string | null
          threshold_values?: Json | null
          updated_at?: string | null
        }
        Update: {
          approval_required?: boolean | null
          approver_roles?: string[] | null
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          rule_name?: string
          rule_type?: string
          team_id?: string | null
          threshold_values?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_governance_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_governance_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_governance_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_governance_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_governance_rules_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_lifecycle_events: {
        Row: {
          affected_user_id: string | null
          event_data: Json
          event_timestamp: string | null
          event_type: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          performed_by: string | null
          team_id: string | null
          user_agent: string | null
        }
        Insert: {
          affected_user_id?: string | null
          event_data?: Json
          event_timestamp?: string | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
          team_id?: string | null
          user_agent?: string | null
        }
        Update: {
          affected_user_id?: string | null
          event_data?: Json
          event_timestamp?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string | null
          team_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_lifecycle_events_affected_user_id_fkey"
            columns: ["affected_user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_lifecycle_events_affected_user_id_fkey"
            columns: ["affected_user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_lifecycle_events_affected_user_id_fkey"
            columns: ["affected_user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_lifecycle_events_affected_user_id_fkey"
            columns: ["affected_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_lifecycle_events_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_lifecycle_events_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_lifecycle_events_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_lifecycle_events_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_lifecycle_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
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
          location_name: string | null
          start_date: string | null
          status: string | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_type?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          location_id?: string | null
          location_name?: string | null
          start_date?: string | null
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_type?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          location_id?: string | null
          location_name?: string | null
          start_date?: string | null
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
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
      team_member_achievements: {
        Row: {
          achieved_at: string | null
          achievement_type: string | null
          created_at: string | null
          description: string | null
          id: string
          team_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          achievement_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          team_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          achievement_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          team_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_member_achievements_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_member_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_member_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_member_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_member_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_member_activity: {
        Row: {
          activity_count: number | null
          activity_status: string
          created_at: string | null
          id: string
          last_activity_at: string | null
          session_duration_minutes: number | null
          team_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          activity_count?: number | null
          activity_status?: string
          created_at?: string | null
          id?: string
          last_activity_at?: string | null
          session_duration_minutes?: number | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          activity_count?: number | null
          activity_status?: string
          created_at?: string | null
          id?: string
          last_activity_at?: string | null
          session_duration_minutes?: number | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_member_activity_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_member_assignments: {
        Row: {
          assigned_by: string | null
          assignment_type: string | null
          created_at: string | null
          end_date: string | null
          id: string
          location_id: string | null
          metadata: Json | null
          start_date: string
          status: string | null
          team_member_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_by?: string | null
          assignment_type?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          location_id?: string | null
          metadata?: Json | null
          start_date: string
          status?: string | null
          team_member_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string | null
          assignment_type?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          location_id?: string | null
          metadata?: Json | null
          start_date?: string
          status?: string | null
          team_member_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_member_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_member_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_member_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_member_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_member_assignments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_member_assignments_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      team_member_deadlines: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          priority: string | null
          status: string | null
          team_id: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          priority?: string | null
          status?: string | null
          team_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          priority?: string | null
          status?: string | null
          team_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_member_deadlines_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_member_deadlines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_member_deadlines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_member_deadlines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_member_deadlines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_member_invitations: {
        Row: {
          accepted_at: string | null
          cancelled_at: string | null
          created_at: string | null
          custom_message: string | null
          declined_at: string | null
          expires_at: string
          id: string
          invitation_token: string
          invited_at: string | null
          invited_by: string
          invited_email: string
          invited_name: string | null
          role: string
          status: string
          team_id: string
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          custom_message?: string | null
          declined_at?: string | null
          expires_at: string
          id?: string
          invitation_token: string
          invited_at?: string | null
          invited_by: string
          invited_email: string
          invited_name?: string | null
          role?: string
          status?: string
          team_id: string
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          custom_message?: string | null
          declined_at?: string | null
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_at?: string | null
          invited_by?: string
          invited_email?: string
          invited_name?: string | null
          role?: string
          status?: string
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_member_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_member_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_member_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_member_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_member_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_member_status_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          effective_date: string | null
          id: string
          metadata: Json | null
          new_role: string | null
          new_status: string
          old_role: string | null
          old_status: string | null
          reason: string | null
          team_member_id: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          effective_date?: string | null
          id?: string
          metadata?: Json | null
          new_role?: string | null
          new_status: string
          old_role?: string | null
          old_status?: string | null
          reason?: string | null
          team_member_id?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          effective_date?: string | null
          id?: string
          metadata?: Json | null
          new_role?: string | null
          new_status?: string
          old_role?: string | null
          old_status?: string | null
          reason?: string | null
          team_member_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_member_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_member_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_member_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_member_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_member_status_history_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          assignment_end_date: string | null
          assignment_start_date: string | null
          created_at: string | null
          emergency_contact: Json | null
          id: string
          invitation_accepted_at: string | null
          invitation_sent_at: string | null
          last_activity: string | null
          location_assignment: string | null
          notes: string | null
          permissions: Json | null
          role: string
          skills: Json | null
          status: string | null
          team_id: string
          team_position: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assignment_end_date?: string | null
          assignment_start_date?: string | null
          created_at?: string | null
          emergency_contact?: Json | null
          id?: string
          invitation_accepted_at?: string | null
          invitation_sent_at?: string | null
          last_activity?: string | null
          location_assignment?: string | null
          notes?: string | null
          permissions?: Json | null
          role?: string
          skills?: Json | null
          status?: string | null
          team_id: string
          team_position?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assignment_end_date?: string | null
          assignment_start_date?: string | null
          created_at?: string | null
          emergency_contact?: Json | null
          id?: string
          invitation_accepted_at?: string | null
          invitation_sent_at?: string | null
          last_activity?: string | null
          location_assignment?: string | null
          notes?: string | null
          permissions?: Json | null
          role?: string
          skills?: Json | null
          status?: string | null
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
      team_performance_history: {
        Row: {
          calculated_at: string | null
          certificates_issued: number | null
          compliance_score: number | null
          courses_conducted: number | null
          created_at: string | null
          id: string
          performance_period: string
          performance_score: number | null
          period_end: string
          period_start: string
          team_id: string
        }
        Insert: {
          calculated_at?: string | null
          certificates_issued?: number | null
          compliance_score?: number | null
          courses_conducted?: number | null
          created_at?: string | null
          id?: string
          performance_period?: string
          performance_score?: number | null
          period_end: string
          period_start: string
          team_id: string
        }
        Update: {
          calculated_at?: string | null
          certificates_issued?: number | null
          compliance_score?: number | null
          courses_conducted?: number | null
          created_at?: string | null
          id?: string
          performance_period?: string
          performance_score?: number | null
          period_end?: string
          period_start?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_performance_history_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_performance_metrics: {
        Row: {
          average_satisfaction_score: number | null
          calculated_at: string | null
          calculated_by: string | null
          certificates_issued: number | null
          compliance_score: number | null
          courses_conducted: number | null
          id: string
          member_retention_rate: number | null
          metadata: Json | null
          metric_period_end: string
          metric_period_start: string
          team_id: string | null
          training_hours_delivered: number | null
        }
        Insert: {
          average_satisfaction_score?: number | null
          calculated_at?: string | null
          calculated_by?: string | null
          certificates_issued?: number | null
          compliance_score?: number | null
          courses_conducted?: number | null
          id?: string
          member_retention_rate?: number | null
          metadata?: Json | null
          metric_period_end: string
          metric_period_start: string
          team_id?: string | null
          training_hours_delivered?: number | null
        }
        Update: {
          average_satisfaction_score?: number | null
          calculated_at?: string | null
          calculated_by?: string | null
          certificates_issued?: number | null
          compliance_score?: number | null
          courses_conducted?: number | null
          id?: string
          member_retention_rate?: number | null
          metadata?: Json | null
          metric_period_end?: string
          metric_period_start?: string
          team_id?: string | null
          training_hours_delivered?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_performance_metrics_calculated_by_fkey"
            columns: ["calculated_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_performance_metrics_calculated_by_fkey"
            columns: ["calculated_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_performance_metrics_calculated_by_fkey"
            columns: ["calculated_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_performance_metrics_calculated_by_fkey"
            columns: ["calculated_by"]
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
      team_permission_delegations: {
        Row: {
          created_at: string | null
          delegate_id: string | null
          delegation_scope: Json | null
          delegator_id: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          permission: string
          revoked_at: string | null
          revoked_by: string | null
          team_id: string | null
        }
        Insert: {
          created_at?: string | null
          delegate_id?: string | null
          delegation_scope?: Json | null
          delegator_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          permission: string
          revoked_at?: string | null
          revoked_by?: string | null
          team_id?: string | null
        }
        Update: {
          created_at?: string | null
          delegate_id?: string | null
          delegation_scope?: Json | null
          delegator_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          permission?: string
          revoked_at?: string | null
          revoked_by?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_permission_delegations_delegate_id_fkey"
            columns: ["delegate_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_permission_delegations_delegate_id_fkey"
            columns: ["delegate_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_permission_delegations_delegate_id_fkey"
            columns: ["delegate_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_permission_delegations_delegate_id_fkey"
            columns: ["delegate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_permission_delegations_delegator_id_fkey"
            columns: ["delegator_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_permission_delegations_delegator_id_fkey"
            columns: ["delegator_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_permission_delegations_delegator_id_fkey"
            columns: ["delegator_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_permission_delegations_delegator_id_fkey"
            columns: ["delegator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_permission_delegations_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_permission_delegations_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_permission_delegations_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_permission_delegations_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_permission_delegations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_utilization_metrics: {
        Row: {
          active_members: number | null
          calculated_at: string
          created_at: string
          id: string
          member_count: number | null
          metric_date: string
          peak_hours: Json | null
          team_id: string
          total_available_hours: number | null
          total_scheduled_hours: number | null
          utilization_rate: number | null
        }
        Insert: {
          active_members?: number | null
          calculated_at?: string
          created_at?: string
          id?: string
          member_count?: number | null
          metric_date: string
          peak_hours?: Json | null
          team_id: string
          total_available_hours?: number | null
          total_scheduled_hours?: number | null
          utilization_rate?: number | null
        }
        Update: {
          active_members?: number | null
          calculated_at?: string
          created_at?: string
          id?: string
          member_count?: number | null
          metric_date?: string
          peak_hours?: Json | null
          team_id?: string
          total_available_hours?: number | null
          total_scheduled_hours?: number | null
          utilization_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_utilization_metrics_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_workflows: {
        Row: {
          approval_data: Json | null
          approved_by: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          request_data: Json
          requested_by: string | null
          status: string | null
          team_id: string | null
          updated_at: string | null
          workflow_type: string
        }
        Insert: {
          approval_data?: Json | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          request_data?: Json
          requested_by?: string | null
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
          workflow_type: string
        }
        Update: {
          approval_data?: Json | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          request_data?: Json
          requested_by?: string | null
          status?: string | null
          team_id?: string | null
          updated_at?: string | null
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_workflows_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_workflows_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_workflows_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_workflows_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_workflows_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_workflows_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_workflows_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "team_workflows_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_workflows_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          archived_at: string | null
          archived_by: string | null
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
          parent_team_id: string | null
          performance_score: number | null
          provider_id: string | null
          split_from_team_id: string | null
          status: string | null
          team_type: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
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
          parent_team_id?: string | null
          performance_score?: number | null
          provider_id?: string | null
          split_from_team_id?: string | null
          status?: string | null
          team_type?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
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
          parent_team_id?: string | null
          performance_score?: number | null
          provider_id?: string | null
          split_from_team_id?: string | null
          status?: string | null
          team_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_teams_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
            foreignKeyName: "teams_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "teams_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "teams_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "teams_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "teams_parent_team_id_fkey"
            columns: ["parent_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_split_from_team_id_fkey"
            columns: ["split_from_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams_backup_20250621: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string | null
          created_by: string | null
          current_metrics: Json | null
          description: string | null
          id: string | null
          location_id: string | null
          metadata: Json | null
          monthly_targets: Json | null
          name: string | null
          parent_id: string | null
          parent_team_id: string | null
          performance_score: number | null
          provider_id: string | null
          split_from_team_id: string | null
          status: string | null
          team_type: string | null
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string | null
          created_by?: string | null
          current_metrics?: Json | null
          description?: string | null
          id?: string | null
          location_id?: string | null
          metadata?: Json | null
          monthly_targets?: Json | null
          name?: string | null
          parent_id?: string | null
          parent_team_id?: string | null
          performance_score?: number | null
          provider_id?: string | null
          split_from_team_id?: string | null
          status?: string | null
          team_type?: string | null
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string | null
          created_by?: string | null
          current_metrics?: Json | null
          description?: string | null
          id?: string | null
          location_id?: string | null
          metadata?: Json | null
          monthly_targets?: Json | null
          name?: string | null
          parent_id?: string | null
          parent_team_id?: string | null
          performance_score?: number | null
          provider_id?: string | null
          split_from_team_id?: string | null
          status?: string | null
          team_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      user_achievements: {
        Row: {
          achieved_at: string | null
          achievement_description: string | null
          achievement_name: string
          achievement_type: string
          badge_icon: string | null
          category: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          points_awarded: number | null
          tier_level: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          achievement_description?: string | null
          achievement_name: string
          achievement_type: string
          badge_icon?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          points_awarded?: number | null
          tier_level?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          achievement_description?: string | null
          achievement_name?: string
          achievement_type?: string
          badge_icon?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          points_awarded?: number | null
          tier_level?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_achievements_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_user_achievements_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_user_achievements_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_user_achievements_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          activity_category: string
          activity_type: string
          created_at: string | null
          duration_seconds: number | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          activity_category: string
          activity_type: string
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          activity_category?: string
          activity_type?: string
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "user_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "user_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      user_availability: {
        Row: {
          availability_type: Database["public"]["Enums"]["availability_type"]
          created_at: string
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          effective_date: string
          end_time: string
          expiry_date: string | null
          id: string
          is_active: boolean
          notes: string | null
          recurring_pattern: string | null
          start_time: string
          time_slot_duration: number
          updated_at: string
          user_id: string
        }
        Insert: {
          availability_type?: Database["public"]["Enums"]["availability_type"]
          created_at?: string
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          effective_date?: string
          end_time: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          recurring_pattern?: string | null
          start_time: string
          time_slot_duration?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          availability_type?: Database["public"]["Enums"]["availability_type"]
          created_at?: string
          day_of_week?: Database["public"]["Enums"]["day_of_week"]
          effective_date?: string
          end_time?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          recurring_pattern?: string | null
          start_time?: string
          time_slot_duration?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "user_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "user_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_availability_settings: {
        Row: {
          created_at: string
          id: string
          settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_certifications: {
        Row: {
          certificate_id: string | null
          certificate_type: string | null
          certification_name: string
          created_at: string
          expiry_date: string | null
          id: string
          issued_date: string
          issuing_authority: string | null
          metadata: Json | null
          status: string
          updated_at: string
          user_id: string
          verification_code: string | null
        }
        Insert: {
          certificate_id?: string | null
          certificate_type?: string | null
          certification_name: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          issued_date: string
          issuing_authority?: string | null
          metadata?: Json | null
          status?: string
          updated_at?: string
          user_id: string
          verification_code?: string | null
        }
        Update: {
          certificate_id?: string | null
          certificate_type?: string | null
          certification_name?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          issued_date?: string
          issuing_authority?: string | null
          metadata?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
          verification_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_certifications_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "user_certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "user_certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_compliance_records: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          completion_percentage: number | null
          compliance_status: string | null
          created_at: string | null
          current_value: string | null
          due_date: string | null
          evidence_files: Json | null
          id: string
          last_checked_at: string | null
          metadata: Json | null
          metric_id: string
          next_review_date: string | null
          notes: string | null
          priority: number | null
          rejection_reason: string | null
          reminder_sent_at: string | null
          requirement_id: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: string | null
          submission_data: Json | null
          target_value: string | null
          tier: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          completion_percentage?: number | null
          compliance_status?: string | null
          created_at?: string | null
          current_value?: string | null
          due_date?: string | null
          evidence_files?: Json | null
          id?: string
          last_checked_at?: string | null
          metadata?: Json | null
          metric_id: string
          next_review_date?: string | null
          notes?: string | null
          priority?: number | null
          rejection_reason?: string | null
          reminder_sent_at?: string | null
          requirement_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string | null
          submission_data?: Json | null
          target_value?: string | null
          tier?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          completion_percentage?: number | null
          compliance_status?: string | null
          created_at?: string | null
          current_value?: string | null
          due_date?: string | null
          evidence_files?: Json | null
          id?: string
          last_checked_at?: string | null
          metadata?: Json | null
          metric_id?: string
          next_review_date?: string | null
          notes?: string | null
          priority?: number | null
          rejection_reason?: string | null
          reminder_sent_at?: string | null
          requirement_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string | null
          submission_data?: Json | null
          target_value?: string | null
          tier?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_compliance_records_approved_by"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_user_compliance_records_approved_by"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_user_compliance_records_approved_by"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_user_compliance_records_approved_by"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_compliance_records_metric_id"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "compliance_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_compliance_records_requirement_id"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "compliance_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_compliance_records_reviewer_id"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_user_compliance_records_reviewer_id"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_user_compliance_records_reviewer_id"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_user_compliance_records_reviewer_id"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_compliance_records_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_user_compliance_records_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_user_compliance_records_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "fk_user_compliance_records_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_engagement_scores: {
        Row: {
          activity_score: number | null
          calculated_date: string
          compliance_score: number | null
          created_at: string | null
          engagement_score: number
          id: string
          performance_score: number | null
          score_breakdown: Json | null
          score_trend: string | null
          user_id: string | null
        }
        Insert: {
          activity_score?: number | null
          calculated_date: string
          compliance_score?: number | null
          created_at?: string | null
          engagement_score?: number
          id?: string
          performance_score?: number | null
          score_breakdown?: Json | null
          score_trend?: string | null
          user_id?: string | null
        }
        Update: {
          activity_score?: number | null
          calculated_date?: string
          compliance_score?: number | null
          created_at?: string | null
          engagement_score?: number
          id?: string
          performance_score?: number | null
          score_breakdown?: Json | null
          score_trend?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_engagement_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_engagement_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "user_engagement_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "user_engagement_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
      user_performance_metrics: {
        Row: {
          calculated_at: string | null
          context_data: Json | null
          id: string
          metric_category: string
          metric_date: string
          metric_type: string
          metric_value: number
          period_type: string | null
          user_id: string | null
        }
        Insert: {
          calculated_at?: string | null
          context_data?: Json | null
          id?: string
          metric_category: string
          metric_date: string
          metric_type: string
          metric_value: number
          period_type?: string | null
          user_id?: string | null
        }
        Update: {
          calculated_at?: string | null
          context_data?: Json | null
          id?: string
          metric_category?: string
          metric_date?: string
          metric_type?: string
          metric_value?: number
          period_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_performance_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_performance_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "user_performance_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "user_performance_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          accessibility_settings: Json | null
          created_at: string | null
          dashboard_layout: Json | null
          id: string
          keyboard_shortcuts: Json | null
          language_preference: string | null
          notification_preferences: Json | null
          search_preferences: Json | null
          theme_settings: Json | null
          timezone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accessibility_settings?: Json | null
          created_at?: string | null
          dashboard_layout?: Json | null
          id?: string
          keyboard_shortcuts?: Json | null
          language_preference?: string | null
          notification_preferences?: Json | null
          search_preferences?: Json | null
          theme_settings?: Json | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accessibility_settings?: Json | null
          created_at?: string | null
          dashboard_layout?: Json | null
          id?: string
          keyboard_shortcuts?: Json | null
          language_preference?: string | null
          notification_preferences?: Json | null
          search_preferences?: Json | null
          theme_settings?: Json | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress_tracking: {
        Row: {
          completion_percentage: number | null
          created_at: string | null
          current_stage: string
          estimated_completion: string | null
          id: string
          last_activity: string | null
          milestones_achieved: Json | null
          next_milestone: Json | null
          progress_category: string
          progress_type: string
          total_stages: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completion_percentage?: number | null
          created_at?: string | null
          current_stage: string
          estimated_completion?: string | null
          id?: string
          last_activity?: string | null
          milestones_achieved?: Json | null
          next_milestone?: Json | null
          progress_category: string
          progress_type: string
          total_stages: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completion_percentage?: number | null
          created_at?: string | null
          current_stage?: string
          estimated_completion?: string | null
          id?: string
          last_activity?: string | null
          milestones_achieved?: Json | null
          next_milestone?: Json | null
          progress_category?: string
          progress_type?: string
          total_stages?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_progress_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "user_progress_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "user_progress_tracking_user_id_fkey"
            columns: ["user_id"]
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
      user_work_hours: {
        Row: {
          actual_end: string | null
          actual_hours: number | null
          actual_start: string | null
          approved_at: string | null
          approved_by: string | null
          break_duration: number | null
          created_at: string
          id: string
          notes: string | null
          overtime_hours: number | null
          payroll_period: string | null
          scheduled_end: string | null
          scheduled_hours: number | null
          scheduled_start: string | null
          updated_at: string
          user_id: string
          work_date: string
        }
        Insert: {
          actual_end?: string | null
          actual_hours?: number | null
          actual_start?: string | null
          approved_at?: string | null
          approved_by?: string | null
          break_duration?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          payroll_period?: string | null
          scheduled_end?: string | null
          scheduled_hours?: number | null
          scheduled_start?: string | null
          updated_at?: string
          user_id: string
          work_date: string
        }
        Update: {
          actual_end?: string | null
          actual_hours?: number | null
          actual_start?: string | null
          approved_at?: string | null
          approved_by?: string | null
          break_duration?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          payroll_period?: string | null
          scheduled_end?: string | null
          scheduled_hours?: number | null
          scheduled_start?: string | null
          updated_at?: string
          user_id?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_work_hours_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_work_hours_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "user_work_hours_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "user_work_hours_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_work_hours_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_work_hours_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "user_work_hours_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "user_work_hours_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      webhook_configurations: {
        Row: {
          created_at: string
          event_types: string[]
          headers: Json | null
          id: string
          is_active: boolean
          last_triggered_at: string | null
          retry_config: Json | null
          secret_key: string | null
          team_id: string | null
          updated_at: string
          user_id: string | null
          webhook_name: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          event_types: string[]
          headers?: Json | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          retry_config?: Json | null
          secret_key?: string | null
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
          webhook_name: string
          webhook_url: string
        }
        Update: {
          created_at?: string
          event_types?: string[]
          headers?: Json | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          retry_config?: Json | null
          secret_key?: string | null
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
          webhook_name?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_configurations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
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
      workflow_approvals: {
        Row: {
          approval_type: string
          approver_id: string | null
          comments: string | null
          decision_data: Json | null
          expires_at: string | null
          id: string
          requested_at: string | null
          responded_at: string | null
          status: string
          step_id: string
          workflow_instance_id: string | null
        }
        Insert: {
          approval_type: string
          approver_id?: string | null
          comments?: string | null
          decision_data?: Json | null
          expires_at?: string | null
          id?: string
          requested_at?: string | null
          responded_at?: string | null
          status: string
          step_id: string
          workflow_instance_id?: string | null
        }
        Update: {
          approval_type?: string
          approver_id?: string | null
          comments?: string | null
          decision_data?: Json | null
          expires_at?: string | null
          id?: string
          requested_at?: string | null
          responded_at?: string | null
          status?: string
          step_id?: string
          workflow_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "workflow_approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "workflow_approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "workflow_approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_approvals_workflow_instance_id_fkey"
            columns: ["workflow_instance_id"]
            isOneToOne: false
            referencedRelation: "workflow_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_definitions: {
        Row: {
          business_rules: Json
          created_at: string | null
          created_by: string | null
          definition_json: Json
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          workflow_type: string
        }
        Insert: {
          business_rules: Json
          created_at?: string | null
          created_by?: string | null
          definition_json: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          workflow_type: string
        }
        Update: {
          business_rules?: Json
          created_at?: string | null
          created_by?: string | null
          definition_json?: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_definitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "workflow_definitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "workflow_definitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "workflow_definitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_instances: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          compliance_record_id: string | null
          created_at: string | null
          crm_lead_id: string | null
          crm_opportunity_id: string | null
          current_step_id: string
          id: string
          initiated_by: string | null
          instance_data: Json
          priority: string | null
          status: string
          team_id: string | null
          updated_at: string | null
          workflow_definition_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          compliance_record_id?: string | null
          created_at?: string | null
          crm_lead_id?: string | null
          crm_opportunity_id?: string | null
          current_step_id: string
          id?: string
          initiated_by?: string | null
          instance_data: Json
          priority?: string | null
          status: string
          team_id?: string | null
          updated_at?: string | null
          workflow_definition_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          compliance_record_id?: string | null
          created_at?: string | null
          crm_lead_id?: string | null
          crm_opportunity_id?: string | null
          current_step_id?: string
          id?: string
          initiated_by?: string | null
          instance_data?: Json
          priority?: string | null
          status?: string
          team_id?: string | null
          updated_at?: string | null
          workflow_definition_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_instances_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "workflow_instances_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "workflow_instances_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "workflow_instances_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_instances_compliance_record_id_fkey"
            columns: ["compliance_record_id"]
            isOneToOne: false
            referencedRelation: "user_compliance_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_instances_crm_lead_id_fkey"
            columns: ["crm_lead_id"]
            isOneToOne: false
            referencedRelation: "crm_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_instances_crm_opportunity_id_fkey"
            columns: ["crm_opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_instances_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "workflow_instances_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "workflow_instances_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "workflow_instances_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_instances_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_instances_workflow_definition_id_fkey"
            columns: ["workflow_definition_id"]
            isOneToOne: false
            referencedRelation: "workflow_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_integration_logs: {
        Row: {
          error_message: string | null
          execution_duration_ms: number | null
          execution_time: string | null
          id: string
          input_data: Json | null
          method_name: string
          output_data: Json | null
          service_name: string
          status: string
          step_id: string
          workflow_instance_id: string | null
        }
        Insert: {
          error_message?: string | null
          execution_duration_ms?: number | null
          execution_time?: string | null
          id?: string
          input_data?: Json | null
          method_name: string
          output_data?: Json | null
          service_name: string
          status: string
          step_id: string
          workflow_instance_id?: string | null
        }
        Update: {
          error_message?: string | null
          execution_duration_ms?: number | null
          execution_time?: string | null
          id?: string
          input_data?: Json | null
          method_name?: string
          output_data?: Json | null
          service_name?: string
          status?: string
          step_id?: string
          workflow_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_integration_logs_workflow_instance_id_fkey"
            columns: ["workflow_instance_id"]
            isOneToOne: false
            referencedRelation: "workflow_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_queue: {
        Row: {
          actual_duration: number | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          due_date: string | null
          error_message: string | null
          estimated_duration: number | null
          id: string
          last_retry_at: string | null
          max_retries: number | null
          queue_data: Json | null
          queue_metadata: Json | null
          queue_priority: number | null
          queue_status: string | null
          queue_type: string
          retry_count: number | null
          started_at: string | null
          updated_at: string | null
          workflow_instance_id: string | null
        }
        Insert: {
          actual_duration?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          error_message?: string | null
          estimated_duration?: number | null
          id?: string
          last_retry_at?: string | null
          max_retries?: number | null
          queue_data?: Json | null
          queue_metadata?: Json | null
          queue_priority?: number | null
          queue_status?: string | null
          queue_type: string
          retry_count?: number | null
          started_at?: string | null
          updated_at?: string | null
          workflow_instance_id?: string | null
        }
        Update: {
          actual_duration?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          error_message?: string | null
          estimated_duration?: number | null
          id?: string
          last_retry_at?: string | null
          max_retries?: number | null
          queue_data?: Json | null
          queue_metadata?: Json | null
          queue_priority?: number | null
          queue_status?: string | null
          queue_type?: string
          retry_count?: number | null
          started_at?: string | null
          updated_at?: string | null
          workflow_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "workflow_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "workflow_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "workflow_queue_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_queue_history: {
        Row: {
          change_metadata: Json | null
          change_reason: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          new_assignee: string | null
          new_status: string | null
          previous_assignee: string | null
          previous_status: string | null
          queue_id: string | null
        }
        Insert: {
          change_metadata?: Json | null
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_assignee?: string | null
          new_status?: string | null
          previous_assignee?: string | null
          previous_status?: string | null
          queue_id?: string | null
        }
        Update: {
          change_metadata?: Json | null
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_assignee?: string | null
          new_status?: string | null
          previous_assignee?: string | null
          previous_status?: string | null
          queue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_queue_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "workflow_queue_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "workflow_queue_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "workflow_queue_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_queue_history_new_assignee_fkey"
            columns: ["new_assignee"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "workflow_queue_history_new_assignee_fkey"
            columns: ["new_assignee"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "workflow_queue_history_new_assignee_fkey"
            columns: ["new_assignee"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "workflow_queue_history_new_assignee_fkey"
            columns: ["new_assignee"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_queue_history_previous_assignee_fkey"
            columns: ["previous_assignee"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "workflow_queue_history_previous_assignee_fkey"
            columns: ["previous_assignee"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "workflow_queue_history_previous_assignee_fkey"
            columns: ["previous_assignee"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "workflow_queue_history_previous_assignee_fkey"
            columns: ["previous_assignee"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_queue_history_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "workflow_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_sla_tracking: {
        Row: {
          breach_count: number | null
          created_at: string | null
          current_status: string | null
          escalation_level: number | null
          escalation_triggered: boolean | null
          id: string
          last_breach_at: string | null
          recovery_time: number | null
          sla_deadline: string
          sla_metadata: Json | null
          sla_name: string
          updated_at: string | null
          workflow_instance_id: string | null
        }
        Insert: {
          breach_count?: number | null
          created_at?: string | null
          current_status?: string | null
          escalation_level?: number | null
          escalation_triggered?: boolean | null
          id?: string
          last_breach_at?: string | null
          recovery_time?: number | null
          sla_deadline: string
          sla_metadata?: Json | null
          sla_name: string
          updated_at?: string | null
          workflow_instance_id?: string | null
        }
        Update: {
          breach_count?: number | null
          created_at?: string | null
          current_status?: string | null
          escalation_level?: number | null
          escalation_triggered?: boolean | null
          id?: string
          last_breach_at?: string | null
          recovery_time?: number | null
          sla_deadline?: string
          sla_metadata?: Json | null
          sla_name?: string
          updated_at?: string | null
          workflow_instance_id?: string | null
        }
        Relationships: []
      }
      workflow_step_history: {
        Row: {
          error_message: string | null
          executed_by: string | null
          execution_duration_ms: number | null
          execution_result: string
          execution_time: string | null
          id: string
          notes: string | null
          output_data: Json | null
          step_data: Json
          step_id: string
          step_name: string
          step_type: string
          workflow_instance_id: string | null
        }
        Insert: {
          error_message?: string | null
          executed_by?: string | null
          execution_duration_ms?: number | null
          execution_result: string
          execution_time?: string | null
          id?: string
          notes?: string | null
          output_data?: Json | null
          step_data: Json
          step_id: string
          step_name: string
          step_type: string
          workflow_instance_id?: string | null
        }
        Update: {
          error_message?: string | null
          executed_by?: string | null
          execution_duration_ms?: number | null
          execution_result?: string
          execution_time?: string | null
          id?: string
          notes?: string | null
          output_data?: Json | null
          step_data?: Json
          step_id?: string
          step_name?: string
          step_type?: string
          workflow_instance_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_step_history_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "workflow_step_history_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "workflow_step_history_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "workflow_step_history_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_step_history_workflow_instance_id_fkey"
            columns: ["workflow_instance_id"]
            isOneToOne: false
            referencedRelation: "workflow_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_templates: {
        Row: {
          category: string
          conditional_routing: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          escalation_rules: Json | null
          id: string
          is_system_template: boolean | null
          name: string
          sla_config: Json | null
          template_json: Json
          updated_at: string | null
          usage_count: number | null
          version: number | null
          workflow_name: string | null
          workflow_steps: Json | null
          workflow_type: string
        }
        Insert: {
          category: string
          conditional_routing?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          escalation_rules?: Json | null
          id?: string
          is_system_template?: boolean | null
          name: string
          sla_config?: Json | null
          template_json: Json
          updated_at?: string | null
          usage_count?: number | null
          version?: number | null
          workflow_name?: string | null
          workflow_steps?: Json | null
          workflow_type: string
        }
        Update: {
          category?: string
          conditional_routing?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          escalation_rules?: Json | null
          id?: string
          is_system_template?: boolean | null
          name?: string
          sla_config?: Json | null
          template_json?: Json
          updated_at?: string | null
          usage_count?: number | null
          version?: number | null
          workflow_name?: string | null
          workflow_steps?: Json | null
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "workflow_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_teaching_load"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "workflow_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "instructor_workload_summary"
            referencedColumns: ["instructor_id"]
          },
          {
            foreignKeyName: "workflow_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
      cache_performance: {
        Row: {
          active_entries: number | null
          avg_access_count: number | null
          cache_namespace: string | null
          expired_entries: number | null
          total_accesses: number | null
          total_entries: number | null
        }
        Relationships: []
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
      compliance_dashboard_summary: {
        Row: {
          compliance_score: number | null
          compliance_tier: string | null
          compliant_count: number | null
          display_name: string | null
          email: string | null
          last_activity: string | null
          non_compliant_count: number | null
          overdue_count: number | null
          pending_count: number | null
          role: string | null
          total_requirements: number | null
          user_id: string | null
          warning_count: number | null
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
      crm_analytics_summary: {
        Row: {
          average_deal_size: number | null
          completed_activities: number | null
          conversion_rate: number | null
          converted_leads: number | null
          new_leads: number | null
          total_activities: number | null
          total_leads: number | null
          total_opportunities: number | null
          total_pipeline_value: number | null
          total_revenue: number | null
          win_rate: number | null
          won_opportunities: number | null
        }
        Relationships: []
      }
      crm_conversion_analytics: {
        Row: {
          avg_lead_score: number | null
          conversion_rate: number | null
          converted_leads: number | null
          email_leads: number | null
          month: string | null
          referral_leads: number | null
          total_leads: number | null
          website_leads: number | null
        }
        Relationships: []
      }
      crm_conversion_funnel: {
        Row: {
          contact_rate: number | null
          contacted_leads: number | null
          conversion_rate: number | null
          converted_leads: number | null
          high_score_leads: number | null
          month: string | null
          overall_conversion_rate: number | null
          qualification_rate: number | null
          qualified_leads: number | null
          scored_leads: number | null
          total_leads: number | null
        }
        Relationships: []
      }
      crm_daily_analytics: {
        Row: {
          analytics_date: string | null
          avg_lead_score: number | null
          contacted_count: number | null
          conversions: number | null
          converted_count: number | null
          daily_count: number | null
          entity_type: string | null
          lost_count: number | null
          new_count: number | null
          qualified_count: number | null
        }
        Relationships: []
      }
      crm_revenue_analytics: {
        Row: {
          analytics_month: string | null
          avg_deal_size: number | null
          avg_probability: number | null
          lost_deals: number | null
          lost_revenue: number | null
          monthly_revenue: number | null
          open_deals: number | null
          open_pipeline: number | null
          weighted_pipeline: number | null
          win_rate: number | null
          won_deals: number | null
        }
        Relationships: []
      }
      crm_revenue_performance: {
        Row: {
          avg_deal_size: number | null
          avg_sales_cycle_days: number | null
          lost_opportunities: number | null
          period: string | null
          pipeline_value: number | null
          total_opportunities: number | null
          weighted_pipeline: number | null
          win_rate: number | null
          won_opportunities: number | null
          won_revenue: number | null
        }
        Relationships: []
      }
      enrollment_with_student_profiles: {
        Row: {
          course_description: string | null
          course_name: string | null
          course_offering_id: string | null
          created_at: string | null
          end_date: string | null
          id: string | null
          start_date: string | null
          student_display_name: string | null
          student_email: string | null
          student_first_name: string | null
          student_import_date: string | null
          student_last_name: string | null
          student_last_sync: string | null
          student_profile_id: string | null
          student_status: string | null
          thinkific_user_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_offering_id_fkey"
            columns: ["course_offering_id"]
            isOneToOne: false
            referencedRelation: "course_offerings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_enrollments_student_profile_id"
            columns: ["student_profile_id"]
            isOneToOne: false
            referencedRelation: "student_enrollment_profiles"
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
      performance_dashboard: {
        Row: {
          avg_response_time: number | null
          hour_bucket: string | null
          metric_type: string | null
          p95_response_time: number | null
          p99_response_time: number | null
          total_requests: number | null
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
          },
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
            referencedRelation: "compliance_dashboard_summary"
            referencedColumns: ["user_id"]
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
      add_team_member_bypass_rls: {
        Args: { p_team_id: string; p_user_id: string; p_role?: string }
        Returns: {
          id: string
          user_id: string
          team_id: string
          role: string
          created_at: string
        }[]
      }
      add_team_member_safe: {
        Args:
          | { p_team_id: string; p_user_id: string; p_role?: string }
          | {
              p_team_id: string
              p_user_id: string
              p_role?: string
              p_assigned_by?: string
            }
          | {
              p_team_id: string
              p_user_id: string
              p_role?: string
              p_joined_date?: string
            }
        Returns: string
      }
      advance_workflow_step: {
        Args: { p_workflow_id: string; p_step_data?: Json }
        Returns: Json
      }
      assign_ap_user_to_location: {
        Args: {
          p_ap_user_id: string
          p_location_id: string
          p_assignment_role?: string
          p_end_date?: string
        }
        Returns: string
      }
      assign_lead_intelligent: {
        Args: { p_lead_id: string; p_assignment_criteria?: Json }
        Returns: string
      }
      assign_provider_location_safe: {
        Args: { p_provider_id: string; p_location_id: string }
        Returns: Json
      }
      assign_provider_to_team: {
        Args:
          | {
              p_provider_id: number
              p_team_id: string
              p_assignment_role: string
              p_oversight_level: string
              p_assigned_by: string
            }
          | {
              p_provider_id: number
              p_team_id: string
              p_assignment_role: string
              p_oversight_level: string
              p_assigned_by: string
            }
          | {
              p_provider_id: string
              p_team_id: string
              p_assignment_role: string
              p_oversight_level: string
              p_assignment_type?: string
              p_end_date?: string
              p_assigned_by?: string
            }
        Returns: string
      }
      assign_provider_to_team_safe: {
        Args: {
          p_provider_id: string
          p_team_id: string
          p_assignment_role?: string
          p_oversight_level?: string
          p_assignment_type?: string
          p_end_date?: string
        }
        Returns: string
      }
      auto_assign_lead: {
        Args: { lead_id: string }
        Returns: string
      }
      auto_convert_qualified_leads: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      backup_configurations: {
        Args: Record<PropertyKey, never>
        Returns: {
          configuration_data: Json
        }[]
      }
      bulk_add_team_members_bypass_rls: {
        Args: { p_team_id: string; p_user_ids: string[]; p_role?: string }
        Returns: {
          success_count: number
          failed_users: string[]
          error_messages: string[]
        }[]
      }
      calculate_analytics_warehouse_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      calculate_campaign_roi: {
        Args: { p_campaign_id: string }
        Returns: number
      }
      calculate_certificate_status: {
        Args: {
          p_practical_score: number
          p_written_score: number
          p_practical_weight: number
          p_written_weight: number
          p_pass_threshold: number
          p_requires_both_scores: boolean
        }
        Returns: {
          total_score: number
          calculated_status: string
        }[]
      }
      calculate_compliance_risk_score: {
        Args: { p_entity_type: string; p_entity_id: string }
        Returns: number
      }
      calculate_enhanced_lead_score: {
        Args: { p_lead_id: string }
        Returns: number
      }
      calculate_enhanced_team_performance_metrics: {
        Args: { p_team_id: string; p_start_date: string; p_end_date: string }
        Returns: Json
      }
      calculate_lead_score: {
        Args: { lead_id: string }
        Returns: number
      }
      calculate_lead_score_simple: {
        Args: { p_lead_id: string }
        Returns: number
      }
      calculate_system_health_score: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      calculate_teaching_hours_credit: {
        Args: { p_session_id: string }
        Returns: number
      }
      calculate_team_performance_metrics: {
        Args: { p_team_id: string; p_start_date: string; p_end_date: string }
        Returns: Json
      }
      calculate_team_utilization_metrics: {
        Args: { p_team_id: string; p_date: string }
        Returns: Json
      }
      calculate_user_compliance_score: {
        Args: { p_user_id: string }
        Returns: number
      }
      calculate_user_engagement_score: {
        Args: { p_user_id: string; p_date?: string }
        Returns: number
      }
      can_user_manage_team_enhanced: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      check_compliance_rules: {
        Args: { p_entity_type: string; p_entity_id: string }
        Returns: undefined
      }
      check_expired_compliance_documents: {
        Args: Record<PropertyKey, never>
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
      check_member_compliance: {
        Args: { p_user_id: string }
        Returns: Json
      }
      check_metric_alerts: {
        Args: { p_metric_name: string; p_metric_value: number }
        Returns: boolean
      }
      check_provider_data_integrity: {
        Args: Record<PropertyKey, never>
        Returns: {
          issue_type: string
          count: number
          details: string
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
      check_team_admin_status: {
        Args: { p_user_id: string; p_team_id: string }
        Returns: boolean
      }
      check_workflow_slas: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_compliance_reports: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_system_metrics: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      column_exists: {
        Args: { table_name: string; column_name: string }
        Returns: boolean
      }
      convert_lead_to_contact_and_account: {
        Args: {
          p_lead_id: string
          p_contact_data?: Json
          p_account_data?: Json
        }
        Returns: Json
      }
      create_certificate_notification: {
        Args: {
          p_user_id: string
          p_notification_type: string
          p_title: string
          p_message: string
          p_certificate_request_id?: string
          p_batch_id?: string
          p_send_email?: boolean
        }
        Returns: string
      }
      create_default_instructor_availability: {
        Args: { instructor_id: string }
        Returns: undefined
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
      create_team_bypass_rls: {
        Args:
          | {
              p_name: string
              p_description?: string
              p_location_id?: string
              p_team_type?: string
              p_status?: string
            }
          | {
              p_name: string
              p_description?: string
              p_team_type?: string
              p_location_id?: string
              p_provider_id?: string
              p_created_by?: string
            }
        Returns: {
          id: string
          name: string
          description: string
          team_type: string
          status: string
          performance_score: number
          location_id: string
          provider_id: string
          created_by: string
          created_at: string
          updated_at: string
          metadata: Json
          monthly_targets: Json
          current_metrics: Json
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
      current_user_can_manage_compliance_documents: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      current_user_can_manage_teams: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      current_user_can_view_compliance_documents: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      current_user_has_management_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      current_user_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      delete_team_bypass_rls: {
        Args: { p_team_id: string }
        Returns: boolean
      }
      evaluate_progression_eligibility: {
        Args: { p_user_id: string; p_target_role: string }
        Returns: Json
      }
      exec_sql: {
        Args: { sql: string }
        Returns: {
          result: Json
        }[]
      }
      execute_automation_rule: {
        Args: { p_rule_id: string }
        Returns: Json
      }
      execute_lead_workflow: {
        Args: { p_workflow_id: string; p_lead_id: string }
        Returns: string
      }
      fetch_team_members_with_profiles: {
        Args: { p_team_id: string }
        Returns: {
          id: string
          team_id: string
          user_id: string
          role: string
          status: string
          location_assignment: string
          assignment_start_date: string
          assignment_end_date: string
          team_position: string
          permissions: Json
          created_at: string
          updated_at: string
          display_name: string
          email: string
          user_role: string
        }[]
      }
      fetch_user_team_memberships: {
        Args: { p_user_id: string }
        Returns: {
          id: string
          team_id: string
          user_id: string
          role: string
          status: string
          location_assignment: string
          assignment_start_date: string
          assignment_end_date: string
          team_position: string
          permissions: Json
          created_at: string
          updated_at: string
        }[]
      }
      find_or_create_student_profile: {
        Args: {
          p_email: string
          p_first_name?: string
          p_last_name?: string
          p_external_student_id?: string
          p_student_metadata?: Json
        }
        Returns: string
      }
      fix_roster_certificate_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          fixed_roster_id: string
          old_count: number
          new_count: number
        }[]
      }
      generate_compliance_intelligence_insight: {
        Args: {
          p_entity_type: string
          p_entity_id: string
          p_analysis_type?: string
        }
        Returns: string
      }
      generate_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_system_health_snapshot: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_verification_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_admin_team_statistics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_admin_teams_overview: {
        Args: Record<PropertyKey, never>
        Returns: {
          team_data: Json
        }[]
      }
      get_ap_user_assignments: {
        Args: { p_ap_user_id?: string }
        Returns: {
          assignment_id: string
          ap_user_id: string
          ap_user_name: string
          ap_user_email: string
          location_id: string
          location_name: string
          location_city: string
          location_state: string
          assignment_role: string
          status: string
          start_date: string
          end_date: string
          team_count: number
        }[]
      }
      get_auth_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_automation_triggers: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          description: string
          event_type: string
          is_active: boolean
        }[]
      }
      get_available_ap_users_for_location: {
        Args: { p_location_id: string }
        Returns: {
          user_id: string
          display_name: string
          email: string
          phone: string
          organization: string
          job_title: string
          created_at: string
        }[]
      }
      get_available_users_for_team_bypass_rls: {
        Args: { p_team_id: string }
        Returns: {
          id: string
          display_name: string
          email: string
          role: string
        }[]
      }
      get_backend_function_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          description: string
          is_connected: boolean
          last_checked: string
          error_message: string
          category: string
        }[]
      }
      get_cache_entry: {
        Args: { p_cache_key: string }
        Returns: Json
      }
      get_campaign_analytics: {
        Args: { campaign_ids?: string[]; date_from?: string; date_to?: string }
        Returns: {
          campaign_id: string
          campaign_name: string
          campaign_type: string
          sent_count: number
          delivered_count: number
          opened_count: number
          clicked_count: number
          bounced_count: number
          unsubscribed_count: number
          open_rate: number
          click_rate: number
          bounce_rate: number
          unsubscribe_rate: number
          revenue_attributed: number
          created_at: string
        }[]
      }
      get_campaign_performance_summary: {
        Args: { date_from?: string; date_to?: string }
        Returns: {
          total_campaigns: number
          active_campaigns: number
          total_recipients: number
          total_delivered: number
          total_opened: number
          total_clicked: number
          total_bounced: number
          total_unsubscribed: number
          avg_open_rate: number
          avg_click_rate: number
          avg_bounce_rate: number
          avg_unsubscribe_rate: number
          total_revenue: number
          performance_data: Json
          engagement_data: Json
        }[]
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
      get_compliance_analytics: {
        Args: Record<PropertyKey, never>
        Returns: {
          metric_name: string
          basic_completion_rate: number
          robust_completion_rate: number
          total_users_basic: number
          total_users_robust: number
          completed_basic: number
          completed_robust: number
          pending_users: number
          overdue_users: number
        }[]
      }
      get_compliance_completion_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          tier: string
          total_users: number
          avg_completion_percentage: number
          total_requirements: number
          completed_requirements: number
        }[]
      }
      get_compliance_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_compliance_requirements_for_user: {
        Args: { user_tier?: string; user_role?: string }
        Returns: {
          id: string
          name: string
          description: string
          requirement_type: string
          category: string
          tier_level: string
          is_mandatory: boolean
          due_days_from_assignment: number
          points_value: number
          document_required: boolean
          external_link_required: boolean
          estimated_completion_time: number
          difficulty_level: string
          display_order: number
          icon: string
          color_code: string
        }[]
      }
      get_cross_team_analytics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_enhanced_executive_dashboard_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_enhanced_provider_dashboard_metrics: {
        Args: { p_provider_id: number }
        Returns: Json
      }
      get_enhanced_teams_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          team_data: Json
        }[]
      }
      get_enterprise_team_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_enterprise_team_summary: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_executive_dashboard_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_instructor_performance_metrics: {
        Args: { p_instructor_id: string }
        Returns: Json
      }
      get_metric_aggregation: {
        Args: { p_metric_name: string; p_start_time: string; p_period: string }
        Returns: {
          metric: string
          period: string
          avg: number
          min: number
          max: number
          count: number
          sum: number
        }[]
      }
      get_monthly_certificate_counts: {
        Args: { months_limit?: number }
        Returns: {
          month: string
          count: number
        }[]
      }
      get_pending_compliance_submissions: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          user_id: string
          user_name: string
          metric_name: string
          submitted_at: string
          current_value: string
          compliance_status: string
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
      get_provider_certificates_detailed: {
        Args: { p_provider_id: string }
        Returns: {
          certificate_id: string
          certificate_number: string
          user_name: string
          user_email: string
          team_name: string
          location_name: string
          course_name: string
          issue_date: string
          expiry_date: string
          status: string
        }[]
      }
      get_provider_dashboard_metrics: {
        Args: { p_provider_id: string }
        Returns: Json
      }
      get_provider_location_kpis: {
        Args: { p_provider_id: string }
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
        Args: { p_provider_id: string }
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
        Args: { p_provider_id: number } | { p_provider_id: string }
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
      get_provider_team_assignments_detailed: {
        Args: { p_provider_id: string }
        Returns: {
          assignment_id: string
          provider_id: string
          provider_name: string
          team_id: string
          team_name: string
          team_type: string
          assignment_role: string
          oversight_level: string
          assignment_type: string
          start_date: string
          end_date: string
          status: string
          team_status: string
          location_id: string
          location_name: string
          member_count: number
          performance_score: number
        }[]
      }
      get_provider_teams_detailed: {
        Args: { p_provider_id: string }
        Returns: {
          team_id: string
          team_name: string
          team_type: string
          team_status: string
          assignment_role: string
          oversight_level: string
          assignment_type: string
          start_date: string
          end_date: string
          assignment_status: string
          location_name: string
          member_count: number
          performance_score: number
        }[]
      }
      get_provider_with_relationships: {
        Args: { p_provider_id: string }
        Returns: {
          provider_data: Json
          location_data: Json
          teams_data: Json
          performance_metrics: Json
        }[]
      }
      get_requirement_completion_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          requirement_id: string
          requirement_name: string
          total_assigned: number
          completed: number
          in_progress: number
          overdue: number
          completion_rate: number
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
      get_system_admin_dashboard_metrics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_system_health_overview: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_functions: number
          healthy_functions: number
          warning_functions: number
          critical_functions: number
          overall_health_score: number
          critical_functions_down: number
        }[]
      }
      get_team_analytics_bypass_rls: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_teams: number
          total_members: number
          active_teams: number
          inactive_teams: number
        }[]
      }
      get_team_analytics_summary: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_team_compliance_report: {
        Args: { p_team_id: string }
        Returns: Json
      }
      get_team_leader_dashboard_metrics: {
        Args: { p_team_id: string }
        Returns: Json
      }
      get_team_member_count: {
        Args: { p_team_id: string }
        Returns: number
      }
      get_team_members_bypass_rls: {
        Args: { p_team_id: string }
        Returns: {
          id: string
          user_id: string
          team_id: string
          role: string
          joined_at: string
          display_name: string
          email: string
          user_role: string
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
      get_team_statistics_safe: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_teams: number
          active_teams: number
          inactive_teams: number
          suspended_teams: number
          average_performance: number
        }[]
      }
      get_team_workflows: {
        Args: { p_team_id: string }
        Returns: {
          id: string
          team_id: string
          workflow_type: string
          status: string
          requested_by: string
          approved_by: string
          request_data: Json
          approval_data: Json
          created_at: string
          updated_at: string
          completed_at: string
        }[]
      }
      get_teams_bypass_rls: {
        Args: Record<PropertyKey, never> | { p_user_id?: string }
        Returns: {
          id: string
          name: string
          description: string
          team_type: string
          status: string
          performance_score: number
          location_id: string
          provider_id: string
          created_by: string
          created_at: string
          updated_at: string
          metadata: Json
          monthly_targets: Json
          current_metrics: Json
        }[]
      }
      get_teams_safe: {
        Args: { p_user_id?: string }
        Returns: {
          id: string
          name: string
          description: string
          team_type: string
          status: string
          performance_score: number
          location_id: string
          provider_id: string
          created_by: string
          created_at: string
          updated_at: string
          metadata: Json
          monthly_targets: Json
          current_metrics: Json
        }[]
      }
      get_tier_distribution: {
        Args: Record<PropertyKey, never>
        Returns: {
          tier_name: string
          user_count: number
          completion_percentage: number
        }[]
      }
      get_top_certificate_courses: {
        Args: { limit_count?: number }
        Returns: {
          course_name: string
          count: number
        }[]
      }
      get_unread_certificate_notifications_count: {
        Args: { p_user_id?: string }
        Returns: number
      }
      get_user_compliance_summary: {
        Args: { p_user_id: string }
        Returns: {
          user_id: string
          overall_score: number
          total_metrics: number
          compliant_count: number
          warning_count: number
          non_compliant_count: number
          pending_count: number
          overdue_actions: number
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_role_direct: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_user_team_ids_direct: {
        Args: { user_uuid: string }
        Returns: string[]
      }
      get_user_workflow_queue: {
        Args: { p_user_id?: string }
        Returns: {
          queue_id: string
          workflow_name: string
          queue_type: string
          queue_priority: number
          queue_status: string
          due_date: string
          entity_type: string
          entity_id: string
          queue_data: Json
        }[]
      }
      get_workflow_statistics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      has_admin_team_access: {
        Args: { user_id: string }
        Returns: boolean
      }
      initialize_all_integrations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      initiate_workflow: {
        Args: {
          p_workflow_type: string
          p_entity_type: string
          p_entity_id: string
          p_initiated_by: string
          p_workflow_data?: Json
        }
        Returns: string
      }
      intelligent_search: {
        Args: { p_query: string; p_entity_types?: string[]; p_limit?: number }
        Returns: {
          entity_type: string
          entity_id: string
          search_content: string
          rank: number
          metadata: Json
        }[]
      }
      invalidate_cache_by_tags: {
        Args: { p_tags: string[] }
        Returns: number
      }
      is_admin_user: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_sa_or_ad: {
        Args: { user_id?: string }
        Returns: boolean
      }
      is_team_admin_direct: {
        Args: { p_user_id: string; p_team_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { team_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_team_member_direct: {
        Args: { user_uuid: string; team_uuid: string }
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
      log_team_lifecycle_event: {
        Args: {
          p_team_id: string
          p_event_type: string
          p_event_data?: Json
          p_affected_user_id?: string
          p_old_values?: Json
          p_new_values?: Json
        }
        Returns: string
      }
      mark_certificate_notification_read: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      normalize_team_member_role: {
        Args: { input_role: string }
        Returns: string
      }
      process_background_job: {
        Args: { p_job_id: string }
        Returns: boolean
      }
      process_compliance_reminders: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      process_workflow_queue_item: {
        Args: { p_queue_id: string }
        Returns: boolean
      }
      qualify_lead_automatically: {
        Args: { p_lead_id: string }
        Returns: boolean
      }
      record_provider_team_performance: {
        Args: {
          p_provider_id: string
          p_team_id: string
          p_measurement_period: string
          p_courses_delivered?: number
          p_certifications_issued?: number
          p_average_satisfaction_score?: number
          p_completion_rate?: number
          p_compliance_score?: number
        }
        Returns: string
      }
      record_system_metric: {
        Args: {
          p_metric_name: string
          p_metric_value: number
          p_metric_category?: string
          p_metric_unit?: string
          p_source_component?: string
          p_tags?: Json
        }
        Returns: string
      }
      refresh_all_revenue_analytics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_conversion_analytics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_crm_analytics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      remove_ap_user_from_location: {
        Args: { p_ap_user_id: string; p_location_id: string }
        Returns: boolean
      }
      remove_provider_from_team_safe: {
        Args: { p_provider_id: string; p_team_id: string }
        Returns: string
      }
      remove_provider_location_safe: {
        Args: { p_provider_id: string }
        Returns: Json
      }
      remove_team_member_bypass_rls: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      remove_team_member_safe: {
        Args: { p_member_id: string } | { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      render_notification_template: {
        Args: { template_id: string; template_variables?: Json }
        Returns: Json
      }
      safe_backfill_certificate_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      send_campaign: {
        Args: { campaign_id: string; send_immediately?: boolean }
        Returns: {
          success: boolean
          message: string
          recipients_count: number
        }[]
      }
      set_cache_entry: {
        Args: {
          p_cache_key: string
          p_cache_namespace: string
          p_cache_data: Json
          p_ttl_seconds?: number
          p_cache_tags?: string[]
        }
        Returns: undefined
      }
      start_provider_assignment_workflow: {
        Args: { p_workflow_type?: string }
        Returns: string
      }
      sync_team_location_names: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      table_exists: {
        Args: { table_name: string }
        Returns: boolean
      }
      test_authorized_providers_update: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      test_conversion_system: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      test_location_assignment_bypass: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      test_location_assignment_rls: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      test_location_removal: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      test_migration_success: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      test_profiles_recursion_fix: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      test_provider_team_assignment_permissions: {
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
      test_team_assignment_fix: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      update_bulk_operation_progress: {
        Args: { p_operation_id: string; p_processed: number; p_failed?: number }
        Returns: undefined
      }
      update_campaign_status: {
        Args: { campaign_id: string; new_status: string }
        Returns: {
          success: boolean
          message: string
          old_status: string
          updated_status: string
        }[]
      }
      update_compliance_monitoring_alert: {
        Args: { p_monitor_id: string; p_current_value: number }
        Returns: boolean
      }
      update_compliance_record: {
        Args: {
          p_user_id: string
          p_metric_id: string
          p_current_value: Json
          p_compliance_status: string
          p_notes?: string
        }
        Returns: string
      }
      update_realtime_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_resource_availability: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_system_usage_pattern: {
        Args: {
          p_feature_name: string
          p_success?: boolean
          p_duration_seconds?: number
        }
        Returns: undefined
      }
      update_team_bypass_rls: {
        Args: { p_team_id: string; p_updates: Json }
        Returns: Json
      }
      update_team_member_role_bypass_rls: {
        Args: { p_team_id: string; p_user_id: string; p_new_role: string }
        Returns: {
          id: string
          user_id: string
          team_id: string
          role: string
          updated_at: string
        }[]
      }
      update_team_member_role_safe: {
        Args: { p_member_id: string; p_new_role: string }
        Returns: undefined
      }
      update_team_performance_scores: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_user_activity_metrics: {
        Args: {
          p_user_id: string
          p_activity_date: string
          p_activity_type: string
        }
        Returns: undefined
      }
      upload_compliance_document: {
        Args: {
          p_user_id: string
          p_metric_id: string
          p_file_name: string
          p_file_path: string
          p_file_type: string
          p_file_size: number
          p_expiry_date?: string
        }
        Returns: string
      }
      validate_ap_user_selection: {
        Args: { p_workflow_id: string; p_ap_user_id: string }
        Returns: Json
      }
      validate_configuration_value: {
        Args: { p_data_type: string; p_value: Json; p_validation_rules?: Json }
        Returns: boolean
      }
      validate_crm_data_integrity: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          issue_type: string
          count: number
          details: string
        }[]
      }
      validate_location_selection: {
        Args: { p_workflow_id: string; p_location_id: string }
        Returns: Json
      }
      validate_notification_template: {
        Args: { template_data: Json }
        Returns: boolean
      }
      validate_provider_uuid: {
        Args: { p_id: string }
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
      verify_compliance_document: {
        Args: {
          p_document_id: string
          p_verification_status: string
          p_verification_notes?: string
          p_rejection_reason?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      availability_type: "available" | "busy" | "tentative" | "out_of_office"
      booking_type:
        | "course_instruction"
        | "training_session"
        | "meeting"
        | "administrative"
        | "personal"
      day_of_week: "0" | "1" | "2" | "3" | "4" | "5" | "6"
      permission_type: "view" | "edit" | "manage"
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
      availability_type: ["available", "busy", "tentative", "out_of_office"],
      booking_type: [
        "course_instruction",
        "training_session",
        "meeting",
        "administrative",
        "personal",
      ],
      day_of_week: ["0", "1", "2", "3", "4", "5", "6"],
      permission_type: ["view", "edit", "manage"],
    },
  },
} as const
