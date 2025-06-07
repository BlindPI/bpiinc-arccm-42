
import { supabase } from '@/integrations/supabase/client';
import type { SimpleTeam, SimpleTeamMember } from '@/types/simplified-team-management';

export interface EnhancedTeamMember extends SimpleTeamMember {
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  skills: string[];
  emergency_contact: Record<string, any>;
  notes: string;
  last_activity: string;
  assignments?: TeamMemberAssignment[];
  status_history?: TeamMemberStatusHistory[];
}

export interface TeamMemberAssignment {
  id: string;
  location_id: string;
  assignment_type: 'primary' | 'secondary' | 'temporary';
  start_date: string;
  end_date?: string;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  location_name?: string;
}

export interface TeamMemberStatusHistory {
  id: string;
  old_status?: string;
  new_status: string;
  old_role?: string;
  new_role?: string;
  reason?: string;
  effective_date: string;
  changed_by?: string;
}

export interface TeamPerformanceMetric {
  id: string;
  team_id: string;
  metric_type: string;
  metric_value: number;
  period_start: string;
  period_end: string;
  recorded_by?: string;
  recorded_date: string;
  metadata: Record<string, any>;
}

export interface TeamWorkflow {
  id: string;
  team_id: string;
  workflow_type: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requested_by?: string;
  approved_by?: string;
  request_data: Record<string, any>;
  approval_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface TeamMemberUpdate {
  role?: 'MEMBER' | 'ADMIN';
  team_position?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'pending';
  skills?: string[];
  emergency_contact?: Record<string, any>;
  notes?: string;
}

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
        const enhancedMembers = await this.getEnhancedMembersForTeam(team.id);

