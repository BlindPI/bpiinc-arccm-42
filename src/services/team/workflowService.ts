
import { supabase } from '@/integrations/supabase/client';

export interface WorkflowRequest {
  id: string;
  workflow_type: string;
  entity_type: string;
  entity_id: string;
  initiated_by: string;
  workflow_status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  workflow_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStatistics {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  avgProcessingTime: string;
  complianceRate: number;
}

export class WorkflowService {
  // Initiate a new workflow using real database function
  static async initiateWorkflow(
    workflowType: string,
    entityType: string,
    entityId: string,
    initiatedBy: string,
    workflowData: Record<string, any> = {}
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('initiate_workflow', {
        p_workflow_type: workflowType,
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_initiated_by: initiatedBy,
        p_workflow_data: workflowData
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error initiating workflow:', error);
      return null;
    }
  }

  // Get workflow statistics using real database function
  static async getWorkflowStatistics(): Promise<WorkflowStatistics> {
    try {
      const { data, error } = await supabase.rpc('get_workflow_statistics');
      
      if (error) throw error;
      
      const statsData = this.safeParseJsonResponse(data);
      
      return {
        pending: statsData.pending || 0,
        approved: statsData.approved || 0,
        rejected: statsData.rejected || 0,
        total: statsData.total || 0,
        avgProcessingTime: statsData.avgProcessingTime || '0 days',
        complianceRate: statsData.complianceRate || 0
      };
    } catch (error) {
      console.error('Failed to fetch workflow statistics:', error);
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

  // Get pending workflow requests
  static async getPendingWorkflows(): Promise<WorkflowRequest[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_instances')
        .select('*')
        .in('workflow_status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        workflow_type: item.workflow_type || 'unknown',
        entity_type: item.entity_type,
        entity_id: item.entity_id,
        initiated_by: item.initiated_by,
        workflow_status: item.workflow_status as 'pending' | 'in_progress' | 'completed' | 'rejected',
        workflow_data: this.safeParseJsonResponse(item.workflow_data),
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
    } catch (error) {
      console.error('Failed to fetch pending workflows:', error);
      return [];
    }
  }

  // Approve a workflow request
  static async approveWorkflow(workflowId: string, approvedBy: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_instances')
        .update({
          workflow_status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      if (error) throw error;
    } catch (error) {
      console.error('Error approving workflow:', error);
      throw error;
    }
  }

  // Reject a workflow request
  static async rejectWorkflow(workflowId: string, rejectedBy: string, reason: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_instances')
        .update({
          workflow_status: 'rejected',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          workflow_data: {
            rejection_reason: reason,
            rejected_by: rejectedBy
          }
        })
        .eq('id', workflowId);

      if (error) throw error;
    } catch (error) {
      console.error('Error rejecting workflow:', error);
      throw error;
    }
  }

  private static safeParseJsonResponse(data: any): any {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return {};
      }
    }
    return data || {};
  }
}
