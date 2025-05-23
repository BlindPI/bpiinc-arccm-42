
export interface NotificationQueueEntry {
  id: string;
  created_at: string;
  notification_id: string;
  recipient: string;
  subject: string;
  content: string;
  status: string;
  priority: string;
  processed_at?: string;
  error?: string;
  category: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO' | 'ACTION';
  category?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  read: boolean;
  read_at: string | null;
  action_url: string | null;
  created_at: string;
  updated_at?: string;
}

export interface NotificationFilters {
  read?: boolean;
  category?: string;
  priority?: string;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  category: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  browser_enabled: boolean;
}