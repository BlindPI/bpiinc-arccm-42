import { supabase } from '@/integrations/supabase/client';
import { AuthorizedProviderService } from './authorizedProviderService';
import type { Provider } from '@/types/team-management';

// Enhanced types for provider team management
export interface ProviderTeamAssignment {
  id: string;
  provider_id: string;
  team_id: string;
  team_name: string;
  assignment_role: 'primary_trainer' | 'support_trainer' | 'supervisor' | 'coordinator';
  oversight_level: 'monitor' | 'manage' | 'admin';
  assignment_type: 'ongoing' | 'project_based' | 'temporary';
  start_date: string;
  end_date?: string;
  status: 'active' | 'inactive' | 'suspended';
  team_status: string;
  location_name?: string;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProviderTrainingCapabilities {
  id: string;
  provider_id: string;
  course_category: string;
  certification_types: string[];
  max_team_size: number;
  location_restrictions: string[];
  equipment_requirements: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProviderTeamPerformance {
  id: string;
  provider_id: string;
  team_id: string;
  measurement_period: string;
  courses_delivered: number;
  certifications_issued: number;
  average_satisfaction_score: number;
  completion_rate: number;
  compliance_score: number;
  created_at: string;
}

export interface ProviderTeamPerformanceData {
  courses_delivered: number;
  certifications_issued: number;
  average_satisfaction_score: number;
  completion_rate: number;
  compliance_score: number;
}

export class EnhancedProviderService extends AuthorizedProviderService {
  
  // Provider team assignment methods
  async assignProviderToTeam(
    providerId: string,
    teamId: string,
    assignmentRole: 'primary_trainer' | 'support_trainer' | 'supervisor' | 'coordinator',
    oversightLevel: 'monitor' | 'manage' | 'admin',
    assignmentType: 'ongoing' | 'project_based' | 'temporary' = 'ongoing',
    endDate?: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('assign_provider_to_team' as any, {
        p_provider_id: providerId as any,
        p_team_id: teamId as any,
        p_assignment_role: assignmentRole,
        p_oversight_level: oversightLevel,
        p_assignment_type: assignmentType,
        p_end_date: endDate || null,
        p_assigned_by: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error assigning provider to team:', error);
      throw error;
    }
  }

  async getProviderTeamAssignments(providerId: string): Promise<ProviderTeamAssignment[]> {
    try {
      const { data, error } = await supabase.rpc('get_provider_team_assignments' as any, {
        p_provider_id: providerId as any
      });

      if (error) throw error;

      return (data || []).map((assignment: any) => ({
        id: assignment.assignment_id,
        provider_id: providerId,
        team_id: assignment.team_id,
        team_name: assignment.team_name,
        assignment_role: assignment.assignment_role,
        oversight_level: assignment.oversight_level,
        assignment_type: assignment.assignment_type,
        start_date: assignment.start_date,
        end_date: assignment.end_date,
        status: assignment.status,
        team_status: assignment.team_status,
        location_name: assignment.location_name,
        member_count: assignment.member_count,
        created_at: assignment.created_at || new Date().toISOString(),
        updated_at: assignment.updated_at || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error fetching provider team assignments:', error);
      return [];
    }
  }

  async updateTeamAssignment(
    assignmentId: string, 
    updates: Partial<ProviderTeamAssignment>
  ): Promise<void> {
    try {
      const cleanUpdates: any = {
        updated_at: new Date().toISOString()
      };

      // Only include valid database fields
      if (updates.assignment_role) cleanUpdates.assignment_role = updates.assignment_role;
      if (updates.oversight_level) cleanUpdates.oversight_level = updates.oversight_level;
      if (updates.assignment_type) cleanUpdates.assignment_type = updates.assignment_type;
      if (updates.end_date) cleanUpdates.end_date = updates.end_date;
      if (updates.status) cleanUpdates.status = updates.status;

      const { error } = await supabase
        .from('provider_team_assignments' as any)
        .update(cleanUpdates)
        .eq('id', assignmentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating team assignment:', error);
      throw error;
    }
  }

  async removeProviderFromTeam(providerId: string, teamId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('provider_team_assignments' as any)
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('provider_id', providerId)
        .eq('team_id', teamId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing provider from team:', error);
      throw error;
    }
  }

  // Provider capabilities management
  async updateProviderCapabilities(
    providerId: string, 
    capabilities: Omit<ProviderTrainingCapabilities, 'id' | 'provider_id' | 'created_at' | 'updated_at'>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('provider_training_capabilities' as any)
        .upsert({
          provider_id: providerId,
          course_category: capabilities.course_category,
          certification_types: capabilities.certification_types,
          max_team_size: capabilities.max_team_size,
          location_restrictions: capabilities.location_restrictions,
          equipment_requirements: capabilities.equipment_requirements,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating provider capabilities:', error);
      throw error;
    }
  }

  async getProviderCapabilities(providerId: string): Promise<ProviderTrainingCapabilities[]> {
    try {
      const { data, error } = await supabase
        .from('provider_training_capabilities' as any)
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((capability: any) => ({
        id: capability.id,
        provider_id: capability.provider_id,
        course_category: capability.course_category,
        certification_types: capability.certification_types || [],
        max_team_size: capability.max_team_size,
        location_restrictions: capability.location_restrictions || [],
        equipment_requirements: capability.equipment_requirements || {},
        created_at: capability.created_at,
        updated_at: capability.updated_at
      }));
    } catch (error) {
      console.error('Error fetching provider capabilities:', error);
      return [];
    }
  }

  // Provider team performance
  async recordTeamPerformance(
    providerId: string,
    teamId: string,
    performanceData: ProviderTeamPerformanceData,
    measurementPeriod?: string
  ): Promise<void> {
    try {
      const period = measurementPeriod || new Date().toISOString().slice(0, 7) + '-01'; // First day of current month

      const { data, error } = await supabase.rpc('record_provider_team_performance' as any, {
        p_provider_id: providerId as any,
        p_team_id: teamId as any,
        p_measurement_period: period,
        p_courses_delivered: performanceData.courses_delivered,
        p_certifications_issued: performanceData.certifications_issued,
        p_average_satisfaction_score: performanceData.average_satisfaction_score,
        p_completion_rate: performanceData.completion_rate,
        p_compliance_score: performanceData.compliance_score
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording team performance:', error);
      throw error;
    }
  }

  async getProviderTeamPerformance(
    providerId: string,
    teamId?: string,
    period?: string
  ): Promise<ProviderTeamPerformance[]> {
    try {
      let query = supabase
        .from('provider_team_performance' as any)
        .select('*')
        .eq('provider_id', providerId);

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      if (period) {
        query = query.eq('measurement_period', period);
      }

      query = query.order('measurement_period', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((perf: any) => ({
        id: perf.id,
        provider_id: perf.provider_id,
        team_id: perf.team_id,
        measurement_period: perf.measurement_period,
        courses_delivered: perf.courses_delivered,
        certifications_issued: perf.certifications_issued,
        average_satisfaction_score: perf.average_satisfaction_score,
        completion_rate: perf.completion_rate,
        compliance_score: perf.compliance_score,
        created_at: perf.created_at
      }));
    } catch (error) {
      console.error('Error fetching provider team performance:', error);
      return [];
    }
  }

  // Enhanced analytics for provider team management
  async getProviderTeamAnalytics(providerId: string): Promise<{
    totalTeams: number;
    activeAssignments: number;
    averagePerformance: number;
    totalCertificationsIssued: number;
    totalCoursesDelivered: number;
    performanceTrend: number;
  }> {
    try {
      // Get team assignments count
      const { data: assignments, error: assignmentsError } = await supabase
        .from('provider_team_assignments' as any)
        .select('id, status')
        .eq('provider_id', providerId);

      if (assignmentsError) throw assignmentsError;

      // Get performance data
      const { data: performance, error: performanceError } = await supabase
        .from('provider_team_performance' as any)
        .select('*')
        .eq('provider_id', providerId);

      if (performanceError) throw performanceError;

      const totalTeams = assignments?.length || 0;
      const activeAssignments = assignments?.filter((a: any) => a.status === 'active').length || 0;
      
      const totalCertificationsIssued = performance?.reduce((sum: number, p: any) => sum + (p.certifications_issued || 0), 0) || 0;
      const totalCoursesDelivered = performance?.reduce((sum: number, p: any) => sum + (p.courses_delivered || 0), 0) || 0;
      
      const averagePerformance = performance?.length > 0 
        ? performance.reduce((sum: number, p: any) => sum + (p.compliance_score || 0), 0) / performance.length 
        : 0;

      // Calculate performance trend (last 3 months vs previous 3 months)
      const now = new Date();
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

      const recentPerformance = performance?.filter((p: any) => 
        new Date(p.measurement_period) >= threeMonthsAgo
      ) || [];
      
      const previousPerformance = performance?.filter((p: any) => 
        new Date(p.measurement_period) >= sixMonthsAgo && 
        new Date(p.measurement_period) < threeMonthsAgo
      ) || [];

      const recentAvg = recentPerformance.length > 0 
        ? recentPerformance.reduce((sum: number, p: any) => sum + (p.compliance_score || 0), 0) / recentPerformance.length 
        : 0;
      
      const previousAvg = previousPerformance.length > 0 
        ? previousPerformance.reduce((sum: number, p: any) => sum + (p.compliance_score || 0), 0) / previousPerformance.length 
        : 0;

      const performanceTrend = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

      return {
        totalTeams,
        activeAssignments,
        averagePerformance,
        totalCertificationsIssued,
        totalCoursesDelivered,
        performanceTrend
      };
    } catch (error) {
      console.error('Error fetching provider team analytics:', error);
      return {
        totalTeams: 0,
        activeAssignments: 0,
        averagePerformance: 0,
        totalCertificationsIssued: 0,
        totalCoursesDelivered: 0,
        performanceTrend: 0
      };
    }
  }

  // Get teams available for assignment to a provider
  async getAvailableTeamsForProvider(providerId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          description,
          team_type,
          status,
          location_id,
          locations(name),
          team_members(id)
        `)
        .eq('status', 'active');

      if (error) throw error;

      // Filter out teams that already have this provider assigned
      const { data: existingAssignments } = await supabase
        .from('provider_team_assignments' as any)
        .select('team_id')
        .eq('provider_id', providerId)
        .eq('status', 'active');

      const assignedTeamIds = new Set(existingAssignments?.map((a: any) => a.team_id) || []);

      return (data || [])
        .filter(team => !assignedTeamIds.has(team.id))
        .map(team => ({
          ...team,
          member_count: team.team_members?.length || 0,
          location_name: team.locations?.name
        }));
    } catch (error) {
      console.error('Error fetching available teams:', error);
      return [];
    }
  }
}

export const enhancedProviderService = new EnhancedProviderService();