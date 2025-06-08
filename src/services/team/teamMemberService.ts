
import { supabase } from '@/integrations/supabase/client';
import type { TeamMemberWithProfile } from '@/types/team-management';

export class TeamMemberService {
  async getTeamMembers(teamId: string): Promise<TeamMemberWithProfile[]> {
    try {
      const { data: members, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles (
            id,
            display_name,
            email,
            role,
            created_at,
            updated_at
          )
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (members || []).map(member => ({
        ...member,
        role: member.role as 'MEMBER' | 'ADMIN',
        status: member.status as 'active' | 'inactive' | 'on_leave' | 'suspended',
        permissions: this.safeJsonParse(member.permissions, {}),
        display_name: member.profiles?.display_name || member.user_id || 'Unknown',
        profiles: member.profiles ? {
          id: member.profiles.id,
          display_name: member.profiles.display_name,
          email: member.profiles.email,
          role: member.profiles.role,
          created_at: member.profiles.created_at,
          updated_at: member.profiles.updated_at
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching team members:', error);
      return [];
    }
  }

  async addTeamMember(
    teamId: string, 
    userId: string, 
    role: 'ADMIN' | 'MEMBER' = 'MEMBER'
  ): Promise<TeamMemberWithProfile> {
    try {
      // Check if user is already a member
      const { data: existing } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        throw new Error('User is already a member of this team');
      }

      // Add the member
      const { data: newMember, error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role,
          status: 'active',
          permissions: role === 'ADMIN' ? { admin: true, manage_members: true } : {},
          assignment_start_date: new Date().toISOString()
        })
        .select(`
          *,
          profiles (
            id,
            display_name,
            email,
            role,
            created_at,
            updated_at
          )
        `)
        .single();

      if (error) throw error;

      // Log the addition
      await this.logMembershipChange(teamId, userId, 'added', role);

      return {
        ...newMember,
        role: newMember.role as 'MEMBER' | 'ADMIN',
        status: newMember.status as 'active' | 'inactive' | 'on_leave' | 'suspended',
        permissions: this.safeJsonParse(newMember.permissions, {}),
        display_name: newMember.profiles?.display_name || newMember.user_id || 'Unknown',
        profiles: newMember.profiles
      };
    } catch (error) {
      console.error('Error adding team member:', error);
      throw error;
    }
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;

      // Log the removal
      await this.logMembershipChange(teamId, userId, 'removed');
    } catch (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
  }

  async updateMemberRole(teamId: string, userId: string, newRole: 'ADMIN' | 'MEMBER'): Promise<void> {
    try {
      const permissions = newRole === 'ADMIN' 
        ? { admin: true, manage_members: true, manage_settings: true }
        : {};

      const { error } = await supabase
        .from('team_members')
        .update({ 
          role: newRole,
          permissions,
          updated_at: new Date().toISOString()
        })
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;

      // Log the role change
      await this.logMembershipChange(teamId, userId, 'role_changed', newRole);
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }

  async updateMemberStatus(
    teamId: string, 
    userId: string, 
    status: 'active' | 'inactive' | 'on_leave' | 'suspended'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;

      // Log the status change
      await this.logMembershipChange(teamId, userId, 'status_changed', undefined, status);
    } catch (error) {
      console.error('Error updating member status:', error);
      throw error;
    }
  }

  async bulkUpdateMembers(
    teamId: string,
    operations: Array<{
      userId: string;
      operation: 'add' | 'remove' | 'update_role' | 'update_status';
      data?: any;
    }>
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const op of operations) {
      try {
        switch (op.operation) {
          case 'add':
            await this.addTeamMember(teamId, op.userId, op.data?.role || 'MEMBER');
            break;
          case 'remove':
            await this.removeTeamMember(teamId, op.userId);
            break;
          case 'update_role':
            await this.updateMemberRole(teamId, op.userId, op.data?.role);
            break;
          case 'update_status':
            await this.updateMemberStatus(teamId, op.userId, op.data?.status);
            break;
        }
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`${op.operation} for ${op.userId}: ${error.message}`);
      }
    }

    return results;
  }

  private async logMembershipChange(
    teamId: string, 
    userId: string, 
    action: string, 
    role?: string,
    status?: string
  ): Promise<void> {
    try {
      await supabase
        .from('team_lifecycle_events')
        .insert({
          team_id: teamId,
          event_type: 'member_change',
          event_data: {
            user_id: userId,
            action,
            role,
            status,
            timestamp: new Date().toISOString()
          },
          triggered_by: (await supabase.auth.getUser()).data.user?.id
        });
    } catch (error) {
      console.error('Error logging membership change:', error);
    }
  }

  private safeJsonParse<T>(value: any, defaultValue: T): T {
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

export const teamMemberService = new TeamMemberService();
