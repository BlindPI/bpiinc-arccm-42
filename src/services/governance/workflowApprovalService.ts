
import { supabase } from '@/integrations/supabase/client';

export interface WorkflowRequest {
  id: string;
  team_id: string;
  workflow_type: string;
  request_data: Record<string, any>;
  requested_by: string;
  approved_by?: string;
  status: 'pending' | 'approved' | 'rejected';
  approval_data?: Record<string, any>;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  teams?: {
    name: string;
  };
  requester?: {
    display_name: string;
  };
}

export interface WorkflowStep {
  id: string;
  stepNumber: number;
  stepName: string;
  stepType: 'approval' | 'notification' | 'automation';
  approverRole?: string;
  approverIds?: string[];
  conditions?: Record<string, any>;
  actions?: Record<string, any>;
  isRequired: boolean;
}

export class WorkflowApprovalService {
  async createWorkflowRequest(
    teamId: string,
    workflowType: string,
    requestData: Record<string, any>,
    requestedBy: string
  ): Promise<WorkflowRequest> {
    try {
      const { data, error } = await supabase
        .from('team_workflows')
        .insert({
          team_id: teamId,
          workflow_type: workflowType,
          request_data: requestData,
          requested_by: requestedBy,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        status: data.status as 'pending' | 'approved' | 'rejected',
        request_data: this.safeJsonParse(data.request_data, {}),
        approval_data: this.safeJsonParse(data.approval_data, {})
      };
    } catch (error) {
      console.error('Error creating workflow request:', error);
      throw error;
    }
  }

  async approveWorkflowRequest(
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

  async rejectWorkflowRequest(
    requestId: string,
    rejectedBy: string,
    reason: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_workflows')
        .update({
          status: 'rejected',
          approved_by: rejectedBy,
          approval_data: { rejection_reason: reason },
          completed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
    } catch (error) {
      console.error('Error rejecting workflow request:', error);
      throw error;
    }
  }

  async getWorkflowRequests(
    status?: 'pending' | 'approved' | 'rejected'
  ): Promise<WorkflowRequest[]> {
    try {
      let query = supabase
        .from('team_workflows')
        .select(`
          *,
          teams!inner(name),
          profiles!team_workflows_requested_by_fkey(display_name)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        status: item.status as 'pending' | 'approved' | 'rejected',
        request_data: this.safeJsonParse(item.request_data, {}),
        approval_data: this.safeJsonParse(item.approval_data, {}),
        teams: item.teams,
        requester: item.profiles
      }));
    } catch (error) {
      console.error('Error fetching workflow requests:', error);
      return [];
    }
  }

  // New methods for missing functionality
  async getPendingWorkflows(userId?: string): Promise<WorkflowRequest[]> {
    return this.getWorkflowRequests('pending');
  }

  async getWorkflowStats(): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from('team_workflows')
        .select('status, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const stats: Record<string, number> = {};
      (data || []).forEach(workflow => {
        const key = `${workflow.status}_today`;
        stats[key] = (stats[key] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching workflow stats:', error);
      return {};
    }
  }

  async approveWorkflow(workflowId: string, approvedBy: string, approvalData?: Record<string, any>): Promise<void> {
    return this.approveWorkflowRequest(workflowId, approvedBy, approvalData);
  }

  async rejectWorkflow(workflowId: string, rejectedBy: string, reason?: string): Promise<void> {
    return this.rejectWorkflowRequest(workflowId, rejectedBy, reason || 'Manual rejection');
  }

  async createWorkflow(
    workflowName: string,
    workflowType: string,
    steps: WorkflowStep[],
    createdBy: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('approval_workflows')
        .insert({
          workflow_name: workflowName,
          workflow_type: workflowType,
          steps: steps as any,
          created_by: createdBy,
          is_active: true
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  private safeJsonParse<T>(value: any, defaultValue: T): T {
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

export const workflowApprovalService = new WorkflowApprovalService();
