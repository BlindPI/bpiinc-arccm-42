
import { supabase } from '@/integrations/supabase/client';
import type { WorkflowRequest } from '@/types/team-management';

export interface RoleChangeRequest {
  id: string;
  userId: string;
  fromRole: string;
  toRole: string;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  requiresApproval: boolean;
  processed: boolean;
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
    
    const { data, error } = await supabase
      .from('team_workflows')
      .insert({
        team_id: null,
        workflow_type: 'role_change',
        request_data: {
          userId,
          fromRole,
          toRole,
          requiresApproval
        },
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

    return (data || []).map(item => ({
      id: item.id,
      userId: item.request_data?.userId || '',
      fromRole: item.request_data?.fromRole || '',
      toRole: item.request_data?.toRole || '',
      requestedBy: item.requested_by || '',
      status: item.status as 'pending' | 'approved' | 'rejected',
      requiresApproval: item.request_data?.requiresApproval || false,
      processed: item.status !== 'pending',
      createdAt: item.created_at
    }));
  }

  private static determineApprovalRequirement(fromRole: string, toRole: string): boolean {
    const highPrivilegeRoles = ['SA', 'AD', 'AP'];
    return highPrivilegeRoles.includes(toRole) || highPrivilegeRoles.includes(fromRole);
  }
}
