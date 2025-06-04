// CRM System Types for Assured Response Sales CRM
// Comprehensive type definitions for leads, opportunities, activities, and revenue tracking

export interface CRMLead {
  id: string;
  
  // Lead Classification
  lead_type: 'individual' | 'corporate' | 'potential_ap';
  lead_source: string;
  lead_status: string;
  
  // Contact Information
  first_name?: string;
  last_name?: string;
  company_name?: string;
  job_title?: string;
  email: string;
  phone?: string;
  
  // Address Information
  address_line1?: string;
  address_line2?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  
  // Business Information
  industry?: string;
  company_size?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  annual_revenue_range?: string;
  number_of_employees?: number;
  
  // Training Needs
  required_certifications?: string[];
  training_urgency?: 'immediate' | 'within_month' | 'within_quarter' | 'planning';
  preferred_location?: string;
  preferred_training_format?: 'in_person' | 'blended' | 'flexible';
  estimated_participant_count?: number;
  budget_range?: string;
  
  // Lead Scoring
  lead_score: number;
  qualification_notes?: string;
  pain_points?: string[];
  decision_timeline?: string;
  decision_makers?: Record<string, any>;
  
  // Assignment and Tracking
  assigned_to?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  last_contact_date?: string;
  next_follow_up_date?: string;
  
  // Integration
  converted_to_opportunity_id?: string;
  converted_date?: string;
  
  status: string;
}

export interface CRMOpportunity {
  id: string;
  lead_id?: string;
  
  // Opportunity Details
  opportunity_name: string;
  opportunity_type: 'individual_training' | 'corporate_contract' | 'ap_partnership';
  stage: string;
  
  // Financial Information
  estimated_value: number;
  probability: number;
  expected_close_date?: string;
  actual_close_date?: string;
  
  // Training Details
  certification_types?: string[];
  participant_count?: number;
  training_location?: string;
  preferred_ap_id?: number;
  training_schedule?: Record<string, any>;
  
  // Corporate Contract Details
  contract_duration_months?: number;
  recurring_training?: boolean;
  volume_discount_applicable?: boolean;
  
  // AP Partnership Details
  proposed_service_areas?: string[];
  expected_monthly_volume?: number;
  setup_investment?: number;
  
  // Sales Process
  proposal_sent_date?: string;
  proposal_value?: number;
  competitor_analysis?: Record<string, any>;
  objections_notes?: string;
  next_steps?: string;
  
  // Management
  assigned_to?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  status: string;
}

export interface CRMActivity {
  id: string;
  lead_id?: string;
  opportunity_id?: string;
  
  // Activity Details
  activity_type: 'call' | 'email' | 'meeting' | 'demo' | 'proposal' | 'follow_up';
  subject: string;
  description?: string;
  
  // Timing
  activity_date: string;
  duration_minutes?: number;
  
  // Outcome
  outcome?: 'positive' | 'neutral' | 'negative' | 'no_response';
  outcome_notes?: string;
  interest_level?: number; // 1-10 scale
  
  // Follow-up
  follow_up_required?: boolean;
  follow_up_date?: string;
  follow_up_type?: string;
  
  // Participants and Location
  attendees?: Record<string, any>;
  location?: string;
  meeting_type?: 'phone' | 'video' | 'in_person' | 'email';
  
  // Documents and Attachments
  documents?: Record<string, any>;
  
