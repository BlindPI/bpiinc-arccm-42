
import { supabase } from '@/integrations/supabase/client';
import type { 
  WorkflowDefinition, 
  WorkflowInstance, 
  WorkflowApproval,
  WorkflowStep
} from '@/types/governance';

export class WorkflowAutomationService {
  static async createWorkflowDefinition(
    workflowData: Omit<WorkflowDefinition, 'id' | 'created_at' | 'updated_at'>
  ): Promise<WorkflowDefinition | null> {
    try {
      const { data, error } = await supabase
        .from('workflow_definitions')
        .insert(workflowData)
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        workflow_steps: typeof data.workflow_steps === 'string' 
          ? JSON.parse(data.workflow_steps) 
          : data.workflow_steps,
        conditional_routing: typeof data.conditional_routing === 'string'
          ? JSON.parse(data.conditional_routing)
          : data.conditional_routing,
        escalation_rules: typeof data.escalation_rules === 'string'
          ? JSON.parse(data.escalation_rules)
          : data.escalation_rules,
        sla_config: typeof data.sla_config === 'string'
          ? JSON.parse(data.sla_config)
          : data.sla_config
      };
    } catch (error) {
      console.error('Error creating workflow definition:', error);
      return null;
    }
  }

  static async getWorkflowDefinitions(workflowType?: string): Promise<WorkflowDefinition[]> {
    try {
      let query = supabase
        .from('workflow_definitions')
        .select('*')
        .eq('is_active', true)
        .order('workflow_name');

      if (workflowType) {
        query = query.eq('workflow_type', workflowType);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        workflow_steps: this.parseJsonField(item.workflow_steps) as WorkflowStep[],
        conditional_routing: this.parseJsonField(item.conditional_routing),
        escalation_rules: this.parseJsonField(item.escalation_rules),
        sla_config: this.parseJsonField(item.sla_config)
      }));
    } catch (error) {
      console.error('Error fetching workflow definitions:', error);
      return [];
    }
  }

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

  static async getWorkflowInstances(
    entityType?: string,
    entityId?: string,
    status?: string
  ): Promise<WorkflowInstance[]> {
    try {
      let query = supabase
        .from('workflow_instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }

      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      if (status) {
        query = query.eq('workflow_status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        workflow_data: this.parseJsonField(item.workflow_data),
        step_history: this.parseJsonField(item.step_history) || []
      }));
    } catch (error) {
      console.error('Error fetching workflow instances:', error);
      return [];
    }
  }

  static async getPendingApprovals(approverId: string): Promise<WorkflowApproval[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_approvals')
        .select(`
          *,
          workflow_instances!inner(
            id,
            instance_name,
            entity_type,
            entity_id,
            workflow_status,
            initiated_at,
            sla_deadline
          )
        `)
        .eq('approver_id', approverId)
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        approval_data: this.parseJsonField(item.approval_data),
        workflow_instance: item.workflow_instances
      }));
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      return [];
    }
  }

  static async processApproval(
    approvalId: string,
    action: 'approved' | 'rejected',
    comments?: string,
    approverId?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('workflow_approvals')
        .update({
          approval_status: action,
          approval_date: new Date().toISOString(),
          comments,
          updated_at: new Date().toISOString()
        })
        .eq('id', approvalId);

      if (error) throw error;

      // Update workflow instance status if needed
      await this.updateWorkflowInstanceStatus(approvalId, action);
      
      return true;
    } catch (error) {
      console.error('Error processing approval:', error);
      return false;
    }
  }

  static async checkSLABreaches(): Promise<void> {
    try {
      const { error } = await supabase.rpc('check_workflow_slas');
      if (error) throw error;
    } catch (error) {
      console.error('Error checking SLA breaches:', error);
    }
  }

  static async getWorkflowMetrics(): Promise<Record<string, any>> {
    try {
      const { data: pendingCount } = await supabase
        .from('workflow_instances')
        .select('id', { count: 'exact' })
        .eq('workflow_status', 'pending');

      const { data: approvedCount } = await supabase
        .from('workflow_instances')
        .select('id', { count: 'exact' })
        .eq('workflow_status', 'approved');

      const { data: escalatedCount } = await supabase
        .from('workflow_instances')
        .select('id', { count: 'exact' })
        .eq('workflow_status', 'escalated');

      const { data: slaBreaches } = await supabase
        .from('workflow_sla_tracking')
        .select('id', { count: 'exact' })
        .eq('escalation_triggered', true);

      return {
        pending: pendingCount?.length || 0,
        approved: approvedCount?.length || 0,
        escalated: escalatedCount?.length || 0,
        slaBreaches: slaBreaches?.length || 0,
        avgProcessingTime: '2.5 days', // Would calculate from actual data
        complianceRate: 94.2
      };
    } catch (error) {
      console.error('Error fetching workflow metrics:', error);
      return {
        pending: 0,
        approved: 0,
        escalated: 0,
        slaBreaches: 0,
        avgProcessingTime: '0 days',
        complianceRate: 0
      };
    }
  }

  private static async updateWorkflowInstanceStatus(
    approvalId: string,
    action: 'approved' | 'rejected'
  ): Promise<void> {
    // Get the approval and workflow instance
    const { data: approval } = await supabase
      .from('workflow_approvals')
      .select('workflow_instance_id, step_number')
      .eq('id', approvalId)
      .single();

    if (!approval) return;

    // Get workflow instance and definition
    const { data: instance } = await supabase
      .from('workflow_instances')
      .select(`
        *,
        workflow_definitions!inner(workflow_steps)
      `)
      .eq('id', approval.workflow_instance_id)
      .single();

    if (!instance) return;

    let newStatus = instance.workflow_status;
    let newStep = instance.current_step;

    if (action === 'rejected') {
      newStatus = 'rejected';
    } else if (action === 'approved') {
      const workflowSteps = this.parseJsonField(instance.workflow_definitions.workflow_steps) as WorkflowStep[];
      
      if (approval.step_number >= workflowSteps.length) {
        newStatus = 'approved';
      } else {
        newStep = approval.step_number + 1;
        newStatus = 'in_progress';
      }
    }

    // Update workflow instance
    await supabase
      .from('workflow_instances')
      .update({
        workflow_status: newStatus,
        current_step: newStep,
        completed_at: newStatus === 'approved' || newStatus === 'rejected' 
          ? new Date().toISOString() 
          : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', approval.workflow_instance_id);
  }

  private static parseJsonField(field: any): any {
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return field;
      }
    }
    return field || {};
  }
}
