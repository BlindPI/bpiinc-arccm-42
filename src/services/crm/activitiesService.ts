
import { supabase } from '@/integrations/supabase/client';
import { Activity } from '@/types/crm';

export class ActivitiesService {
  static async getActivities(): Promise<Activity[]> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .select('*')
        .order('activity_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  static async createActivity(activity: Partial<Activity>): Promise<Activity | null> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .insert(activity)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating activity:', error);
      return null;
    }
  }

  static async updateActivity(id: string, updates: Partial<Activity>): Promise<Activity | null> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating activity:', error);
      return null;
    }
  }

  static async deleteActivity(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('crm_activities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting activity:', error);
      return false;
    }
  }
}
