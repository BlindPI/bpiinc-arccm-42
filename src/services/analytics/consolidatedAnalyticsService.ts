/**
 * CONSOLIDATED ANALYTICS SERVICE - PHASE 3 CLEAN FOUNDATION
 * 
 * Replaces multiple redundant analytics services with a single, optimized service
 * Uses the real database functions and consistent data patterns
 */

import { supabase } from '@/integrations/supabase/client';
import { realTeamDataService } from '@/services/team/realTeamDataService';

export interface ConsolidatedAnalytics {
  // System-wide metrics
  systemMetrics: {
    totalTeams: number;
    totalMembers: number;
    averagePerformance: number;
    averageCompliance: number;
    activeBulkOps: number;
  };
  
  // Performance analytics
  performanceMetrics: {
    topPerformingTeams: Array<{
      id: string;
      name: string;
      performance_score: number;
      member_count: number;
    }>;
    performanceDistribution: {
      excellent: number; // 90-100%
      good: number;      // 70-89%
      average: number;   // 50-69%
      poor: number;      // <50%
    };
  };
  
  // Team analytics
  teamAnalytics: {
    teamsByLocation: Record<string, number>;
    teamsByType: Record<string, number>;
    membershipTrends: Array<{
      month: string;
      totalMembers: number;
      newMembers: number;
      activeTeams: number;
    }>;
  };
}

export interface TeamDetailedAnalytics {
  teamId: string;
  teamName: string;
  performanceScore: number;
  complianceScore: number;
  memberCount: number;
  activeMemberCount: number;
  recentActivity: Array<{
    type: 'member_added' | 'member_removed' | 'performance_update';
    timestamp: string;
    details: string;
  }>;
  monthlyMetrics: Array<{
    month: string;
    memberCount: number;
    performanceScore: number;
    complianceScore: number;
  }>;
}

class ConsolidatedAnalyticsService {
  // Cache for reducing database calls
  private static cache: Map<string, { data: any; timestamp: number }> = new Map();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private static getCacheKey(operation: string, params?: any): string {
    return `${operation}_${JSON.stringify(params || {})}`;
  }

  private static getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private static setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Get comprehensive system analytics - replaces multiple redundant calls
   */
  static async getSystemAnalytics(): Promise<ConsolidatedAnalytics> {
    const cacheKey = this.getCacheKey('system_analytics');
    const cached = this.getCachedData<ConsolidatedAnalytics>(cacheKey);
    if (cached) return cached;

    try {
      // Use the consolidated real team data service
      const systemData = await realTeamDataService.getSystemAnalytics();
      
      // Get additional team details for performance analysis
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, performance_score, status')
        .eq('status', 'active')
        .order('performance_score', { ascending: false });

      if (teamsError) throw teamsError;

      // Get location distribution
      const { data: locations, error: locationsError } = await supabase
        .from('teams')
        .select('location_id, locations(name)')
        .eq('status', 'active');

      if (locationsError) throw locationsError;

      // Process performance distribution
      const performanceDistribution = {
        excellent: teams?.filter(t => (t.performance_score || 0) >= 90).length || 0,
        good: teams?.filter(t => (t.performance_score || 0) >= 70 && (t.performance_score || 0) < 90).length || 0,
        average: teams?.filter(t => (t.performance_score || 0) >= 50 && (t.performance_score || 0) < 70).length || 0,
        poor: teams?.filter(t => (t.performance_score || 0) < 50).length || 0,
      };

      // Process location distribution
      const locationCounts: Record<string, number> = {};
      locations?.forEach(team => {
        const locationName = team.locations?.name || 'No Location';
        locationCounts[locationName] = (locationCounts[locationName] || 0) + 1;
      });

      // Get team member counts for top performers
      const topTeamsWithMembers = await Promise.all(
        (teams?.slice(0, 5) || []).map(async (team) => {
          const { data: members } = await supabase
            .from('team_members')
            .select('id')
            .eq('team_id', team.id)
            .eq('status', 'active');
          
          return {
            id: team.id,
            name: team.name,
            performance_score: team.performance_score || 0,
            member_count: members?.length || 0
          };
        })
      );

      const analytics: ConsolidatedAnalytics = {
        systemMetrics: {
          totalTeams: systemData.totalTeams,
          totalMembers: systemData.totalMembers,
          averagePerformance: systemData.averagePerformance,
          averageCompliance: systemData.averageCompliance,
          activeBulkOps: 0 // Will be updated if needed
        },
        performanceMetrics: {
          topPerformingTeams: topTeamsWithMembers,
          performanceDistribution
        },
        teamAnalytics: {
          teamsByLocation: locationCounts,
          teamsByType: systemData.performance_by_team_type || { operational: systemData.averagePerformance },
          membershipTrends: [] // Can be populated with historical data if needed
        }
      };

      this.setCachedData(cacheKey, analytics);
      return analytics;
    } catch (error) {
      console.error('Failed to fetch consolidated analytics:', error);
      throw error;
    }
  }

  /**
   * Get detailed analytics for a specific team
   */
  static async getTeamDetailedAnalytics(teamId: string): Promise<TeamDetailedAnalytics> {
    const cacheKey = this.getCacheKey('team_analytics', { teamId });
    const cached = this.getCachedData<TeamDetailedAnalytics>(cacheKey);
    if (cached) return cached;

    try {
      // Get team basic info
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id, name, performance_score, status')
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;

      // Get team members
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('id, status, created_at')
        .eq('team_id', teamId);

      if (membersError) throw membersError;

      const activeMembers = members?.filter(m => m.status === 'active') || [];

      // Get recent activity (simplified for now)
      const recentActivity = members?.slice(0, 5).map(member => ({
        type: 'member_added' as const,
        timestamp: member.created_at || new Date().toISOString(),
        details: `Member joined the team`
      })) || [];

      const analytics: TeamDetailedAnalytics = {
        teamId: team.id,
        teamName: team.name,
        performanceScore: team.performance_score || 0,
        complianceScore: 90, // Default compliance score
        memberCount: members?.length || 0,
        activeMemberCount: activeMembers.length,
        recentActivity,
        monthlyMetrics: [] // Can be populated with historical data
      };

      this.setCachedData(cacheKey, analytics);
      return analytics;
    } catch (error) {
      console.error('Failed to fetch team detailed analytics:', error);
      throw error;
    }
  }

  /**
   * Clear all cached data
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get analytics for authorized providers (AP users)
   */
  static async getProviderAnalytics(userId: string): Promise<any> {
    try {
      // Get provider info
      const { data: provider, error: providerError } = await supabase
        .from('authorized_providers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (providerError) throw providerError;
      if (!provider) return null;

      // Get provider's assigned teams
      const { data: assignments, error: assignmentsError } = await supabase
        .from('provider_team_assignments')
        .select('team_id, teams(name, performance_score)')
        .eq('provider_id', provider.id)
        .eq('status', 'active');

      if (assignmentsError) throw assignmentsError;

      return {
        providerId: provider.id,
        providerName: provider.name,
        assignedTeams: assignments?.length || 0,
        averageTeamPerformance: assignments?.length 
          ? Math.round(assignments.reduce((sum, a) => sum + (a.teams?.performance_score || 0), 0) / assignments.length)
          : 0,
        complianceScore: provider.compliance_score || 0,
        performanceRating: provider.performance_rating || 0
      };
    } catch (error) {
      console.error('Failed to fetch provider analytics:', error);
      throw error;
    }
  }
}

export { ConsolidatedAnalyticsService };