import { supabase } from '@/integrations/supabase/client';

export interface TeamAnalyticsData {
  certificatesIssued: number;
  coursesCompleted: number;
  trainingHours: number;
  complianceScore: number;
  performanceScore: number;
}

export class TeamAnalyticsService {
  /**
   * Get analytics data for a specific team based on location relationships
   */
  static async getTeamAnalytics(teamId: string): Promise<TeamAnalyticsData> {
    try {
      console.log(`🔍 TEAMANALYTICS: Fetching analytics for team ${teamId}`);
      
      // First get the team's location
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('location_id, name')
        .eq('id', teamId)
        .single();

      if (teamError || !teamData) {
        console.error('Error fetching team data:', teamError);
        return this.getDefaultAnalytics();
      }

      console.log(`🔍 TEAMANALYTICS: Team "${teamData.name}" location_id:`, teamData.location_id);

      // Get certificates issued for this team's location
      let certificatesIssued = 0;
      if (teamData.location_id) {
        const { data: certData, error: certError } = await supabase
          .from('certificates')
          .select('id')
          .eq('location_id', teamData.location_id)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

        if (!certError && certData) {
          certificatesIssued = certData.length;
        }
      }

      // Get courses completed for this team's location
      let coursesCompleted = 0;
      if (teamData.location_id) {
        const { data: courseData, error: courseError } = await supabase
          .from('course_offerings')
          .select('id')
          .eq('location_id', teamData.location_id)
          .eq('status', 'COMPLETED')
          .gte('end_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

        if (!courseError && courseData) {
          coursesCompleted = courseData.length;
        }
      }

      // Get training hours from team members
      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .select(`
          profiles!inner(training_hours)
        `)
        .eq('team_id', teamId)
        .eq('status', 'active');

      let trainingHours = 0;
      if (!memberError && memberData) {
        trainingHours = memberData.reduce((total: number, member: any) => {
          return total + (member.profiles?.training_hours || 0);
        }, 0);
      }

      // Calculate performance score based on activity
      const performanceScore = this.calculatePerformanceScore(certificatesIssued, coursesCompleted, trainingHours);
      
      // Calculate compliance score based on team members
      const complianceScore = await this.calculateComplianceScore(teamId);

      const analytics: TeamAnalyticsData = {
        certificatesIssued,
        coursesCompleted,
        trainingHours,
        complianceScore,
        performanceScore
      };

      console.log(`🔍 TEAMANALYTICS: Analytics for team "${teamData.name}":`, analytics);
      return analytics;

    } catch (error) {
      console.error('Error fetching team analytics:', error);
      return this.getDefaultAnalytics();
    }
  }

  /**
   * Calculate performance score based on various metrics
   */
  private static calculatePerformanceScore(certificates: number, courses: number, trainingHours: number): number {
    // Base score
    let score = 50;
    
    // Add points for certificates (up to 25 points)
    score += Math.min(certificates * 5, 25);
    
    // Add points for completed courses (up to 15 points)
    score += Math.min(courses * 3, 15);
    
    // Add points for training hours (up to 10 points)
    score += Math.min(trainingHours / 10, 10);
    
    return Math.min(Math.round(score), 100);
  }

  /**
   * Calculate compliance score for team members
   */
  private static async calculateComplianceScore(teamId: string): Promise<number> {
    try {
      const { data: memberData, error } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId)
        .eq('status', 'active');

      if (error || !memberData || memberData.length === 0) {
        return 85; // Default compliance score
      }

      // Check for compliance issues among team members
      const { data: complianceIssues, error: complianceError } = await supabase
        .from('compliance_issues')
        .select('user_id')
        .in('user_id', memberData.map(m => m.user_id))
        .eq('status', 'OPEN');

      if (complianceError) {
        return 85; // Default if can't check compliance
      }

      const totalMembers = memberData.length;
      const membersWithIssues = complianceIssues?.length || 0;
      const complianceRate = ((totalMembers - membersWithIssues) / totalMembers) * 100;

      return Math.round(complianceRate);
    } catch (error) {
      console.error('Error calculating compliance score:', error);
      return 85; // Default compliance score
    }
  }

  /**
   * Get default analytics when data can't be fetched
   */
  private static getDefaultAnalytics(): TeamAnalyticsData {
    return {
      certificatesIssued: 0,
      coursesCompleted: 0,
      trainingHours: 0,
      complianceScore: 85,
      performanceScore: 85
    };
  }
}