        teams.push({
          ...team,
          status: (team.status as 'active' | 'inactive' | 'suspended') || 'active',
          location: team.locations ? {
            id: team.locations.id,
            name: team.locations.name,
            city: team.locations.city,
            state: team.locations.state
          } : undefined,
          members: enhancedMembers,
          member_count: enhancedMembers.length
        });
      }
      
      return teams;
    } catch (error) {
      console.error('Error fetching teams with enhanced members:', error);
      throw error;
    }
  }

  // Get enhanced members for a specific team
  async getEnhancedMembersForTeam(teamId: string): Promise<EnhancedTeamMember[]> {
    try {
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

      const enhancedMembers: EnhancedTeamMember[] = [];

      for (const member of membersData || []) {
        // Get assignments for this member
        const assignments = await this.getMemberAssignments(member.id);
        
        // Get status history for this member
        const statusHistory = await this.getMemberStatusHistory(member.id);

        enhancedMembers.push({
          id: member.id,
          team_id: member.team_id,
          user_id: member.user_id,
          role: member.role as 'MEMBER' | 'ADMIN',
          permissions: this.getTeamPermissions(member.role as 'MEMBER' | 'ADMIN'),
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
          status: member.status || 'active',
          skills: Array.isArray(member.skills) ? member.skills : [],
          emergency_contact: member.emergency_contact || {},
          notes: member.notes || '',
          last_activity: member.last_activity || member.updated_at,
          assignments,
          status_history: statusHistory
        });
      }

      return enhancedMembers;
    } catch (error) {
      console.error('Error fetching enhanced members for team:', error);
      return [];
    }
  }

  // Get member assignments
  async getMemberAssignments(memberId: string): Promise<TeamMemberAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('team_member_assignments')
        .select(`
          id,
          location_id,
          assignment_type,
          start_date,
          end_date,
          status,
          locations(name)
        `)
        .eq('team_member_id', memberId)
        .eq('status', 'active');

      if (error) throw error;

      return (data || []).map(assignment => ({
        id: assignment.id,
        location_id: assignment.location_id,
        assignment_type: assignment.assignment_type as 'primary' | 'secondary' | 'temporary',
        start_date: assignment.start_date,
        end_date: assignment.end_date,
        status: assignment.status as 'active' | 'pending' | 'completed' | 'cancelled',
        location_name: assignment.locations?.name
      }));
    } catch (error) {
      console.error('Error fetching member assignments:', error);
      return [];
    }
  }

  // Get member status history
  async getMemberStatusHistory(memberId: string): Promise<TeamMemberStatusHistory[]> {
    try {
      const { data, error } = await supabase
        .from('team_member_status_history')
        .select('*')
        .eq('team_member_id', memberId)
        .order('effective_date', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching member status history:', error);
      return [];
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
        updateData.permissions = this.getTeamPermissions(updates.role);
      }
      if (updates.team_position !== undefined) updateData.team_position = updates.team_position;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.skills !== undefined) updateData.skills = JSON.stringify(updates.skills);
      if (updates.emergency_contact !== undefined) updateData.emergency_contact = updates.emergency_contact;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

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

  // Record team performance metric
  async recordPerformanceMetric(metric: Omit<TeamPerformanceMetric, 'id' | 'recorded_by' | 'recorded_date'>): Promise<void> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User must be authenticated to record performance');
      }

      const { error } = await supabase
        .from('team_performance_metrics')
        .insert({
          ...metric,
          recorded_by: user.id,
          recorded_date: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording performance metric:', error);
      throw error;
    }
  }

  // Get team performance metrics
  async getTeamPerformanceMetrics(teamId: string, limit: number = 10): Promise<TeamPerformanceMetric[]> {
    try {
      const { data, error } = await supabase
        .from('team_performance_metrics')
        .select('*')
        .eq('team_id', teamId)
        .order('recorded_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching team performance metrics:', error);
      return [];
    }
  }

  // Create team workflow
  async createTeamWorkflow(workflow: Omit<TeamWorkflow, 'id' | 'requested_by' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User must be authenticated to create workflow');
      }

      const { data, error } = await supabase
        .from('team_workflows')
        .insert({
          ...workflow,
          requested_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating team workflow:', error);
      throw error;
    }
  }

  // Get team workflows
  async getTeamWorkflows(teamId: string): Promise<TeamWorkflow[]> {
    try {
      const { data, error } = await supabase
        .from('team_workflows')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching team workflows:', error);
      return [];
    }
  }

  // Assign member to location
  async assignMemberToLocation(
    memberId: string, 
    locationId: string, 
    assignmentType: 'primary' | 'secondary' | 'temporary' = 'primary'
  ): Promise<void> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User must be authenticated to assign members');
      }

      const { error } = await supabase
        .from('team_member_assignments')
        .insert({
          team_member_id: memberId,
          location_id: locationId,
          assignment_type: assignmentType,
          assigned_by: user.id,
          start_date: new Date().toISOString(),
          status: 'active'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error assigning member to location:', error);
      throw error;
    }
  }

  private getTeamPermissions(role: 'MEMBER' | 'ADMIN') {
    const basePermissions = {
      can_manage_members: false,
      can_edit_settings: false,
      can_view_reports: true
    };

    if (role === 'ADMIN') {
      return {
        can_manage_members: true,
        can_edit_settings: true,
        can_view_reports: true
      };
    }

    return basePermissions;
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

      const enhancedMembers = await this.getEnhancedMembersForTeam(teamId);

      return {
        ...teamData,
        status: (teamData.status as 'active' | 'inactive' | 'suspended') || 'active',
        location: teamData.locations ? {
          id: teamData.locations.id,
          name: teamData.locations.name,
          city: teamData.locations.city,
          state: teamData.locations.state
        } : undefined,
        members: enhancedMembers,
        member_count: enhancedMembers.length
      };
    } catch (error) {
      console.error('Error fetching team with enhanced members:', error);
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
      const permissions = this.getTeamPermissions(role);
      
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role,
          permissions: permissions as any,
          assignment_start_date: new Date().toISOString(),
          status: 'active',
          skills: [],
          emergency_contact: {},
          notes: '',
          last_activity: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error adding team member:', error);
      throw error;
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
