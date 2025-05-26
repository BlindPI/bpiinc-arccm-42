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
  is_dismissed?: boolean;
  badge_count?: number;
  metadata?: Record<string, any>;
}

export interface NotificationFilters {
  read?: boolean;
  category?: string;
  priority?: string;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
  isDismissed?: boolean;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type_id: string;
  category?: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  browser_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationType {
  id: string;
  display_name: string;
  description: string;
  icon: string;
  default_priority: 'low' | 'normal' | 'high' | 'urgent';
  requires_email: boolean;
  category: string;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationBadge {
  id: string;
  user_id: string;
  page_path: string;
  badge_count: number;
  last_updated: string;
}

export interface NotificationDigest {
  id: string;
  user_id: string;
  digest_type: 'daily' | 'weekly';
  last_sent_at?: string;
  next_scheduled_at?: string;
  is_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: string;
  category?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  actionUrl?: string;
  metadata?: Record<string, any>;
  pagePath?: string;
  sendEmail?: boolean;
}

export interface NotificationCountResult {
  total: number;
  unread: number;
  byCategoryAndPriority: Record<string, {
    total: number;
    unread: number;
    byPriority: Record<string, {
      total: number;
      unread: number;
    }>;
  }>;
  byPage?: Record<string, number>;
}

export interface UpdateNotificationPreferenceParams {
  userId: string;
  notificationTypeId: string;
  updates: {
    in_app_enabled?: boolean;
    email_enabled?: boolean;
    browser_enabled?: boolean;
  };
}

export interface NotificationDigestSettings {
  dailyDigest: boolean;
  weeklyDigest: boolean;
  digestTime: string; // Format: "HH:MM"
  digestDay: number; // 0-6 (Sunday-Saturday)
}

export type NotificationCategory = 
  | 'GENERAL'
  | 'CERTIFICATE'
  | 'COURSE'
  | 'ACCOUNT'
  | 'ROLE_MANAGEMENT'
  | 'SUPERVISION'
  | 'INSTRUCTOR'
  | 'PROVIDER'
  | 'SYSTEM';