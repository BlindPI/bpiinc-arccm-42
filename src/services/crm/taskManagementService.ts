
import { supabase } from '@/integrations/supabase/client';
import type { Task, Activity, TaskFilters, TaskMetrics } from '@/types/api';

export class TaskManagementService {
  static mapActivityToTask(activity: any): Task {
    return {
      id: activity.id,
      created_at: activity.created_at,
      updated_at: activity.updated_at,
      
      // Map activity fields to task interface
      task_title: activity.subject || activity.activity_title || 'Untitled Task',
      task_description: activity.description || activity.activity_description || '',
      task_type: activity.activity_type || 'task',
      priority: activity.priority || 'medium',
      status: this.mapActivityStatusToTaskStatus(activity.activity_type),
      
      // Keep original activity fields for compatibility
      activity_type: activity.activity_type,
      activity_title: activity.subject,
      activity_description: activity.description,
      duration: activity.duration,
      next_steps: activity.next_steps,
      activity_date: activity.activity_date,
      
      // Relationships
      user_id: activity.user_id || activity.created_by,
      assigned_to: activity.created_by,
      lead_id: activity.lead_id,
      contact_id: activity.contact_id,
      opportunity_id: activity.opportunity_id,
      
      // Scheduling
      due_date: activity.due_date || activity.activity_date,
      estimated_duration: activity.duration,
      actual_duration: activity.actual_duration,
      completed_date: activity.completed_date,
      
      // Additional fields with defaults
      tags: activity.tags || [],
      notes: activity.description || activity.notes || '',
      attachments: activity.attachments || [],
      is_recurring: activity.is_recurring || false,
      created_by: activity.created_by,
      subtasks: [],
      reminder_date: activity.reminder_date,
      parent_task_id: activity.parent_task_id,
      recurrence_pattern: activity.recurrence_pattern
    };
  }

  static mapDatabaseToActivity(dbActivity: any): Activity {
    return {
      id: dbActivity.id,
      activity_type: dbActivity.activity_type || 'task',
      activity_title: dbActivity.subject || 'Untitled Activity',
      activity_description: dbActivity.description || '',
      duration: dbActivity.duration || 0,
      next_steps: dbActivity.next_steps || '',
      lead_id: dbActivity.lead_id,
      contact_id: dbActivity.contact_id,
      user_id: dbActivity.user_id || dbActivity.created_by,
      activity_date: dbActivity.activity_date || dbActivity.created_at,
      created_at: dbActivity.created_at,
      updated_at: dbActivity.updated_at,
      outcome: dbActivity.outcome || 'pending'
    };
  }

  static mapActivityStatusToTaskStatus(activityType: string): Task['status'] {
    if (!activityType) return 'pending';
    
    if (activityType.includes('completed')) return 'completed';
    if (activityType.includes('cancelled')) return 'cancelled';
    if (activityType.includes('progress')) return 'in_progress';
    
    return 'pending';
  }

  static async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task | null> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .insert([{
          activity_type: task.task_type || 'task',
          subject: task.task_title || 'New Task',
          description: task.task_description || task.notes,
          lead_id: task.lead_id,
          contact_id: task.contact_id,
          opportunity_id: task.opportunity_id,
          activity_date: task.due_date || task.activity_date,
          due_date: task.due_date,
          user_id: task.user_id,
          created_by: task.created_by || task.user_id,
          priority: task.priority
        }])
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

  static async createActivity(activity: Partial<Activity>): Promise<Activity | null> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .insert([{
          activity_type: activity.activity_type || 'task',
          subject: activity.activity_title || 'New Activity',
          description: activity.activity_description,
          lead_id: activity.lead_id,
          contact_id: activity.contact_id,
          activity_date: activity.activity_date,
          user_id: activity.user_id,
          outcome: activity.outcome || 'pending'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating activity:', error);
        return null;
      }

      return this.mapDatabaseToActivity(data);
    } catch (error) {
      console.error('Error creating activity:', error);
      return null;
    }
  }

