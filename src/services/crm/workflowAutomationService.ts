
import { supabase } from '@/integrations/supabase/client';
import type { LeadWorkflow, WorkflowExecution, AssignmentPerformance } from '@/types/crm';

export class WorkflowAutomationService {
  // Workflow Management
  static async getLeadWorkflows(): Promise<LeadWorkflow[]> {
    try {
      const { data, error } = await supabase
        .from('crm_lead_workflows')
        .select('*')
        .order('execution_priority', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(workflow => ({
        ...workflow,
        trigger_conditions: (typeof workflow.trigger_conditions === 'string' 
          ? JSON.parse(workflow.trigger_conditions) 
          : workflow.trigger_conditions) as Record<string, any>,
        workflow_steps: (typeof workflow.workflow_steps === 'string' 
          ? JSON.parse(workflow.workflow_steps) 
          : workflow.workflow_steps) as Record<string, any>,
        success_metrics: (typeof workflow.success_metrics === 'string' 
          ? JSON.parse(workflow.success_metrics) 
          : workflow.success_metrics) as Record<string, any>,
        failure_handling: (typeof workflow.failure_handling === 'string' 
          ? JSON.parse(workflow.failure_handling) 
          : workflow.failure_handling) as Record<string, any>
      }));
    } catch (error) {
      console.error('Error fetching lead workflows:', error);
      return [];
    }
  }

  static async createLeadWorkflow(workflow: Omit<LeadWorkflow, 'id' | 'created_at' | 'updated_at'>): Promise<LeadWorkflow | null> {
    try {
      const { data, error } = await supabase
        .from('crm_lead_workflows')
        .insert(workflow)
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        trigger_conditions: (typeof data.trigger_conditions === 'string' 
          ? JSON.parse(data.trigger_conditions) 
          : data.trigger_conditions) as Record<string, any>,
        workflow_steps: (typeof data.workflow_steps === 'string' 
          ? JSON.parse(data.workflow_steps) 
          : data.workflow_steps) as Record<string, any>,
        success_metrics: (typeof data.success_metrics === 'string' 
          ? JSON.parse(data.success_metrics) 
          : data.success_metrics) as Record<string, any>,
        failure_handling: (typeof data.failure_handling === 'string' 
          ? JSON.parse(data.failure_handling) 
          : data.failure_handling) as Record<string, any>
      };
    } catch (error) {
      console.error('Error creating lead workflow:', error);
      return null;
    }
  }

