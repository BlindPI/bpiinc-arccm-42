
import { supabase } from '@/integrations/supabase/client';
import type { WorkflowRequest, RoleChangeRequest } from '@/types/team-management';

export interface RoleChangeRequestData {
  userId: string;
  fromRole: string;
  toRole: string;
  requiresApproval: boolean;
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
        team_id: null,
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

  static async getRoleChangeRequests(): Promise<RoleChangeRequest[]> {
    const { data, error } = await supabase
      .from('team_workflows')
      .select('*')
      .eq('workflow_type', 'role_change')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => {
      const requestData = item.request_data as RoleChangeRequestData;
      
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
    const highPrivilegeRoles = ['SA', 'AD', 'AP'];
    return highPrivilegeRoles.includes(toRole) || highPrivilegeRoles.includes(fromRole);
  }
}

export const enterpriseTeamService = new EnterpriseTeamService();
