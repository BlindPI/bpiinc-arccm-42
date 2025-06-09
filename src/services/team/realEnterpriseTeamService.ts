import { supabase } from '@/integrations/supabase/client';
import { safeConvertTeamAnalytics } from '@/utils/typeGuards';

// Export the TeamMemberWithProfile interface to fix import errors
export interface TeamMemberWithProfile {
  id: string;
  team_id: string;
  user_id: string;
  role: 'MEMBER' | 'ADMIN';
  status: 'active' | 'inactive' | 'on_leave' | 'suspended';
  location_assignment?: string | null;
  assignment_start_date?: string | null;
  assignment_end_date?: string | null;
  team_position?: string | null;
  permissions: string[];
  created_at: string;
  updated_at: string;
  last_activity: string;
  joined_at: string;
  display_name: string;
  profiles: {
    id: string;
    display_name: string;
    email: string;
    role: string;
    created_at: string;
    updated_at: string;
    compliance_status?: boolean | null;
    last_training_date?: string | null;
    next_training_due?: string | null;
    performance_score?: number | null;
    training_hours?: number | null;
    certifications_count?: number | null;
    location_id?: string | null;
    department?: string | null;
    supervisor_id?: string | null;
    user_id?: string;
  };
}

export interface TeamAnalytics {
  totalTeams: number;
  totalMembers: number;
  averagePerformance: number;
  averageCompliance: number;
  teamsByLocation: Record<string, number>;
  performanceByTeamType: Record<string, number>;
}

export interface EnhancedTeam {
  id: string;
  name: string;
  description?: string;
  team_type: string;
  status: 'active' | 'inactive' | 'suspended';
  performance_score: number;
  location_id?: string;
  provider_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
  monthly_targets: Record<string, any>;
  current_metrics: Record<string, any>;
  location?: any;
  provider?: any;
  member_count?: number;
}

export class RealEnterpriseTeamService {
  static async getTeamMembers(teamId: string): Promise<TeamMemberWithProfile[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        profiles:user_id (
          id,
          display_name,
          email,
          role,
          organization,
          phone,
          job_title,
          created_at,
          updated_at,
          compliance_status,
          last_training_date,
          next_training_due,
          performance_score,
          training_hours,
          certifications_count,
          location_id,
          department,
          supervisor_id,
          user_id,
          status
        )
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform data to match expected interface with proper type safety
    return (data || []).map(member => ({
      id: member.id,
      team_id: member.team_id,
      user_id: member.user_id,
      role: member.role as 'MEMBER' | 'ADMIN',
      status: member.status as 'active' | 'inactive' | 'on_leave' | 'suspended',
      location_assignment: member.location_assignment,
      assignment_start_date: member.assignment_start_date,
      assignment_end_date: member.assignment_end_date,
      team_position: member.team_position,
      permissions: Array.isArray(member.permissions) ? 
                   member.permissions.map((p: any) => typeof p === 'string' ? p : String(p)) : 
                   (typeof member.permissions === 'string' ? [member.permissions] : []),
      created_at: member.created_at,
      updated_at: member.updated_at,
      last_activity: member.last_activity || member.updated_at || new Date().toISOString(),
      joined_at: member.created_at,
      display_name: member.profiles?.display_name || 'Unknown User',
      profiles: {
        id: member.profiles?.id || '',
        display_name: member.profiles?.display_name || 'Unknown User',
        email: member.profiles?.email || '',
        role: member.profiles?.role || '',
        created_at: member.profiles?.created_at || '',
        updated_at: member.profiles?.updated_at || '',
        compliance_status: member.profiles?.compliance_status,
        last_training_date: member.profiles?.last_training_date || null,
        next_training_due: member.profiles?.next_training_due || null,
        performance_score: member.profiles?.performance_score || null,
        training_hours: member.profiles?.training_hours || null,
        certifications_count: member.profiles?.certifications_count || null,
        location_id: member.profiles?.location_id || null,
        department: member.profiles?.department || null,
        supervisor_id: member.profiles?.supervisor_id || null,
        user_id: member.profiles?.user_id
      }
    }));
  }

  static async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    try {
      const { data, error } = await supabase.rpc('get_enhanced_teams_data');
      
      if (error) {
        console.error('Error fetching enhanced teams:', error);
        throw error;
      }

      return (data || []).map((teamData: any) => {
        const team = teamData.team_data;
        return {
          id: team.id,
          name: team.name,
          description: team.description,
          team_type: team.team_type,
          status: team.status,
          performance_score: team.performance_score || 0,
          location_id: team.location_id,
          provider_id: team.provider_id,
          created_by: team.created_by,
          created_at: team.created_at,
          updated_at: team.updated_at,
          metadata: team.metadata || {},
          monthly_targets: team.monthly_targets || {},
          current_metrics: team.current_metrics || {},
          location: team.location,
          provider: team.provider,
          member_count: team.member_count || 0
        };
      });
    } catch (error) {
      console.error('Error in getEnhancedTeams:', error);
      throw error;
    }
  }

  static async getTeamAnalytics(): Promise<TeamAnalytics> {
    try {
      const { data, error } = await supabase.rpc('get_team_analytics_summary');
      
      if (error) {
        console.error('Error fetching team analytics:', error);
        throw error;
      }

      return safeConvertTeamAnalytics(data);
    } catch (error) {
      console.error('Error in getTeamAnalytics:', error);
      throw error;
    }
  }

  static async updateMemberRole(memberId: string, newRole: 'MEMBER' | 'ADMIN'): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (error) throw error;
  }

  static async removeMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  }

  static async addTeamMember(teamId: string, userId: string, role: 'MEMBER' | 'ADMIN' = 'MEMBER'): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role,
        status: 'active',
        created_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  static async removeTeamMember(teamId: string, memberId: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId)
      .eq('team_id', teamId);

    if (error) throw error;
  }

  static async updateTeamMemberRole(teamId: string, memberId: string, newRole: 'MEMBER' | 'ADMIN'): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .update({ role: newRole })
      .eq('id', memberId)
      .eq('team_id', teamId);

    if (error) throw error;
  }
}
