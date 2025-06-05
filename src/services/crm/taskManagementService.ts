import { supabase } from '@/integrations/supabase/client';

export interface Task {
  id: string;
  task_title: string;
  task_description?: string;
  task_type: 'call' | 'email' | 'meeting' | 'follow_up' | 'demo' | 'proposal' | 'contract' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  due_date?: string;
  completed_date?: string;
  estimated_duration?: number; // in minutes
  actual_duration?: number; // in minutes
  assigned_to?: string;
  created_by?: string;
  lead_id?: string;
  opportunity_id?: string;
  contact_id?: string;
  tags?: string[];
  notes?: string;
  reminder_date?: string;
  is_recurring?: boolean;
  recurrence_pattern?: Record<string, any>;
  parent_task_id?: string;
  subtasks?: Task[];
  attachments?: string[];
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  activity_type: 'call' | 'email' | 'meeting' | 'note' | 'task' | 'proposal_sent' | 'contract_signed' | 'payment_received';
  activity_title: string;
  activity_description?: string;
  activity_date: string;
  duration?: number; // in minutes
  outcome?: string;
  next_steps?: string;
  lead_id?: string;
  opportunity_id?: string;
  contact_id?: string;
  user_id?: string;
  task_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TaskTemplate {
  id: string;
  template_name: string;
  template_description?: string;
  task_type: string;
  priority: string;
  estimated_duration?: number;
  task_steps: string[];
  default_assignee?: string;
  trigger_conditions?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskMetrics {
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  completion_rate: number;
  average_completion_time: number;
  tasks_by_type: Record<string, number>;
  tasks_by_priority: Record<string, number>;
  tasks_by_status: Record<string, number>;
  productivity_score: number;
}

export class TaskManagementService {
  // Get tasks with filters
  static async getTasks(filters?: {
    assigned_to?: string;
    status?: string;
    priority?: string;
    task_type?: string;
    due_date_from?: string;
    due_date_to?: string;
    lead_id?: string;
    opportunity_id?: string;
    include_subtasks?: boolean;
  }): Promise<Task[]> {
    try {
      let query = supabase
        .from('crm_tasks')
        .select('*')
        .order('due_date', { ascending: true, nullsFirst: false });

      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.task_type) {
        query = query.eq('task_type', filters.task_type);
      }
      if (filters?.due_date_from) {
        query = query.gte('due_date', filters.due_date_from);
      }
      if (filters?.due_date_to) {
        query = query.lte('due_date', filters.due_date_to);
      }
      if (filters?.lead_id) {
        query = query.eq('lead_id', filters.lead_id);
      }
      if (filters?.opportunity_id) {
        query = query.eq('opportunity_id', filters.opportunity_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      let tasks = (data || []).map(task => ({
        id: task.id,
        task_title: task.task_title,
        task_description: task.task_description,
        task_type: task.task_type,
        priority: task.priority,
        status: task.status,
        due_date: task.due_date,
        completed_date: task.completed_date,
        estimated_duration: task.estimated_duration,
        actual_duration: task.actual_duration,
        assigned_to: task.assigned_to,
        created_by: task.created_by,
        lead_id: task.lead_id,
        opportunity_id: task.opportunity_id,
        contact_id: task.contact_id,
        tags: task.tags,
        notes: task.notes,
        reminder_date: task.reminder_date,
        is_recurring: task.is_recurring,
        recurrence_pattern: task.recurrence_pattern,
        parent_task_id: task.parent_task_id,
        attachments: task.attachments,
        created_at: task.created_at,
        updated_at: task.updated_at
      }));

      // Load subtasks if requested
      if (filters?.include_subtasks) {
        for (const task of tasks) {
          if (!task.parent_task_id) { // Only for parent tasks
            const subtasks = await this.getSubtasks(task.id);
            task.subtasks = subtasks;
          }
        }
      }

      return tasks;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  // Get subtasks for a parent task
  static async getSubtasks(parentTaskId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('crm_tasks')
        .select('*')
        .eq('parent_task_id', parentTaskId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(task => ({
        id: task.id,
        task_title: task.task_title,
        task_description: task.task_description,
        task_type: task.task_type,
        priority: task.priority,
        status: task.status,
        due_date: task.due_date,
        completed_date: task.completed_date,
        estimated_duration: task.estimated_duration,
        actual_duration: task.actual_duration,
        assigned_to: task.assigned_to,
        created_by: task.created_by,
        lead_id: task.lead_id,
        opportunity_id: task.opportunity_id,
        contact_id: task.contact_id,
        tags: task.tags,
        notes: task.notes,
        reminder_date: task.reminder_date,
        is_recurring: task.is_recurring,
        recurrence_pattern: task.recurrence_pattern,
        parent_task_id: task.parent_task_id,
        attachments: task.attachments,
        created_at: task.created_at,
        updated_at: task.updated_at
      }));
    } catch (error) {
      console.error('Error fetching subtasks:', error);
      return [];
    }
  }

  // Create task
  static async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'subtasks'>): Promise<Task | null> {
    try {
      const { data, error } = await supabase
        .from('crm_tasks')
        .insert({
          task_title: task.task_title,
          task_description: task.task_description,
          task_type: task.task_type,
          priority: task.priority,
          status: task.status,
          due_date: task.due_date,
          completed_date: task.completed_date,
          estimated_duration: task.estimated_duration,
          actual_duration: task.actual_duration,
          assigned_to: task.assigned_to,
          created_by: task.created_by,
          lead_id: task.lead_id,
          opportunity_id: task.opportunity_id,
          contact_id: task.contact_id,
          tags: task.tags,
          notes: task.notes,
          reminder_date: task.reminder_date,
          is_recurring: task.is_recurring,
          recurrence_pattern: task.recurrence_pattern,
          parent_task_id: task.parent_task_id,
          attachments: task.attachments
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        task_title: data.task_title,
        task_description: data.task_description,
        task_type: data.task_type,
        priority: data.priority,
        status: data.status,
        due_date: data.due_date,
        completed_date: data.completed_date,
        estimated_duration: data.estimated_duration,
        actual_duration: data.actual_duration,
        assigned_to: data.assigned_to,
        created_by: data.created_by,
        lead_id: data.lead_id,
        opportunity_id: data.opportunity_id,
        contact_id: data.contact_id,
        tags: data.tags,
        notes: data.notes,
        reminder_date: data.reminder_date,
        is_recurring: data.is_recurring,
        recurrence_pattern: data.recurrence_pattern,
        parent_task_id: data.parent_task_id,
        attachments: data.attachments,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error creating task:', error);
      return null;
    }
  }

  // Update task
  static async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Only include defined fields in the update
      Object.keys(updates).forEach(key => {
        if (updates[key as keyof Task] !== undefined && key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'subtasks') {
          updateData[key] = updates[key as keyof Task];
        }
      });

      const { data, error } = await supabase
        .from('crm_tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        task_title: data.task_title,
        task_description: data.task_description,
        task_type: data.task_type,
        priority: data.priority,
        status: data.status,
        due_date: data.due_date,
        completed_date: data.completed_date,
        estimated_duration: data.estimated_duration,
        actual_duration: data.actual_duration,
        assigned_to: data.assigned_to,
        created_by: data.created_by,
        lead_id: data.lead_id,
        opportunity_id: data.opportunity_id,
        contact_id: data.contact_id,
        tags: data.tags,
        notes: data.notes,
        reminder_date: data.reminder_date,
        is_recurring: data.is_recurring,
        recurrence_pattern: data.recurrence_pattern,
        parent_task_id: data.parent_task_id,
        attachments: data.attachments,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error updating task:', error);
      return null;
    }
  }

  // Complete task
  static async completeTask(id: string, actualDuration?: number, notes?: string): Promise<boolean> {
    try {
      const updates: any = {
        status: 'completed',
        completed_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (actualDuration !== undefined) {
        updates.actual_duration = actualDuration;
      }

      if (notes) {
        updates.notes = notes;
      }

      const { error } = await supabase
        .from('crm_tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      // Create activity record
      await this.createActivity({
        activity_type: 'task',
        activity_title: 'Task Completed',
        activity_description: notes || 'Task marked as completed',
        activity_date: new Date().toISOString(),
        duration: actualDuration,
        task_id: id
      });

      return true;
    } catch (error) {
      console.error('Error completing task:', error);
      return false;
    }
  }

  // Delete task
  static async deleteTask(id: string): Promise<boolean> {
    try {
      // First delete any subtasks
      await supabase
        .from('crm_tasks')
        .delete()
        .eq('parent_task_id', id);

      // Then delete the main task
      const { error } = await supabase
        .from('crm_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  // Get activities
  static async getActivities(filters?: {
    lead_id?: string;
    opportunity_id?: string;
    contact_id?: string;
    user_id?: string;
    activity_type?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<Activity[]> {
    try {
      let query = supabase
        .from('crm_activities')
        .select('*')
        .order('activity_date', { ascending: false });

      if (filters?.lead_id) {
        query = query.eq('lead_id', filters.lead_id);
      }
      if (filters?.opportunity_id) {
        query = query.eq('opportunity_id', filters.opportunity_id);
      }
      if (filters?.contact_id) {
        query = query.eq('contact_id', filters.contact_id);
      }
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters?.activity_type) {
        query = query.eq('activity_type', filters.activity_type);
      }
      if (filters?.date_from) {
        query = query.gte('activity_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('activity_date', filters.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(activity => ({
        id: activity.id,
        activity_type: activity.activity_type,
        activity_title: activity.activity_title,
        activity_description: activity.activity_description,
        activity_date: activity.activity_date,
        duration: activity.duration,
        outcome: activity.outcome,
        next_steps: activity.next_steps,
        lead_id: activity.lead_id,
        opportunity_id: activity.opportunity_id,
        contact_id: activity.contact_id,
        user_id: activity.user_id,
        task_id: activity.task_id,
        metadata: activity.metadata,
        created_at: activity.created_at,
        updated_at: activity.updated_at
      }));
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  // Create activity
  static async createActivity(activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>): Promise<Activity | null> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .insert({
          activity_type: activity.activity_type,
          activity_title: activity.activity_title,
          activity_description: activity.activity_description,
          activity_date: activity.activity_date,
          duration: activity.duration,
          outcome: activity.outcome,
          next_steps: activity.next_steps,
          lead_id: activity.lead_id,
          opportunity_id: activity.opportunity_id,
          contact_id: activity.contact_id,
          user_id: activity.user_id,
          task_id: activity.task_id,
          metadata: activity.metadata
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        activity_type: data.activity_type,
        activity_title: data.activity_title,
        activity_description: data.activity_description,
        activity_date: data.activity_date,
        duration: data.duration,
        outcome: data.outcome,
        next_steps: data.next_steps,
        lead_id: data.lead_id,
        opportunity_id: data.opportunity_id,
        contact_id: data.contact_id,
        user_id: data.user_id,
        task_id: data.task_id,
        metadata: data.metadata,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error creating activity:', error);
      return null;
    }
  }

  // Get task metrics
  static async getTaskMetrics(filters?: {
    assigned_to?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<TaskMetrics> {
    try {
      let query = supabase.from('crm_tasks').select('*');

      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data: tasks, error } = await query;
      if (error) throw error;

      const allTasks = tasks || [];
      const completedTasks = allTasks.filter(t => t.status === 'completed');
      const overdueTasks = allTasks.filter(t => 
        t.status !== 'completed' && 
        t.due_date && 
        new Date(t.due_date) < new Date()
      );

      // Calculate completion times
      const completionTimes = completedTasks
        .filter(t => t.created_at && t.completed_date)
        .map(t => {
          const created = new Date(t.created_at);
          const completed = new Date(t.completed_date);
          return (completed.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
        });

      const avgCompletionTime = completionTimes.length > 0
        ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
        : 0;

      // Group by type, priority, status
      const tasksByType = allTasks.reduce((acc, task) => {
        acc[task.task_type] = (acc[task.task_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const tasksByPriority = allTasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const tasksByStatus = allTasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate productivity score (0-100)
      const completionRate = allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0;
      const overdueRate = allTasks.length > 0 ? (overdueTasks.length / allTasks.length) * 100 : 0;
      const productivityScore = Math.max(0, completionRate - (overdueRate * 0.5));

      return {
        total_tasks: allTasks.length,
        completed_tasks: completedTasks.length,
        overdue_tasks: overdueTasks.length,
        completion_rate: completionRate,
        average_completion_time: avgCompletionTime,
        tasks_by_type: tasksByType,
        tasks_by_priority: tasksByPriority,
        tasks_by_status: tasksByStatus,
        productivity_score: productivityScore
      };
    } catch (error) {
      console.error('Error getting task metrics:', error);
      return {
        total_tasks: 0,
        completed_tasks: 0,
        overdue_tasks: 0,
        completion_rate: 0,
        average_completion_time: 0,
        tasks_by_type: {},
        tasks_by_priority: {},
        tasks_by_status: {},
        productivity_score: 0
      };
    }
  }

  // Get overdue tasks
  static async getOverdueTasks(assignedTo?: string): Promise<Task[]> {
    try {
      let query = supabase
        .from('crm_tasks')
        .select('*')
        .lt('due_date', new Date().toISOString())
        .neq('status', 'completed')
        .neq('status', 'cancelled')
        .order('due_date', { ascending: true });

      if (assignedTo) {
        query = query.eq('assigned_to', assignedTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(task => ({
        id: task.id,
        task_title: task.task_title,
        task_description: task.task_description,
        task_type: task.task_type,
        priority: task.priority,
        status: 'overdue' as const,
        due_date: task.due_date,
        completed_date: task.completed_date,
        estimated_duration: task.estimated_duration,
        actual_duration: task.actual_duration,
        assigned_to: task.assigned_to,
        created_by: task.created_by,
        lead_id: task.lead_id,
        opportunity_id: task.opportunity_id,
        contact_id: task.contact_id,
        tags: task.tags,
        notes: task.notes,
        reminder_date: task.reminder_date,
        is_recurring: task.is_recurring,
        recurrence_pattern: task.recurrence_pattern,
        parent_task_id: task.parent_task_id,
        attachments: task.attachments,
        created_at: task.created_at,
        updated_at: task.updated_at
      }));
    } catch (error) {
      console.error('Error fetching overdue tasks:', error);
      return [];
    }
  }

  // Get upcoming tasks (due in next 7 days)
  static async getUpcomingTasks(assignedTo?: string): Promise<Task[]> {
    try {
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      let query = supabase
        .from('crm_tasks')
        .select('*')
        .gte('due_date', now.toISOString())
        .lte('due_date', nextWeek.toISOString())
        .neq('status', 'completed')
        .neq('status', 'cancelled')
        .order('due_date', { ascending: true });

      if (assignedTo) {
        query = query.eq('assigned_to', assignedTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(task => ({
        id: task.id,
        task_title: task.task_title,
        task_description: task.task_description,
        task_type: task.task_type,
        priority: task.priority,
        status: task.status,
        due_date: task.due_date,
        completed_date: task.completed_date,
        estimated_duration: task.estimated_duration,
        actual_duration: task.actual_duration,
        assigned_to: task.assigned_to,
        created_by: task.created_by,
        lead_id: task.lead_id,
        opportunity_id: task.opportunity_id,
        contact_id: task.contact_id,
        tags: task.tags,
        notes: task.notes,
        reminder_date: task.reminder_date,
        is_recurring: task.is_recurring,
        recurrence_pattern: task.recurrence_pattern,
        parent_task_id: task.parent_task_id,
        attachments: task.attachments,
        created_at: task.created_at,
        updated_at: task.updated_at
      }));
    } catch (error) {
      console.error('Error fetching upcoming tasks:', error);
      return [];
    }
  }

  // Create task from template
  static async createTaskFromTemplate(templateId: string, overrides?: Partial<Task>): Promise<Task | null> {
    try {
      // This would fetch a template and create a task based on it
      // For now, return a basic implementation
      const defaultTask: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'subtasks'> = {
        task_title: 'Task from Template',
        task_type: 'other',
        priority: 'medium',
        status: 'pending',
        ...overrides
      };

      return await this.createTask(defaultTask);
    } catch (error) {
      console.error('Error creating task from template:', error);
      return null;
    }
  }
}