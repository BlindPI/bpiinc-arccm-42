
import { supabase } from '@/integrations/supabase/client';
import type { TeamPerformanceMetrics } from '@/types/team-management';

export class PerformanceService {
  static async getTeamPerformanceMetrics(teamId: string): Promise<TeamPerformanceMetrics> {
    try {
      const { data, error } = await supabase.rpc(
        'calculate_team_performance_metrics',
        {
          p_team_id: teamId,
          p_start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          p_end_date: new Date().toISOString().split('T')[0]
        }
      );

      if (error) throw error;

      const parsed = typeof data === 'string' ? JSON.parse(data) : data || {};

      return {
        team_id: teamId,
        location_name: undefined,
        totalCertificates: Number(parsed.certificates_issued) || 0,
        totalCourses: Number(parsed.courses_conducted) || 0,
        averageSatisfaction: Number(parsed.average_satisfaction_score) || 0,
        complianceScore: Number(parsed.compliance_score) || 0,
        performanceTrend: 0,
        total_certificates: Number(parsed.certificates_issued) || 0,
        total_courses: Number(parsed.courses_conducted) || 0,
        avg_satisfaction: Number(parsed.average_satisfaction_score) || 0,
        compliance_score: Number(parsed.compliance_score) || 0,
        performance_trend: 0
      };
    } catch (error) {
      console.error('Error fetching team performance metrics:', error);
      throw error;
    }
  }
}
