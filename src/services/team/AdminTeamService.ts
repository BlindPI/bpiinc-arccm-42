import { supabase } from '@/integrations/supabase/client';
import type { DatabaseUserRole } from '@/types/database-roles';

export interface AdminTeamCreateData {
  name: string;
  description?: string;
  team_type: string;
  location_id?: string;
  provider_id?: string; // Changed to string to match database schema
  metadata?: Record<string, any>;
  monthly_targets?: Record<string, any>;
}

export interface AdminTeamUpdateData {
  name?: string;
  description?: string;
  team_type?: string;
  status?: 'active' | 'inactive' | 'suspended';
  location_id?: string;
  provider_id?: string; // Changed to string to match database schema
  metadata?: Record<string, any>;
  monthly_targets?: Record<string, any>;
  current_metrics?: Record<string, any>;
}

export interface AdminMemberData {
  id: string;
  team_id: string;
  user_id: string;
  role: 'ADMIN' | 'MEMBER';
  status: 'active' | 'inactive' | 'on_leave' | 'suspended';
  location_assignment?: string;
  assignment_start_date?: string;
  assignment_end_date?: string;
  team_position?: string;
  permissions: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_activity?: string;
  profiles?: {
    id: string;
    display_name: string;
    email?: string;
    role: DatabaseUserRole;
  };
}

export interface BulkMemberOperation {
  operation: 'add' | 'remove' | 'update_role' | 'transfer';
  user_ids: string[];
  target_team_id?: string;
  new_role?: 'ADMIN' | 'MEMBER';
  source_team_id?: string;
}

export interface AdminAuditLog {
  id: string;
  action: string;
  entity_type: 'team' | 'member';
  entity_id: string;
  user_id: string;
  details: Record<string, any>;
  timestamp: string;
}

