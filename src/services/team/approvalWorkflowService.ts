
import { supabase } from '@/integrations/supabase/client';

export interface ApprovalStep {
  stepNumber: number;
  approverRole: string;
  approverId?: string;
  isRequired: boolean;
  timeout?: number;
}

export interface ApprovalChain {
  id: string;
  chainName: string;
  workflowType: string;
  steps: ApprovalStep[];
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalRequest {
  id: string;
  requestType: string;
  requestedBy: string;
  chainId?: string;
  currentStep: number;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  requestData: Record<string, any>;
  approvalHistory: any[];
  createdAt: string;
  updatedAt: string;
}

export class ApprovalWorkflowService {
  static async createApprovalChain(chain: Omit<ApprovalChain, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApprovalChain> {
    try {
      // Serialize steps as JSON for database storage
      const serializedSteps = chain.steps.map(step => ({
        stepNumber: step.stepNumber,
        approverRole: step.approverRole,
        approverId: step.approverId,
        isRequired: step.isRequired,
        timeout: step.timeout
      }));

      const { data, error } = await supabase
        .from('approval_chains')
        .insert({
          chain_name: chain.chainName,
          workflow_type: chain.workflowType,
          steps: serializedSteps as any,
          is_active: chain.isActive,
          created_by: chain.createdBy,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        chainName: data.chain_name,
        workflowType: data.workflow_type,
        isActive: data.is_active,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        steps: Array.isArray(data.steps) ? data.steps.map((step: any) => ({
          stepNumber: step.stepNumber,
          approverRole: step.approverRole,
          approverId: step.approverId,
          isRequired: step.isRequired,
          timeout: step.timeout
        })) : []
      };
    } catch (error) {
      console.error('Error creating approval chain:', error);
      throw error;
    }
  }

  static async getApprovalChains(): Promise<ApprovalChain[]> {
    try {
      const { data, error } = await supabase
        .from('approval_chains')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        chainName: item.chain_name,
        workflowType: item.workflow_type,
        isActive: item.is_active,
        createdBy: item.created_by,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        steps: Array.isArray(item.steps) ? item.steps.map((step: any) => ({
          stepNumber: step.stepNumber || 0,
          approverRole: step.approverRole || '',
          approverId: step.approverId,
          isRequired: step.isRequired !== false,
          timeout: step.timeout
        })) : []
      }));
    } catch (error) {
      console.error('Error fetching approval chains:', error);
      return [];
    }
  }

  static async createApprovalRequest(request: Omit<ApprovalRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApprovalRequest> {
    try {
      const { data, error } = await supabase
        .from('approval_requests')
        .insert({
          request_type: request.requestType,
          requested_by: request.requestedBy,
          chain_id: request.chainId,
          current_step: request.currentStep,
          status: request.status,
          request_data: request.requestData,
          approval_history: request.approvalHistory,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        requestType: data.request_type,
        requestedBy: data.requested_by,
        chainId: data.chain_id,
        currentStep: data.current_step,
        status: data.status,
        requestData: data.request_data,
        approvalHistory: data.approval_history,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error creating approval request:', error);
      throw error;
    }
  }

  static async getPendingRequests(userId?: string): Promise<ApprovalRequest[]> {
    try {
      let query = supabase
        .from('approval_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('requested_by', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        requestType: item.request_type,
        requestedBy: item.requested_by,
        chainId: item.chain_id,
        currentStep: item.current_step,
        status: item.status,
        requestData: item.request_data || {},
        approvalHistory: item.approval_history || [],
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      return [];
    }
  }

  static async approveRequest(requestId: string, approverId: string, comments?: string): Promise<ApprovalRequest> {
    try {
      // Get current request
      const { data: currentRequest, error: fetchError } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Update approval history
      const newHistory = [
        ...(currentRequest.approval_history || []),
        {
          step: currentRequest.current_step,
          approverId,
          action: 'approved',
          timestamp: new Date().toISOString(),
          comments
        }
      ];

      // Update request
      const { data, error } = await supabase
        .from('approval_requests')
        .update({
          status: 'approved',
          approval_history: newHistory,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        requestType: data.request_type,
        requestedBy: data.requested_by,
        chainId: data.chain_id,
        currentStep: data.current_step,
        status: data.status,
        requestData: data.request_data || {},
        approvalHistory: data.approval_history || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error approving request:', error);
      throw error;
    }
  }

  static async rejectRequest(requestId: string, approverId: string, reason?: string): Promise<ApprovalRequest> {
    try {
      // Get current request
      const { data: currentRequest, error: fetchError } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // Update approval history
      const newHistory = [
        ...(currentRequest.approval_history || []),
        {
          step: currentRequest.current_step,
          approverId,
          action: 'rejected',
          timestamp: new Date().toISOString(),
          reason
        }
      ];

      // Update request
      const { data, error } = await supabase
        .from('approval_requests')
        .update({
          status: 'rejected',
          approval_history: newHistory,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        requestType: data.request_type,
        requestedBy: data.requested_by,
        chainId: data.chain_id,
        currentStep: data.current_step,
        status: data.status,
        requestData: data.request_data || {},
        approvalHistory: data.approval_history || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error rejecting request:', error);
      throw error;
    }
  }
}