  static async getActivities(filters: TaskFilters = {}): Promise<Activity[]> {
    try {
      let query = supabase
        .from('crm_activities')
        .select('*')
        .order('activity_date', { ascending: true });

      if (filters.userId) {
        query = query.eq('created_by', filters.userId);
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
        console.error('Error fetching activities:', error);
        return [];
      }

      return (data || []).map(this.mapDatabaseToActivity);
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
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
      const updateData: any = {};
      
      if (updates.task_title) updateData.subject = updates.task_title;
      if (updates.task_description) updateData.description = updates.task_description;
      if (updates.task_type) updateData.activity_type = updates.task_type;
      if (updates.due_date) updateData.due_date = updates.due_date;
      if (updates.activity_date) updateData.activity_date = updates.activity_date;
      if (updates.priority) updateData.priority = updates.priority;

      const { data, error } = await supabase
        .from('crm_activities')
        .update(updateData)
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
        query = query.eq('created_by', filters.userId);
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

      const tasks = (data || []).map(this.mapActivityToTask);

      // Handle subtasks if requested
      if (filters.include_subtasks) {
        for (const task of tasks) {
          if (task.id) {
            const subtasks = await this.getTasks({
              ...filters,
              include_subtasks: false // Prevent infinite recursion
            });
            task.subtasks = subtasks.filter(t => t.parent_task_id === task.id);
          }
        }
      }

      return tasks;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  static async completeTask(taskId: string, actualDuration?: number): Promise<boolean> {
    try {
      const updateData: any = {
        activity_type: 'completed_task',
        completed: true,
        updated_at: new Date().toISOString()
      };

      if (actualDuration) {
        updateData.duration = actualDuration;
      }

      const { error } = await supabase
        .from('crm_activities')
        .update(updateData)
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
      const completedTasks = tasks.filter(t => t.activity_type === 'completed_task' || t.completed);
      const now = new Date();
      const overdueTasks = tasks.filter(t => {
        const dueDate = new Date(t.due_date || t.activity_date);
        return dueDate < now && !t.completed && t.activity_type !== 'completed_task';
      });

      const totalTasks = tasks.length;
      const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
      const productivityScore = Math.max(0, 100 - (overdueTasks.length * 10));

      return {
        totalTasks,
        completedTasks: completedTasks.length,
        overdueTasks: overdueTasks.length,
        completionRate,
        productivityScore,
        total_tasks: totalTasks,
        completed_tasks: completedTasks.length,
        overdue_tasks: overdueTasks.length,
        completion_rate: completionRate,
        productivity_score: productivityScore
      };
    } catch (error) {
      console.error('Error getting task metrics:', error);
      return {
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        completionRate: 0,
        productivityScore: 0,
        total_tasks: 0,
        completed_tasks: 0,
        overdue_tasks: 0,
        completion_rate: 0,
        productivity_score: 0
      };
    }
  }

  static async getOverdueTasks(): Promise<Task[]> {
    try {
      const { data: activities, error } = await supabase
        .from('crm_activities')
        .select('*')
        .or('due_date.lt.' + new Date().toISOString() + ',activity_date.lt.' + new Date().toISOString())
        .neq('activity_type', 'completed_task')
        .neq('completed', true);

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
        .neq('activity_type', 'completed_task')
        .neq('completed', true);

      if (error) throw error;

      return (activities || []).map(this.mapActivityToTask);
    } catch (error) {
      console.error('Error getting upcoming tasks:', error);
      return [];
    }
  }

  // Fix method signature for createActivitiesBatch
  static async createActivitiesBatch(activities: Omit<Activity, 'id' | 'created_at' | 'updated_at'>[]): Promise<Activity[]> {
    try {
      const insertData = activities.map(activity => ({
        activity_type: activity.activity_type || 'task',
        subject: activity.activity_title || 'New Activity',
        description: activity.activity_description,
        lead_id: activity.lead_id,
        contact_id: activity.contact_id,
        activity_date: activity.activity_date,
        user_id: activity.user_id,
        outcome: activity.outcome || 'pending'
      }));

      const { data, error } = await supabase
        .from('crm_activities')
        .insert(insertData)
        .select();

      if (error) {
        console.error('Error creating activities batch:', error);
        return [];
      }

      return (data || []).map(this.mapDatabaseToActivity);
    } catch (error) {
      console.error('Error creating activities batch:', error);
      return [];
    }
  }
}
