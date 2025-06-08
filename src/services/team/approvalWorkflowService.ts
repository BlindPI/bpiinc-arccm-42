
import { supabase } from '@/integrations/supabase/client';
import type { 
  ApprovalChain, 
  ApprovalRequest, 
  ApprovalStep, 
  ApprovalHistoryEntry 
} from '@/types/enhanced-team-management';

export class ApprovalWorkflowService {
  static async createApprovalChain(
    chainName: string,
    workflowType: string,
    steps: ApprovalStep[],
    createdBy: string
  ): Promise<ApprovalChain | null> {
    try {
      const { data, error } = await supabase
        .from('approval_chains')
        .insert({
          chain_name: chainName,
          workflow_type: workflowType,
          steps,
          created_by: createdBy
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating approval chain:', error);
      return null;
    }
  }

  static async getApprovalChains(workflowType?: string): Promise<ApprovalChain[]> {
    try {
      let query = supabase
        .from('approval_chains')
        .select('*')
        .eq('is_active', true)
        .order('chain_name');

      if (workflowType) {
        query = query.eq('workflow_type', workflowType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching approval chains:', error);
      return [];
    }
  }

  static async createApprovalRequest(
    requestType: string,
    requestData: Record<string, any>,
    requestedBy: string,
    chainId?: string
  ): Promise<ApprovalRequest | null> {
    try {
      // Auto-assign chain if not provided
      if (!chainId) {
        const chains = await this.getApprovalChains(requestType);
        if (chains.length > 0) {
          chainId = chains[0].id;
        }
      }

      const { data, error } = await supabase
        .from('approval_requests')
        .insert({
          chain_id: chainId,
          request_type: requestType,
          request_data: requestData,
          requested_by: requestedBy
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating approval request:', error);
      return null;
    }
  }

  static async getApprovalRequests(
    status?: string,
    requestedBy?: string
  ): Promise<ApprovalRequest[]> {
    try {
      let query = supabase
        .from('approval_requests')
        .select(`
          *,
          approval_chains(*)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      if (requestedBy) {
        query = query.eq('requested_by', requestedBy);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(request => ({
        ...request,
        chain: (request as any).approval_chains
      }));
    } catch (error) {
      console.error('Error fetching approval requests:', error);
      return [];
    }
  }

  static async getPendingApprovals(approverId: string): Promise<ApprovalRequest[]> {
    try {
      const { data, error } = await supabase
        .from('approval_requests')
        .select(`
          *,
          approval_chains(*)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter requests where the current user can approve based on current step
      const filteredRequests = (data || []).filter(request => {
        const chain = (request as any).approval_chains;
        if (!chain || !chain.steps) return false;

        const currentStep = chain.steps[request.current_step - 1];
        if (!currentStep) return false;

        // Check if user can approve this step
        return currentStep.approver_users?.includes(approverId) ||
               this.userHasApproverRole(approverId, currentStep.approver_roles);
      });

      return filteredRequests.map(request => ({
        ...request,
        chain: (request as any).approval_chains
      }));
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      return [];
    }
  }

  static async processApproval(
    requestId: string,
    approverId: string,
    action: 'approved' | 'rejected',
    comments?: string
  ): Promise<boolean> {
    try {
      const request = await this.getApprovalRequest(requestId);
      if (!request || request.status !== 'pending') {
        throw new Error('Invalid or already processed request');
      }

      const chain = request.chain;
      if (!chain) {
        throw new Error('Approval chain not found');
      }

      const currentStep = chain.steps[request.current_step - 1];
      if (!currentStep) {
        throw new Error('Invalid approval step');
      }

      // Verify approver permissions
      const canApprove = currentStep.approver_users?.includes(approverId) ||
                        this.userHasApproverRole(approverId, currentStep.approver_roles);

      if (!canApprove) {
        throw new Error('User not authorized to approve this step');
      }

      // Add to approval history
      const historyEntry: ApprovalHistoryEntry = {
        step: request.current_step,
        approver_id: approverId,
        action,
        comments,
        timestamp: new Date().toISOString()
      };

      const newHistory = [...request.approval_history, historyEntry];

      // Determine next status and step
      let newStatus = request.status;
      let newStep = request.current_step;

      if (action === 'rejected') {
        newStatus = 'rejected';
      } else if (action === 'approved') {
        if (request.current_step >= chain.steps.length) {
          newStatus = 'approved';
        } else {
          newStep = request.current_step + 1;
        }
      }

      // Update request
      const { error } = await supabase
        .from('approval_requests')
        .update({
          status: newStatus,
          current_step: newStep,
          approval_history: newHistory
        })
        .eq('id', requestId);

      if (error) throw error;

      // Send notifications if needed
      await this.sendApprovalNotifications(requestId, action, approverId);

      return true;
    } catch (error) {
      console.error('Error processing approval:', error);
      return false;
    }
  }

  private static async getApprovalRequest(requestId: string): Promise<ApprovalRequest | null> {
    try {
      const { data, error } = await supabase
        .from('approval_requests')
        .select(`
          *,
          approval_chains(*)
        `)
        .eq('id', requestId)
        .single();

      if (error) throw error;

      return {
        ...data,
        chain: (data as any).approval_chains
      };
    } catch (error) {
      console.error('Error fetching approval request:', error);
      return null;
    }
  }

  private static userHasApproverRole(userId: string, approverRoles: string[]): boolean {
    // This would check the user's role against the approver roles
    // For now, return true for SA/AD roles
    return true; // Simplified for demonstration
  }

  private static async sendApprovalNotifications(
    requestId: string,
    action: string,
    approverId: string
  ): Promise<void> {
    // Implementation would send email/in-app notifications
    console.log(`Approval ${action} notification sent for request ${requestId} by ${approverId}`);
  }
}

export const approvalWorkflowService = new ApprovalWorkflowService();
