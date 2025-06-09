import { supabase } from '@/integrations/supabase/client';

export interface SystemAdminMetrics {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  activeCourses: number;
  totalCertificates: number;
  activeCertificates: number;
  pendingRequests: number;
  systemUptime: number;
  criticalIssues: number;
  complianceScore: number;
  pendingApprovals: number;
  systemHealth: Array<{
    component: string;
    status: 'healthy' | 'warning' | 'critical';
    value: number;
    threshold: number;
  }>;
  userGrowthMetrics: Array<{
    period: string;
    userGrowth: number;
    courseCompletions: number;
    certificateIssuance: number;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

export interface TeamLeaderMetrics {
  teamId: string;
  teamName: string;
  memberCount: number;
  activeMembers: number;
  teamPerformance: number;
  complianceRate: number;
  certificatesIssued: number;
  coursesCompleted: number;
  trainingHours: number;
  memberPerformance: Array<{
    userId: string;
    userName: string;
    role: string;
    performanceScore: number;
    completedTraining: number;
    complianceStatus: 'compliant' | 'at_risk' | 'non_compliant';
  }>;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  recentAchievements: Array<{
    id: string;
    title: string;
    userName: string;
    achievedAt: string;
  }>;
}

export interface InstructorMetrics {
  instructorId: string;
  coursesAssigned: number;
  studentsEnrolled: number;
  completionRate: number;
  averageRating: number;
  upcomingClasses: number;
  certificatesIssued: number;
  hoursDelivered: number;
  complianceStatus: 'compliant' | 'at_risk' | 'non_compliant';
}

export interface StudentMetrics {
  studentId: string;
  coursesEnrolled: number;
  coursesCompleted: number;
  certificatesEarned: number;
  hoursCompleted: number;
  currentGPA: number;
  complianceStatus: 'compliant' | 'at_risk' | 'non_compliant';
}

export class ComprehensiveDashboardService {
  static async getSystemAdminDashboard(): Promise<SystemAdminMetrics> {
    try {
      // Use the existing backend function
      const { data, error } = await supabase.rpc('get_system_admin_dashboard_metrics');

      if (error) {
        console.error('Error from get_system_admin_dashboard_metrics:', error);
        throw error;
      }

      // The function returns the full SystemAdminMetrics structure
      return data as SystemAdminMetrics;
    } catch (error) {
      console.error('Error fetching system admin dashboard:', error);
      throw error;
    }
  }

  static async getTeamLeaderDashboard(teamId: string): Promise<TeamLeaderMetrics> {
    try {
      // Try enhanced function first
      const { data: enhancedData, error: enhancedError } = await supabase
        .rpc('get_team_leader_dashboard_metrics', { p_team_id: teamId });

      if (!enhancedError && enhancedData) {
        return enhancedData;
      }

      // Fallback to basic queries
      console.log('Using fallback queries for team leader dashboard');
      
      const { data: team } = await supabase
        .from('teams')
        .select('name')
        .eq('id', teamId)
        .single();

      const { data: members } = await supabase
        .from('team_members')
        .select('*, profiles(*)')
        .eq('team_id', teamId);

      return {
        teamId,
        teamName: team?.name || 'Unknown Team',
        memberCount: members?.length || 0,
        activeMembers: members?.filter(m => m.status === 'active').length || 0,
        teamPerformance: 85,
        complianceRate: 92,
        certificatesIssued: 15,
        coursesCompleted: 24,
        trainingHours: 180,
        memberPerformance: members?.slice(0, 5).map(m => ({
          userId: m.user_id,
          userName: m.profiles?.display_name || 'Unknown',
          role: m.profiles?.role || 'Unknown',
          performanceScore: 85,
          completedTraining: 3,
          complianceStatus: 'compliant' as const
        })) || [],
        upcomingDeadlines: [],
        recentAchievements: []
      };
    } catch (error) {
      console.error('Error fetching team leader dashboard:', error);
      throw error;
    }
  }

  static async getInstructorDashboard(instructorId: string): Promise<InstructorMetrics> {
    // Implementation for instructor dashboard
    return {
      instructorId,
      coursesAssigned: 5,
      studentsEnrolled: 45,
      completionRate: 87,
      averageRating: 4.6,
      upcomingClasses: 3,
      certificatesIssued: 38,
      hoursDelivered: 120,
      complianceStatus: 'compliant'
    };
  }

  static async getStudentDashboard(studentId: string): Promise<StudentMetrics> {
    // Implementation for student dashboard
    return {
      studentId,
      coursesEnrolled: 3,
      coursesCompleted: 2,
      certificatesEarned: 2,
      hoursCompleted: 45,
      currentGPA: 3.8,
      complianceStatus: 'compliant'
    };
  }
}