  static async updateLeadWorkflow(id: string, updates: Partial<LeadWorkflow>): Promise<LeadWorkflow | null> {
    try {
      const { data, error } = await supabase
        .from('crm_lead_workflows')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        trigger_conditions: (typeof data.trigger_conditions === 'string' 
          ? JSON.parse(data.trigger_conditions) 
          : data.trigger_conditions) as Record<string, any>,
        workflow_steps: (typeof data.workflow_steps === 'string' 
          ? JSON.parse(data.workflow_steps) 
          : data.workflow_steps) as Record<string, any>,
        success_metrics: (typeof data.success_metrics === 'string' 
          ? JSON.parse(data.success_metrics) 
          : data.success_metrics) as Record<string, any>,
        failure_handling: (typeof data.failure_handling === 'string' 
          ? JSON.parse(data.failure_handling) 
          : data.failure_handling) as Record<string, any>
      };
    } catch (error) {
      console.error('Error updating lead workflow:', error);
      return null;
    }
  }

  static async deleteLeadWorkflow(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('crm_lead_workflows')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting lead workflow:', error);
      return false;
    }
  }

  // Workflow Execution
  static async executeWorkflow(workflowId: string, leadId: string): Promise<WorkflowExecution | null> {
    try {
      const { data, error } = await supabase.rpc('execute_lead_workflow', {
        p_workflow_id: workflowId,
        p_lead_id: leadId
      });

      if (error) throw error;

      // Get the execution record
      const { data: execution, error: executionError } = await supabase
        .from('crm_workflow_executions')
        .select('*')
        .eq('id', data)
        .single();

      if (executionError) throw executionError;
      
      return {
        ...execution,
        execution_status: execution.execution_status as 'pending' | 'running' | 'completed' | 'failed' | 'cancelled',
        execution_data: (typeof execution.execution_data === 'string' 
          ? JSON.parse(execution.execution_data) 
          : execution.execution_data) as Record<string, any>,
        step_results: (typeof execution.step_results === 'string' 
          ? JSON.parse(execution.step_results) 
          : execution.step_results) as Record<string, any>,
        error_details: (typeof execution.error_details === 'string' 
          ? JSON.parse(execution.error_details) 
          : execution.error_details) as Record<string, any>
      };
    } catch (error) {
      console.error('Error executing workflow:', error);
      return null;
    }
  }

  static async getWorkflowExecutions(leadId?: string): Promise<WorkflowExecution[]> {
    try {
      let query = supabase
        .from('crm_workflow_executions')
        .select('*')
        .order('started_at', { ascending: false });

      if (leadId) {
        query = query.eq('lead_id', leadId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map(execution => ({
        ...execution,
        execution_status: execution.execution_status as 'pending' | 'running' | 'completed' | 'failed' | 'cancelled',
        execution_data: (typeof execution.execution_data === 'string' 
          ? JSON.parse(execution.execution_data) 
          : execution.execution_data) as Record<string, any>,
        step_results: (typeof execution.step_results === 'string' 
          ? JSON.parse(execution.step_results) 
          : execution.step_results) as Record<string, any>,
        error_details: (typeof execution.error_details === 'string' 
          ? JSON.parse(execution.error_details) 
          : execution.error_details) as Record<string, any>
      }));
    } catch (error) {
      console.error('Error fetching workflow executions:', error);
      return [];
    }
  }

  // Lead Assignment Automation
  static async intelligentLeadAssignment(leadId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('assign_lead_intelligent', {
        p_lead_id: leadId,
        p_assignment_criteria: {}
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error with intelligent lead assignment:', error);
      return null;
    }
  }

  // Enhanced Lead Scoring
  static async calculateEnhancedLeadScore(leadId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('calculate_enhanced_lead_score', {
        p_lead_id: leadId
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error calculating enhanced lead score:', error);
      return 0;
    }
  }

  // Assignment Performance
  static async getAssignmentPerformance(): Promise<AssignmentPerformance[]> {
    try {
      const { data, error } = await supabase
        .from('crm_assignment_performance')
        .select('*')
        .order('assignment_date', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(performance => ({
        ...performance,
        avg_response_time: performance.avg_response_time ? String(performance.avg_response_time) : ''
      }));
    } catch (error) {
      console.error('Error fetching assignment performance:', error);
      return [];
    }
  }

  static async updateAssignmentPerformance(
    userId: string, 
    updates: Partial<AssignmentPerformance>
  ): Promise<AssignmentPerformance | null> {
    try {
      const { data, error } = await supabase
        .from('crm_assignment_performance')
        .update(updates)
        .eq('user_id', userId)
        .eq('assignment_date', new Date().toISOString().split('T')[0])
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        avg_response_time: data.avg_response_time ? String(data.avg_response_time) : ''
      };
    } catch (error) {
      console.error('Error updating assignment performance:', error);
      return null;
    }
  }

  // Analytics
  static async getWorkflowAnalytics(): Promise<any> {
    try {
      const { data: executions, error } = await supabase
        .from('crm_workflow_executions')
        .select('*');

      if (error) throw error;

      const totalExecutions = executions?.length || 0;
      const completedExecutions = executions?.filter(e => e.execution_status === 'completed').length || 0;
      const failedExecutions = executions?.filter(e => e.execution_status === 'failed').length || 0;
      const successRate = totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0;

      return {
        totalExecutions,
        completedExecutions,
        failedExecutions,
        successRate: Math.round(successRate * 100) / 100
      };
    } catch (error) {
      console.error('Error fetching workflow analytics:', error);
      return {
        totalExecutions: 0,
        completedExecutions: 0,
        failedExecutions: 0,
        successRate: 0
      };
    }
  }
}
