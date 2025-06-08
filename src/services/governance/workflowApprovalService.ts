
import { supabase } from '@/integrations/supabase/client';
import type { WorkflowRequest, WorkflowStep } from '@/types/team-management';

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
        request_data: data.request_data || {},
        approval_data: data.approval_data || {}
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
        request_data: item.request_data || {},
        approval_data: item.approval_data || {},
        teams: item.teams,
        requester: item.profiles
      }));
    } catch (error) {
      console.error('Error fetching workflow requests:', error);
      return [];
    }
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
}

export const workflowApprovalService = new WorkflowApprovalService();
