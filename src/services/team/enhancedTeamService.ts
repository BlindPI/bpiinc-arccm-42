import { supabase } from '@/integrations/supabase/client';
import type { SimpleTeam, SimpleTeamPermissions } from '@/types/simplified-team-management';

export interface EnhancedTeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'MEMBER' | 'ADMIN';
  permissions: SimpleTeamPermissions;
  team_position?: string;
  assignment_start_date?: string;
  assignment_end_date?: string;
  created_at: string;
  updated_at: string;
  display_name: string;
  profile?: {
    id: string;
    display_name: string;
    email?: string;
    role: string;
  };
  // Enhanced fields now available in database
  status: 'active' | 'inactive' | 'on_leave' | 'suspended';
  skills: string[];
  emergency_contact: Record<string, any>;
  notes?: string;
  last_activity?: string;
}

export interface TeamMemberUpdate {
  role?: 'MEMBER' | 'ADMIN';
  team_position?: string;
  status?: 'active' | 'inactive' | 'on_leave' | 'suspended';
  skills?: string[];
  emergency_contact?: Record<string, any>;
  notes?: string;
}

// Type guard functions for safe conversion
function parseSkillsArray(value: any): string[] {
  if (Array.isArray(value)) {
    return value.filter(item => typeof item === 'string');
  }
  return [];
}

function parseEmergencyContact(value: any): Record<string, any> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, any>;
  }
  return {};
}

// Helper function to convert enhanced team member to simple team member
const convertToSimpleTeamMember = (enhancedMember: EnhancedTeamMember): any => {
  const permissions: SimpleTeamPermissions = enhancedMember.role === 'ADMIN' ? {
    can_manage_members: true,
    can_edit_settings: true,
    can_view_reports: true
  } : {
    can_manage_members: false,
    can_edit_settings: false,
    can_view_reports: true
  };

  return {
    ...enhancedMember,
    permissions
  };
};

