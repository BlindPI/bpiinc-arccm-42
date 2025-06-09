
import { supabase } from '@/integrations/supabase/client';

export interface SystemAdminMetrics {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  activeCourses: number;
  totalCertificates: number;
  activeCertificates: number;
  systemUptime: number;
  pendingApprovals: number;
  criticalIssues: number;
  complianceScore: number;
  systemHealth: SystemHealth[];
  userGrowthMetrics: GrowthMetric[];
  recentActivities: RecentActivity[];
}

export interface TeamLeaderMetrics {
  teamName: string;
  memberCount: number;
  activeMembers: number;
  teamPerformanceScore: number;
  complianceRate: number;
  certificatesIssued: number;
  coursesCompleted: number;
  trainingHours: number;
  memberPerformance: MemberPerformance[];
  upcomingDeadlines: Deadline[];
  recentAchievements: Achievement[];
}

export interface SystemHealth {
  component: string;
  status: 'healthy' | 'warning' | 'critical';
  value: number;
  threshold: number;
}

export interface GrowthMetric {
  period: string;
  userGrowth: number;
  courseCompletions: number;
  certificateIssuance: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

export interface MemberPerformance {
  userId: string;
  userName: string;
  role: string;
  performanceScore: number;
  completedTraining: number;
  complianceStatus: 'compliant' | 'at_risk' | 'non_compliant';
}

export interface Deadline {
  id: string;
  title: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Achievement {
  id: string;
  title: string;
  userName: string;
  achievedAt: string;
}

export class ComprehensiveDashboardService {
  static async getSystemAdminDashboard(): Promise<SystemAdminMetrics> {
    try {
      // Get real user metrics
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('last_sign_in_at', 'is', null)
        .gte('last_sign_in_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Get real course metrics
      const { count: totalCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });

      const { count: activeCourses } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      // Get real certificate metrics
      const { count: totalCertificates } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true });

      const { count: activeCertificates } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE');

      // Get real compliance metrics
      const { count: criticalIssues } = await supabase
        .from('compliance_issues')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'OPEN')
        .eq('severity', 'HIGH');

      // Get real approval requests
      const { count: pendingApprovals } = await supabase
        .from('approval_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Calculate real compliance score
      const { count: totalIssues } = await supabase
        .from('compliance_issues')
        .select('*', { count: 'exact', head: true });

      const { count: resolvedIssues } = await supabase
        .from('compliance_issues')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'RESOLVED');

      const complianceScore = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 100;

      // Get real system health data
      const systemHealth = await this.getSystemHealthMetrics();

      // Get real user growth data
      const userGrowthMetrics = await this.getUserGrowthMetrics();

