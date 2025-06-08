
import { supabase } from '@/integrations/supabase/client';
import type { TeamMember, TeamMemberWithProfile, Profile } from '@/types/team-management';

export interface TeamMemberInvitation {
  id: string;
  teamId: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  invitedBy: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
  createdAt: string;
}

export interface TeamMemberActivity {
  memberId: string;
  activityType: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Helper function to safely parse JSON permissions
function parsePermissions(permissions: any): Record<string, any> {
  if (typeof permissions === 'object' && permissions !== null && !Array.isArray(permissions)) {
    return permissions;
  }
  if (typeof permissions === 'string') {
    try {
      const parsed = JSON.parse(permissions);
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

export class TeamMemberService {
  async addTeamMember(
    teamId: string, 
    userId: string, 
    role: 'ADMIN' | 'MEMBER' = 'MEMBER',
    permissions: Record<string, any> = {}
  ): Promise<TeamMemberWithProfile> {
    try {
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (existingMember) {
        throw new Error('User is already a member of this team');
      }

      // Add team member
      const { data: newMember, error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role,
          status: 'active',
          permissions: permissions || {},
          assignment_start_date: new Date().toISOString()
        })
        .select(`
          *,
          profiles (
            id, display_name, email, role, created_at, updated_at
          )
        `)
        .single();

      if (memberError) throw memberError;

      return {
        ...newMember,
        role: newMember.role as 'ADMIN' | 'MEMBER',
        status: newMember.status as 'active' | 'inactive' | 'on_leave' | 'suspended',
        permissions: parsePermissions(newMember.permissions),
        display_name: newMember.profiles?.display_name || userId,
        profiles: newMember.profiles ? {
          id: newMember.profiles.id,
          display_name: newMember.profiles.display_name,
          email: newMember.profiles.email,
          role: newMember.profiles.role,
          created_at: newMember.profiles.created_at,
          updated_at: newMember.profiles.updated_at
        } : undefined
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
      const { error } = await supabase
        .from('team_members')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;
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
    } catch (error) {
      console.error('Error updating member status:', error);
      throw error;
    }
  }

  async getTeamMembers(teamId: string): Promise<TeamMemberWithProfile[]> {
    try {
      const { data: members, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles (
            id, display_name, email, role, created_at, updated_at
          )
        `)
        .eq('team_id', teamId)
        .order('created_at');

      if (error) throw error;

      return (members || []).map(member => ({
        ...member,
        role: member.role as 'ADMIN' | 'MEMBER',
        status: member.status as 'active' | 'inactive' | 'on_leave' | 'suspended',
        permissions: parsePermissions(member.permissions),
        display_name: member.profiles?.display_name || member.user_id,
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
      console.error('Error getting team members:', error);
      return [];
    }
  }

  async getMemberActivity(memberId: string, limit: number = 10): Promise<TeamMemberActivity[]> {
    try {
      const { data: activities, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', memberId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (activities || []).map(activity => ({
        memberId,
        activityType: activity.action,
        description: `${activity.action} on ${activity.entity_type}`,
        timestamp: activity.created_at,
        metadata: activity.details ? parsePermissions(activity.details) : {}
      }));
    } catch (error) {
      console.error('Error getting member activity:', error);
      return [];
    }
  }

  async searchAvailableUsers(searchTerm: string, teamId: string): Promise<Profile[]> {
    try {
      // Get users not already in the team
      const { data: existingMembers } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId);

      const existingUserIds = existingMembers?.map(m => m.user_id) || [];

      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, display_name, email, role, created_at, updated_at')
        .not('id', 'in', `(${existingUserIds.join(',')})`)
        .or(`display_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;

      return users || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  async updateMemberPermissions(
    teamId: string, 
    userId: string, 
    permissions: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ 
          permissions,
          updated_at: new Date().toISOString()
        })
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating member permissions:', error);
      throw error;
    }
  }
}

export const teamMemberService = new TeamMemberService();
