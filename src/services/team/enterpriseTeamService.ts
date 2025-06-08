
import { supabase } from '@/integrations/supabase/client';
import type { 
  EnterpriseTeamRole, 
  ApprovalWorkflow, 
  PendingApproval, 
  TeamGovernanceRule
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
        // Create approval request using real database
        const { data: approval, error } = await supabase
          .from('team_approval_requests')
          .insert({
            team_id: teamId,
            request_type: 'role_change',
            request_data: {
              member_id: memberId,
              new_role: newRole,
              requested_by: requestedBy
            },
            requested_by: requestedBy
          })
          .select()
          .single();

        if (error) throw error;
        
        return { requiresApproval: true, approvalId: approval.id };
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
      const { data, error } = await supabase
        .from('team_approval_workflows')
        .insert({
          team_id: workflow.team_id,
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

  async createApprovalRequest(
    teamId: string, 
    requestData: Record<string, any>
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('team_approval_requests')
        .insert({
          team_id: teamId,
          request_type: requestData.type,
          request_data: requestData,
          requested_by: requestData.requested_by
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating approval request:', error);
      throw error;
    }
  }

  async getPendingApprovals(teamId: string): Promise<PendingApproval[]> {
    try {
      const { data, error } = await supabase
        .from('team_approval_requests')
        .select(`
          *,
          profiles!team_approval_requests_requested_by_fkey(display_name),
          team_approval_workflows(workflow_name)
        `)
        .eq('team_id', teamId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(request => ({
        id: request.id,
        team_id: request.team_id,
        request_type: request.request_type,
        request_data: request.request_data,
        requested_by: request.requested_by,
        requested_at: request.created_at,
        requester_name: request.profiles?.display_name || 'Unknown',
        workflow_name: request.team_approval_workflows?.workflow_name || 'Standard Approval',
        priority: 'normal',
        description: this.generateRequestDescription(request.request_type, request.request_data)
      }));
    } catch (error) {
      console.error('Error getting pending approvals:', error);
      return [];
    }
  }

  async approveRequest(
    approvalId: string, 
    approverId: string, 
    comments?: string
  ): Promise<void> {
    try {
      // Get the request details
      const { data: request, error: fetchError } = await supabase
        .from('team_approval_requests')
        .select('*')
        .eq('id', approvalId)
        .single();

      if (fetchError) throw fetchError;

      // Update the approval record
      const { error: updateError } = await supabase
        .from('team_approval_requests')
        .update({
          status: 'approved',
          approved_by: approverId,
          approved_at: new Date().toISOString(),
          approver_comments: comments
        })
        .eq('id', approvalId);

      if (updateError) throw updateError;

      // Execute the approved action
      await this.executeApprovedAction(request);

      // Log the approval
      await supabase.rpc('log_team_lifecycle_event', {
        p_team_id: request.team_id,
        p_event_type: 'approval_granted',
        p_event_data: {
          approval_id: approvalId,
          request_type: request.request_type,
          approved_by: approverId,
          comments
        }
      });
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
      const { data: request, error: fetchError } = await supabase
        .from('team_approval_requests')
        .select('*')
        .eq('id', approvalId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('team_approval_requests')
        .update({
          status: 'rejected',
          approved_by: approverId,
          approved_at: new Date().toISOString(),
          rejected_reason: reason
        })
        .eq('id', approvalId);

      if (updateError) throw updateError;

      // Log the rejection
      await supabase.rpc('log_team_lifecycle_event', {
        p_team_id: request.team_id,
        p_event_type: 'approval_rejected',
        p_event_data: {
          approval_id: approvalId,
          request_type: request.request_type,
          rejected_by: approverId,
          reason
        }
      });
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
        .select('role, permissions')
        .eq('user_id', userId)
        .eq('team_id', teamId)
        .single();

      if (error || !membership) {
        return [];
      }

      // Get base permissions from role
      const basePermissions = this.getRolePermissions(membership.role as 'ADMIN' | 'MEMBER');

      // Get delegated permissions
      const { data: delegations } = await supabase
        .from('team_permission_delegations')
        .select('permission')
        .eq('team_id', teamId)
        .eq('delegate_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      const delegatedPermissions = delegations?.map(d => d.permission) || [];

      return [...basePermissions, ...delegatedPermissions];
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
      const { error } = await supabase
        .from('team_permission_delegations')
        .insert({
          team_id: teamId,
          delegator_id: fromUserId,
          delegate_id: toUserId,
          permission,
          expires_at: expiresAt?.toISOString(),
          is_active: true
        });

      if (error) throw error;

      // Log the delegation
      await supabase.rpc('log_team_lifecycle_event', {
        p_team_id: teamId,
        p_event_type: 'permission_delegated',
        p_event_data: {
          delegator_id: fromUserId,
          delegate_id: toUserId,
          permission,
          expires_at: expiresAt?.toISOString()
        }
      });
    } catch (error) {
      console.error('Error delegating permission:', error);
      throw error;
    }
  }

  async revokeDelegation(delegationId: string): Promise<void> {
    try {
      const { data: delegation, error: fetchError } = await supabase
        .from('team_permission_delegations')
        .select('*')
        .eq('id', delegationId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('team_permission_delegations')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
          revoked_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', delegationId);

      if (updateError) throw updateError;

      // Log the revocation
      await supabase.rpc('log_team_lifecycle_event', {
        p_team_id: delegation.team_id,
        p_event_type: 'permission_revoked',
        p_event_data: {
          delegation_id: delegationId,
          permission: delegation.permission
        }
      });
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
    try {
      // Check governance rules to determine if approval is required
      const { data: rules } = await supabase
        .from('team_governance_rules')
        .select('*')
        .eq('team_id', teamId)
        .eq('rule_type', 'role_assignment')
        .eq('is_active', true);

      // For now, assume LEAD and OWNER role changes require approval
      return ['LEAD', 'OWNER'].includes(newRole);
    } catch (error) {
      console.error('Error checking role change approval:', error);
      return true; // Default to requiring approval
    }
  }

  private async checkArchivalApproval(teamId: string, requestedBy: string): Promise<boolean> {
    try {
      // Check if user has permission to archive without approval
      const hasPermission = await this.hasPermission(requestedBy, teamId, 'archive_team');
      return !hasPermission;
    } catch (error) {
      console.error('Error checking archival approval:', error);
      return true; // Default to requiring approval
    }
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

    // Log the archival
    await supabase.rpc('log_team_lifecycle_event', {
      p_team_id: teamId,
      p_event_type: 'archived',
      p_event_data: { archived_at: new Date().toISOString() }
    });
  }

  private async executeApprovedAction(request: any): Promise<void> {
    switch (request.request_type) {
      case 'role_change':
        await this.executeRoleChange(
          request.request_data.member_id,
          request.request_data.new_role
        );
        break;
      case 'archive_team':
        await this.executeTeamArchival(request.team_id);
        break;
      // Add more cases as needed
    }
  }

  private getRolePermissions(role: 'ADMIN' | 'MEMBER'): string[] {
    if (role === 'ADMIN') {
      return [
        'view_members', 'add_members', 'modify_member_roles', 'view_member_performance',
        'view_team_settings', 'modify_team_settings', 'view_basic_reports', 'view_advanced_reports'
      ];
    } else {
      return ['view_members', 'view_team_settings', 'view_basic_reports'];
    }
  }

  private generateRequestDescription(requestType: string, requestData: any): string {
    switch (requestType) {
      case 'role_change':
        return `Request to change role to ${requestData.new_role}`;
      case 'archive_team':
        return `Request to archive team: ${requestData.reason}`;
      default:
        return `${requestType} request`;
    }
  }
}

export const enterpriseTeamService = new EnterpriseTeamService();
