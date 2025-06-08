
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
}

export interface ApprovalRule {
  workflow_type: string;
  required_approvers: string[];
  auto_approve_conditions?: Record<string, any>;
  escalation_rules?: Record<string, any>;
}

export class WorkflowApprovalService {
  // Create a new workflow request
  static async createWorkflowRequest(
    teamId: string,
    workflowType: string,
    requestData: Record<string, any>,
    requestedBy: string
  ): Promise<WorkflowRequest | null> {
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

      // Check for auto-approval conditions
      await this.checkAutoApproval(data.id);

      return data;
    } catch (error) {
      console.error('Error creating workflow request:', error);
      return null;
    }
  }

  // Get pending workflow requests
  static async getPendingWorkflows(userId?: string): Promise<WorkflowRequest[]> {
    try {
      let query = supabase
        .from('team_workflows')
        .select(`
          *,
          teams(name),
          requester:profiles!team_workflows_requested_by_fkey(display_name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // If userId provided, filter for workflows they can approve
      if (userId) {
        // Get user role to determine approval permissions
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        if (userProfile?.role && ['SA', 'AD'].includes(userProfile.role)) {
          // SA and AD can approve all workflows
        } else {
          // Regular users can only see their own requests
          query = query.eq('requested_by', userId);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending workflows:', error);
      return [];
    }
  }

  // Approve a workflow request
  static async approveWorkflow(
    workflowId: string,
    approverId: string,
    approvalData?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Check if user has permission to approve
      const canApprove = await this.checkApprovalPermission(workflowId, approverId);
      if (!canApprove) {
        throw new Error('User does not have permission to approve this workflow');
      }

      const { error } = await supabase
        .from('team_workflows')
        .update({
          status: 'approved',
          approved_by: approverId,
          approval_data: approvalData || {},
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      if (error) throw error;

      // Execute the approved workflow
      await this.executeApprovedWorkflow(workflowId);

      return true;
    } catch (error) {
      console.error('Error approving workflow:', error);
      return false;
    }
  }

  // Reject a workflow request
  static async rejectWorkflow(
    workflowId: string,
    approverId: string,
    rejectionReason?: string
  ): Promise<boolean> {
    try {
      const canApprove = await this.checkApprovalPermission(workflowId, approverId);
      if (!canApprove) {
        throw new Error('User does not have permission to reject this workflow');
      }

      const { error } = await supabase
        .from('team_workflows')
        .update({
          status: 'rejected',
          approved_by: approverId,
          approval_data: { rejection_reason: rejectionReason },
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error rejecting workflow:', error);
      return false;
    }
  }

  // Check if workflow can be auto-approved
  private static async checkAutoApproval(workflowId: string): Promise<void> {
    try {
      const { data: workflow, error } = await supabase
        .from('team_workflows')
        .select('*, teams(*)')
        .eq('id', workflowId)
        .single();

      if (error) throw error;

      // Auto-approval rules
      const autoApprovalRules = {
        'member_addition': (requestData: any) => {
          // Auto-approve member additions for teams with < 10 members
          return requestData.auto_approve === true;
        },
        'role_update': (requestData: any) => {
          // Auto-approve role updates from MEMBER to ADMIN for small teams
          return requestData.from_role === 'MEMBER' && requestData.to_role === 'ADMIN';
        }
      };

      const rule = autoApprovalRules[workflow.workflow_type as keyof typeof autoApprovalRules];
      if (rule && rule(workflow.request_data)) {
        await this.approveWorkflow(workflowId, 'system', { auto_approved: true });
      }
    } catch (error) {
      console.error('Error checking auto-approval:', error);
    }
  }

  // Check user permission to approve workflow
  private static async checkApprovalPermission(workflowId: string, userId: string): Promise<boolean> {
    try {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      // SA and AD can approve all workflows
      if (userProfile?.role && ['SA', 'AD'].includes(userProfile.role)) {
        return true;
      }

      // Check if user is team admin for the specific team
      const { data: workflow } = await supabase
        .from('team_workflows')
        .select('team_id')
        .eq('id', workflowId)
        .single();

      if (workflow) {
        const { data: membership } = await supabase
          .from('team_members')
          .select('role')
          .eq('team_id', workflow.team_id)
          .eq('user_id', userId)
          .eq('role', 'ADMIN')
          .single();

        return !!membership;
      }

      return false;
    } catch (error) {
      console.error('Error checking approval permission:', error);
      return false;
    }
  }

  // Execute approved workflow
  private static async executeApprovedWorkflow(workflowId: string): Promise<void> {
    try {
      const { data: workflow, error } = await supabase
        .from('team_workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (error) throw error;

      // Execute based on workflow type
      switch (workflow.workflow_type) {
        case 'member_addition':
          await this.executeMemberAddition(workflow);
          break;
        case 'role_update':
          await this.executeRoleUpdate(workflow);
          break;
        case 'team_archive':
          await this.executeTeamArchive(workflow);
          break;
        default:
          console.log('Unknown workflow type:', workflow.workflow_type);
      }
    } catch (error) {
      console.error('Error executing approved workflow:', error);
    }
  }

  // Execute member addition workflow
  private static async executeMemberAddition(workflow: WorkflowRequest): Promise<void> {
    const { user_id, role, permissions } = workflow.request_data;
    
    await supabase
      .from('team_members')
      .insert({
        team_id: workflow.team_id,
        user_id,
        role: role || 'MEMBER',
        permissions: permissions || {}
      });
  }

  // Execute role update workflow
  private static async executeRoleUpdate(workflow: WorkflowRequest): Promise<void> {
    const { member_id, new_role, new_permissions } = workflow.request_data;
    
    await supabase
      .from('team_members')
      .update({
        role: new_role,
        permissions: new_permissions || {},
        updated_at: new Date().toISOString()
      })
      .eq('id', member_id);
  }

  // Execute team archive workflow
  private static async executeTeamArchive(workflow: WorkflowRequest): Promise<void> {
    const { archive_reason } = workflow.request_data;
    
    await supabase
      .from('teams')
      .update({
        status: 'inactive',
        archived_at: new Date().toISOString(),
        archived_by: workflow.approved_by,
        updated_at: new Date().toISOString()
      })
      .eq('id', workflow.team_id);
  }

  // Get workflow statistics
  static async getWorkflowStats(): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from('team_workflows')
        .select('status, workflow_type');

      if (error) throw error;

      const stats = (data || []).reduce((acc, workflow) => {
        const key = `${workflow.status}_${workflow.workflow_type}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return stats;
    } catch (error) {
      console.error('Error fetching workflow stats:', error);
      return {};
    }
  }
}
