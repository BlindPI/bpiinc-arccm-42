
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO' | 'ACTION';
  read: boolean;
  read_at: string | null;
  action_url?: string | null;
  category: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  created_at: string;
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
  created_at: string;
  updated_at: string;
}

export interface NotificationCount {
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
}
