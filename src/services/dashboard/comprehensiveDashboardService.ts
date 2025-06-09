
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

export interface SystemHealthStatus {
  component: string;
  status: 'healthy' | 'warning' | 'critical';
  value: number;
  threshold: number;
}

export interface UserGrowthMetric {
  period: string;
  userGrowth: number;
  courseCompletions: number;
  certificateIssuance: number;
}

export interface RecentActivity {
  id: string;
  description: string;
  timestamp: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SystemAdminMetrics {
  totalUsers: number;
  activeUsers: number;
  activeInstructors: number;
  totalCertificates: number;
  activeCertificates: number;
  totalCourses: number;
  activeCourses: number;
  monthlyGrowth: number;
  complianceScore: number;
  performanceIndex: number;
  systemUptime: number;
  pendingApprovals: number;
  criticalIssues: number;
  systemHealth: SystemHealthStatus[];
  userGrowthMetrics: UserGrowthMetric[];
  recentActivities: RecentActivity[];
}

export interface MemberPerformance {
  userId: string;
  userName: string;
  role: string;
  performanceScore: number;
  completedTraining: number;
  complianceStatus: 'compliant' | 'at_risk' | 'non_compliant';
}

export interface UpcomingDeadline {
  id: string;
  title: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
}

export interface RecentAchievement {
  id: string;
  title: string;
  userName: string;
  achievedAt: string;
}

export interface TeamLeaderMetrics {
  teamName: string;
  teamPerformance: number;
  memberCount: number;
  activeMembers: number;
  completionRate: number;
  complianceScore: number;
  complianceRate: number;
  certificatesIssued: number;
  coursesConducted: number;
  coursesCompleted: number;
  trainingHours: number;
  trainingHoursDelivered: number;
  memberPerformance: MemberPerformance[];
  upcomingDeadlines: UpcomingDeadline[];
  recentAchievements: RecentAchievement[];
}

export interface ComprehensiveDashboardMetrics {
  systemAdmin: SystemAdminMetrics;
  teamLeader: TeamLeaderMetrics;
  lastUpdated: string;
}

export class ComprehensiveDashboardService {
  static async getSystemAdminDashboard(): Promise<SystemAdminMetrics> {
    try {
      const { data, error } = await supabase.rpc('get_enhanced_executive_dashboard_metrics');
      
      if (error) {
        console.error('Error fetching system admin metrics:', error);
        throw error;
      }

      // Safely extract metrics with defaults
      const metrics = safeJsonAccess(data, {});
      
      return {
        totalUsers: safeJsonProperty(metrics, 'totalUsers', 0),
        activeUsers: safeJsonProperty(metrics, 'activeUsers', 0),
        activeInstructors: safeJsonProperty(metrics, 'activeInstructors', 0),
        totalCertificates: safeJsonProperty(metrics, 'totalCertificates', 0),
        activeCertificates: safeJsonProperty(metrics, 'activeCertificates', 0),
        totalCourses: safeJsonProperty(metrics, 'totalCourses', 0),
        activeCourses: safeJsonProperty(metrics, 'activeCourses', 0),
        monthlyGrowth: safeJsonProperty(metrics, 'monthlyGrowth', 0),
        complianceScore: safeJsonProperty(metrics, 'complianceScore', 0),
        performanceIndex: safeJsonProperty(metrics, 'performanceIndex', 0),
        systemUptime: safeJsonProperty(metrics, 'systemUptime', 0),
        pendingApprovals: safeJsonProperty(metrics, 'pendingApprovals', 0),
        criticalIssues: safeJsonProperty(metrics, 'criticalIssues', 0),
        systemHealth: safeJsonProperty(metrics, 'systemHealth', []),
        userGrowthMetrics: safeJsonProperty(metrics, 'userGrowthMetrics', []),
        recentActivities: safeJsonProperty(metrics, 'recentActivities', [])
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
      
      const { data, error } = await supabase.rpc('calculate_enhanced_team_performance_metrics', {
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
        teamName: safeJsonProperty(metrics, 'teamName', 'Unknown Team'),
        teamPerformance: safeJsonProperty(metrics, 'teamPerformance', 0),
        memberCount: safeJsonProperty(metrics, 'memberCount', 0),
        activeMembers: safeJsonProperty(metrics, 'activeMembers', 0),
        completionRate: safeJsonProperty(metrics, 'completionRate', 0),
        complianceScore: safeJsonProperty(metrics, 'complianceScore', 0),
        complianceRate: safeJsonProperty(metrics, 'complianceRate', 0),
        certificatesIssued: safeJsonProperty(metrics, 'certificatesIssued', 0),
        coursesConducted: safeJsonProperty(metrics, 'coursesConducted', 0),
        coursesCompleted: safeJsonProperty(metrics, 'coursesCompleted', 0),
        trainingHours: safeJsonProperty(metrics, 'trainingHours', 0),
        trainingHoursDelivered: safeJsonProperty(metrics, 'trainingHoursDelivered', 0),
        memberPerformance: safeJsonProperty(metrics, 'memberPerformance', []),
        upcomingDeadlines: safeJsonProperty(metrics, 'upcomingDeadlines', []),
        recentAchievements: safeJsonProperty(metrics, 'recentAchievements', [])
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
          teamName: 'No Team',
          teamPerformance: 0,
          memberCount: 0,
          activeMembers: 0,
          completionRate: 0,
          complianceScore: 0,
          complianceRate: 0,
          certificatesIssued: 0,
          coursesConducted: 0,
          coursesCompleted: 0,
          trainingHours: 0,
          trainingHoursDelivered: 0,
          memberPerformance: [],
          upcomingDeadlines: [],
          recentAchievements: []
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
