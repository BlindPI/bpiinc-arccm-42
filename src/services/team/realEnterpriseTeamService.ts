
import { supabase } from '@/integrations/supabase/client';
import { safeConvertTeamAnalytics } from '@/utils/typeGuards';

export interface TeamMemberWithProfile {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  last_activity: string;
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
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform data to match expected interface
    return (data || []).map(member => ({
      id: member.id,
      team_id: member.team_id,
      user_id: member.user_id,
      role: member.role,
      status: member.status,
      joined_at: member.created_at, // Use created_at as joined_at
      last_activity: member.last_activity || member.updated_at,
      permissions: member.permissions || [],
      profiles: {
        id: member.profiles?.id || '',
        display_name: member.profiles?.display_name || 'Unknown User',
        email: member.profiles?.email || '',
        role: member.profiles?.role || '',
        organization: member.profiles?.organization,
        phone: member.profiles?.phone,
        job_title: member.profiles?.job_title
      }
    }));
  }

  static async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    const { data, error } = await supabase.rpc('get_enhanced_teams_data');
    if (error) throw error;
    
    return (data || []).map((row: any) => ({
      ...row.team_data,
      status: row.team_data.status || 'active' // Ensure status is properly typed
    }));
  }

  static async getTeamAnalytics(): Promise<TeamAnalytics> {
    const { data, error } = await supabase.rpc('get_team_analytics_summary');
    if (error) throw error;
    
    // Use type guard for safe conversion
    const safeData = safeConvertTeamAnalytics(data);
    
    return {
      totalTeams: safeData.total_teams,
      totalMembers: safeData.total_members,
      averagePerformance: safeData.performance_average,
      averageCompliance: safeData.compliance_score,
      teamsByLocation: safeData.cross_location_teams ? { cross_location: safeData.cross_location_teams } : {},
      performanceByTeamType: {}
    };
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
        created_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  // Alias methods for compatibility with existing components
  static async addTeamMember(teamId: string, userId: string, role: string): Promise<void> {
    return this.addMember(teamId, userId, role);
  }

  static async removeTeamMember(teamId: string, memberId: string): Promise<void> {
    return this.removeMember(memberId);
  }

  static async updateTeamMemberRole(teamId: string, memberId: string, newRole: string): Promise<void> {
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
