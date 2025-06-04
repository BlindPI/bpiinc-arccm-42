import { supabase } from '@/integrations/supabase/client';
import { 
  CRMActivity, 
  CreateActivityData, 
  ActivityFilters, 
  CRMServiceResponse, 
  PaginatedResponse 
} from '@/types/crm';

export class CRMActivityService {
  /**
   * Create a new activity
   */
  async createActivity(activityData: CreateActivityData): Promise<CRMServiceResponse<CRMActivity>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: 'User must be authenticated' };
      }

      const { data, error } = await supabase
        .from('crm_activities')
        .insert({
          ...activityData,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating activity:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in createActivity:', error);
      return { success: false, error: 'Failed to create activity' };
    }
  }

  /**
   * Get activities with filtering and pagination
   */
  async getActivities(
    filters: ActivityFilters = {}, 
    page: number = 1, 
    limit: number = 50
  ): Promise<CRMServiceResponse<PaginatedResponse<CRMActivity>>> {
    try {
      let query = supabase
        .from('crm_activities')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.lead_id) {
        query = query.eq('lead_id', filters.lead_id);
      }
      if (filters.opportunity_id) {
        query = query.eq('opportunity_id', filters.opportunity_id);
      }
      if (filters.activity_type) {
        query = query.eq('activity_type', filters.activity_type);
      }
      if (filters.outcome) {
        query = query.eq('outcome', filters.outcome);
      }
      if (filters.created_by) {
        query = query.eq('created_by', filters.created_by);
      }
      if (filters.date_from) {
        query = query.gte('activity_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('activity_date', filters.date_to);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query
        .order('activity_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching activities:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          data: data || [],
          total: count || 0,
          page,
          limit,
          has_more: (count || 0) > offset + limit
        }
      };
    } catch (error) {
      console.error('Error in getActivities:', error);
      return { success: false, error: 'Failed to fetch activities' };
    }
  }

  /**
   * Get a single activity by ID
   */
  async getActivity(activityId: string): Promise<CRMServiceResponse<CRMActivity>> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .select('*')
        .eq('id', activityId)
        .single();

      if (error) {
        console.error('Error fetching activity:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in getActivity:', error);
      return { success: false, error: 'Failed to fetch activity' };
    }
  }

  /**
   * Update an activity
   */
  async updateActivity(activityId: string, updates: Partial<CRMActivity>): Promise<CRMServiceResponse<CRMActivity>> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', activityId)
        .select()
        .single();

      if (error) {
        console.error('Error updating activity:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateActivity:', error);
      return { success: false, error: 'Failed to update activity' };
    }
  }

  /**
   * Delete an activity
   */
  async deleteActivity(activityId: string): Promise<CRMServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from('crm_activities')
        .delete()
        .eq('id', activityId);

      if (error) {
        console.error('Error deleting activity:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteActivity:', error);
      return { success: false, error: 'Failed to delete activity' };
    }
  }

  /**
   * Get activities for a specific lead
   */
  async getLeadActivities(leadId: string): Promise<CRMServiceResponse<CRMActivity[]>> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('activity_date', { ascending: false });

      if (error) {
        console.error('Error fetching lead activities:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getLeadActivities:', error);
      return { success: false, error: 'Failed to fetch lead activities' };
    }
  }

  /**
   * Get activities for a specific opportunity
   */
  async getOpportunityActivities(opportunityId: string): Promise<CRMServiceResponse<CRMActivity[]>> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('activity_date', { ascending: false });

      if (error) {
        console.error('Error fetching opportunity activities:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getOpportunityActivities:', error);
      return { success: false, error: 'Failed to fetch opportunity activities' };
    }
  }

  /**
   * Log a phone call activity
   */
  async logPhoneCall(
    leadId?: string, 
    opportunityId?: string, 
    duration: number = 0, 
    outcome: 'positive' | 'neutral' | 'negative' = 'neutral',
    notes?: string
  ): Promise<CRMServiceResponse<CRMActivity>> {
    const activityData: CreateActivityData = {
      lead_id: leadId,
      opportunity_id: opportunityId,
      activity_type: 'call',
      subject: 'Phone Call',
      description: notes || 'Phone call with prospect',
      activity_date: new Date().toISOString(),
      duration_minutes: duration,
      outcome
    };

    return this.createActivity(activityData);
  }

  /**
   * Log an email activity
   */
  async logEmail(
    leadId?: string, 
    opportunityId?: string, 
    subject: string = 'Email Communication',
    outcome: 'positive' | 'neutral' | 'negative' = 'neutral',
    notes?: string
  ): Promise<CRMServiceResponse<CRMActivity>> {
    const activityData: CreateActivityData = {
      lead_id: leadId,
      opportunity_id: opportunityId,
      activity_type: 'email',
      subject,
      description: notes || 'Email communication with prospect',
      activity_date: new Date().toISOString(),
      outcome
    };

    return this.createActivity(activityData);
  }

  /**
   * Log a meeting activity
   */
  async logMeeting(
    leadId?: string, 
    opportunityId?: string, 
    duration: number = 60,
    outcome: 'positive' | 'neutral' | 'negative' = 'positive',
    notes?: string
  ): Promise<CRMServiceResponse<CRMActivity>> {
    const activityData: CreateActivityData = {
      lead_id: leadId,
      opportunity_id: opportunityId,
      activity_type: 'meeting',
      subject: 'Meeting',
      description: notes || 'Meeting with prospect',
      activity_date: new Date().toISOString(),
      duration_minutes: duration,
      outcome
    };

    return this.createActivity(activityData);
  }

  /**
   * Log a follow-up activity
   */
  async logFollowUp(
    leadId?: string, 
    opportunityId?: string, 
    subject: string = 'Follow-up',
    outcome: 'positive' | 'neutral' | 'negative' = 'neutral',
    notes?: string
  ): Promise<CRMServiceResponse<CRMActivity>> {
    const activityData: CreateActivityData = {
      lead_id: leadId,
      opportunity_id: opportunityId,
      activity_type: 'follow_up',
      subject,
      description: notes || 'Follow-up with prospect',
      activity_date: new Date().toISOString(),
      outcome
    };

    return this.createActivity(activityData);
  }

  /**
   * Get activity summary for a time period
   */
  async getActivitySummary(
    startDate: string, 
    endDate: string, 
    userId?: string
  ): Promise<CRMServiceResponse<{
    total_activities: number;
    activities_by_type: Record<string, number>;
    activities_by_outcome: Record<string, number>;
    total_call_duration: number;
    avg_call_duration: number;
  }>> {
    try {
      let query = supabase
        .from('crm_activities')
        .select('activity_type, outcome, duration_minutes')
        .gte('activity_date', startDate)
        .lte('activity_date', endDate);

      if (userId) {
        query = query.eq('created_by', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching activity summary:', error);
        return { success: false, error: error.message };
      }

      const activities = data || [];
      const total_activities = activities.length;

      // Group by type
      const activities_by_type = activities.reduce((acc, activity) => {
        acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group by outcome
      const activities_by_outcome = activities.reduce((acc, activity) => {
        acc[activity.outcome] = (acc[activity.outcome] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate call duration metrics
      const callActivities = activities.filter(a => a.duration_minutes > 0);
      const total_call_duration = callActivities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);
      const avg_call_duration = callActivities.length > 0 ? total_call_duration / callActivities.length : 0;

      return {
        success: true,
        data: {
          total_activities,
          activities_by_type,
          activities_by_outcome,
          total_call_duration,
          avg_call_duration
        }
      };
    } catch (error) {
      console.error('Error in getActivitySummary:', error);
      return { success: false, error: 'Failed to get activity summary' };
    }
  }

  /**
   * Get upcoming activities (tasks/reminders)
   */
  async getUpcomingActivities(userId?: string, days: number = 7): Promise<CRMServiceResponse<CRMActivity[]>> {
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      let query = supabase
        .from('crm_activities')
        .select('*')
        .gte('activity_date', new Date().toISOString())
        .lte('activity_date', endDate.toISOString())
        .order('activity_date', { ascending: true });

      if (userId) {
        query = query.eq('created_by', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching upcoming activities:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getUpcomingActivities:', error);
      return { success: false, error: 'Failed to fetch upcoming activities' };
    }
  }

  /**
   * Bulk create activities (for automation/imports)
   */
  async bulkCreateActivities(activities: CreateActivityData[]): Promise<CRMServiceResponse<CRMActivity[]>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: 'User must be authenticated' };
      }

      const activitiesWithUser = activities.map(activity => ({
        ...activity,
        created_by: user.id
      }));

      const { data, error } = await supabase
        .from('crm_activities')
        .insert(activitiesWithUser)
        .select();

      if (error) {
        console.error('Error bulk creating activities:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in bulkCreateActivities:', error);
      return { success: false, error: 'Failed to bulk create activities' };
    }
  }
}

export const crmActivityService = new CRMActivityService();