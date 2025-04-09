
export interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ACTION';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category: 'GENERAL' | 'SYSTEM' | 'CERTIFICATE' | 'COURSE' | 'ACCOUNT' | 'SUPERVISION' | 'ROLE_MANAGEMENT';
  read: boolean;
  read_at: string | null;
  created_at: string;
  action_url?: string | null;
  image_url?: string | null;
  metadata?: Record<string, any> | null;
}

export interface NotificationInsert extends Omit<Notification, 'id' | 'created_at' | 'read' | 'read_at'> {
  read?: boolean;
  read_at?: string | null;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  category: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  browser_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationFilters {
  read?: boolean;
  category?: string;
  priority?: string;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
}
