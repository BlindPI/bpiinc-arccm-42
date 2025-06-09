
import { supabase } from '@/integrations/supabase/client';
import type { Activity } from '@/types/supabase-schema';

export class ActivitiesService {
  static async getActivities(): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('crm_activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const activitiesService = ActivitiesService;
