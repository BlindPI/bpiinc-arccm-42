
import { supabase } from '@/integrations/supabase/client';
import { teamMemberHistoryService } from './teamMemberHistoryService';
import type { TeamMemberWithProfile } from '@/types/team-management';

export class TeamMemberService {
  async getTeamMembers(teamId: string): Promise<TeamMemberWithProfile[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles(*)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(member => ({
        ...member,
        role: this.validateMemberRole(member.role),
        status: this.validateMemberStatus(member.status),
        permissions: this.safeJsonParse(member.permissions, {}),
        display_name: member.profiles?.display_name || 'Unknown User',
        last_activity: member.last_activity || member.updated_at,
        profiles: member.profiles
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
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role: role,
          status: 'active',
          permissions: {},
          assignment_start_date: new Date().toISOString()
        });

      if (error) throw error;

      // Log the addition
      await teamMemberHistoryService.logStatusChange(
        userId,
        '',
        'active',
        '',
        role,
        'Added to team'
      );
    } catch (error) {
      console.error('Error adding team member:', error);
      throw error;
    }
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    try {
      // Get current member details
      const { data: member, error: fetchError } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      // Remove the member
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;

      // Log the removal
      await teamMemberHistoryService.logStatusChange(
        member.id,
        member.status,
        'removed',
        member.role,
        '',
        'Removed from team'
      );
    } catch (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
  }

  async updateMemberRole(
    teamId: string, 
    userId: string, 
    newRole: 'ADMIN' | 'MEMBER'
  ): Promise<void> {
    try {
      // Get current member details
      const { data: member, error: fetchError } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      // Update the role
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
      await teamMemberHistoryService.logStatusChange(
        member.id,
        member.status,
        member.status,
        member.role,
        newRole,
        `Role updated from ${member.role} to ${newRole}`
      );
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }

  async updateMemberStatus(
    teamId: string, 
    userId: string, 
    newStatus: 'active' | 'inactive' | 'suspended' | 'on_leave'
  ): Promise<void> {
    try {
      // Get current member details
      const { data: member, error: fetchError } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      // Update the status
      const { error } = await supabase
        .from('team_members')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;

      // Log the status change
      await teamMemberHistoryService.logStatusChange(
        member.id,
        member.status,
        newStatus,
        member.role,
        member.role,
        `Status updated from ${member.status} to ${newStatus}`
      );
    } catch (error) {
      console.error('Error updating member status:', error);
      throw error;
    }
  }

  // Helper methods
  private validateMemberRole(role: string): 'MEMBER' | 'ADMIN' {
    if (role === 'ADMIN' || role === 'MEMBER') {
      return role;
    }
    return 'MEMBER'; // Default fallback
  }

  private validateMemberStatus(status: string): 'active' | 'inactive' | 'suspended' | 'on_leave' {
    if (status === 'active' || status === 'inactive' || status === 'suspended' || status === 'on_leave') {
      return status;
    }
    return 'active'; // Default fallback
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
