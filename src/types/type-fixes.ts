
// Type fixes and utilities for production readiness

import { Location as SupabaseLocation } from '@/types/supabase-schema';

// Re-export Location with status property to fix type conflicts
export interface Location extends Omit<SupabaseLocation, 'status'> {
  status: 'ACTIVE' | 'INACTIVE';
}

// Enhanced types for CRM components
export interface CRMProfile {
  id: string;
  display_name?: string;
  email: string;
  role: string;
  status?: string;
  phone?: string;
  organization?: string;
  job_title?: string;
}

// Operator type for lead scoring
export type OperatorType = 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_list';

// Assignment performance interface
export interface AssignmentPerformance {
  id: string;
  user_id: string;
  user_name: string;
  assignment_date: string;
  leads_assigned: number;
  leads_converted: number;
  avg_response_time: string;
  quality_score: number;
  current_load: number;
  max_capacity: number;
  availability_status: 'available' | 'busy' | 'unavailable';
  updated_at: string;
  profiles?: CRMProfile;
}

// Enhanced campaign wizard data with step structure
export interface EnhancedCampaignWizardData {
  name: string;
  type: string;
  target_audience: string;
  template_id?: string;
  schedule_date?: string;
  settings: Record<string, any>;
}

// Workflow interfaces
export interface LeadWorkflow {
  id: string;
  workflow_name: string;
  workflow_description?: string;
  trigger_conditions: Record<string, any>;
  workflow_steps: any[];
  execution_priority: number;
  is_active: boolean;
  success_metrics: Record<string, any>;
  failure_handling: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  lead_id: string;
  execution_status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  execution_data: Record<string, any>;
  step_results: any[];
  error_details?: Record<string, any>;
}

export interface PipelineStage {
  id: string;
  stage_name: string;
  stage_description?: string;
  stage_order: number;
  stage_probability: number;
  probability_percentage: number;
  is_closed: boolean;
  is_active: boolean;
  stage_color?: string;
  pipeline_type: string;
  required_fields?: string[];
  automation_rules: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}