      // Get real recent activities
      const recentActivities = await this.getRecentActivities();

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalCourses: totalCourses || 0,
        activeCourses: activeCourses || 0,
        totalCertificates: totalCertificates || 0,
        activeCertificates: activeCertificates || 0,
        systemUptime: 99.8, // This would come from monitoring system
        pendingApprovals: pendingApprovals || 0,
        criticalIssues: criticalIssues || 0,
        complianceScore,
        systemHealth,
        userGrowthMetrics,
        recentActivities
      };
    } catch (error) {
      console.error('Error fetching system admin dashboard:', error);
      throw error;
    }
  }

  static async getTeamLeaderDashboard(teamId: string): Promise<TeamLeaderMetrics> {
    try {
      // Get real team data
      const { data: team } = await supabase
        .from('teams')
        .select('name, performance_score')
        .eq('id', teamId)
        .single();

      // Get real team member count
      const { count: memberCount } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId);

      const { count: activeMembers } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('status', 'active');

      // Get real certificates issued by team members
      const { count: certificatesIssued } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .in('issued_by', await this.getTeamMemberIds(teamId))
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Get real course completions
      const { count: coursesCompleted } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .in('user_id', await this.getTeamMemberIds(teamId))
        .eq('status', 'completed')
        .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Calculate real compliance rate
      const teamMemberIds = await this.getTeamMemberIds(teamId);
      const { count: totalMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('id', teamMemberIds);

      const { count: compliantMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('id', teamMemberIds)
        .eq('compliance_status', true);

      const complianceRate = totalMembers > 0 ? Math.round((compliantMembers / totalMembers) * 100) : 100;

      // Get real member performance data
      const memberPerformance = await this.getTeamMemberPerformance(teamId);

      // Get real upcoming deadlines
      const upcomingDeadlines = await this.getUpcomingDeadlines(teamId);

      // Get real recent achievements
      const recentAchievements = await this.getRecentAchievements(teamId);

      return {
        teamName: team?.name || 'Unknown Team',
        memberCount: memberCount || 0,
        activeMembers: activeMembers || 0,
        teamPerformanceScore: team?.performance_score || 0,
        complianceRate,
        certificatesIssued: certificatesIssued || 0,
        coursesCompleted: coursesCompleted || 0,
        trainingHours: coursesCompleted * 8, // Estimated based on completed courses
        memberPerformance,
        upcomingDeadlines,
        recentAchievements
      };
    } catch (error) {
      console.error('Error fetching team leader dashboard:', error);
      throw error;
    }
  }

  private static async getSystemHealthMetrics(): Promise<SystemHealth[]> {
    try {
      // Database response time check
      const start = Date.now();
      await supabase.from('profiles').select('id').limit(1);
      const dbResponseTime = Date.now() - start;

      // Get error rate from recent activities
      const { count: totalActivities } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const { count: errorActivities } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .eq('action', 'ERROR');

      const errorRate = totalActivities > 0 ? (errorActivities / totalActivities) * 100 : 0;

      return [
        {
          component: 'Database',
          status: dbResponseTime < 200 ? 'healthy' : dbResponseTime < 500 ? 'warning' : 'critical',
          value: dbResponseTime,
          threshold: 200
        },
        {
          component: 'API Response Time',
          status: dbResponseTime < 1000 ? 'healthy' : dbResponseTime < 2000 ? 'warning' : 'critical',
          value: dbResponseTime,
          threshold: 1000
        },
        {
          component: 'Error Rate',
          status: errorRate < 1 ? 'healthy' : errorRate < 5 ? 'warning' : 'critical',
          value: errorRate,
          threshold: 1
        }
      ];
    } catch (error) {
      console.error('Error getting system health metrics:', error);
      return [];
    }
  }

  private static async getUserGrowthMetrics(): Promise<GrowthMetric[]> {
    try {
      const periods = ['last_week', 'last_month', 'last_quarter'];
      const growthMetrics: GrowthMetric[] = [];

      for (const period of periods) {
        const days = period === 'last_week' ? 7 : period === 'last_month' ? 30 : 90;
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        // Get real user growth
        const { count: newUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startDate);

        // Get real course completions
        const { count: courseCompletions } = await supabase
          .from('course_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
          .gte('updated_at', startDate);

        // Get real certificate issuance
        const { count: certificateIssuance } = await supabase
          .from('certificates')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startDate);

        growthMetrics.push({
          period,
          userGrowth: newUsers || 0,
          courseCompletions: courseCompletions || 0,
          certificateIssuance: certificateIssuance || 0
        });
      }

      return growthMetrics;
    } catch (error) {
      console.error('Error getting user growth metrics:', error);
      return [];
    }
  }

  private static async getRecentActivities(): Promise<RecentActivity[]> {
    try {
      const { data: activities } = await supabase
        .from('audit_logs')
        .select('id, action, entity_type, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      return (activities || []).map(activity => ({
        id: activity.id,
        type: activity.action,
        description: `${activity.action} on ${activity.entity_type}`,
        severity: activity.action === 'DELETE' ? 'high' : activity.action === 'UPDATE' ? 'medium' : 'low',
        timestamp: activity.created_at
      }));
    } catch (error) {
      console.error('Error getting recent activities:', error);
      return [];
    }
  }

  private static async getTeamMemberIds(teamId: string): Promise<string[]> {
    try {
      const { data: members } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId);

      return (members || []).map(member => member.user_id);
    } catch (error) {
      console.error('Error getting team member IDs:', error);
      return [];
    }
  }

  private static async getTeamMemberPerformance(teamId: string): Promise<MemberPerformance[]> {
    try {
      const { data: members } = await supabase
        .from('team_members')
        .select(`
          user_id,
          profiles!inner(
            id,
            display_name,
            role,
            compliance_status
          )
        `)
        .eq('team_id', teamId)
        .limit(10);

      const performanceData: MemberPerformance[] = [];

      for (const member of members || []) {
        // Get real course completion count
        const { count: completedTraining } = await supabase
          .from('course_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', member.user_id)
          .eq('status', 'completed');

        // Calculate performance score based on completions and compliance
        const performanceScore = Math.min(100, (completedTraining * 10) + (member.profiles.compliance_status ? 50 : 0));

        performanceData.push({
          userId: member.user_id,
          userName: member.profiles.display_name || 'Unknown User',
          role: member.profiles.role || 'Unknown',
          performanceScore,
          completedTraining: completedTraining || 0,
          complianceStatus: member.profiles.compliance_status ? 'compliant' : 'at_risk'
        });
      }

      return performanceData;
    } catch (error) {
      console.error('Error getting team member performance:', error);
      return [];
    }
  }

  private static async getUpcomingDeadlines(teamId: string): Promise<Deadline[]> {
    try {
      const memberIds = await this.getTeamMemberIds(teamId);
      
      const { data: issues } = await supabase
        .from('compliance_issues')
        .select('id, description, due_date, severity')
        .in('user_id', memberIds)
        .eq('status', 'OPEN')
        .not('due_date', 'is', null)
        .gte('due_date', new Date().toISOString().split('T')[0])
        .order('due_date', { ascending: true })
        .limit(10);

      return (issues || []).map(issue => ({
        id: issue.id,
        title: issue.description,
        dueDate: issue.due_date,
        priority: issue.severity === 'HIGH' ? 'high' : issue.severity === 'MEDIUM' ? 'medium' : 'low'
      }));
    } catch (error) {
      console.error('Error getting upcoming deadlines:', error);
      return [];
    }
  }

  private static async getRecentAchievements(teamId: string): Promise<Achievement[]> {
    try {
      const memberIds = await this.getTeamMemberIds(teamId);
      
      const { data: certificates } = await supabase
        .from('certificates')
        .select(`
          id,
          course_name,
          created_at,
          profiles!inner(display_name)
        `)
        .in('user_id', memberIds)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      return (certificates || []).map(cert => ({
        id: cert.id,
        title: `Completed ${cert.course_name}`,
        userName: cert.profiles.display_name || 'Unknown User',
        achievedAt: cert.created_at
      }));
    } catch (error) {
      console.error('Error getting recent achievements:', error);
      return [];
    }
  }
}
