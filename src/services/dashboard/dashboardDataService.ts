
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
      console.log('🔧 DASHBOARD-DATA: Fetching system admin metrics...');
      
      // Try the enhanced function first
      try {
        const { data, error } = await supabase.rpc('get_enhanced_executive_dashboard_metrics');
        
        if (error) {
          console.warn('🔧 DASHBOARD-DATA: Enhanced function failed, falling back to basic queries:', error.message);
          throw error;
        }
        
        if (data) {
          console.log('🔧 DASHBOARD-DATA: Enhanced metrics loaded successfully:', data);
          return {
            totalUsers: data.totalUsers || 0,
            activeCourses: data.activeCourses || 0,
            totalCertificates: data.totalCertificates || 0,
            pendingRequests: data.pendingApprovals || 0
          };
        }
      } catch (enhancedError) {
        console.warn('🔧 DASHBOARD-DATA: Enhanced function not available, using fallback queries');
      }

      // Fallback to individual queries
      console.log('🔧 DASHBOARD-DATA: Using fallback queries for system admin metrics...');
      
      // Get total users count
      const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) {
        console.error('🔧 DASHBOARD-DATA: Error fetching users:', usersError);
      }

      // Get active courses count
      const { count: activeCourses, error: coursesError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE');

      if (coursesError) {
        console.error('🔧 DASHBOARD-DATA: Error fetching courses:', coursesError);
      }

      // Get total certificates
      const { count: totalCertificates, error: certsError } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true });

      if (certsError) {
        console.error('🔧 DASHBOARD-DATA: Error fetching certificates:', certsError);
      }

      // Get pending requests
      const { count: pendingRequests, error: requestsError } = await supabase
        .from('role_transition_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING');

      if (requestsError) {
        console.error('🔧 DASHBOARD-DATA: Error fetching pending requests:', requestsError);
      }

      const result = {
        totalUsers: totalUsers || 0,
        activeCourses: activeCourses || 0,
        totalCertificates: totalCertificates || 0,
        pendingRequests: pendingRequests || 0
      };

      console.log('🔧 DASHBOARD-DATA: Fallback metrics loaded:', result);
      return result;
      
    } catch (error) {
      console.error('🔧 DASHBOARD-DATA: Error in getSystemAdminMetrics:', error);
      // Return safe defaults instead of throwing
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
      console.log('🔧 DASHBOARD-DATA: Fetching team metrics for team:', teamId, 'user:', userId);
      
      // Verify user is a member of this team
      const { data: membership, error: membershipError } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (membershipError || !membership) {
        console.error('🔧 DASHBOARD-DATA: User not a member of team:', membershipError);
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

      if (teamError) {
        console.error('🔧 DASHBOARD-DATA: Error fetching team info:', teamError);
        throw teamError;
      }

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

      const result = {
        teamSize: teamSize || 0,
        locationName: team.locations?.name || 'No Location',
        totalCertificates,
        activeCourses
      };

      console.log('🔧 DASHBOARD-DATA: Team metrics loaded:', result);
      return result;
      
    } catch (error) {
      console.error('🔧 DASHBOARD-DATA: Error in getTeamScopedMetrics:', error);
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
      console.log('🔧 DASHBOARD-DATA: Fetching instructor metrics for:', instructorId);
      
      // Try enhanced function first
      try {
        const { data, error } = await supabase.rpc('get_instructor_performance_metrics', {
          p_instructor_id: instructorId
        });
        
        if (!error && data) {
          console.log('🔧 DASHBOARD-DATA: Enhanced instructor metrics loaded:', data);
          return {
            upcomingClasses: data.totalSessions || 0,
            studentsTaught: data.studentsCount || 0,
            certificationsIssued: data.certificatesIssued || 0,
            teachingHours: data.totalHours || 0
          };
        }
      } catch (enhancedError) {
        console.warn('🔧 DASHBOARD-DATA: Enhanced instructor function not available, using fallback');
      }

      // Fallback queries
      const fourteenDaysFromNow = new Date();
      fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

      const { count: upcomingClasses } = await supabase
        .from('teaching_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('instructor_id', instructorId)
        .gte('session_date', new Date().toISOString())
        .lte('session_date', fourteenDaysFromNow.toISOString());

      const { count: certificationsIssued } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('issued_by', instructorId);

      const result = {
        upcomingClasses: upcomingClasses || 0,
        studentsTaught: 0, // Would need session data
        certificationsIssued: certificationsIssued || 0,
        teachingHours: 0 // Would need session duration data
      };

      console.log('🔧 DASHBOARD-DATA: Instructor metrics loaded (fallback):', result);
      return result;
      
    } catch (error) {
      console.error('🔧 DASHBOARD-DATA: Error in getInstructorMetrics:', error);
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
      console.log('🔧 DASHBOARD-DATA: Fetching student metrics for:', studentId);
      
      // Get active enrollments
      const { count: activeCourses } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', studentId)
        .eq('status', 'enrolled');

      // Get certificates
      const { count: activeCertifications } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', studentId)
        .eq('status', 'ACTIVE');

      // Get expiring certificates (next 60 days)
      const sixtyDaysFromNow = new Date();
      sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

      const { count: expiringSoon } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', studentId)
        .eq('status', 'ACTIVE')
        .lte('expiry_date', sixtyDaysFromNow.toISOString());

      const result = {
        activeCourses: activeCourses || 0,
        activeCertifications: activeCertifications || 0,
        expiringSoon: expiringSoon || 0,
        complianceIssues: 0
      };

      console.log('🔧 DASHBOARD-DATA: Student metrics loaded:', result);
      return result;
      
    } catch (error) {
      console.error('🔧 DASHBOARD-DATA: Error in getStudentMetrics:', error);
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
      console.log('🔧 DASHBOARD-DATA: Fetching recent activities for user:', userId, 'role:', userRole);
      
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

      console.log('🔧 DASHBOARD-DATA: Recent activities loaded:', activities.length, 'items');
      return activities;
      
    } catch (error) {
      console.error('🔧 DASHBOARD-DATA: Error fetching recent activities:', error);
      return [];
    }
  }
}
