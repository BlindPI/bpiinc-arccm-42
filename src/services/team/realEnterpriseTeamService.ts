
import { supabase } from '@/integrations/supabase/client';
import type { EnhancedTeam, TeamAnalytics, TeamPerformanceMetrics } from '@/types/team-management';
import { safeJsonAccess, isRecord } from '@/utils/jsonUtils';

export class RealEnterpriseTeamService {
  static async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    try {
      const { data, error } = await supabase.rpc('get_enhanced_teams_data');
      
      if (error) throw error;
      
      return data.map((item: any) => item.team_data);
    } catch (error) {
      console.error('Error fetching enhanced teams:', error);
      throw error;
    }
  }

  static async getTeamAnalytics(): Promise<TeamAnalytics> {
    try {
      const { data, error } = await supabase.rpc('get_team_analytics_summary');
      
      if (error) throw error;
      
      const analyticsData = data || {};
      
      return {
        totalTeams: safeJsonAccess(analyticsData, 'total_teams', 0),
        totalMembers: safeJsonAccess(analyticsData, 'total_members', 0),
        averagePerformance: safeJsonAccess(analyticsData, 'performance_average', 0),
        averageCompliance: safeJsonAccess(analyticsData, 'compliance_score', 0),
        teamsByLocation: isRecord(safeJsonAccess(analyticsData, 'teamsByLocation'))
          ? safeJsonAccess(analyticsData, 'teamsByLocation', {})
          : {},
        performanceByTeamType: isRecord(safeJsonAccess(analyticsData, 'performanceByTeamType'))
          ? safeJsonAccess(analyticsData, 'performanceByTeamType', {})
          : {}
      };
    } catch (error) {
      console.error('Error fetching team analytics:', error);
      throw error;
    }
  }

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
      
      const metricsData = data || {};
      
      return {
        team_id: teamId,
        totalCertificates: safeJsonAccess(metricsData, 'certificates_issued', 0),
        totalCourses: safeJsonAccess(metricsData, 'courses_conducted', 0),
        averageSatisfaction: safeJsonAccess(metricsData, 'average_satisfaction_score', 0),
        complianceScore: safeJsonAccess(metricsData, 'compliance_score', 0),
        performanceTrend: 5.2,
        total_certificates: safeJsonAccess(metricsData, 'certificates_issued', 0),
        total_courses: safeJsonAccess(metricsData, 'courses_conducted', 0),
        avg_satisfaction: safeJsonAccess(metricsData, 'average_satisfaction_score', 0),
        compliance_score: safeJsonAccess(metricsData, 'compliance_score', 0),
        performance_trend: 5.2
      };
    } catch (error) {
      console.error('Error fetching team performance metrics:', error);
      throw error;
    }
  }

  static async createTeam(teamData: {
    name: string;
    description?: string;
    team_type: string;
    location_id?: string;
    provider_id?: string;
    created_by: string;
  }): Promise<EnhancedTeam> {
    try {
      // Convert provider_id to number if it exists
      const providerIdNumber = teamData.provider_id ? parseInt(teamData.provider_id, 10) : null;
      
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          description: teamData.description,
          team_type: teamData.team_type,
          location_id: teamData.location_id,
          provider_id: providerIdNumber,
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

      // Log team creation event
      await supabase.rpc('log_team_lifecycle_event', {
        p_team_id: data.id,
        p_event_type: 'team_created',
        p_event_data: teamData
      });

      return {
        ...data,
        provider_id: data.provider_id?.toString(),
        status: data.status as 'active' | 'inactive' | 'suspended',
        metadata: isRecord(data.metadata) ? data.metadata : {},
        monthly_targets: isRecord(data.monthly_targets) ? data.monthly_targets : {},
        current_metrics: isRecord(data.current_metrics) ? data.current_metrics : {},
        members: []
      };
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  static async addTeamMember(teamId: string, userId: string, role: 'MEMBER' | 'ADMIN'): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role: role,
          status: 'active',
          permissions: {}
        });

      if (error) throw error;

      await supabase.rpc('log_team_lifecycle_event', {
        p_team_id: teamId,
        p_event_type: 'member_added',
        p_event_data: { user_id: userId, role },
        p_affected_user_id: userId
      });
    } catch (error) {
      console.error('Error adding team member:', error);
      throw error;
    }
  }

  static async removeTeamMember(teamId: string, memberId: string): Promise<void> {
    try {
      const { data: member } = await supabase
        .from('team_members')
        .select('user_id, role')
        .eq('id', memberId)
        .single();

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      if (member) {
        await supabase.rpc('log_team_lifecycle_event', {
          p_team_id: teamId,
          p_event_type: 'member_removed',
          p_event_data: { member_id: memberId, role: member.role },
          p_affected_user_id: member.user_id
        });
      }
    } catch (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
  }

  static async updateTeamMemberRole(teamId: string, memberId: string, newRole: 'MEMBER' | 'ADMIN'): Promise<void> {
    try {
      const { data: currentMember } = await supabase
        .from('team_members')
        .select('user_id, role')
        .eq('id', memberId)
        .single();

      const { error } = await supabase
        .from('team_members')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;

      if (currentMember) {
        await supabase.rpc('log_team_lifecycle_event', {
          p_team_id: teamId,
          p_event_type: 'role_changed',
          p_event_data: { 
            member_id: memberId, 
            old_role: currentMember.role, 
            new_role: newRole 
          },
          p_affected_user_id: currentMember.user_id,
          p_old_values: { role: currentMember.role },
          p_new_values: { role: newRole }
        });
      }
    } catch (error) {
      console.error('Error updating team member role:', error);
      throw error;
    }
  }

  static async updateTeamSettings(teamId: string, updates: {
    name?: string;
    description?: string;
    team_type?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId);

      if (error) throw error;

      await supabase.rpc('log_team_lifecycle_event', {
        p_team_id: teamId,
        p_event_type: 'settings_updated',
        p_event_data: updates
      });
    } catch (error) {
      console.error('Error updating team settings:', error);
      throw error;
    }
  }

  static async getWorkflowStatistics(): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_workflow_statistics');
      
      if (error) throw error;
      
      return data || {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0,
        avgProcessingTime: '0 days',
        complianceRate: 0
      };
    } catch (error) {
      console.error('Error fetching workflow statistics:', error);
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

  static async checkUserCanManageTeam(teamId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('can_user_manage_team_enhanced', {
        p_team_id: teamId,
        p_user_id: userId
      });
      
      if (error) throw error;
      
      return data || false;
    } catch (error) {
      console.error('Error checking team management permissions:', error);
      return false;
    }
  }
}
