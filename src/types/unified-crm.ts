
// Unified EmailCampaign type definition to resolve conflicts
export interface EmailCampaign {
  id: string;
  campaign_name: string;
  campaign_type: 'newsletter' | 'promotional' | 'follow_up' | 'onboarding' | 'retention';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  subject_line: string;
  content?: string;
  html_content?: string;
  sender_name: string;
  sender_email: string;
  reply_to_email?: string;
  target_audience?: string;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  total_recipients?: number;
  tracking_enabled?: boolean;
  automation_rules?: Record<string, any>;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  sent_date?: string;
}

export interface CampaignSummary {
  totalCampaigns: number;
  activeCampaigns: number;
  totalRecipients: number;
  averageOpenRate: number;
  averageClickRate: number;
  totalRevenue: number;
}

// WorkflowApproval interface
export interface WorkflowApproval {
  id: string;
  workflow_instance_id: string;
  approver_id: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  approval_date?: string;
  approval_method: string;
  comments?: string;
  step_number: number;
  created_at: string;
}

// Notification type
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO' | 'ACTION';
  category: string;
  priority: string;
  read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  metadata?: Record<string, any>;
  action_url?: string;
  badge_count?: number;
  is_dismissed?: boolean;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  category: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
  browser_enabled: boolean;
  created_at: string;
  updated_at: string;
}
