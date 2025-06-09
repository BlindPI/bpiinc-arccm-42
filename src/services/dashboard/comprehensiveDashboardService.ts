
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

// Helper function to safely access JSON properties
function safeJsonAccess<T>(data: Json, defaultValue: T): T {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as T;
  }
  return defaultValue;
}

function safeJsonProperty(obj: Json, property: string, defaultValue: any = null): any {
  if (obj && typeof obj === 'object' && !Array.isArray(obj) && property in obj) {
    return (obj as Record<string, any>)[property];
  }
  return defaultValue;
}

export interface SystemAdminMetrics {
  totalUsers: number;
  activeInstructors: number;
  totalCertificates: number;
  monthlyGrowth: number;
  complianceScore: number;
  performanceIndex: number;
}

export interface TeamLeaderMetrics {
  teamPerformance: number;
  memberCount: number;
  completionRate: number;
  complianceScore: number;
  certificatesIssued: number;
  coursesConducted: number;
  trainingHoursDelivered: number;
}

export interface ComprehensiveDashboardMetrics {
  systemAdmin: SystemAdminMetrics;
  teamLeader: TeamLeaderMetrics;
  lastUpdated: string;
}

export class ComprehensiveDashboardService {
  static async getSystemAdminDashboard(): Promise<SystemAdminMetrics> {
    try {
      const { data, error } = await supabase.rpc('get_executive_dashboard_metrics');
      
      if (error) {
        console.error('Error fetching system admin metrics:', error);
        throw error;
      }

      // Safely extract metrics with defaults
      const metrics = safeJsonAccess(data, {});
      
      return {
        totalUsers: safeJsonProperty(metrics, 'total_users', 0),
        activeInstructors: safeJsonProperty(metrics, 'active_instructors', 0),
        totalCertificates: safeJsonProperty(metrics, 'total_certificates', 0),
        monthlyGrowth: safeJsonProperty(metrics, 'monthly_growth', 0),
        complianceScore: safeJsonProperty(metrics, 'compliance_score', 0),
        performanceIndex: safeJsonProperty(metrics, 'performance_index', 0)
      };
    } catch (error) {
      console.error('Error in getSystemAdminDashboard:', error);
      throw error;
    }
  }

  static async getTeamLeaderDashboard(teamId: string): Promise<TeamLeaderMetrics> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();
      
      const { data, error } = await supabase.rpc('calculate_team_performance_metrics', {
        p_team_id: teamId,
        p_start_date: startDate.toISOString().split('T')[0],
        p_end_date: endDate.toISOString().split('T')[0]
      });

      if (error) {
        console.error('Error fetching team leader metrics:', error);
        throw error;
      }

      // Safely extract metrics with defaults
      const metrics = safeJsonAccess(data, {});
      
      return {
        teamPerformance: safeJsonProperty(metrics, 'team_performance', 0),
        memberCount: safeJsonProperty(metrics, 'member_count', 0),
        completionRate: safeJsonProperty(metrics, 'completion_rate', 0),
        complianceScore: safeJsonProperty(metrics, 'compliance_score', 0),
        certificatesIssued: safeJsonProperty(metrics, 'certificates_issued', 0),
        coursesConducted: safeJsonProperty(metrics, 'courses_conducted', 0),
        trainingHoursDelivered: safeJsonProperty(metrics, 'training_hours_delivered', 0)
      };
    } catch (error) {
      console.error('Error in getTeamLeaderDashboard:', error);
      throw error;
    }
  }

  static async getComprehensiveDashboard(teamId?: string): Promise<ComprehensiveDashboardMetrics> {
    try {
      const [systemAdminMetrics, teamLeaderMetrics] = await Promise.all([
        this.getSystemAdminDashboard(),
        teamId ? this.getTeamLeaderDashboard(teamId) : Promise.resolve({
          teamPerformance: 0,
          memberCount: 0,
          completionRate: 0,
          complianceScore: 0,
          certificatesIssued: 0,
          coursesConducted: 0,
          trainingHoursDelivered: 0
        })
      ]);

      return {
        systemAdmin: systemAdminMetrics,
        teamLeader: teamLeaderMetrics,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in getComprehensiveDashboard:', error);
      throw error;
    }
  }
}
