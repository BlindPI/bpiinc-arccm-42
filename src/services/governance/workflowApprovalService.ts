
import { supabase } from '@/integrations/supabase/client';
import type { WorkflowRequest, WorkflowStatistics } from '@/types/team-management';

// Type guards for database responses
interface DatabaseWorkflowStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  avgProcessingTime: string;
  complianceRate: number;
}

function isWorkflowStats(data: any): data is DatabaseWorkflowStats {
  return data && typeof data === 'object' && 
    'pending' in data && 'approved' in data && 'rejected' in data;
}

export class WorkflowApprovalService {
  static async getPendingWorkflows(): Promise<WorkflowRequest[]> {
    try {
      const { data, error } = await supabase
        .from('team_workflows')
        .select(`
          *,
          teams!inner(name),
          requester:profiles!team_workflows_requested_by_fkey(display_name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

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
      console.error('Error fetching pending workflows:', error);
      return [];
    }
  }

  static async getWorkflowStats(): Promise<WorkflowStatistics> {
    try {
      const { data, error } = await supabase.rpc('get_workflow_statistics');
      
      if (error) throw error;

      // Type-safe parsing with fallback
      if (data && isWorkflowStats(data)) {
        return {
          pending: data.pending,
          approved: data.approved,
          rejected: data.rejected,
          total: data.total,
          avgProcessingTime: data.avgProcessingTime,
          complianceRate: data.complianceRate
        };
      }

      // Fallback response
      return {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0,
        avgProcessingTime: '0 days',
        complianceRate: 0
      };
    } catch (error) {
      console.error('Error fetching workflow stats:', error);
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

  static async approveWorkflow(workflowId: string, approvedBy: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_workflows')
        .update({
          status: 'approved',
          approved_by: approvedBy,
          completed_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      if (error) throw error;
    } catch (error) {
      console.error('Error approving workflow:', error);
      throw error;
    }
  }

  static async rejectWorkflow(workflowId: string, rejectedBy: string, reason?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_workflows')
        .update({
          status: 'rejected',
          approved_by: rejectedBy,
          approval_data: { rejection_reason: reason },
          completed_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      if (error) throw error;
    } catch (error) {
      console.error('Error rejecting workflow:', error);
      throw error;
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
