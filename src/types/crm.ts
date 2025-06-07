
// Enterprise CRM TypeScript Interfaces - Updated to match new database schema

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name?: string;
  phone?: string;
  job_title?: string;
  lead_status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  lead_score: number;
  lead_source: 'website' | 'referral' | 'social_media' | 'email' | 'cold_call' | 'trade_show' | 'other';
  notes?: string;
  assigned_to?: string;
  last_activity_date?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  lead_type?: 'individual' | 'corporate';
  training_urgency?: 'immediate' | 'within_month' | 'within_quarter' | 'planning';
  estimated_participant_count?: number;
  preferred_training_format?: 'in_person' | 'virtual' | 'blended' | 'self_paced';
  budget_range?: string;
  decision_timeline?: string;
  certification_requirements?: string;
  company_size?: string;
  industry?: string;
  website?: string;
  linkedin_profile?: string;
  referral_source?: string;
  qualification_notes?: string;
  last_contact_date?: string;
  province?: string;
  city?: string;
  postal_code?: string;
  annual_revenue_range?: string;
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
  contact_status: 'active' | 'inactive' | 'bounced';
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
  account_status?: string;
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

export interface Opportunity {
  id: string;
  opportunity_name: string;
  account_name?: string;
  account_id?: string;
  estimated_value: number;
  stage: 'Prospect' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  probability: number;
  expected_close_date?: string;
  description?: string;
  lead_id?: string;
  opportunity_status?: 'open' | 'closed';
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

export interface Activity {
  id: string;
  activity_type: 'call' | 'email' | 'meeting' | 'task' | 'note';
  subject: string;
  description?: string;
  activity_date?: string;
  due_date?: string;
  completed: boolean;
  outcome?: string;
  lead_id?: string;
  opportunity_id?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface PipelineStage {
  id: string;
  stage_name: string;
  stage_order: number;
  pipeline_type?: string;
  stage_probability?: number;
  probability_percentage?: number;
  is_closed?: boolean;
  is_active?: boolean;
  stage_color?: string;
  stage_description?: string;
  required_fields?: string[];
  automation_rules?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

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

// Analytics Interfaces
export interface CRMStats {
  totalLeads: number;
  totalOpportunities: number;
  pipelineValue: number;
  totalActivities: number;
  conversionRate: number;
  winRate: number;
  averageDealSize: number;
}

export interface RevenueMetrics {
  currentRevenue: number;
  previousRevenue: number;
  growthRate: number;
  averageDealSize: number;
  pipelineValue: number;
  forecastValue: number;
}

export interface PipelineMetrics {
  totalPipelineValue: number;
  weightedPipelineValue: number;
  averageCloseTime: number;
  conversionRate: number;
  stageDistribution: Array<{
    stage_name: string;
    opportunity_count: number;
    total_value: number;
    avg_probability: number;
  }>;
}

export interface MonthlyRevenueData {
  month: string;
  revenue: number;
  deals: number;
  totalRevenue: number;
}

export interface RevenueBySource {
  source: string;
  revenue: number;
  percentage: number;
  count: number;
}

export interface RevenueForecast {
  month: string;
  predicted: number;
  confidence: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface ConversionAudit {
  id: string;
  lead_id: string;
  conversion_type: string;
  before_data: any;
  after_data: any;
  created_entities: any;
  conversion_options?: any;
  converted_by: string;
  conversion_date?: string;
  success?: boolean;
  notes?: string;
  error_details?: string;
}

export interface AnalyticsCache {
  id: string;
  cache_key: string;
  cache_data: any;
  expires_at: string;
  created_at: string;
}

// New interfaces for updated services
export interface CampaignAnalytics {
  campaign_id: string;
  total_sent?: number;
  delivery_rate?: number;
  open_rate?: number;
  click_rate?: number;
  conversion_rate?: number;
  opens_over_time: Array<{ date: string; opens: number }>;
  clicks_over_time: Array<{ date: string; clicks: number }>;
  geographic_breakdown: Array<{ location: string; opens: number; clicks: number }>;
  device_breakdown: Array<{ device: string; opens: number; clicks: number }>;
}

export interface TargetAudience {
  id: string;
  name: string;
  criteria: Record<string, any>;
  estimated_size: number;
}

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
  created_by?: string;
}
