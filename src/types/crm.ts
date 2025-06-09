
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
  account_type: string;
  industry?: string;
  account_status: 'active' | 'inactive' | 'prospect';
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
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
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  opportunity_name: string;
  account_name?: string;
  estimated_value: number;
  stage: 'prospect' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number;
  expected_close_date?: string;
  opportunity_status: 'open' | 'closed';
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  title?: string;
  department?: string;
  account_id?: string;
  contact_status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
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
