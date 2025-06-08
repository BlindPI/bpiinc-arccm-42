
import { supabase } from '@/integrations/supabase/client';
import type { WorkflowDefinition, WorkflowInstance } from '@/types/governance';

export class WorkflowAutomationService {
  static async createWorkflowDefinition(
    definition: Omit<WorkflowDefinition, 'id' | 'created_at' | 'updated_at'>
  ): Promise<WorkflowDefinition> {
    // Convert workflow_steps to JSON before sending to database
    const { data, error } = await supabase
      .from('workflow_definitions')
      .insert({
        ...definition,
        workflow_steps: definition.workflow_steps as any, // Cast to Json type
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      workflow_steps: typeof data.workflow_steps === 'object' && data.workflow_steps !== null 
        ? data.workflow_steps 
        : {}
    } as WorkflowDefinition;
  }

  static async getWorkflowDefinitions(): Promise<WorkflowDefinition[]> {
    const { data, error } = await supabase
      .from('workflow_definitions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => ({
      ...item,
      workflow_steps: typeof item.workflow_steps === 'object' && item.workflow_steps !== null 
        ? item.workflow_steps 
        : {},
      conditional_routing: typeof item.conditional_routing === 'object' && item.conditional_routing !== null 
        ? item.conditional_routing 
        : {},
      escalation_rules: typeof item.escalation_rules === 'object' && item.escalation_rules !== null 
        ? item.escalation_rules 
        : {},
      sla_config: typeof item.sla_config === 'object' && item.sla_config !== null 
        ? item.sla_config 
        : {},
      description: item.description || undefined,
      created_by: item.created_by || undefined,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString()
    })) as WorkflowDefinition[];
  }

  static async getWorkflowInstances(
    entityType?: string,
    entityId?: string
  ): Promise<WorkflowInstance[]> {
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

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(item => ({
      ...item,
      workflow_data: typeof item.workflow_data === 'object' && item.workflow_data !== null 
        ? item.workflow_data 
        : {},
      step_history: Array.isArray(item.step_history) ? item.step_history : [],
      current_step: item.current_step || 1,
      escalation_count: item.escalation_count || 0,
      workflow_status: item.workflow_status || 'pending',
      instance_name: item.instance_name || undefined,
      initiated_by: item.initiated_by || undefined,
      completed_at: item.completed_at || undefined,
      sla_deadline: item.sla_deadline || undefined,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString()
    })) as WorkflowInstance[];
  }

  static async updateWorkflowInstance(
    instanceId: string,
    updates: Partial<WorkflowInstance>
  ): Promise<WorkflowInstance> {
    const { data, error } = await supabase
      .from('workflow_instances')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      workflow_data: typeof data.workflow_data === 'object' && data.workflow_data !== null 
        ? data.workflow_data 
        : {},
      step_history: Array.isArray(data.step_history) ? data.step_history : []
    } as WorkflowInstance;
  }

  static async executeWorkflowStep(
    instanceId: string,
    stepNumber: number,
    approverAction: 'approved' | 'rejected',
    comments?: string
  ): Promise<WorkflowInstance> {
    // Get current instance
    const { data: instance, error: fetchError } = await supabase
      .from('workflow_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (fetchError) throw fetchError;

    // Update step history
    const newStepHistory = [
      ...(Array.isArray(instance.step_history) ? instance.step_history : []),
      {
        step_number: stepNumber,
        approver_id: 'current-user-id', // Would be actual user ID
        action: approverAction,
        timestamp: new Date().toISOString(),
        comments: comments || undefined
      }
    ];

    // Determine next status
    const nextStatus = approverAction === 'approved' ? 'approved' : 'rejected';
    const completedAt = approverAction === 'rejected' ? new Date().toISOString() : instance.completed_at;

    return this.updateWorkflowInstance(instanceId, {
      workflow_status: nextStatus as any,
      step_history: newStepHistory,
      completed_at: completedAt,
      current_step: approverAction === 'approved' ? stepNumber + 1 : stepNumber
    });
  }
}
