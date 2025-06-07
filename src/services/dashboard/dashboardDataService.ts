
import { supabase } from '@/integrations/supabase/client';

export interface DashboardMetrics {
  totalUsers?: number;
  activeCourses?: number;
  totalCertificates?: number;
  pendingRequests?: number;
  teamSize?: number;
  locationName?: string;
  upcomingClasses?: number;
  studentsTaught?: number;
  certificationsIssued?: number;
  teachingHours?: number;
  activeCertifications?: number;
  expiringSoon?: number;
  complianceIssues?: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user_name?: string;
}

export class DashboardDataService {
  /**
   * Get metrics for System Admins only
   */
  static async getSystemAdminMetrics(): Promise<DashboardMetrics> {
    try {
      // Get total users count
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Get active courses count
      const { count: activeCourses, error: coursesError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE');

      if (coursesError) throw coursesError;

      // Get total certificates
      const { count: totalCertificates, error: certsError } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true });

      if (certsError) throw certsError;

      // Get pending requests
      const { count: pendingRequests, error: requestsError } = await supabase
        .from('role_transition_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING');

      if (requestsError) throw requestsError;

      return {
        totalUsers: totalUsers || 0,
        activeCourses: activeCourses || 0,
        totalCertificates: totalCertificates || 0,
        pendingRequests: pendingRequests || 0
      };
    } catch (error) {
      console.error('Error fetching system admin metrics:', error);
      return {
        totalUsers: 0,
        activeCourses: 0,
        totalCertificates: 0,
        pendingRequests: 0
      };
    }
  }

  /**
   * Get metrics for team-scoped users (team members only see their team data)
   */
  static async getTeamScopedMetrics(teamId: string, userId: string): Promise<DashboardMetrics> {
    try {
      // Verify user is a member of this team
      const { data: membership, error: membershipError } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (membershipError || !membership) {
        throw new Error('Access denied: User not a member of this team');
      }

      // Get team info
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          location_id,
          locations(name)
        `)
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;

      // Get team size
      const { count: teamSize } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId);

      // Get location-specific certificates if location exists
      let totalCertificates = 0;
      if (team.location_id) {
        const { count } = await supabase
          .from('certificates')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', team.location_id);
        totalCertificates = count || 0;
      }

      // Get location-specific courses
      let activeCourses = 0;
      if (team.location_id) {
        const { count } = await supabase
          .from('course_offerings')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', team.location_id)
          .eq('status', 'SCHEDULED');
        activeCourses = count || 0;
      }

      return {
        teamSize: teamSize || 0,
        locationName: team.locations?.name || 'No Location',
        totalCertificates,
        activeCourses
      };
    } catch (error) {
      console.error('Error fetching team metrics:', error);
      return {
        teamSize: 0,
        locationName: 'Unknown',
        totalCertificates: 0,
        activeCourses: 0
      };
    }
  }

  /**
   * Get instructor-specific metrics
   */
  static async getInstructorMetrics(instructorId: string): Promise<DashboardMetrics> {
    try {
      // Get upcoming classes (next 14 days)
      const fourteenDaysFromNow = new Date();
      fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

      const { count: upcomingClasses, error: upcomingError } = await supabase
        .from('teaching_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('instructor_id', instructorId)
        .gte('session_date', new Date().toISOString())
        .lte('session_date', fourteenDaysFromNow.toISOString());

      if (upcomingError) throw upcomingError;

      // Get students taught (last 12 months)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('teaching_sessions')
        .select('attendees')
        .eq('instructor_id', instructorId)
        .gte('session_date', twelveMonthsAgo.toISOString());

      if (sessionsError) throw sessionsError;

      const uniqueStudents = new Set();
      sessionsData?.forEach(session => {
        if (session.attendees) {
          session.attendees.forEach((studentId: string) => uniqueStudents.add(studentId));
        }
      });

      // Get certifications issued
      const { count: certificationsIssued, error: certsError } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('issued_by', instructorId)
        .gte('created_at', twelveMonthsAgo.toISOString());

      if (certsError) throw certsError;

      // Get teaching hours
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data: hoursData, error: hoursError } = await supabase
        .from('teaching_sessions')
        .select('teaching_hours_credit')
        .eq('instructor_id', instructorId)
        .gte('session_date', threeMonthsAgo.toISOString());

      if (hoursError) throw hoursError;

      const teachingHours = hoursData?.reduce((total, session) => 
        total + (session.teaching_hours_credit || 0), 0) || 0;

      return {
        upcomingClasses: upcomingClasses || 0,
        studentsTaught: uniqueStudents.size,
        certificationsIssued: certificationsIssued || 0,
        teachingHours: Math.round(teachingHours)
      };
    } catch (error) {
      console.error('Error fetching instructor metrics:', error);
      return {
        upcomingClasses: 0,
        studentsTaught: 0,
        certificationsIssued: 0,
        teachingHours: 0
      };
    }
  }

  /**
   * Get student-specific metrics
   */
  static async getStudentMetrics(studentId: string): Promise<DashboardMetrics> {
    try {
      // Get active enrollments
      const { count: activeCourses, error: activeError } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', studentId)
        .eq('status', 'enrolled');

      if (activeError) throw activeError;

      // Get certificates
      const { count: activeCertifications, error: certsError } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', studentId)
        .eq('status', 'ACTIVE');

      if (certsError) throw certsError;

      // Get expiring certificates (next 60 days)
      const sixtyDaysFromNow = new Date();
      sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

      const { count: expiringSoon, error: expiringError } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', studentId)
        .eq('status', 'ACTIVE')
        .lte('expiry_date', sixtyDaysFromNow.toISOString());

      if (expiringError) throw expiringError;

      return {
        activeCourses: activeCourses || 0,
        activeCertifications: activeCertifications || 0,
        expiringSoon: expiringSoon || 0,
        complianceIssues: 0 // Students don't have compliance issues tracked
      };
    } catch (error) {
      console.error('Error fetching student metrics:', error);
      return {
        activeCourses: 0,
        activeCertifications: 0,
        expiringSoon: 0,
        complianceIssues: 0
      };
    }
  }

  /**
   * Get recent activities with proper RBAC
   */
  static async getRecentActivities(userId: string, userRole: string, teamId?: string): Promise<RecentActivity[]> {
    try {
      const activities: RecentActivity[] = [];

      if (['SA', 'AD'].includes(userRole)) {
        // System admins can see all activities
        const { data: auditLogs, error } = await supabase
          .from('audit_logs')
          .select('id, action, created_at, user_id')
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && auditLogs) {
          activities.push(...auditLogs.map(log => ({
            id: log.id,
            type: 'system',
            description: log.action,
            timestamp: log.created_at
          })));
        }
      } else if (teamId) {
        // Team members see team-specific activities only
        const { data: teamActivities, error } = await supabase
          .from('certificates')
          .select('id, course_name, created_at, recipient_name')
          .eq('location_id', teamId) // Assuming location-based filtering
          .order('created_at', { ascending: false })
          .limit(5);

        if (!error && teamActivities) {
          activities.push(...teamActivities.map(cert => ({
            id: cert.id,
            type: 'certificate',
            description: `Certificate issued for ${cert.course_name}`,
            timestamp: cert.created_at,
            user_name: cert.recipient_name
          })));
        }
      } else {
        // Individual user activities
        const { data: userActivities, error } = await supabase
          .from('certificates')
          .select('id, course_name, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!error && userActivities) {
          activities.push(...userActivities.map(cert => ({
            id: cert.id,
            type: 'certificate',
            description: `Received certificate for ${cert.course_name}`,
            timestamp: cert.created_at
          })));
        }
      }

      return activities;
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }
}
