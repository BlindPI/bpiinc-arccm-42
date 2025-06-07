
// Base interfaces for CRM entities
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
  lead_type?: 'individual' | 'corporate';
  assigned_to?: string;
  qualification_notes?: string;
  notes?: string;
  last_contact_date?: string;
  last_activity_date?: string;
  training_urgency?: 'immediate' | 'within_month' | 'within_quarter' | 'planning';
  estimated_participant_count?: number;
  preferred_training_format?: 'in_person' | 'virtual' | 'hybrid';
  budget_range?: string;
  decision_timeline?: string;
  certification_requirements?: string;
  company_size?: string;
  industry?: string;
  website?: string;
  linkedin_profile?: string;
  referral_source?: string;
  province?: string;
  city?: string;
  postal_code?: string;
  annual_revenue_range?: string;
  conversion_date?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
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
  description?: string;
  lead_id?: string;
  opportunity_status: 'open' | 'closed';
  close_date?: string;
  reason_won_lost?: string;
  next_step?: string;
  type?: string;
  lead_source?: string;
  campaign_id?: string;
  assigned_to?: string;
  opportunity_type?: string;
  pipeline_stage_id?: string;
  preferred_ap_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Contact {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  mobile_phone?: string;
  title?: string;
  department?: string;
  account_id?: string;
  contact_status: 'active' | 'inactive';
  converted_from_lead_id?: string;
  lead_source?: string;
  preferred_contact_method?: 'email' | 'phone' | 'mobile';
  do_not_call?: boolean;
  do_not_email?: boolean;
  notes?: string;
  last_activity_date?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Account {
  id: string;
  account_name: string;
  account_type: 'prospect' | 'customer' | 'partner' | 'competitor';
  account_status: 'active' | 'inactive';
  industry?: string;
  company_size?: string;
  website?: string;
  phone?: string;
  fax?: string;
  billing_address?: string;
  shipping_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  billing_country?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  shipping_country?: string;
  annual_revenue?: number;
  assigned_to?: string;
  notes?: string;
  primary_contact_id?: string;
  parent_account_id?: string;
  converted_from_lead_id?: string;
  last_activity_date?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface Activity {
  id: string;
  activity_type: 'call' | 'email' | 'meeting' | 'task' | 'note';
  subject: string;
  description?: string;
  activity_date: string;
  due_date?: string;
  completed: boolean;
  outcome?: string;
  lead_id?: string;
  opportunity_id?: string;
  contact_id?: string;
  account_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CRMStats {
  total_leads: number;
  total_opportunities: number;
  total_pipeline_value: number;
  total_activities: number;
  conversion_rate: number;
  win_rate: number;
  average_deal_size: number;
}

// Email Campaign interfaces
export interface EmailCampaign {
  id: string;
  campaign_name: string;
  campaign_type?: string;
  status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  subject_line?: string;
  email_content?: string;
  target_audience?: string;
  target_segments?: Record<string, any>;
  personalization_fields?: Record<string, any>;
  email_template_id?: string;
  scheduled_date?: string;
  sent_date?: string;
  total_recipients?: number;
  delivered_count?: number;
  opened_count?: number;
  clicked_count?: number;
  bounced_count?: number;
  unsubscribed_count?: number;
  leads_generated?: number;
  opportunities_created?: number;
  revenue_attributed?: number;
  campaign_cost?: number;
  geographic_targeting?: string[];
  industry_targeting?: string[];
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface EmailTemplate {
  id: string;
  template_name: string;
  template_type: string;
  subject_line: string;
  email_content: string;
  personalization_fields?: Record<string, any>;
  design_data?: Record<string, any>;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TargetAudience {
  id: string;
  name: string;
  criteria: Record<string, any>;
  estimated_size: number;
}

export interface CampaignAnalytics {
  campaign_id: string;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
  roi: number;
  engagement_score: number;
  total_sent: number;
  delivery_rate: number;
  geographic_breakdown: Array<{ location: string; opens: number; clicks: number; }>;
  device_breakdown: Array<{ device: string; opens: number; clicks: number; }>;
}

export interface CampaignPerformance {
  campaign_id: string;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
  roi: number;
  total_campaigns: number;
  total_recipients: number;
  avg_open_rate: number;
  avg_click_rate: number;
}

// Pipeline and Stage Management
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
  pipeline_type?: string;
  required_fields?: any[];
  automation_rules?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Enhanced interfaces for automation
export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  lead_id: string;
  execution_status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  execution_data: Record<string, any>;
  error_details?: Record<string, any>;
  step_results: any[];
  current_step: number;
  retry_count: number;
  max_retries: number;
}

export interface LeadWorkflow {
  id: string;
  workflow_name: string;
  workflow_description?: string;
  trigger_conditions: Record<string, any>;
  workflow_steps: any[];
  is_active: boolean;
  execution_priority: number;
  failure_handling: Record<string, any>;
  success_metrics: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AssignmentPerformance {
  id: string;
  user_id: string;
  assignment_date: string;
  leads_assigned: number;
  leads_contacted: number;
  leads_qualified: number;
  leads_converted: number;
  avg_response_time?: string;
  quality_score: number;
  current_load: number;
  max_capacity: number;
  availability_status: string;
  created_at: string;
  updated_at: string;
}

// New advanced types
export interface LeadScoringRule {
  id: string;
  rule_name: string;
  rule_description?: string;
  field_name: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_list';
  field_value: string;
  score_points: number;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssignmentRule {
  id: string;
  rule_name: string;
  rule_description?: string;
  criteria: Record<string, any>;
  assignment_type: 'round_robin' | 'load_balanced' | 'skill_based' | 'geographic';
  assigned_user_id?: string;
  is_active: boolean;
  priority: number;
  working_hours?: Record<string, any>;
  escalation_rules?: Record<string, any>;
  automation_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Analytics interfaces
export interface PipelineMetrics {
  stage_name: string;
  opportunity_count: number;
  total_value: number;
  avg_probability: number;
  stageDistribution?: PipelineStageData[];
  totalPipelineValue?: number;
  weightedPipelineValue?: number;
  averageCloseTime?: number;
  conversionRate?: number;
}

export interface PipelineStageData {
  stage_name: string;
  opportunity_count: number;
  total_value: number;
  avg_probability: number;
}

export interface RevenueMetrics {
  currentRevenue: number;
  previousRevenue: number;
  growthRate: number;
  pipelineValue: number;
  averageDealSize: number;
  forecastValue: number;
  monthly_data: MonthlyRevenueData[];
  revenue_by_source: RevenueBySource[];
  forecast: RevenueForecast;
}

export interface MonthlyRevenueData {
  month: string;
  revenue: number;
  target: number;
  growth_rate: number;
}

export interface RevenueBySource {
  source: string;
  revenue: number;
  percentage: number;
}

export interface RevenueForecast {
  current_quarter: number;
  next_quarter: number;
  confidence_level: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

// Dashboard configuration
export interface DashboardConfig {
  welcomeMessage: string;
  subtitle: string;
  widgets: string[];
}

// Role Management and Progression
export interface ProgressionEvaluation {
  eligible: boolean;
  score: number;
  requirementsMet: RequirementStatus[];
  blockers: ProgressionBlocker[];
  nextSteps: string[];
}

export interface RequirementStatus {
  type: 'hours' | 'courses' | 'assessments' | 'supervision';
  name: string;
  completed: boolean;
  progress: number;
  required: number;
  details: any;
}

export interface ProgressionBlocker {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AvailableProgression {
  targetRole: string;
  title: string;
  description: string;
  eligibility: {
    met: boolean;
    score: number;
    blockers: string[];
  };
  requirements: RequirementStatus[];
}