export class EnhancedTeamService {
  // Get teams with enhanced member data
  async getTeamsWithEnhancedMembers(): Promise<SimpleTeam[]> {
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          description,
          status,
          team_type,
          performance_score,
          location_id,
          provider_id,
          created_at,
          updated_at,
          locations(id, name, city, state)
        `)
        .order('created_at', { ascending: false });
      
      if (teamsError) throw teamsError;

      const teams: SimpleTeam[] = [];
      
      for (const team of teamsData || []) {
        // Get enhanced member data with all new columns
        const { data: membersData, error: membersError } = await supabase
          .from('team_members')
          .select(`
            id,
            team_id,
            user_id,
            role,
            team_position,
            assignment_start_date,
            assignment_end_date,
            permissions,
            status,
            skills,
            emergency_contact,
            notes,
            last_activity,
            created_at,
            updated_at,
            profiles!inner(
              id,
              display_name,
              email,
              role,
              phone,
              organization
            )
          `)
          .eq('team_id', team.id);

        if (membersError) {
          console.error('Error fetching team members:', membersError);
          continue;
        }

        const enhancedMembers: EnhancedTeamMember[] = (membersData || []).map(member => {
          const enhancedMember: EnhancedTeamMember = {
            id: member.id,
            team_id: member.team_id,
            user_id: member.user_id,
            role: member.role as 'MEMBER' | 'ADMIN',
            permissions: member.role === 'ADMIN' ? {
              can_manage_members: true,
              can_edit_settings: true,
              can_view_reports: true
            } : {
              can_manage_members: false,
              can_edit_settings: false,
              can_view_reports: true
            },
            team_position: member.team_position,
            assignment_start_date: member.assignment_start_date,
            assignment_end_date: member.assignment_end_date,
            created_at: member.created_at,
            updated_at: member.updated_at,
            display_name: member.profiles?.display_name || 'Unknown User',
            profile: member.profiles ? {
              id: member.profiles.id,
              display_name: member.profiles.display_name,
              email: member.profiles.email,
              role: member.profiles.role
            } : undefined,
            // Enhanced fields from new database columns with safe type conversion
            status: (member.status as 'active' | 'inactive' | 'on_leave' | 'suspended') || 'active',
            skills: parseSkillsArray(member.skills),
            emergency_contact: parseEmergencyContact(member.emergency_contact),
            notes: member.notes || '',
            last_activity: member.last_activity
          };
          return enhancedMember;
        });

        teams.push({
          ...team,
          status: (team.status as 'active' | 'inactive' | 'suspended') || 'active',
          location: team.locations ? {
            id: team.locations.id,
            name: team.locations.name,
            city: team.locations.city,
            state: team.locations.state
          } : undefined,
          members: enhancedMembers.map(convertToSimpleTeamMember),
          member_count: enhancedMembers.length
        });
      }
      
      return teams;
    } catch (error) {
      console.error('Error fetching teams with enhanced members:', error);
      throw error;
    }
  }

  // Get single team with enhanced member details
  async getTeamWithEnhancedMembers(teamId: string): Promise<SimpleTeam> {
    try {
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select(`
          *,
          locations(id, name, city, state)
        `)
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;

      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select(`
          id,
          team_id,
          user_id,
          role,
          team_position,
          assignment_start_date,
          assignment_end_date,
          permissions,
          status,
          skills,
          emergency_contact,
          notes,
          last_activity,
          created_at,
          updated_at,
          profiles!inner(
            id,
            display_name,
            email,
            role,
            phone,
            organization
          )
        `)
        .eq('team_id', teamId);

      if (membersError) throw membersError;

      const enhancedMembers: EnhancedTeamMember[] = (membersData || []).map(member => {
        const enhancedMember: EnhancedTeamMember = {
          id: member.id,
          team_id: member.team_id,
          user_id: member.user_id,
          role: member.role as 'MEMBER' | 'ADMIN',
          permissions: member.role === 'ADMIN' ? {
            can_manage_members: true,
            can_edit_settings: true,
            can_view_reports: true
          } : {
            can_manage_members: false,
            can_edit_settings: false,
            can_view_reports: true
          },
          team_position: member.team_position,
          assignment_start_date: member.assignment_start_date,
          assignment_end_date: member.assignment_end_date,
          created_at: member.created_at,
          updated_at: member.updated_at,
          display_name: member.profiles?.display_name || 'Unknown User',
          profile: member.profiles ? {
            id: member.profiles.id,
            display_name: member.profiles.display_name,
            email: member.profiles.email,
            role: member.profiles.role
          } : undefined,
          // Enhanced fields from new database columns with safe type conversion
          status: (member.status as 'active' | 'inactive' | 'on_leave' | 'suspended') || 'active',
          skills: parseSkillsArray(member.skills),
          emergency_contact: parseEmergencyContact(member.emergency_contact),
          notes: member.notes || '',
          last_activity: member.last_activity
        };
        return enhancedMember;
      });

      return {
        ...teamData,
        status: (teamData.status as 'active' | 'inactive' | 'suspended') || 'active',
        location: teamData.locations ? {
          id: teamData.locations.id,
          name: teamData.locations.name,
          city: teamData.locations.city,
          state: teamData.locations.state
        } : undefined,
        members: enhancedMembers.map(convertToSimpleTeamMember),
        member_count: enhancedMembers.length
      };
    } catch (error) {
      console.error('Error fetching team with enhanced members:', error);
      throw error;
    }
  }

  // Update team member with enhanced fields
  async updateTeamMember(memberId: string, updates: TeamMemberUpdate): Promise<void> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Map updates to database columns
      if (updates.role !== undefined) {
        updateData.role = updates.role;
      }
      if (updates.team_position !== undefined) {
        updateData.team_position = updates.team_position;
      }
      if (updates.status !== undefined) {
        updateData.status = updates.status;
      }
      if (updates.skills !== undefined) {
        updateData.skills = updates.skills;
      }
      if (updates.emergency_contact !== undefined) {
        updateData.emergency_contact = updates.emergency_contact;
      }
      if (updates.notes !== undefined) {
        updateData.notes = updates.notes;
      }

      const { error } = await supabase
        .from('team_members')
        .update(updateData)
        .eq('id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating team member:', error);
      throw error;
    }
  }

  // Remove team member
  async removeTeamMember(memberId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
  }

  // Add team member
  async addTeamMember(teamId: string, userId: string, role: 'MEMBER' | 'ADMIN' = 'MEMBER'): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role,
          permissions: role === 'ADMIN' ? {
            can_manage_members: true,
            can_edit_settings: true,
            can_view_reports: true
          } : {
            can_manage_members: false,
            can_edit_settings: false,
            can_view_reports: true
          },
          assignment_start_date: new Date().toISOString(),
          status: 'active'
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error adding team member:', error);
      throw error;
    }
  }

  // Update team settings
  async updateTeam(teamId: string, updates: Partial<SimpleTeam>): Promise<void> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Map updates to database columns
      if (updates.name !== undefined) {
        updateData.name = updates.name;
      }
      if (updates.description !== undefined) {
        updateData.description = updates.description;
      }
      if (updates.status !== undefined) {
        updateData.status = updates.status;
      }
      if (updates.performance_score !== undefined) {
        updateData.performance_score = updates.performance_score;
      }

      const { error } = await supabase
        .from('teams')
        .update(updateData)
        .eq('id', teamId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  }

  // Check if user can manage team
  async canUserManageTeam(teamId: string, userId: string): Promise<boolean> {
    try {
      // Check if user is SA/AD
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile?.role && ['SA', 'AD'].includes(profile.role)) {
        return true;
      }

      // Check if user is team admin
      const { data: membership } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      return membership?.role === 'ADMIN';
    } catch (error) {
      console.error('Error checking team management permissions:', error);
      return false;
    }
  }

  // Get available users to add to team
  async getAvailableUsers(teamId: string): Promise<Array<{
    id: string;
    display_name: string;
    email: string;
    role: string;
  }>> {
    try {
      // Get users who are not already in this team
      const { data: existingMembers } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId);

      const existingUserIds = existingMembers?.map(m => m.user_id) || [];

      let query = supabase
        .from('profiles')
        .select('id, display_name, email, role')
        .order('display_name');

      if (existingUserIds.length > 0) {
        query = query.not('id', 'in', `(${existingUserIds.join(',')})`);
      }

      const { data: users, error } = await query;

      if (error) throw error;

      return users || [];
    } catch (error) {
      console.error('Error fetching available users:', error);
      return [];
    }
  }
}

export const enhancedTeamService = new EnhancedTeamService();
