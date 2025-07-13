import { supabase } from '@/integrations/supabase/client';
import { safeJsonParse } from '@/utils/jsonUtils';

export interface TeamMemberWithProfile {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  last_activity: string;
  assignment_start_date?: string;
  assignment_end_date?: string;
  team_position?: string;
  permissions: string[];
  profiles: {
    id: string;
    display_name: string;
    email: string;
    role: string;
    organization?: string;
    phone?: string;
    job_title?: string;
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

// Type guard for valid team status
function isValidTeamStatus(status: string): status is 'active' | 'inactive' | 'suspended' {
  return ['active', 'inactive', 'suspended'].includes(status);
}

// Helper function to safely parse JSON responses
function safeParseJsonResponse(data: any): any {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data || {};
}

// Helper function to safely parse analytics data with fallbacks
function parseAnalyticsData(data: any): {
  total_teams: number;
  total_members: number;
  performance_average: number;
  compliance_score: number;
  teamsByLocation: Record<string, number>;
  performanceByTeamType: Record<string, number>;
} {
  if (!data) {
    return {
      total_teams: 0,
      total_members: 0,
      performance_average: 0,
      compliance_score: 0,
      teamsByLocation: {},
      performanceByTeamType: {}
    };
  }

  const parsed = typeof data === 'string' ? safeJsonParse(data, {}) : data;
  
  return {
    total_teams: parsed.total_teams || 0,
    total_members: parsed.total_members || 0,
    performance_average: parsed.performance_average || 0,
    compliance_score: parsed.compliance_score || 0,
    teamsByLocation: parsed.teamsByLocation || {},
    performanceByTeamType: parsed.performanceByTeamType || {}
  };
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
          job_title
        )
      `)
      .eq('team_id', teamId)
      .order('assignment_start_date', { ascending: false });

    if (error) throw error;
    
    // Map the data to ensure all required properties are present
    return (data || []).map((member: any) => ({
      ...member,
      joined_at: member.assignment_start_date || member.created_at || new Date().toISOString(),
      last_activity: member.last_activity || member.updated_at || new Date().toISOString(),
      permissions: Array.isArray(member.permissions) ? member.permissions : []
    })) as TeamMemberWithProfile[];
  }

  static async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    const { data, error } = await supabase.rpc('get_enhanced_teams_data');
    if (error) throw error;
    
    const teams = (data || []).map((row: any) => {
      const teamData = safeParseJsonResponse(row.team_data);
      return {
        ...teamData,
        status: isValidTeamStatus(teamData.status) ? teamData.status : 'active',
        metadata: safeParseJsonResponse(teamData.metadata),
        monthly_targets: safeParseJsonResponse(teamData.monthly_targets),
        current_metrics: safeParseJsonResponse(teamData.current_metrics),
        member_count: teamData.member_count || 0,
        provider: null // Will be populated from provider_team_assignments
      };
    });

    // Now follow the working pattern - populate provider assignments for each team
    console.log('DEBUG: Fetching provider assignments for teams:', teams.length);
    
    for (const team of teams) {
      try {
        console.log(`DEBUG: Fetching provider assignment for team ${team.id} (${team.name})`);
        
        // Query provider_team_assignments table (the working pattern)
        const { data: assignments, error: assignmentError } = await supabase
          .from('provider_team_assignments')
          .select(`
            assignment_role,
            status,
            authorized_providers!inner(
              id,
              name,
              provider_type,
              status
            )
          `)
          .eq('team_id', team.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);

        console.log(`DEBUG: Provider assignment query for team ${team.id}:`, { assignments, assignmentError });

        if (!assignmentError && assignments && assignments.length > 0) {
          const assignment = assignments[0];
          const provider = assignment.authorized_providers;
          
          team.provider = {
            id: provider.id,
            name: provider.name,
            provider_name: provider.name,
            provider_type: provider.provider_type,
            assignment_role: assignment.assignment_role,
            assignment_status: assignment.status
          };
          
          console.log(`DEBUG: Provider assigned to team ${team.id}:`, team.provider);
        } else {
          console.log(`DEBUG: No provider assignment found for team ${team.id}`);
        }
      } catch (error) {
        console.error(`Error fetching provider assignment for team ${team.id}:`, error);
        // Continue without provider data rather than failing
      }
    }
    
    return teams;
  }

  static async getTeamAnalytics(): Promise<TeamAnalytics> {
    try {
      const { data, error } = await supabase.rpc('get_team_analytics_summary');
      if (error) throw error;
      
      const analyticsData = parseAnalyticsData(data);
      
      return {
        totalTeams: analyticsData.total_teams,
        totalMembers: analyticsData.total_members,
        averagePerformance: analyticsData.performance_average,
        averageCompliance: analyticsData.compliance_score,
        teamsByLocation: analyticsData.teamsByLocation,
        performanceByTeamType: analyticsData.performanceByTeamType
      };
    } catch (error) {
      console.error('Error fetching team analytics:', error);
      return {
        totalTeams: 0,
        totalMembers: 0,
        averagePerformance: 0,
        averageCompliance: 0,
        teamsByLocation: {},
        performanceByTeamType: {}
      };
    }
  }

  static async updateMemberRole(memberId: string, newRole: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId);

    if (error) throw error;
  }

  static async updateMemberStatus(memberId: string, newStatus: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
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

  static async addMember(teamId: string, userId: string, role: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role,
        status: 'active',
        assignment_start_date: new Date().toISOString()
      });

    if (error) throw error;
  }

  // Maintain backward compatibility with existing method names
  static async addTeamMember(teamId: string, userId: string, role: 'MEMBER' | 'ADMIN'): Promise<void> {
    return this.addMember(teamId, userId, role);
  }

  static async removeTeamMember(teamId: string, memberId: string): Promise<void> {
    return this.removeMember(memberId);
  }

  static async updateTeamMemberRole(teamId: string, memberId: string, newRole: 'MEMBER' | 'ADMIN'): Promise<void> {
    return this.updateMemberRole(memberId, newRole);
  }

  static async bulkUpdateMembers(memberIds: string[], updates: Partial<TeamMemberWithProfile>): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .in('id', memberIds);

    if (error) throw error;
  }

  static async getTeamPerformanceMetrics(teamId: string): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();
    
    const { data, error } = await supabase.rpc('calculate_team_performance_metrics', {
      p_team_id: teamId,
      p_start_date: startDate.toISOString().split('T')[0],
      p_end_date: endDate.toISOString().split('T')[0]
    });

    if (error) throw error;
    return data;
  }

  static async getComplianceMetrics(): Promise<any> {
    const { data, error } = await supabase.rpc('get_compliance_metrics');
    if (error) throw error;
    return data;
  }

  static async getExecutiveMetrics(): Promise<any> {
    const { data, error } = await supabase.rpc('get_executive_dashboard_metrics');
    if (error) throw error;
    return data;
  }

  static async getInstructorPerformance(instructorId: string): Promise<any> {
    const { data, error } = await supabase.rpc('get_instructor_performance_metrics', {
      p_instructor_id: instructorId
    });
    if (error) throw error;
    return data;
  }
}
