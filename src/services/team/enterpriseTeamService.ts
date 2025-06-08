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

// New interfaces for missing methods
export interface RoleUpdateResult {
  success: boolean;
  requiresApproval: boolean;
  message: string;
}

export interface BulkRoleUpdateResult {
  processed: number;
  requiresApproval: string[];
  errors: string[];
}

export interface TeamArchiveResult {
  success: boolean;
  archivedAt: string;
  message: string;
}

export interface OwnershipTransferResult {
  success: boolean;
  transferredAt: string;
  newOwnerId: string;
  message: string;
}

export type EnterpriseTeamRole = 'OWNER' | 'LEAD' | 'ADMIN' | 'MEMBER' | 'OBSERVER';

export class EnterpriseTeamService {
  // New method: Update member role
  async updateMemberRole(
    teamId: string, 
    memberId: string, 
    newRole: EnterpriseTeamRole, 
    updatedBy: string
  ): Promise<RoleUpdateResult> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          role: newRole === 'OWNER' ? 'ADMIN' : 'MEMBER', // Map to actual DB roles
          permissions: this.getRolePermissions(newRole),
          updated_at: new Date().toISOString()
        })
        .eq('team_id', teamId)
        .eq('user_id', memberId);

      if (error) throw error;

      // Log the role change
      await supabase.rpc('log_team_lifecycle_event', {
        p_team_id: teamId,
        p_event_type: 'role_updated',
        p_event_data: {
          member_id: memberId,
          new_role: newRole,
          updated_by: updatedBy
        },
        p_affected_user_id: memberId
      });

      return {
        success: true,
        requiresApproval: false, // Could add approval logic here
        message: `Role updated to ${newRole} successfully`
      };
    } catch (error) {
      console.error('Error updating member role:', error);
      return {
        success: false,
        requiresApproval: false,
        message: 'Failed to update role'
      };
    }
  }

  // New method: Bulk update member roles
  async bulkUpdateMemberRoles(
    teamId: string,
    updates: Array<{ memberId: string; newRole: EnterpriseTeamRole }>,
    updatedBy: string
  ): Promise<BulkRoleUpdateResult> {
    const result: BulkRoleUpdateResult = {
      processed: 0,
      requiresApproval: [],
      errors: []
    };

    for (const update of updates) {
      try {
        const roleResult = await this.updateMemberRole(
          teamId, 
          update.memberId, 
          update.newRole, 
          updatedBy
        );
        
        if (roleResult.success) {
          result.processed++;
          if (roleResult.requiresApproval) {
            result.requiresApproval.push(update.memberId);
          }
        } else {
          result.errors.push(`${update.memberId}: ${roleResult.message}`);
        }
      } catch (error) {
        result.errors.push(`${update.memberId}: ${error.message}`);
      }
    }

    return result;
  }

  // New method: Archive team
  async archiveTeam(teamId: string, archivedBy: string, reason?: string): Promise<TeamArchiveResult> {
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString(),
          metadata: {
            archived: true,
            archived_by: archivedBy,
            archived_at: new Date().toISOString(),
            archive_reason: reason
          }
        })
        .eq('id', teamId);

      if (error) throw error;

      // Log the archival
      await supabase.rpc('log_team_lifecycle_event', {
        p_team_id: teamId,
        p_event_type: 'team_archived',
        p_event_data: {
          archived_by: archivedBy,
          reason: reason || 'No reason provided'
        }
      });

      return {
        success: true,
        archivedAt: new Date().toISOString(),
        message: 'Team archived successfully'
      };
    } catch (error) {
      console.error('Error archiving team:', error);
      return {
        success: false,
        archivedAt: '',
        message: 'Failed to archive team'
      };
    }
  }

  // New method: Transfer team ownership
  async transferTeamOwnership(
    teamId: string, 
    newOwnerId: string, 
    transferredBy: string, 
    reason?: string
  ): Promise<OwnershipTransferResult> {
    try {
      // Update new owner to admin role
      const { error: updateError } = await supabase
        .from('team_members')
        .update({
          role: 'ADMIN',
          permissions: this.getRolePermissions('OWNER'),
          updated_at: new Date().toISOString()
        })
        .eq('team_id', teamId)
        .eq('user_id', newOwnerId);

      if (updateError) throw updateError;

      // Log the ownership transfer
      await supabase.rpc('log_team_lifecycle_event', {
        p_team_id: teamId,
        p_event_type: 'ownership_transferred',
        p_event_data: {
          new_owner: newOwnerId,
          transferred_by: transferredBy,
          reason: reason || 'No reason provided'
        },
        p_affected_user_id: newOwnerId
      });

      return {
        success: true,
        transferredAt: new Date().toISOString(),
        newOwnerId,
        message: 'Ownership transferred successfully'
      };
    } catch (error) {
      console.error('Error transferring ownership:', error);
      return {
        success: false,
        transferredAt: '',
        newOwnerId: '',
        message: 'Failed to transfer ownership'
      };
    }
  }

  // Helper method to get role permissions
  private getRolePermissions(role: EnterpriseTeamRole): Record<string, any> {
    switch (role) {
      case 'OWNER':
        return { admin: true, owner: true, manage_members: true, manage_settings: true };
      case 'LEAD':
        return { lead: true, manage_members: true, view_analytics: true };
      case 'ADMIN':
        return { admin: true, manage_members: true };
      case 'MEMBER':
        return { member: true };
      case 'OBSERVER':
        return { observer: true, view_only: true };
      default:
        return {};
    }
  }

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
          created_at,
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
        request_data: typeof item.request_data === 'object' ? item.request_data as Record<string, any> : {},
        requested_by: item.requested_by,
        current_step: 1,
        status: 'pending' as const,
        approvals: [],
        created_at: item.created_at
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
