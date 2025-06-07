
// Enterprise CRM TypeScript Interfaces - Updated to match actual database schema

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
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
  account_status?: 'active' | 'inactive';
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
  stage: string;
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
  probability_percentage?: number;
  is_closed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailCampaign {
  id: string;
  campaign_name: string;
  campaign_type?: string;
  status?: string;
  subject_line?: string;
  email_content?: text;
  target_audience?: string;
  scheduled_date?: string;
  sent_date?: string;
  total_recipients?: number;
  delivered_count?: number;
  opened_count?: number;
  clicked_count?: number;
  bounced_count?: number;
  unsubscribed_count?: number;
  leads_generated?: number;
  revenue_attributed?: number;
  campaign_cost?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ConversionRule {
  id: string;
  rule_name: string;
  rule_description?: string;
  conditions: any;
  actions: any;
  is_active?: boolean;
  priority?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface AssignmentRule {
  id: string;
  rule_name: string;
  rule_description?: string;
  assignment_type?: string;
  criteria: any;
  assigned_user_id?: string;
  is_active?: boolean;
  priority?: number;
  created_at: string;
  updated_at: string;
}

export interface LeadScoringRule {
  id: string;
  rule_name: string;
  field_name: string;
  field_value?: string;
  score_points: number;
  rule_description?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
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