  // Management
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CRMPipelineStage {
  id: string;
  pipeline_type: 'individual' | 'corporate' | 'ap_partnership';
  stage_name: string;
  stage_order: number;
  probability_default?: number;
  is_closed_won?: boolean;
  is_closed_lost?: boolean;
  automation_rules?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CRMEmailCampaign {
  id: string;
  campaign_name: string;
  campaign_type: 'lead_nurture' | 'promotional' | 'educational' | 'follow_up';
  target_audience: 'individuals' | 'corporate' | 'potential_aps' | 'all';
  
  // Email Content
  subject_line: string;
  email_template_id?: string;
  personalization_fields?: Record<string, any>;
  
  // Targeting
  target_segments?: Record<string, any>;
  geographic_targeting?: string[];
  industry_targeting?: string[];
  
  // Scheduling
  scheduled_date?: string;
  sent_date?: string;
  
  // Performance Metrics
  status: string;
  total_recipients: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  leads_generated: number;
  opportunities_created: number;
  revenue_attributed: number;
  
  // Management
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CRMTask {
  id: string;
  lead_id?: string;
  opportunity_id?: string;
  
  // Task Details
  task_title: string;
  description?: string;
  task_type?: 'follow_up' | 'proposal' | 'demo' | 'contract_review' | 'onboarding';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Timing
  due_date?: string;
  completed_date?: string;
  reminder_date?: string;
  
  // Assignment
  assigned_to?: string;
  created_by?: string;
  
  // Status
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  completion_notes?: string;
  
  created_at: string;
  updated_at: string;
}

export interface CRMRevenueRecord {
  id: string;
  opportunity_id?: string;
  
  // Revenue Details
  revenue_type: 'certificate_sale' | 'corporate_contract' | 'ap_setup_fee' | 'recurring_revenue';
  amount: number;
  currency: string;
  
  // Timing
  revenue_date: string;
  billing_period_start?: string;
  billing_period_end?: string;
  
  // Attribution
  ap_location_id?: number;
  certificate_count?: number;
  participant_count?: number;
  
  // Commission and Tracking
  sales_rep_id?: string;
  commission_rate?: number;
  commission_amount?: number;
  
  // Integration
  certificate_request_ids?: string[];
  invoice_reference?: string;
  
  created_at: string;
  updated_at: string;
}

export interface CRMAnalyticsCache {
  id: string;
  metric_type: string;
  metric_period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  metric_date: string;
  metric_data: Record<string, any>;
  calculated_at: string;
  expires_at: string;
}

// Form Data Types
export interface CreateLeadData {
  lead_type: 'individual' | 'corporate' | 'potential_ap';
  lead_source: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  job_title?: string;
  email: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  industry?: string;
  company_size?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  number_of_employees?: number;
  required_certifications?: string[];
  training_urgency?: 'immediate' | 'within_month' | 'within_quarter' | 'planning';
  preferred_location?: string;
  estimated_participant_count?: number;
  budget_range?: string;
  qualification_notes?: string;
  pain_points?: string[];
  assigned_to?: string;
}

export interface CreateOpportunityData {
  lead_id?: string;
  opportunity_name: string;
  opportunity_type: 'individual_training' | 'corporate_contract' | 'ap_partnership';
  stage: string;
  estimated_value: number;
  probability: number;
  expected_close_date?: string;
  certification_types?: string[];
  participant_count?: number;
  training_location?: string;
  preferred_ap_id?: number;
  contract_duration_months?: number;
  recurring_training?: boolean;
  proposed_service_areas?: string[];
  expected_monthly_volume?: number;
  setup_investment?: number;
  description?: string;
  next_steps?: string;
  assigned_to?: string;
}

export interface CreateActivityData {
  lead_id?: string;
  opportunity_id?: string;
  activity_type: 'call' | 'email' | 'meeting' | 'demo' | 'proposal' | 'follow_up';
  subject: string;
  description?: string;
  activity_date: string;
  duration_minutes?: number;
  outcome?: 'positive' | 'neutral' | 'negative' | 'no_response';
  outcome_notes?: string;
  interest_level?: number;
  follow_up_required?: boolean;
  follow_up_date?: string;
  follow_up_type?: string;
  attendees?: Record<string, any>;
  location?: string;
  meeting_type?: 'phone' | 'video' | 'in_person' | 'email';
}

export interface CreateTaskData {
  lead_id?: string;
  opportunity_id?: string;
  task_title: string;
  description?: string;
  task_type?: 'follow_up' | 'proposal' | 'demo' | 'contract_review' | 'onboarding';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  reminder_date?: string;
  assigned_to?: string;
}

// Filter Types
export interface LeadFilters {
  lead_type?: 'individual' | 'corporate' | 'potential_ap';
  lead_source?: string;
  lead_status?: string;
  assigned_to?: string;
  min_score?: number;
  max_score?: number;
  training_urgency?: 'immediate' | 'within_month' | 'within_quarter' | 'planning';
  company_size?: '1-10' | '11-50' | '51-200' | '201-500' | '500+';
  industry?: string;
  province?: string;
  created_after?: string;
  created_before?: string;
  next_follow_up_after?: string;
  next_follow_up_before?: string;
}

export interface OpportunityFilters {
  opportunity_type?: 'individual_training' | 'corporate_contract' | 'ap_partnership';
  stage?: string;
  assigned_to?: string;
  min_value?: number;
  max_value?: number;
  min_probability?: number;
  max_probability?: number;
  expected_close_after?: string;
  expected_close_before?: string;
  status?: string;
}

export interface ActivityFilters {
  lead_id?: string;
  opportunity_id?: string;
  activity_type?: 'call' | 'email' | 'meeting' | 'demo' | 'proposal' | 'follow_up';
  outcome?: 'positive' | 'neutral' | 'negative' | 'no_response';
  created_by?: string;
  date_from?: string;
  date_to?: string;
}

// Analytics Types
export interface PipelineMetrics {
  stage_name: string;
  opportunity_count: number;
  total_value: number;
  avg_probability: number;
}

export interface RevenueMetrics {
  total_revenue: number;
  certificate_revenue: number;
  corporate_revenue: number;
  ap_setup_revenue: number;
  transaction_count: number;
}

export interface LeadSourceMetrics {
  source: string;
  lead_count: number;
  conversion_rate: number;
  avg_lead_score: number;
  total_revenue_attributed: number;
}

export interface SalesPerformanceMetrics {
  sales_rep_id: string;
  sales_rep_name: string;
  leads_assigned: number;
  opportunities_created: number;
  opportunities_won: number;
  total_revenue: number;
  avg_deal_size: number;
  conversion_rate: number;
}

export interface CampaignMetrics {
  campaign_id: string;
  campaign_name: string;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
  leads_generated: number;
  revenue_attributed: number;
  roi: number;
}

// Dashboard Widget Types
export interface CRMDashboardMetrics {
  monthly_revenue: number;
  monthly_revenue_change: number;
  active_opportunities: number;
  active_opportunities_change: number;
  conversion_rate: number;
  conversion_rate_change: number;
  avg_deal_size: number;
  avg_deal_size_change: number;
  pipeline_value: number;
  leads_this_month: number;
  tasks_due_today: number;
  follow_ups_overdue: number;
}

export interface TopPerformingAP {
  ap_id: number;
  ap_name: string;
  location: string;
  referrals_received: number;
  certificates_issued: number;
  revenue_generated: number;
  conversion_rate: number;
}

// Service Response Types
export interface CRMServiceResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Lead Scoring Configuration
export interface LeadScoringConfig {
  urgency_weights: {
    immediate: number;
    within_month: number;
    within_quarter: number;
    planning: number;
  };
  company_size_weights: {
    '1-10': number;
    '11-50': number;
    '51-200': number;
    '201-500': number;
    '500+': number;
  };
  contact_quality_weights: {
    has_phone_and_email: number;
    has_company_name: number;
    has_job_title: number;
  };
  volume_weights: {
    participant_count_multiplier: number;
    max_volume_score: number;
  };
  industry_weights: Record<string, number>;
}

// Integration Types
export interface APLocationMatch {
  ap_id: number;
  ap_name: string;
  distance_km: number;
  has_required_certifications: boolean;
  performance_rating: number;
  availability_score: number;
  match_score: number;
}

export interface CertificateRevenueAttribution {
  certificate_request_id: string;
  opportunity_id?: string;
  lead_id?: string;
  revenue_amount: number;
  ap_location_id: number;
  sales_rep_id?: string;
  attribution_confidence: number;
}

// Automation Types
export interface AutomationTrigger {
  trigger_type: 'lead_created' | 'opportunity_stage_changed' | 'activity_logged' | 'task_completed';
  conditions: Record<string, any>;
  actions: AutomationAction[];
}

export interface AutomationAction {
  action_type: 'send_email' | 'create_task' | 'update_field' | 'assign_user' | 'create_activity';
  parameters: Record<string, any>;
  delay_minutes?: number;
}

// Email Template Types
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string;
  template_type: 'welcome' | 'follow_up' | 'proposal' | 'nurture' | 'promotional';
  target_audience: 'individual' | 'corporate' | 'potential_ap' | 'all';
  personalization_fields: string[];
  is_active: boolean;
}

// Report Types
export interface CRMReport {
  id: string;
  report_name: string;
  report_type: 'sales_performance' | 'pipeline_analysis' | 'lead_source_roi' | 'ap_network_performance';
  parameters: Record<string, any>;
  generated_at: string;
  generated_by: string;
  data: Record<string, any>;
}

// Settings Types for CRM Configuration
export interface PipelineStage {
  id: string;
  stage_name: string;
  stage_description?: string;
  stage_order: number;
  probability_percentage: number;
  is_active: boolean;
  stage_color?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadScoringRule {
  id: string;
  rule_name: string;
  rule_description?: string;
  field_name: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range';
  field_value: string;
  score_points: number;
  priority: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AssignmentRule {
  id: string;
  rule_name: string;
  rule_description?: string;
  criteria: Record<string, any>;
  assignment_type: 'round_robin' | 'territory_based' | 'skill_based' | 'workload_based';
  assigned_users: string[];
  priority: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}