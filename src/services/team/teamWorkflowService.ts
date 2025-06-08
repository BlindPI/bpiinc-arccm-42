
import { supabase } from '@/integrations/supabase/client';
import type { WorkflowRequest, WorkflowStatistics } from '@/types/team-management';

export class TeamWorkflowService {
  static async createWorkflowRequest(
    teamId: string,
    workflowType: string,
    requestData: Record<string, any>
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('team_workflows')
        .insert({
          team_id: teamId,
          workflow_type: workflowType,
          request_data: requestData,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating workflow request:', error);
      return null;
    }
  }

  static async getWorkflowRequests(teamId?: string): Promise<WorkflowRequest[]> {
    try {
      let query = supabase
        .from('team_workflows')
        .select(`
          *,
          teams!inner(name),
          requester:profiles!team_workflows_requested_by_fkey(display_name)
        `)
        .order('created_at', { ascending: false });

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        status: item.status as 'pending' | 'approved' | 'rejected',
        request_data: this.safeJsonParse(item.request_data, {}),
        approval_data: this.safeJsonParse(item.approval_data, {}),
        teams: item.teams,
        requester: item.requester
      }));
    } catch (error) {
      console.error('Error fetching workflow requests:', error);
      return [];
    }
  }

  static async approveWorkflowRequest(
    requestId: string,
    approvedBy: string,
    approvalData?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_workflows')
        .update({
          status: 'approved',
          approved_by: approvedBy,
          approval_data: approvalData || {},
          completed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
    } catch (error) {
      console.error('Error approving workflow request:', error);
      throw error;
    }
  }

  static async rejectWorkflowRequest(
    requestId: string,
    rejectedBy: string,
    rejectionReason: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_workflows')
        .update({
          status: 'rejected',
          approved_by: rejectedBy,
          approval_data: { rejection_reason: rejectionReason },
          completed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
    } catch (error) {
      console.error('Error rejecting workflow request:', error);
      throw error;
    }
  }

  static async getWorkflowStatistics(): Promise<WorkflowStatistics> {
    try {
      const { data, error } = await supabase.rpc('get_workflow_statistics');
      
      if (error) throw error;

      return data || {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0,
        avgProcessingTime: '0 days',
        complianceRate: 0
      };
    } catch (error) {
      console.error('Error fetching workflow statistics:', error);
      return {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0,
        avgProcessingTime: '0 days',
        complianceRate: 0
      };
    }
  }

  private static safeJsonParse<T>(value: any, defaultValue: T): T {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'object' && value !== null) return value as T;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  }
}

export const teamWorkflowService = new TeamWorkflowService();
