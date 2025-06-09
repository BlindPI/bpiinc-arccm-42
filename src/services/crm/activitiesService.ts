
import { supabase } from '@/integrations/supabase/client';
import type { Activity } from '@/types/supabase-schema';

export class ActivitiesService {
  static transformActivity(dbActivity: any): Activity {
    return {
      ...dbActivity,
      activity_type: dbActivity.activity_type as 'email' | 'call' | 'meeting' | 'task' | 'note'
    };
  }

  static async getActivities(): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('crm_activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(this.transformActivity);
  }
}

export const activitiesService = ActivitiesService;
