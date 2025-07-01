import { supabase } from '../../lib/supabase';
import { getNotificationTemplate } from './notificationTemplates';

export type NotificationType =
  | 'requirement_assigned'
  | 'requirement_updated'
  | 'submission_approved'
  | 'submission_rejected'
  | 'tier_switched'
  | 'comment_added'
  | 'due_date_approaching'
  | 'system_announcement';

export interface NotificationMetadata {
  [key: string]: any;
}

export interface NotificationData {
  userId: string;
  type: NotificationType;
  title?: string;
  message?: string;
  link?: string;
  metadata?: NotificationMetadata;
  urgent?: boolean;
}

export interface Notification extends NotificationData {
  id: string;
  created_at: string;
  read: boolean;
}

export class NotificationService {
  /**
   * Send a notification to a user
   */
  static async send(data: NotificationData): Promise<boolean> {
    try {
      // Get notification template if title/message not provided
      if (!data.title || !data.message) {
        const template = getNotificationTemplate(data.type, data.metadata);
        data.title = data.title || template.title;
        data.message = data.message || template.message;
        data.link = data.link || template.link;
      }
      
      // Insert notification into the database
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          link: data.link,
          metadata: data.metadata || {},
          urgent: data.urgent || false,
          read: false
        });
        
      if (error) throw error;
      
      // Send real-time notification via Supabase realtime
      await this.broadcastNotification(data);
      
      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }
  
  /**
   * Send notification to multiple users
   */
  static async bulkSend(userIds: string[], data: Omit<NotificationData, 'userId'>): Promise<boolean> {
    try {
      // Get notification template if title/message not provided
      if (!data.title || !data.message) {
        const template = getNotificationTemplate(data.type, data.metadata);
        data.title = data.title || template.title;
        data.message = data.message || template.message;
        data.link = data.link || template.link;
      }
      
      // Prepare bulk notifications
      const notifications = userIds.map(userId => ({
        user_id: userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        metadata: data.metadata || {},
        urgent: data.urgent || false,
        read: false
      }));
      
      // Insert all notifications
      const { error } = await supabase
        .from('notifications')
        .insert(notifications);
        
      if (error) throw error;
      
      // Broadcast to all users
      for (const userId of userIds) {
        await this.broadcastNotification({ ...data, userId });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to send bulk notifications:', error);
      return false;
    }
  }
  
  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }
  
  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }
  }
  
  /**
   * Delete a notification
   */
  static async delete(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }
  }
  
  /**
   * Get notifications for a user
   */
  static async getForUser(userId: string, limit = 50, includeRead = false): Promise<Notification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
        
      if (!includeRead) {
        query = query.eq('read', false);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Notification[];
    } catch (error) {
      console.error('Failed to get notifications:', error);
      return [];
    }
  }
  
  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);
        
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }
  
  /**
   * Broadcast notification via Supabase realtime
   */
  private static async broadcastNotification(data: NotificationData): Promise<void> {
    try {
      await supabase.from('notification_broadcast').insert({
        user_id: data.userId,
        payload: {
          type: data.type,
          title: data.title,
          message: data.message,
          link: data.link,
          metadata: data.metadata || {},
          urgent: data.urgent || false
        }
      });
    } catch (error) {
      console.error('Failed to broadcast notification:', error);
    }
  }
}