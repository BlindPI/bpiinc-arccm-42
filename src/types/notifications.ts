
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
