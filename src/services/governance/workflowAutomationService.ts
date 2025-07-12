
import { supabase } from '@/integrations/supabase/client';
import type { WorkflowDefinition, WorkflowInstance, WorkflowStepHistory } from '@/types/governance';

// Helper function to safely parse step history
function parseStepHistory(stepHistory: any): WorkflowStepHistory[] {
  if (!stepHistory) return [];
  if (Array.isArray(stepHistory)) {
    return stepHistory.map(step => {
      if (typeof step === 'object' && step !== null) {
        return {
          step_number: step.step_number || 0,
          approver_id: step.approver_id || '',
          action: step.action || 'approved',
          timestamp: step.timestamp || new Date().toISOString(),
          comments: step.comments
        };
      }
      return {
        step_number: 0,
        approver_id: '',
        action: 'approved' as const,
        timestamp: new Date().toISOString()
      };
    });
  }
  return [];
}

// Helper function to serialize step history for database
function serializeStepHistory(stepHistory: WorkflowStepHistory[]): any {
  return stepHistory.map(step => ({
    step_number: step.step_number,
    approver_id: step.approver_id,
    action: step.action,
    timestamp: step.timestamp,
    comments: step.comments
  }));
}

export class WorkflowAutomationService {
  static async createWorkflowDefinition(
    definition: Omit<WorkflowDefinition, 'id' | 'created_at' | 'updated_at'>
  ): Promise<WorkflowDefinition> {
    const { data, error } = await supabase
      .from('workflow_definitions')
      .insert({
        name: definition.workflow_name,
        description: definition.description,
        workflow_type: definition.workflow_type,
        definition_json: {
          workflow_steps: definition.workflow_steps,
          conditional_routing: definition.conditional_routing,
          escalation_rules: definition.escalation_rules,
          sla_config: definition.sla_config,
          version: definition.version
        },
        business_rules: {},
        is_active: definition.is_active,
        created_by: definition.created_by
      })
      .select()
      .single();

    if (error) throw error;

    const definitionJson = data.definition_json as any || {};
    return {
      id: data.id,
      workflow_name: data.name,
      workflow_type: data.workflow_type,
      description: data.description,
      workflow_steps: definitionJson.workflow_steps || {},
      conditional_routing: definitionJson.conditional_routing || {},
      escalation_rules: definitionJson.escalation_rules || {},
      sla_config: definitionJson.sla_config || {},
      is_active: data.is_active,
      version: definitionJson.version || 1,
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at
    } as WorkflowDefinition;
  }

  static async getWorkflowDefinitions(): Promise<WorkflowDefinition[]> {
    const { data, error } = await supabase
      .from('workflow_definitions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => {
      const definitionJson = item.definition_json as any || {};
      return {
        id: item.id,
        workflow_name: item.name,
        workflow_type: item.workflow_type,
        description: item.description,
        workflow_steps: definitionJson.workflow_steps || {},
        conditional_routing: definitionJson.conditional_routing || {},
        escalation_rules: definitionJson.escalation_rules || {},
        sla_config: definitionJson.sla_config || {},
        is_active: item.is_active,
        version: definitionJson.version || 1,
        created_by: item.created_by,
        created_at: item.created_at,
        updated_at: item.updated_at
      } as WorkflowDefinition;
    });
  }

  static async getWorkflowInstances(
    entityType?: string,
    entityId?: string
  ): Promise<WorkflowInstance[]> {
    const { data, error } = await supabase
      .from('workflow_instances')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => {
      const instanceData = item.instance_data as any || {};
      return {
        id: item.id,
        workflow_definition_id: item.workflow_definition_id,
        instance_name: instanceData.instance_name,
        entity_type: instanceData.entity_type || 'general',
        entity_id: instanceData.entity_id || item.id,
        current_step: parseInt(item.current_step_id) || 1,
        workflow_status: item.status as any || 'pending',
        initiated_by: item.initiated_by,
        initiated_at: item.created_at,
        completed_at: item.completed_at,
        sla_deadline: instanceData.sla_deadline,
        escalation_count: instanceData.escalation_count || 0,
        workflow_data: instanceData,
        step_history: parseStepHistory(instanceData.step_history),
        created_at: item.created_at,
        updated_at: item.updated_at
      } as WorkflowInstance;
    });
  }

  static async updateWorkflowInstance(
    instanceId: string,
    updates: Partial<WorkflowInstance>
  ): Promise<WorkflowInstance> {
    // Get current instance to merge data
    const { data: currentData, error: fetchError } = await supabase
      .from('workflow_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    if (fetchError) throw fetchError;

    const currentInstanceData = currentData.instance_data as any || {};
    const updatedInstanceData = {
      ...currentInstanceData,
      instance_name: updates.instance_name || currentInstanceData.instance_name,
      entity_type: updates.entity_type || currentInstanceData.entity_type,
      entity_id: updates.entity_id || currentInstanceData.entity_id,
      sla_deadline: updates.sla_deadline || currentInstanceData.sla_deadline,
      escalation_count: updates.escalation_count ?? currentInstanceData.escalation_count,
      step_history: updates.step_history ? serializeStepHistory(updates.step_history) : currentInstanceData.step_history,
      ...updates.workflow_data
    };

    const { data, error } = await supabase
      .from('workflow_instances')
      .update({
        current_step_id: updates.current_step?.toString() || currentData.current_step_id,
        status: updates.workflow_status || currentData.status,
        assigned_to: updates.initiated_by || currentData.assigned_to,
        completed_at: updates.completed_at || currentData.completed_at,
        instance_data: updatedInstanceData,
        updated_at: new Date().toISOString()
      })
      .eq('id', instanceId)
      .select()
      .single();

    if (error) throw error;

    const instanceData = data.instance_data as any || {};
    return {
      id: data.id,
      workflow_definition_id: data.workflow_definition_id,
      instance_name: instanceData.instance_name,
      entity_type: instanceData.entity_type || 'general',
      entity_id: instanceData.entity_id || data.id,
      current_step: parseInt(data.current_step_id) || 1,
      workflow_status: data.status as any || 'pending',
      initiated_by: data.initiated_by,
      initiated_at: data.created_at,
      completed_at: data.completed_at,
      sla_deadline: instanceData.sla_deadline,
      escalation_count: instanceData.escalation_count || 0,
      workflow_data: instanceData,
      step_history: parseStepHistory(instanceData.step_history),
      created_at: data.created_at,
      updated_at: data.updated_at
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

    const instanceData = instance.instance_data as any || {};
    
    // Update step history
    const currentStepHistory = parseStepHistory(instanceData.step_history);
    const newStepHistory = [
      ...currentStepHistory,
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