export class AdminTeamService {
  // Verify admin permissions before operations
  private static async verifyAdminPermissions(userId: string): Promise<boolean> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        console.error('Error verifying admin permissions:', error);
        return false;
      }

      return ['SA', 'AD'].includes(profile.role);
    } catch (error) {
      console.error('Failed to verify admin permissions:', error);
      return false;
    }
  }

  // Log administrative actions for audit trail
  private static async logAdminAction(
    action: string,
    entityType: 'team' | 'member',
    entityId: string,
    details: Record<string, any>
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.rpc('log_team_lifecycle_event', {
        p_team_id: entityType === 'team' ? entityId : details.team_id,
        p_event_type: action,
        p_event_data: details,
        p_affected_user_id: entityType === 'member' ? entityId : null
      });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  }

  // Create team with administrative privileges
  static async createTeam(teamData: AdminTeamCreateData): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const hasPermission = await this.verifyAdminPermissions(user.id);
      if (!hasPermission) {
        throw new Error('Insufficient permissions to create teams');
      }

      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          description: teamData.description,
          team_type: teamData.team_type,
          location_id: teamData.location_id,
          provider_id: teamData.provider_id?.toString(),
          created_by: user.id,
          status: 'active',
          performance_score: 0,
          metadata: teamData.metadata || {},
          monthly_targets: teamData.monthly_targets || {},
          current_metrics: {}
        })
        .select()
        .single();

      if (error) throw error;

      // Log the creation
      await this.logAdminAction('admin_team_created', 'team', data.id, {
        team_name: teamData.name,
        team_type: teamData.team_type,
        created_by_admin: user.id
      });

      return data;
    } catch (error) {
      console.error('Failed to create team:', error);
      throw error;
    }
  }

  // Update team with administrative privileges
  static async updateTeam(teamId: string, updateData: AdminTeamUpdateData): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const hasPermission = await this.verifyAdminPermissions(user.id);
      if (!hasPermission) {
        throw new Error('Insufficient permissions to update teams');
      }

      const { data, error } = await supabase
        .from('teams')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId)
        .select()
        .single();

      if (error) throw error;

      // Log the update
      await this.logAdminAction('admin_team_updated', 'team', teamId, {
        updated_fields: Object.keys(updateData),
        updated_by_admin: user.id
      });

      return data;
    } catch (error) {
      console.error('Failed to update team:', error);
      throw error;
    }
  }

  // Delete team with administrative privileges (SA only)
  static async deleteTeam(teamId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'SA') {
        throw new Error('Only System Administrators can delete teams');
      }

      // Check for dependencies before deletion
      const { data: members } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId);

      if (members && members.length > 0) {
        throw new Error('Cannot delete team with active members. Remove all members first.');
      }

      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      // Log the deletion
      await this.logAdminAction('admin_team_deleted', 'team', teamId, {
        deleted_by_admin: user.id,
        deletion_reason: 'administrative_action'
      });
    } catch (error) {
      console.error('Failed to delete team:', error);
      throw error;
    }
  }

  // Get all team members for administrative oversight
  static async getAllTeamMembers(teamId: string): Promise<AdminMemberData[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const hasPermission = await this.verifyAdminPermissions(user.id);
      if (!hasPermission) {
        throw new Error('Insufficient permissions to view team members');
      }

      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles!inner(
            id,
            display_name,
            email,
            role
          )
        `)
        .eq('team_id', teamId);

      if (error) throw error;

      return data as AdminMemberData[];
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      throw error;
    }
  }

  // Add member to team with administrative privileges
  static async addTeamMember(
    teamId: string,
    userId: string,
    role: 'ADMIN' | 'MEMBER' = 'MEMBER',
    additionalData?: Partial<AdminMemberData>
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const hasPermission = await this.verifyAdminPermissions(user.id);
      if (!hasPermission) {
        throw new Error('Insufficient permissions to add team members');
      }

      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role: role,
          status: 'active',
          permissions: additionalData?.permissions || {},
          assignment_start_date: additionalData?.assignment_start_date || new Date().toISOString(),
          location_assignment: additionalData?.location_assignment,
          team_position: additionalData?.team_position
        });

      if (error) throw error;

      // Log the addition
      await this.logAdminAction('admin_member_added', 'member', userId, {
        team_id: teamId,
        role: role,
        added_by_admin: user.id
      });
    } catch (error) {
      console.error('Failed to add team member:', error);
      throw error;
    }
  }

  // Remove member from team with administrative privileges
  static async removeTeamMember(teamId: string, userId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const hasPermission = await this.verifyAdminPermissions(user.id);
      if (!hasPermission) {
        throw new Error('Insufficient permissions to remove team members');
      }

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;

      // Log the removal
      await this.logAdminAction('admin_member_removed', 'member', userId, {
        team_id: teamId,
        removed_by_admin: user.id
      });
    } catch (error) {
      console.error('Failed to remove team member:', error);
      throw error;
    }
  }

  // Update member role with administrative privileges
  static async updateMemberRole(
    teamId: string,
    userId: string,
    newRole: 'ADMIN' | 'MEMBER'
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const hasPermission = await this.verifyAdminPermissions(user.id);
      if (!hasPermission) {
        throw new Error('Insufficient permissions to update member roles');
      }

      const { error } = await supabase
        .from('team_members')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;

      // Log the role change
      await this.logAdminAction('admin_member_role_updated', 'member', userId, {
        team_id: teamId,
        new_role: newRole,
        updated_by_admin: user.id
      });
    } catch (error) {
      console.error('Failed to update member role:', error);
      throw error;
    }
  }

  // Bulk member operations for administrative efficiency
  static async performBulkMemberOperation(
    teamId: string,
    operation: BulkMemberOperation
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const hasPermission = await this.verifyAdminPermissions(user.id);
      if (!hasPermission) {
        throw new Error('Insufficient permissions for bulk operations');
      }

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const userId of operation.user_ids) {
        try {
          switch (operation.operation) {
            case 'add':
              await this.addTeamMember(teamId, userId, operation.new_role || 'MEMBER');
              break;
            case 'remove':
              await this.removeTeamMember(teamId, userId);
              break;
            case 'update_role':
              if (operation.new_role) {
                await this.updateMemberRole(teamId, userId, operation.new_role);
              }
              break;
            case 'transfer':
              if (operation.target_team_id && operation.source_team_id) {
                await this.removeTeamMember(operation.source_team_id, userId);
                await this.addTeamMember(operation.target_team_id, userId, operation.new_role || 'MEMBER');
              }
              break;
          }
          success++;
        } catch (error) {
          failed++;
          errors.push(`User ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Log the bulk operation
      await this.logAdminAction('admin_bulk_operation', 'member', teamId, {
        operation: operation.operation,
        total_users: operation.user_ids.length,
        success_count: success,
        failed_count: failed,
        performed_by_admin: user.id
      });

      return { success, failed, errors };
    } catch (error) {
      console.error('Failed to perform bulk operation:', error);
      throw error;
    }
  }

  // Get administrative audit logs
  static async getAdminAuditLogs(
    teamId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<AdminAuditLog[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const hasPermission = await this.verifyAdminPermissions(user.id);
      if (!hasPermission) {
        throw new Error('Insufficient permissions to view audit logs');
      }

      // This would require a proper audit log table in the database
      // For now, we'll return an empty array as a placeholder
      return [];
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      throw error;
    }
  }
}