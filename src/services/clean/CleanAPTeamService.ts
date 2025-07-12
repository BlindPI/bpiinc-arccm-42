import { supabase } from '@/integrations/supabase/client';

export interface CleanTeamData {
  id: string;
  name: string;
  description: string;
  status: string;
  member_count: number;
  performance_score: number;
  location_name?: string;
  created_at: string;
}

export interface CleanTeamMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  display_name: string;
  email: string;
  assignment_start_date: string;
}

export class CleanAPTeamService {
  static async getTeams(): Promise<CleanTeamData[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          description,
          status,
          performance_score,
          created_at,
          locations!location_id(name)
        `)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;

      return (data || []).map(team => ({
        id: team.id,
        name: team.name,
        description: team.description || '',
        status: team.status,
        member_count: 0, // Will be populated separately
        performance_score: team.performance_score || 0,
        location_name: (team.locations as any)?.name || 'No Location',
        created_at: team.created_at
      }));
    } catch (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
  }

  static async getTeamMembers(teamId: string): Promise<CleanTeamMember[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          id,
          user_id,
          role,
          status,
          assignment_start_date,
          profiles!user_id(
            display_name,
            email
          )
        `)
        .eq('team_id', teamId)
        .eq('status', 'active');

      if (error) throw error;

      return (data || []).map(member => ({
        id: member.id,
        user_id: member.user_id,
        role: member.role,
        status: member.status,
        display_name: (member.profiles as any)?.display_name || 'Unknown',
        email: (member.profiles as any)?.email || '',
        assignment_start_date: member.assignment_start_date || ''
      }));
    } catch (error) {
      console.error('Error fetching team members:', error);
      return [];
    }
  }

  static async getAPUserTeams(userId: string): Promise<CleanTeamData[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          teams!inner(
            id,
            name,
            description,
            status,
            performance_score,
            created_at,
            locations!location_id(name)
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) throw error;

      return (data || []).map(item => ({
        id: (item.teams as any).id,
        name: (item.teams as any).name,
        description: (item.teams as any).description || '',
        status: (item.teams as any).status,
        member_count: 0,
        performance_score: (item.teams as any).performance_score || 0,
        location_name: (item.teams as any).locations?.name || 'No Location',
        created_at: (item.teams as any).created_at
      }));
    } catch (error) {
      console.error('Error fetching AP user teams:', error);
      return [];
    }
  }

  static async getAPUserDashboard(userId: string): Promise<{
    totalTeams: number;
    totalMembers: number;
    averagePerformance: number;
    recentActivity: any[];
  }> {
    try {
      const teams = await this.getAPUserTeams(userId);
      
      return {
        totalTeams: teams.length,
        totalMembers: teams.reduce((sum, team) => sum + team.member_count, 0),
        averagePerformance: teams.length > 0 
          ? Math.round(teams.reduce((sum, team) => sum + team.performance_score, 0) / teams.length)
          : 0,
        recentActivity: []
      };
    } catch (error) {
      console.error('Error fetching AP user dashboard:', error);
      return {
        totalTeams: 0,
        totalMembers: 0,
        averagePerformance: 0,
        recentActivity: []
      };
    }
  }

  static async addTeamMember(teamId: string, userId: string, role: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role: role,
          status: 'active',
          assignment_start_date: new Date().toISOString().split('T')[0]
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding team member:', error);
      return false;
    }
  }

  static async removeTeamMember(memberId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'inactive' })
        .eq('id', memberId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing team member:', error);
      return false;
    }
  }

  static async createTeam(teamData: {
    name: string;
    description?: string;
    location_id?: string;
  }): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          description: teamData.description || '',
          location_id: teamData.location_id,
          status: 'active',
          performance_score: 0,
          team_type: 'provider_team'
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating team:', error);
      return null;
    }
  }
}