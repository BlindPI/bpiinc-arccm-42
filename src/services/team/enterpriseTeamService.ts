
import { supabase } from '@/integrations/supabase/client';
import type { WorkflowRequest, RoleChangeRequest } from '@/types/team-management';

export interface RoleChangeRequestData {
  userId: string;
  fromRole: string;
  toRole: string;
  requiresApproval: boolean;
  [key: string]: any; // Add index signature for JSON compatibility
}

export interface BulkRoleUpdateResult {
  processed: number;
  requiresApproval: RoleChangeRequest[];
  errors: string[];
}

export interface PendingApproval {
  id: string;
  type: string;
  requestedBy: string;
  data: any;
  createdAt: string;
}

export class EnterpriseTeamService {
  static async createRoleChangeRequest(
    userId: string,
    fromRole: string,
    toRole: string,
    requestedBy: string
  ): Promise<RoleChangeRequest> {
    const requiresApproval = this.determineApprovalRequirement(fromRole, toRole);
    
    const requestData: RoleChangeRequestData = {
      userId,
      fromRole,
      toRole,
      requiresApproval
    };
    
    const { data, error } = await supabase
      .from('team_workflows')
      .insert({
        workflow_type: 'role_change',
        request_data: requestData,
        requested_by: requestedBy,
        status: requiresApproval ? 'pending' : 'approved'
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId,
      fromRole,
      toRole,
      requestedBy,
      status: data.status as 'pending' | 'approved' | 'rejected',
      requiresApproval,
      processed: !requiresApproval,
      createdAt: data.created_at
    };
  }

  static async updateMemberRole(
    teamId: string,
    memberId: string,
    newRole: string,
    updatedBy: string
  ): Promise<{ requiresApproval: boolean; requestId?: string }> {
    // Check if approval is required
    const requiresApproval = this.determineApprovalRequirement('MEMBER', newRole);
    
    if (requiresApproval) {
      // Create approval workflow
      const { data, error } = await supabase
        .from('team_workflows')
        .insert({
          team_id: teamId,
          workflow_type: 'role_change',
          request_data: { memberId, newRole, teamId },
          requested_by: updatedBy,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      
      return { requiresApproval: true, requestId: data.id };
    } else {
      // Direct update
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', memberId);

      if (error) throw error;
      
      return { requiresApproval: false };
    }
  }

  static async bulkUpdateMemberRoles(
    teamId: string,
    updates: Array<{ memberId: string; newRole: string }>,
    updatedBy: string
  ): Promise<BulkRoleUpdateResult> {
    const result: BulkRoleUpdateResult = {
      processed: 0,
      requiresApproval: [],
      errors: []
    };

    for (const update of updates) {
      try {
        const updateResult = await this.updateMemberRole(
          teamId,
          update.memberId,
          update.newRole,
          updatedBy
        );
        
        if (updateResult.requiresApproval) {
          result.requiresApproval.push({
            id: updateResult.requestId || '',
            userId: update.memberId,
            fromRole: 'MEMBER',
            toRole: update.newRole,
            requestedBy: updatedBy,
            status: 'pending',
            requiresApproval: true,
            processed: false,
            createdAt: new Date().toISOString()
          });
        } else {
          result.processed++;
        }
      } catch (error) {
        result.errors.push(`Failed to update ${update.memberId}: ${error.message}`);
      }
    }

    return result;
  }

  static async getPendingApprovals(teamId?: string): Promise<PendingApproval[]> {
    let query = supabase
      .from('team_workflows')
      .select('*')
      .eq('status', 'pending');

    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      type: item.workflow_type,
      requestedBy: item.requested_by,
      data: this.safeJsonParse(item.request_data, {}),
      createdAt: item.created_at
    }));
  }

  static async approveRequest(requestId: string, approvedBy: string): Promise<void> {
    const { error } = await supabase
      .from('team_workflows')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        completed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) throw error;
  }

  static async rejectRequest(requestId: string, rejectedBy: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from('team_workflows')
      .update({
        status: 'rejected',
        approved_by: rejectedBy,
        approval_data: { rejection_reason: reason },
        completed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) throw error;
  }

  static async getRoleChangeRequests(): Promise<RoleChangeRequest[]> {
    const { data, error } = await supabase
      .from('team_workflows')
      .select('*')
      .eq('workflow_type', 'role_change')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => {
      const requestData = this.safeJsonParse(item.request_data, {}) as RoleChangeRequestData;
      
      return {
        id: item.id,
        userId: requestData.userId || '',
        fromRole: requestData.fromRole || '',
        toRole: requestData.toRole || '',
        requestedBy: item.requested_by || '',
        status: item.status as 'pending' | 'approved' | 'rejected',
        requiresApproval: requestData.requiresApproval || false,
        processed: item.status !== 'pending',
        createdAt: item.created_at
      };
    });
  }

  private static determineApprovalRequirement(fromRole: string, toRole: string): boolean {
    const highPrivilegeRoles = ['SA', 'AD', 'AP', 'OWNER', 'LEAD'];
    return highPrivilegeRoles.includes(toRole) || highPrivilegeRoles.includes(fromRole);
  }

  private static safeJsonParse<T>(value: any, defaultValue: T): T {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'object' && value !== null) return value as T;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  }
}

export const enterpriseTeamService = new EnterpriseTeamService();
