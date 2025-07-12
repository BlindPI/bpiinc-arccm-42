
import { supabase } from '@/integrations/supabase/client';
import type { DatabaseUserRole } from '@/types/database-roles';

export interface RealTeam {
  id: string;
  name: string;
  description?: string;
  team_type: string;
  status: 'active' | 'inactive' | 'suspended';
  performance_score: number;
  location_id?: string;
  provider_id?: string; // Changed to string to match database schema
  created_by?: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
  monthly_targets: Record<string, any>;
  current_metrics: Record<string, any>;
  location?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
  };
  provider?: {
    id: string;
    name: string;
    provider_type: string;
    status: string;
  };
  member_count: number;
}

export interface RealTeamMember {
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

export interface TeamAnalytics {
  totalTeams: number;
  totalMembers: number;
  averagePerformance: number;
  averageCompliance: number;
  teamsByLocation: Record<string, number>;
  performanceByTeamType: Record<string, number>;
}

export interface TeamPerformanceMetrics {
  team_id: string;
  certificates_issued: number;
  courses_conducted: number;
  average_satisfaction_score: number;
  compliance_score: number;
  member_retention_rate: number;
  training_hours_delivered: number;
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

export class RealTeamService {
  // Get all teams using the real database function
  static async getEnhancedTeams(): Promise<RealTeam[]> {
    try {
      const { data, error } = await supabase.rpc('get_enhanced_teams_data');
      
      if (error) {
        console.error('Error fetching teams:', error);
        throw error;
      }
      
      return (data || []).map((item: any) => {
        const teamData = safeParseJsonResponse(item.team_data);
        return {
          ...teamData,
          metadata: safeParseJsonResponse(teamData.metadata),
          monthly_targets: safeParseJsonResponse(teamData.monthly_targets),
          current_metrics: safeParseJsonResponse(teamData.current_metrics),
          member_count: teamData.member_count || 0
        } as RealTeam;
      });
    } catch (error) {
      console.error('Failed to fetch enhanced teams:', error);
      throw error;
    }
  }

  // Get team analytics using real database function
  static async getTeamAnalytics(): Promise<TeamAnalytics> {
    try {
      const { data, error } = await supabase.rpc('get_team_analytics_summary');
      
      if (error) {
        console.error('Error fetching analytics:', error);
        throw error;
      }
      
      const analyticsData = safeParseJsonResponse(data);
      
      return {
        totalTeams: analyticsData.total_teams || 0,
        totalMembers: analyticsData.total_members || 0,
        averagePerformance: analyticsData.performance_average || 0,
        averageCompliance: analyticsData.compliance_score || 0,
        teamsByLocation: analyticsData.teamsByLocation || {},
        performanceByTeamType: analyticsData.performanceByTeamType || {}
      };
    } catch (error) {
      console.error('Failed to fetch team analytics:', error);
      throw error;
    }
  }

  // Create team with real database integration
  static async createTeam(teamData: {
    name: string;
    description?: string;
    team_type: string;
    location_id?: string;
    provider_id?: string; // Changed to string
    created_by: string;
  }): Promise<RealTeam> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          description: teamData.description,
          team_type: teamData.team_type,
          location_id: teamData.location_id,
          provider_id: teamData.provider_id?.toString(),
          created_by: teamData.created_by,
          status: 'active',
          performance_score: 0,
          metadata: {},
          monthly_targets: {},
          current_metrics: {}
        })
        .select()
        .single();

      if (error) throw error;

      // Log team creation
      await supabase.rpc('log_team_lifecycle_event', {
        p_team_id: data.id,
        p_event_type: 'team_created',
        p_event_data: teamData
      });

      return {
        ...data,
        metadata: safeParseJsonResponse(data.metadata),
        monthly_targets: safeParseJsonResponse(data.monthly_targets),
        current_metrics: safeParseJsonResponse(data.current_metrics),
        member_count: 0
      } as RealTeam;
    } catch (error) {
      console.error('Failed to create team:', error);
      throw error;
    }
  }

  // Get team members using real database
  static async getTeamMembers(teamId: string): Promise<RealTeamMember[]> {
    try {
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

      return (data || []) as RealTeamMember[];
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      throw error;
    }
  }

  // Add team member with real database integration
  static async addTeamMember(
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

      // Log member addition
      await supabase.rpc('log_team_lifecycle_event', {
        p_team_id: teamId,
        p_event_type: 'member_added',
        p_event_data: { user_id: userId, role },
        p_affected_user_id: userId
      });
    } catch (error) {
      console.error('Failed to add team member:', error);
      throw error;
    }
  }

  // Remove team member
  static async removeTeamMember(teamId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;

      // Log member removal
      await supabase.rpc('log_team_lifecycle_event', {
        p_team_id: teamId,
        p_event_type: 'member_removed',
        p_event_data: { user_id: userId },
        p_affected_user_id: userId
      });
    } catch (error) {
      console.error('Failed to remove team member:', error);
      throw error;
    }
  }

  // Update team member role
  static async updateTeamMemberRole(
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

      // Log role change
      await supabase.rpc('log_team_lifecycle_event', {
        p_team_id: teamId,
        p_event_type: 'role_changed',
        p_event_data: { user_id: userId, new_role: newRole },
        p_affected_user_id: userId
      });
    } catch (error) {
      console.error('Failed to update member role:', error);
      throw error;
    }
  }

  // Get team performance metrics using real database function
  static async getTeamPerformanceMetrics(teamId: string): Promise<TeamPerformanceMetrics> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase.rpc('calculate_team_performance_metrics', {
        p_team_id: teamId,
        p_start_date: thirtyDaysAgo.toISOString().split('T')[0],
        p_end_date: new Date().toISOString().split('T')[0]
      });
      
      if (error) throw error;
      
      const metricsData = safeParseJsonResponse(data);
      
      return {
        team_id: teamId,
        certificates_issued: metricsData.certificates_issued || 0,
        courses_conducted: metricsData.courses_conducted || 0,
        average_satisfaction_score: metricsData.average_satisfaction_score || 0,
        compliance_score: metricsData.compliance_score || 0,
        member_retention_rate: metricsData.member_retention_rate || 0,
        training_hours_delivered: metricsData.training_hours_delivered || 0
      };
    } catch (error) {
      console.error('Failed to fetch team performance metrics:', error);
      throw error;
    }
  }

  // Check if user can manage team using real database function
  static async canUserManageTeam(teamId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('can_user_manage_team_enhanced', {
        p_team_id: teamId,
        p_user_id: userId
      });
      
      if (error) throw error;
      
      return data || false;
    } catch (error) {
      console.error('Failed to check team management permissions:', error);
      return false;
    }
  }

  // Get workflow statistics using real database function
  static async getWorkflowStatistics() {
    try {
      const { data, error } = await supabase.rpc('get_workflow_statistics');
      
      if (error) throw error;
      
      const statsData = safeParseJsonResponse(data);
      
      return {
        pending: statsData.pending || 0,
        approved: statsData.approved || 0,
        rejected: statsData.rejected || 0,
        total: statsData.total || 0,
        avgProcessingTime: statsData.avgProcessingTime || '0 days',
        complianceRate: statsData.complianceRate || 0
      };
    } catch (error) {
      console.error('Failed to fetch workflow statistics:', error);
      return {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0,
        avgProcessingTime: '0 days',
        complianceRate: 0
      };
    }
  }
}
