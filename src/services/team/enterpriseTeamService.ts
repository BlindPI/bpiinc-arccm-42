import { supabase } from '@/integrations/supabase/client';

export interface WorkflowStep {
  step_name: string;
  approver_role: string;
  description: string;
  is_required: boolean;
}

export interface ApprovalRecord {
  step_id: number;
  approved_by: string;
  approved_at: string;
  comments?: string;
}

export interface ApprovalWorkflow {
  id: string;
  workflow_name: string;
  workflow_type: string;
  steps: WorkflowStep[];
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface PendingApproval {
  id: string;
  workflow_id: string;
  team_id: string;
  request_type: string;
  request_data: Record<string, any>;
  requested_by: string;
  current_step: number;
  status: 'pending' | 'approved' | 'rejected';
  approvals: ApprovalRecord[];
  created_at: string;
}

export class EnterpriseTeamService {
  async getCrossTeamAnalytics() {
    try {
      const { data, error } = await supabase.rpc('get_cross_team_analytics');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching cross-team analytics:', error);
      return null;
    }
  }

  async getComplianceMetrics() {
    try {
      const { data, error } = await supabase.rpc('get_compliance_metrics');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching compliance metrics:', error);
      return null;
    }
  }

  async getEnterpriseTeamSummary() {
    try {
      const { data, error } = await supabase.rpc('get_enterprise_team_summary');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching enterprise team summary:', error);
      return null;
    }
  }

  async createApprovalWorkflow(workflow: Omit<ApprovalWorkflow, 'id' | 'created_at'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('approval_workflows')
        .insert({
          workflow_name: workflow.workflow_name,
          workflow_type: workflow.workflow_type,
          steps: workflow.steps,
          is_active: workflow.is_active,
          created_by: workflow.created_by
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating approval workflow:', error);
      throw error;
    }
  }

  async getPendingApprovals(adminId: string): Promise<PendingApproval[]> {
    try {
      const { data, error } = await supabase
        .from('team_workflows')
        .select(`
          id,
          team_id,
          workflow_type as request_type,
          request_data,
          requested_by,
          created_at as requested_at,
          status
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match PendingApproval interface
      return (data || []).map(item => ({
        id: item.id,
        workflow_id: item.id, // Using same ID for workflow_id
        team_id: item.team_id,
        request_type: item.request_type,
        request_data: typeof item.request_data === 'object' ? item.request_data : {},
        requested_by: item.requested_by,
        current_step: 1,
        status: 'pending' as const,
        approvals: [],
        created_at: item.requested_at
      }));
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      return [];
    }
  }

  async approveRequest(approvalId: string, approverId: string, comments?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_workflows')
        .update({
          status: 'approved',
          approved_by: approverId,
          approval_data: {
            approved_at: new Date().toISOString(),
            comments: comments || 'Approved',
            approver_id: approverId
          },
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', approvalId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error approving request:', error);
      return false;
    }
  }

  async rejectRequest(approvalId: string, approverId: string, reason: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_workflows')
        .update({
          status: 'rejected',
          approved_by: approverId,
          approval_data: {
            rejected_at: new Date().toISOString(),
            reason: reason || 'Rejected',
            approver_id: approverId
          },
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', approvalId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error rejecting request:', error);
      return false;
    }
  }

  async getApprovalHistory(teamId?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('team_workflows')
        .select('*')
        .not('status', 'eq', 'pending')
        .order('created_at', { ascending: false });

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching approval history:', error);
      return [];
    }
  }

  async getTeamComplianceReport(teamId: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_team_compliance_report', {
        p_team_id: teamId
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching team compliance report:', error);
      return null;
    }
  }

  async getEnterpriseTeamMetrics(): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_enterprise_team_metrics');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching enterprise team metrics:', error);
      return null;
    }
  }
}

export const enterpriseTeamService = new EnterpriseTeamService();
