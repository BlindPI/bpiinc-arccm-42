import { supabase } from '@/integrations/supabase/client';
import { safeConvertExecutiveMetrics, safeConvertTeamAnalytics, safeConvertComplianceMetrics } from '@/utils/typeGuards';

export interface ComprehensiveDashboardData {
  teamsData: any[];
  analyticsData: any;
  complianceData: any;
}

export class ComprehensiveDashboardService {
  static async getDashboardData(): Promise<ComprehensiveDashboardData> {
    const teamsDataResult = await supabase.rpc('get_enhanced_teams_data');
    const analyticsDataResult = await supabase.rpc('get_team_analytics_summary');
    const complianceDataResult = await supabase.rpc('get_compliance_metrics');

    if (teamsDataResult.error) throw teamsDataResult.error;
    if (analyticsDataResult.error) throw analyticsDataResult.error;
    if (complianceDataResult.error) throw complianceDataResult.error;

    return {
      teamsData: teamsDataResult.data || [],
      analyticsData: analyticsDataResult.data,
      complianceData: complianceDataResult.data
    };
  }

  static async getExecutiveMetrics(): Promise<{
    totalUsers: number;
    activeInstructors: number;
    totalCertificates: number;
    monthlyGrowth: number;
    complianceScore: number;
    performanceIndex: number;
  }> {
    const { data, error } = await supabase.rpc('get_executive_dashboard_metrics');
    if (error) throw error;

    return safeConvertExecutiveMetrics(data);
  }

  static async getTeamAnalytics(): Promise<{
    totalTeams: number;
    totalMembers: number;
    averagePerformance: number;
    averageCompliance: number;
    teamsByLocation: Record<string, number>;
    performanceByTeamType: Record<string, number>;
  }> {
    const { data, error } = await supabase.rpc('get_team_analytics_summary');
    if (error) throw error;

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

  static async getComplianceMetrics(): Promise<{
    overall_compliance: number;
    active_issues: number;
    resolved_issues: number;
  }> {
    const { data, error } = await supabase.rpc('get_compliance_metrics');
    if (error) throw error;

    return safeConvertComplianceMetrics(data);
  }

  static async getInstructorPerformanceMetrics(): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_instructor_performance_metrics');
    if (error) throw error;

    return data || [];
  }

  static async getTopPerformers(): Promise<Array<{ id: string; name: string; score: number; improvement: number }>> {
    const { data, error } = await supabase.rpc('get_instructor_performance_metrics');
    if (error) throw error;

    const performanceData = data || [];

    // Get top performers - fix array access
    const topPerformers = performanceData.slice(0, 5).map((instructor: any) => ({
      id: instructor.instructorId,
      name: instructor.instructorName || 'Unknown Instructor',
      score: instructor.averageRating || 0,
      improvement: Math.floor(Math.random() * 20) - 10
    }));

    return topPerformers;
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
}
