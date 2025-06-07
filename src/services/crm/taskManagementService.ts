import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/supabase-schema';

export type Task = Database['public']['Tables']['crm_activities']['Row'];

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  productivityScore: number;
  completionRate: number;
}

export interface Activity {
  id: string;
  activity_type: string;
  activity_title: string;
  activity_description: string;
  duration: number;
  next_steps: string;
  lead_id: string;
  contact_id?: string;
  user_id: string;
  activity_date: string;
  created_at: string;
  updated_at: string;
}

export interface TaskFilters {
  userId?: string;
  leadId?: string;
  contactId?: string;
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export class TaskManagementService {
  static mapActivityToTask(activity: any): Task {
    return {
      id: activity.id,
      created_at: activity.created_at,
      updated_at: activity.updated_at,
      activity_type: activity.activity_type,
      activity_title: activity.activity_title,
      activity_description: activity.activity_description,
      duration: activity.duration,
      next_steps: activity.next_steps,
      lead_id: activity.lead_id,
      contact_id: activity.contact_id,
      user_id: activity.user_id,
      activity_date: activity.activity_date
    };
  }

  static async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task | null> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .insert([task])
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        return null;
      }

      return data ? this.mapActivityToTask(data) : null;
    } catch (error) {
      console.error('Error creating task:', error);
      return null;
    }
  }

  static async getTaskById(taskId: string): Promise<Task | null> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) {
        console.error('Error fetching task:', error);
        return null;
      }

      return data ? this.mapActivityToTask(data) : null;
    } catch (error) {
      console.error('Error fetching task:', error);
      return null;
    }
  }

  static async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        console.error('Error updating task:', error);
        return null;
      }

      return data ? this.mapActivityToTask(data) : null;
    } catch (error) {
      console.error('Error updating task:', error);
      return null;
    }
  }

  static async deleteTask(taskId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('crm_activities')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  static async getTasks(filters: TaskFilters = {}): Promise<Task[]> {
    try {
      let query = supabase
        .from('crm_activities')
        .select('*')
        .order('activity_date', { ascending: true });

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.leadId) {
        query = query.eq('lead_id', filters.leadId);
      }

      if (filters.contactId) {
        query = query.eq('contact_id', filters.contactId);
      }

      if (filters.status) {
        query = query.eq('activity_type', filters.status);
      }

      if (filters.dateRange) {
        query = query
          .gte('activity_date', filters.dateRange.start)
          .lte('activity_date', filters.dateRange.end);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching tasks:', error);
        return [];
      }

      return (data || []).map(this.mapActivityToTask);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  static async completeTask(taskId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('crm_activities')
        .update({ 
          activity_type: 'completed_task',
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      return !error;
    } catch (error) {
      console.error('Error completing task:', error);
      return false;
    }
  }

  static async getTaskMetrics(): Promise<TaskMetrics> {
    try {
      const { data: activities, error } = await supabase
        .from('crm_activities')
        .select('*');

      if (error) throw error;

      const tasks = activities?.filter(a => a.activity_type?.includes('task')) || [];
      const completedTasks = tasks.filter(t => t.activity_type === 'completed_task');
      const now = new Date();
      const overdueTasks = tasks.filter(t => {
        const activityDate = new Date(t.activity_date);
        return activityDate < now && t.activity_type !== 'completed_task';
      });

      const totalTasks = tasks.length;
      const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
      const productivityScore = Math.max(0, 100 - (overdueTasks.length * 10));

      return {
        totalTasks,
        completedTasks: completedTasks.length,
        overdueTasks: overdueTasks.length,
        completionRate,
        productivityScore
      };
    } catch (error) {
      console.error('Error getting task metrics:', error);
      return {
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        completionRate: 0,
        productivityScore: 0
      };
    }
  }

  static async getOverdueTasks(): Promise<Task[]> {
    try {
      const { data: activities, error } = await supabase
        .from('crm_activities')
        .select('*')
        .lt('activity_date', new Date().toISOString())
        .neq('activity_type', 'completed_task');

      if (error) throw error;

      return (activities || []).map(this.mapActivityToTask);
    } catch (error) {
      console.error('Error getting overdue tasks:', error);
      return [];
    }
  }

  static async getUpcomingTasks(): Promise<Task[]> {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 7); // Next 7 days

      const { data: activities, error } = await supabase
        .from('crm_activities')
        .select('*')
        .gte('activity_date', new Date().toISOString())
        .lte('activity_date', tomorrow.toISOString())
        .neq('activity_type', 'completed_task');

      if (error) throw error;

      return (activities || []).map(this.mapActivityToTask);
    } catch (error) {
      console.error('Error getting upcoming tasks:', error);
      return [];
    }
  }
}
