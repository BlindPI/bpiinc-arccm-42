
import { supabase } from '@/integrations/supabase/client';

export interface WorkflowInstance {
  id: string;
  workflow_definition_id: string;
  instance_name: string;
  entity_type: string;
  entity_id: string;
  initiated_by: string;
  workflow_status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'escalated';
  sla_deadline?: string;
  workflow_data: Record<string, any>;
  initiated_at: string;
  escalation_count: number;
}

export interface WorkflowApproval {
  id: string;
  workflow_instance_id: string;
  step_number: number;
  approver_id: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_at?: string;
  approval_notes?: string;
}

export class WorkflowService {
  static async initiateWorkflow(
    workflowType: string,
    entityType: string,
    entityId: string,
    initiatedBy: string,
    workflowData: Record<string, any> = {}
  ): Promise<string> {
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
      throw error;
    }
  }

  static async getWorkflowInstances(entityId?: string): Promise<WorkflowInstance[]> {
    try {
      let query = supabase
        .from('workflow_instances')
        .select('*')
        .order('initiated_at', { ascending: false });

      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Type cast to ensure proper status types
      return (data || []).map(item => ({
        ...item,
        workflow_status: item.workflow_status as 'pending' | 'in_progress' | 'completed' | 'rejected' | 'escalated'
      }));
    } catch (error) {
      console.error('Error fetching workflow instances:', error);
      return [];
    }
  }

  static async approveWorkflow(
    instanceId: string,
    approverId: string,
    notes?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_approvals')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approval_notes: notes
        })
        .eq('workflow_instance_id', instanceId)
        .eq('approver_id', approverId);

      if (error) throw error;

      // Update workflow instance status
      await supabase
        .from('workflow_instances')
        .update({
          workflow_status: 'completed'
        })
        .eq('id', instanceId);
    } catch (error) {
      console.error('Error approving workflow:', error);
      throw error;
    }
  }

  static async rejectWorkflow(
    instanceId: string,
    approverId: string,
    notes: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflow_approvals')
        .update({
          approval_status: 'rejected',
          approved_at: new Date().toISOString(),
          approval_notes: notes
        })
        .eq('workflow_instance_id', instanceId)
        .eq('approver_id', approverId);

      if (error) throw error;

      // Update workflow instance status
      await supabase
        .from('workflow_instances')
        .update({
          workflow_status: 'rejected'
        })
        .eq('id', instanceId);
    } catch (error) {
      console.error('Error rejecting workflow:', error);
      throw error;
    }
  }

  static async getWorkflowQueue(userId: string): Promise<WorkflowInstance[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_instances')
        .select(`
          *,
          workflow_approvals!inner(*)
        `)
        .eq('workflow_approvals.approver_id', userId)
        .eq('workflow_approvals.approval_status', 'pending')
        .order('initiated_at', { ascending: true });

      if (error) throw error;

      // Type cast to ensure proper status types
      return (data || []).map(item => ({
        ...item,
        workflow_status: item.workflow_status as 'pending' | 'in_progress' | 'completed' | 'rejected' | 'escalated'
      }));
    } catch (error) {
      console.error('Error fetching workflow queue:', error);
      return [];
    }
  }
}

// Export instance for compatibility
export const workflowService = new WorkflowService();
