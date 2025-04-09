
export interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ACTION';
  read: boolean;
  read_at: string | null;
  created_at: string;
  action_url?: string | null;
}

export interface NotificationInsert extends Omit<Notification, 'id' | 'created_at' | 'read' | 'read_at'> {
  read?: boolean;
  read_at?: string | null;
}
