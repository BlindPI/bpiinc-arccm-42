
import { supabase } from '@/integrations/supabase/client';
import type { Activity } from '@/types/crm';

// Type guard for valid activity priority
function isValidActivityPriority(priority: string): priority is 'low' | 'medium' | 'high' {
  return ['low', 'medium', 'high'].includes(priority);
}

export class EnhancedCRMService {
  static async getActivities(): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('crm_activities')
      .select('*')
      .order('activity_date', { ascending: false });
    
    if (error) throw error;
    
    // Type-safe conversion with proper validation
    return (data || []).map(activity => ({
      ...activity,
      priority: isValidActivityPriority(activity.priority) ? activity.priority : 'medium'
    })) as Activity[];
  }

  // Add other enhanced CRM methods as needed
  static async createActivity(activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>): Promise<Activity> {
    const { data, error } = await supabase
      .from('crm_activities')
      .insert(activity)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      ...data,
      priority: isValidActivityPriority(data.priority) ? data.priority : 'medium'
    } as Activity;
  }

  static async updateActivity(id: string, updates: Partial<Activity>): Promise<void> {
    const { error } = await supabase
      .from('crm_activities')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  }

  static async deleteActivity(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_activities')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}
