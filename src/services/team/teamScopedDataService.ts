
import { supabase } from '@/integrations/supabase/client';

export interface TeamScopedMetrics {
  // Team-specific metrics
  teamSize: number;
  activeCourses: number;
  totalCertificates: number;
  teamPerformance: number;
  
  // Location-specific data
  locationName: string;
  locationId: string;
  
  // Time-based metrics
  monthlyProgress: number;
  weeklyActivity: number;
  
  // Comparative metrics (only for admins)
  teamRanking?: number;
  organizationComparison?: number;
}

export interface TeamScopedCourse {
  id: string;
  name: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  start_date: string;
  end_date: string;
  instructor_name: string;
  participants_count: number;
  max_participants: number;
  location_name: string;
}

export interface TeamScopedCertificate {
  id: string;
  recipient_name: string;
  course_name: string;
  issue_date: string;
  status: string;
  instructor_name: string;
}

export class TeamScopedDataService {
  /**
   * Get team-specific metrics with proper data isolation
   */
  static async getTeamMetrics(
    teamId: string, 
    userId: string,
    userRole: string
  ): Promise<TeamScopedMetrics> {
    try {
      // Verify user has access to this team
      const { data: membership, error: membershipError } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (membershipError || !membership) {
        throw new Error('Access denied: User not a member of this team');
      }

      // Get team info with location
      const { data: teamInfo, error: teamError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          performance_score,
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

      // Get location-specific courses if location exists
      let activeCourses = 0;
      if (teamInfo.location_id) {
        const { count } = await supabase
          .from('course_offerings')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', teamInfo.location_id)
          .eq('status', 'SCHEDULED');
        activeCourses = count || 0;
      }

      // Get location-specific certificates
      let totalCertificates = 0;
      if (teamInfo.location_id) {
        const { count } = await supabase
          .from('certificates')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', teamInfo.location_id);
        totalCertificates = count || 0;
      }

      // Calculate time-based metrics
      const monthlyProgress = Math.floor(Math.random() * 100); // TODO: Implement real calculation
      const weeklyActivity = Math.floor(Math.random() * 100); // TODO: Implement real calculation

      return {
        teamSize: teamSize || 0,
        activeCourses,
        totalCertificates,
        teamPerformance: teamInfo.performance_score || 0,
        locationName: teamInfo.locations?.name || 'No Location',
        locationId: teamInfo.location_id || '',
        monthlyProgress,
        weeklyActivity
      };

    } catch (error) {
      console.error('Error getting team metrics:', error);
      throw error;
    }
  }

  /**
   * Get team-specific courses with access control
   */
  static async getTeamCourses(
    teamId: string,
    userId: string,
    limit: number = 10
  ): Promise<TeamScopedCourse[]> {
    try {
      // Verify team membership
      const { data: membership } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (!membership) {
        throw new Error('Access denied: User not a member of this team');
      }

      // Get team location
      const { data: team } = await supabase
        .from('teams')
        .select('location_id')
        .eq('id', teamId)
        .single();

      if (!team?.location_id) {
        return [];
      }

      // Get location-specific courses
      const { data: courses, error } = await supabase
        .from('course_offerings')
        .select(`
          id,
          start_date,
          end_date,
          status,
          max_participants,
          courses(name),
          profiles(display_name),
          locations(name)
        `)
        .eq('location_id', team.location_id)
        .order('start_date', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return courses?.map(course => ({
        id: course.id,
        name: course.courses?.name || 'Unknown Course',
        status: course.status as any,
        start_date: course.start_date,
        end_date: course.end_date,
        instructor_name: course.profiles?.display_name || 'TBD',
        participants_count: 0, // TODO: Calculate from enrollments
        max_participants: course.max_participants,
        location_name: course.locations?.name || 'Unknown Location'
      })) || [];

    } catch (error) {
      console.error('Error getting team courses:', error);
      return [];
    }
  }

  /**
   * Get team-specific certificates with access control
   */
  static async getTeamCertificates(
    teamId: string,
    userId: string,
    limit: number = 10
  ): Promise<TeamScopedCertificate[]> {
    try {
      // Verify team membership
      const { data: membership } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (!membership) {
        throw new Error('Access denied: User not a member of this team');
      }

      // Get team location
      const { data: team } = await supabase
        .from('teams')
        .select('location_id')
        .eq('id', teamId)
        .single();

      if (!team?.location_id) {
        return [];
      }

      // Get location-specific certificates
      const { data: certificates, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('location_id', team.location_id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return certificates?.map(cert => ({
        id: cert.id,
        recipient_name: cert.recipient_name,
        course_name: cert.course_name,
        issue_date: cert.issue_date,
        status: cert.status,
        instructor_name: cert.instructor_name || 'Unknown'
      })) || [];

    } catch (error) {
      console.error('Error getting team certificates:', error);
      return [];
    }
  }

  /**
   * Check if user can access specific team data
   */
  static async verifyTeamAccess(teamId: string, userId: string): Promise<boolean> {
    try {
      const { data: membership } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      return !!membership;
    } catch {
      return false;
    }
  }

  /**
   * Get user's accessible teams for switching
   */
  static async getUserAccessibleTeams(userId: string): Promise<Array<{
    id: string;
    name: string;
    role: string;
    location_name: string;
  }>> {
    try {
      const { data: teamMemberships, error } = await supabase
        .from('team_members')
        .select(`
          team_id,
          role,
          teams(
            id,
            name,
            locations(name)
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      return teamMemberships?.map(tm => ({
        id: tm.team_id,
        name: tm.teams?.name || 'Unknown Team',
        role: tm.role,
        location_name: tm.teams?.locations?.name || 'No Location'
      })) || [];

    } catch (error) {
      console.error('Error getting accessible teams:', error);
      return [];
    }
  }
}
