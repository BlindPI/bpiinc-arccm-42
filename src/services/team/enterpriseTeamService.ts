
import { supabase } from '@/integrations/supabase/client';
import type { 
  EnterpriseTeamRole, 
  ApprovalWorkflow, 
  PendingApproval, 
  TeamGovernanceRule,
  ENTERPRISE_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS
} from '@/types/enterprise-team-roles';

export class EnterpriseTeamService {
  
  // Enhanced Role Management
  async updateMemberRole(
    teamId: string, 
    memberId: string, 
    newRole: EnterpriseTeamRole,
    requestedBy: string
  ): Promise<{ requiresApproval: boolean; approvalId?: string }> {
    try {
      // Check if role change requires approval
      const requiresApproval = await this.checkRoleChangeApproval(teamId, newRole, requestedBy);
      
      if (requiresApproval) {
        // Create approval request
        const approvalId = await this.createApprovalRequest(teamId, {
          type: 'role_change',
          member_id: memberId,
          new_role: newRole,
          requested_by: requestedBy
        });
        
        return { requiresApproval: true, approvalId };
      } else {
        // Direct role update
        await this.executeRoleChange(memberId, newRole);
        return { requiresApproval: false };
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }

  async bulkUpdateMemberRoles(
    teamId: string,
    updates: Array<{ memberId: string; newRole: EnterpriseTeamRole }>,
    requestedBy: string
  ): Promise<{ processed: number; requiresApproval: string[] }> {
    const requiresApproval: string[] = [];
    let processed = 0;

    for (const update of updates) {
      const result = await this.updateMemberRole(teamId, update.memberId, update.newRole, requestedBy);
      if (result.requiresApproval && result.approvalId) {
        requiresApproval.push(result.approvalId);
      } else {
        processed++;
      }
    }

    return { processed, requiresApproval };
  }

  // Governance and Approval Workflows
  async createApprovalWorkflow(workflow: Omit<ApprovalWorkflow, 'id' | 'created_at'>): Promise<string> {
    try {
      // This would create a record in team_approval_workflows table
      const workflowId = `workflow-${Date.now()}`;
      console.log('Creating approval workflow:', workflow);
      
      // For now, return mock ID since table doesn't exist yet
      return workflowId;
    } catch (error) {
      console.error('Error creating approval workflow:', error);
      throw error;
    }
  }

  async createApprovalRequest(
    teamId: string, 
    requestData: Record<string, any>
  ): Promise<string> {
    try {
      // This would create a record in team_approval_requests table
      const approvalId = `approval-${Date.now()}`;
      console.log('Creating approval request:', { teamId, requestData });
      
      // For now, return mock ID since table doesn't exist yet
      return approvalId;
    } catch (error) {
      console.error('Error creating approval request:', error);
      throw error;
    }
  }

  async getPendingApprovals(teamId: string): Promise<PendingApproval[]> {
    try {
      // This would query team_approval_requests table
      console.log('Getting pending approvals for team:', teamId);
      
      // Return mock data for now
      return [];
    } catch (error) {
      console.error('Error getting pending approvals:', error);
      throw error;
    }
  }

  async approveRequest(
    approvalId: string, 
    approverId: string, 
    comments?: string
  ): Promise<void> {
    try {
      console.log('Approving request:', { approvalId, approverId, comments });
      
      // This would update the approval record and potentially execute the approved action
      // For now, just log the approval
    } catch (error) {
      console.error('Error approving request:', error);
      throw error;
    }
  }

  async rejectRequest(
    approvalId: string, 
    approverId: string, 
    reason: string
  ): Promise<void> {
    try {
      console.log('Rejecting request:', { approvalId, approverId, reason });
      
      // This would update the approval record with rejection
    } catch (error) {
      console.error('Error rejecting request:', error);
      throw error;
    }
  }

  // Permission Management
  async getUserPermissions(userId: string, teamId: string): Promise<string[]> {
    try {
      // Get user's role in the team
      const { data: membership, error } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .single();

      if (error || !membership) {
        return [];
      }

      // Map role to permissions (using existing role for now)
      const role = membership.role as 'ADMIN' | 'MEMBER';
      
      if (role === 'ADMIN') {
        return [
          'view_members', 'add_members', 'modify_member_roles', 'view_member_performance',
          'view_team_settings', 'modify_team_settings', 'view_basic_reports', 'view_advanced_reports'
        ];
      } else {
        return ['view_members', 'view_team_settings', 'view_basic_reports'];
      }
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  async hasPermission(userId: string, teamId: string, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, teamId);
    return permissions.includes(permission);
  }

  // Team Lifecycle Management
  async archiveTeam(teamId: string, requestedBy: string, reason: string): Promise<string> {
    try {
      // Check if archival requires approval
      const requiresApproval = await this.checkArchivalApproval(teamId, requestedBy);
      
      if (requiresApproval) {
        return await this.createApprovalRequest(teamId, {
          type: 'archive_team',
          reason,
          requested_by: requestedBy
        });
      } else {
        await this.executeTeamArchival(teamId);
        return 'completed';
      }
    } catch (error) {
      console.error('Error archiving team:', error);
      throw error;
    }
  }

  async transferTeamOwnership(
    teamId: string, 
    fromUserId: string, 
    toUserId: string
  ): Promise<string> {
    try {
      return await this.createApprovalRequest(teamId, {
        type: 'transfer_ownership',
        from_user_id: fromUserId,
        to_user_id: toUserId
      });
    } catch (error) {
      console.error('Error transferring team ownership:', error);
      throw error;
    }
  }

  // Delegation Management
  async delegatePermission(
    teamId: string,
    fromUserId: string,
    toUserId: string,
    permission: string,
    expiresAt?: Date
  ): Promise<void> {
    try {
      // This would create a record in team_permission_delegations table
      console.log('Delegating permission:', {
        teamId, fromUserId, toUserId, permission, expiresAt
      });
      
      // For now, just log the delegation
    } catch (error) {
      console.error('Error delegating permission:', error);
      throw error;
    }
  }

  async revokeDelegation(delegationId: string): Promise<void> {
    try {
      console.log('Revoking delegation:', delegationId);
      
      // This would update the delegation record
    } catch (error) {
      console.error('Error revoking delegation:', error);
      throw error;
    }
  }

  // Helper methods
  private async checkRoleChangeApproval(
    teamId: string, 
    newRole: EnterpriseTeamRole, 
    requestedBy: string
  ): Promise<boolean> {
    // Check governance rules to determine if approval is required
    // For now, assume LEAD and OWNER role changes require approval
    return ['LEAD', 'OWNER'].includes(newRole);
  }

  private async checkArchivalApproval(teamId: string, requestedBy: string): Promise<boolean> {
    // Check if user has permission to archive without approval
    const hasPermission = await this.hasPermission(requestedBy, teamId, 'archive_team');
    return !hasPermission;
  }

  private async executeRoleChange(memberId: string, newRole: EnterpriseTeamRole): Promise<void> {
    // For now, map enterprise roles to existing ADMIN/MEMBER structure
    const mappedRole = ['OWNER', 'LEAD', 'ADMIN'].includes(newRole) ? 'ADMIN' : 'MEMBER';
    
    const { error } = await supabase
      .from('team_members')
      .update({ role: mappedRole })
      .eq('id', memberId);

    if (error) throw error;
  }

  private async executeTeamArchival(teamId: string): Promise<void> {
    const { error } = await supabase
      .from('teams')
      .update({ status: 'inactive' })
      .eq('id', teamId);

    if (error) throw error;
  }
}

export const enterpriseTeamService = new EnterpriseTeamService();
