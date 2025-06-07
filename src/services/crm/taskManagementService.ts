
import { supabase } from '@/integrations/supabase/client';
import type { ActivityType } from '@/types/supabase-schema';

export interface Task {
  id: string;
  task_title: string;
  task_description?: string;
  task_type: 'call' | 'email' | 'meeting' | 'follow_up' | 'demo' | 'proposal' | 'contract' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  completed_date?: string;
  estimated_duration?: number;
  actual_duration?: number;
  assigned_to?: string;
  created_by?: string;
  lead_id?: string;
  opportunity_id?: string;
  contact_id?: string;
  account_id?: string;
  reminder_date?: string;
  is_recurring?: boolean;
  recurrence_pattern?: any;
  parent_task_id?: string;
  attachments?: any[];
  tags?: string[];
  notes?: string;
  subtasks?: Task[];
  created_at: string;
  updated_at: string;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  assigned_to?: string;
  due_date_range?: {
    start: string;
    end: string;
  };
  search?: string;
}

export interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
}

export class TaskManagementService {
  static async getTasks(filters?: TaskFilters): Promise<Task[]> {
    try {
      let query = supabase
        .from('crm_activities')
        .select('*')
        .eq('activity_type', 'task')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        // Map our task status to activity completion status
        if (filters.status === 'completed') {
          query = query.eq('completed', true);
        } else {
          query = query.eq('completed', false);
        }
      }

      if (filters?.assigned_to) {
        query = query.eq('created_by', filters.assigned_to);
      }

      if (filters?.due_date_range) {
        query = query
          .gte('due_date', filters.due_date_range.start)
          .lte('due_date', filters.due_date_range.end);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transform crm_activities to Task format
      return (data || []).map(activity => ({
        id: activity.id,
        task_title: activity.subject,
        task_description: activity.description,
        task_type: this.mapActivityTypeToTaskType(activity.activity_type as ActivityType),
        priority: activity.priority || 'medium',
        status: activity.completed ? 'completed' : 'pending',
        due_date: activity.due_date,
        completed_date: activity.completed ? activity.updated_at : undefined,
        estimated_duration: undefined, // Not available in crm_activities
        actual_duration: undefined, // Not available in crm_activities
        assigned_to: activity.created_by,
        created_by: activity.created_by,
        lead_id: activity.lead_id,
        opportunity_id: activity.opportunity_id,
        contact_id: activity.contact_id,
        account_id: activity.account_id,
        reminder_date: undefined, // Not available in crm_activities
        is_recurring: false, // Not available in crm_activities
        recurrence_pattern: undefined, // Not available in crm_activities
        parent_task_id: activity.parent_activity_id,
        attachments: [], // Not available in crm_activities
        tags: [],
        notes: activity.description,
        subtasks: [], // Would need separate query
        created_at: activity.created_at,
        updated_at: activity.updated_at
      })) as Task[];

    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  static async getTasksByUser(userId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .select('*')
        .eq('activity_type', 'task')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform crm_activities to Task format
      return (data || []).map(activity => ({
        id: activity.id,
        task_title: activity.subject,
        task_description: activity.description,
        task_type: this.mapActivityTypeToTaskType(activity.activity_type as ActivityType),
        priority: activity.priority || 'medium',
        status: activity.completed ? 'completed' : 'pending',
        due_date: activity.due_date,
        completed_date: activity.completed ? activity.updated_at : undefined,
        estimated_duration: undefined,
        actual_duration: undefined,
        assigned_to: activity.created_by,
        created_by: activity.created_by,
        lead_id: activity.lead_id,
        opportunity_id: activity.opportunity_id,
        contact_id: activity.contact_id,
        account_id: activity.account_id,
        reminder_date: undefined,
        is_recurring: false,
        recurrence_pattern: undefined,
        parent_task_id: activity.parent_activity_id,
        attachments: [],
        tags: [],
        notes: activity.description,
        subtasks: [],
        created_at: activity.created_at,
        updated_at: activity.updated_at
      })) as Task[];

    } catch (error) {
      console.error('Error fetching user tasks:', error);
      return [];
    }
  }

  static async createTask(task: Partial<Task>): Promise<Task | null> {
    try {
      const activityData = {
        activity_type: 'task',
        subject: task.task_title || 'Untitled Task',
        description: task.task_description,
        priority: task.priority || 'medium',
        due_date: task.due_date,
        lead_id: task.lead_id,
        opportunity_id: task.opportunity_id,
        contact_id: task.contact_id,
        account_id: task.account_id,
        created_by: task.created_by,
        completed: false
      };

      const { data, error } = await supabase
        .from('crm_activities')
        .insert(activityData)
        .select()
        .single();

      if (error) throw error;

      // Transform back to Task format
      return {
        id: data.id,
        task_title: data.subject,
        task_description: data.description,
        task_type: this.mapActivityTypeToTaskType(data.activity_type as ActivityType),
        priority: data.priority || 'medium',
        status: data.completed ? 'completed' : 'pending',
        due_date: data.due_date,
        completed_date: data.completed ? data.updated_at : undefined,
        estimated_duration: undefined,
        actual_duration: undefined,
        assigned_to: data.created_by,
        created_by: data.created_by,
        lead_id: data.lead_id,
        opportunity_id: data.opportunity_id,
        contact_id: data.contact_id,
        account_id: data.account_id,
        reminder_date: undefined,
        is_recurring: false,
        recurrence_pattern: undefined,
        parent_task_id: data.parent_activity_id,
        attachments: [],
        tags: [],
        notes: data.description,
        subtasks: [],
        created_at: data.created_at,
        updated_at: data.updated_at
      } as Task;

    } catch (error) {
      console.error('Error creating task:', error);
      return null;
    }
  }

  static async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    try {
      const activityUpdates: any = {};
      
      if (updates.task_title) activityUpdates.subject = updates.task_title;
      if (updates.task_description !== undefined) activityUpdates.description = updates.task_description;
      if (updates.priority) activityUpdates.priority = updates.priority;
      if (updates.due_date !== undefined) activityUpdates.due_date = updates.due_date;
      if (updates.status === 'completed') activityUpdates.completed = true;
      if (updates.status && updates.status !== 'completed') activityUpdates.completed = false;

      const { data, error } = await supabase
        .from('crm_activities')
        .update(activityUpdates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      // Transform back to Task format
      return {
        id: data.id,
        task_title: data.subject,
        task_description: data.description,
        task_type: this.mapActivityTypeToTaskType(data.activity_type as ActivityType),
        priority: data.priority || 'medium',
        status: data.completed ? 'completed' : 'pending',
        due_date: data.due_date,
        completed_date: data.completed ? data.updated_at : undefined,
        estimated_duration: undefined,
        actual_duration: undefined,
        assigned_to: data.created_by,
        created_by: data.created_by,
        lead_id: data.lead_id,
        opportunity_id: data.opportunity_id,
        contact_id: data.contact_id,
        account_id: data.account_id,
        reminder_date: undefined,
        is_recurring: false,
        recurrence_pattern: undefined,
        parent_task_id: data.parent_activity_id,
        attachments: [],
        tags: [],
        notes: data.description,
        subtasks: [],
        created_at: data.created_at,
        updated_at: data.updated_at
      } as Task;

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

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  static async getTaskStats(userId?: string): Promise<TaskStats> {
    try {
      let query = supabase
        .from('crm_activities')
        .select('completed, due_date')
        .eq('activity_type', 'task');

      if (userId) {
        query = query.eq('created_by', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const now = new Date();
      const total = data?.length || 0;
      const completed = data?.filter(task => task.completed).length || 0;
      const pending = data?.filter(task => !task.completed).length || 0;
      const overdue = data?.filter(task => 
        !task.completed && task.due_date && new Date(task.due_date) < now
      ).length || 0;

      return {
        total,
        pending,
        in_progress: 0, // Not tracked in current schema
        completed,
        overdue
      };
    } catch (error) {
      console.error('Error fetching task stats:', error);
      return {
        total: 0,
        pending: 0,
        in_progress: 0,
        completed: 0,
        overdue: 0
      };
    }
  }

  private static mapActivityTypeToTaskType(activityType: ActivityType): Task['task_type'] {
    switch (activityType) {
      case 'call': return 'call';
      case 'email': return 'email';
      case 'meeting': return 'meeting';
      case 'task': return 'other';
      case 'note': return 'other';
      default: return 'other';
    }
  }
}
