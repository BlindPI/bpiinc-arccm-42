export interface Activity {
  id: string;
  activity_type: 'call' | 'email' | 'meeting' | 'task' | 'note';
  subject: string;
  description?: string;
  activity_date: string;
  due_date?: string;
  completed: boolean;
  lead_id?: string;
  opportunity_id?: string;
  contact_id?: string;
  account_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  account_name: string;
  account_type: 'prospect' | 'customer' | 'partner' | 'competitor';
  industry?: string;
  account_status: 'active' | 'inactive' | 'prospect';
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  company_size?: string;
  fax?: string;
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  billing_country?: string;
  shipping_address?: string;
  annual_revenue?: number;
  notes?: string;
  converted_from_lead_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  job_title?: string;
  lead_status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  lead_source: 'website' | 'referral' | 'cold_call' | 'email' | 'social_media' | 'trade_show' | 'other';
  lead_score: number;
  assigned_to?: string;
  notes?: string;
  training_urgency?: 'immediate' | 'within_month' | 'within_quarter' | 'planning';
  estimated_participant_count?: number;
  // Additional properties for form compatibility
  lead_type?: string;
  preferred_training_format?: string;
  budget_range?: string;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  opportunity_name: string;
  account_name?: string;
  account_id?: string;
  estimated_value: number;
  stage: 'prospect' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number;
  expected_close_date?: string;
  opportunity_status: 'open' | 'closed';
  description?: string;
  created_by: string;
  lead_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  mobile_phone?: string;
  title?: string;
  department?: string;
  account_id?: string;
  contact_status: 'active' | 'inactive';
  lead_source?: string;
  preferred_contact_method?: 'email' | 'phone' | 'mail';
  do_not_call?: boolean;
  do_not_email?: boolean;
  last_activity_date?: string;
  notes?: string;
  converted_from_lead_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AssignmentRule {
  id: string;
  rule_name: string;
  rule_description?: string;
  criteria: Record<string, any>;
  assignment_type: 'round_robin' | 'load_based' | 'territory' | 'skills';
  assigned_user_id?: string;
  priority: number;
  is_active: boolean;
  working_hours?: Record<string, any>;
  escalation_rules?: Record<string, any>;
  automation_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeadScoringRule {
  id: string;
  rule_name: string;
  rule_description?: string;
  criteria: Record<string, any>;
  score_value: number;
  rule_type: 'demographic' | 'behavioral' | 'firmographic';
  field_name?: string;
  operator?: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_list';
  field_value?: string;
  score_points?: number;
  priority?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailCampaign {
  id: string;
  campaign_name: string;
  campaign_type: string;
  status: 'draft' | 'active' | 'completed' | 'paused';
  target_audience: string;
  sent_count: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
  campaign_cost: number;
  revenue_attributed: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignWizardData {
  name: string;
  type: string;
  target_audience: string;
  template_id?: string;
  schedule_date?: string;
  settings: Record<string, any>;
  step1?: {
    name: string;
    type: string;
    description?: string;
  };
  step2?: {
    target_audience: string;
    template_id?: string;
  };
  step3?: {
    schedule_date?: string;
    settings?: Record<string, any>;
  };
}

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
  profiles?: {
    display_name: string;
    email: string;
    role: string;
  };
}

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

// Enhanced types for better compatibility
export interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  role: string;
  status?: string;
  phone?: string;
  organization?: string;
  job_title?: string;
}

export interface Profile {
  id: string;
  display_name?: string;
  email: string;
  role: string;
  status?: string;
  phone?: string;
  organization?: string;
  job_title?: string;
}

// Additional interfaces for enhanced functionality
export interface RevenueMetrics {
  currentRevenue: number;
  previousRevenue: number;
  growthRate: number;
  pipelineValue: number;
  averageDealSize: number;
  forecastValue: number;
  monthly_data: Array<{
    month: string;
    revenue: number;
  }>;
  revenue_by_source: Array<{
    source: string;
    revenue: number;
  }>;
  forecast: {
    current_quarter: number;
    next_quarter: number;
    confidence_level: number;
  };
}

export interface PipelineMetrics {
  stage_name: string;
  opportunity_count: number;
  total_value: number;
  avg_probability: number;
  stageDistribution: Array<{
    stage_name: string;
    opportunity_count: number;
    total_value: number;
    avg_probability: number;
  }>;
  totalPipelineValue: number;
  weightedPipelineValue: number;
  averageCloseTime: number;
  conversionRate: number;
}

export interface CRMStats {
  total_leads: number;
  total_opportunities: number;
  total_pipeline_value: number;
  total_activities: number;
  conversion_rate: number;
  win_rate: number;
  average_deal_size: number;
  totalCertificates?: number;
  pendingRequests?: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}
