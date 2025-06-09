
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from './useProfile';
import { useTeamMemberships } from './useTeamMemberships';
import { DashboardDataService, type DashboardMetrics, type RecentActivity } from '@/services/dashboard/dashboardDataService';

export interface RoleBasedDashboardData {
  metrics: DashboardMetrics;
  recentActivities: RecentActivity[];
  isLoading: boolean;
  error: string | null;
  canViewSystemMetrics: boolean;
  canViewTeamMetrics: boolean;
  teamContext?: {
    teamId: string;
    teamName: string;
    locationName: string;
  };
}

export function useRoleBasedDashboardData(): RoleBasedDashboardData {
  const { user } = useAuth();
  const { data: profile, error: profileError } = useProfile();
  const { data: teamMemberships = [], error: teamError } = useTeamMemberships();

  const userRole = profile?.role;
  const userId = user?.id;
  const primaryTeam = teamMemberships[0]; // Use first team as primary

  console.log('🔧 DASHBOARD-DATA-HOOK: Hook state:', {
    userId,
    userRole,
    teamMemberships: teamMemberships.length,
    primaryTeam: primaryTeam?.team_id,
    profileError: profileError?.message,
    teamError: teamError?.message
  });

  // Determine access levels based on role
  const canViewSystemMetrics = userRole ? ['SA', 'AD'].includes(userRole) : false;
  const canViewTeamMetrics = !!primaryTeam && !canViewSystemMetrics;

  // Get metrics based on role and access level
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['dashboard-metrics', userId, userRole, primaryTeam?.team_id],
    queryFn: async () => {
      console.log('🔧 DASHBOARD-DATA-HOOK: Fetching metrics for role:', userRole);
      
      if (!userId || !userRole) {
        throw new Error('User not authenticated');
      }

      try {
        // System admins get global metrics
        if (canViewSystemMetrics) {
          console.log('🔧 DASHBOARD-DATA-HOOK: Fetching system admin metrics');
          return await DashboardDataService.getSystemAdminMetrics();
        }

        // Team members get team-scoped metrics
        if (canViewTeamMetrics && primaryTeam) {
          console.log('🔧 DASHBOARD-DATA-HOOK: Fetching team metrics for team:', primaryTeam.team_id);
          return await DashboardDataService.getTeamScopedMetrics(primaryTeam.team_id, userId);
        }

        // Instructors get instructor-specific metrics
        if (['IC', 'IP', 'IT'].includes(userRole)) {
          console.log('🔧 DASHBOARD-DATA-HOOK: Fetching instructor metrics');
          return await DashboardDataService.getInstructorMetrics(userId);
        }

        // Students and others get personal metrics
        console.log('🔧 DASHBOARD-DATA-HOOK: Fetching student metrics');
        return await DashboardDataService.getStudentMetrics(userId);
        
      } catch (error) {
        console.error('🔧 DASHBOARD-DATA-HOOK: Error in metrics query:', error);
        throw error;
      }
    },
    enabled: !!userId && !!userRole,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
    retry: (failureCount, error) => {
      console.log('🔧 DASHBOARD-DATA-HOOK: Query retry attempt:', failureCount, error.message);
      return failureCount < 2; // Only retry twice
    },
    retryDelay: 1000 // Wait 1 second between retries
  });

  // Get recent activities based on role and context
  const { data: recentActivities, isLoading: activitiesLoading, error: activitiesError } = useQuery({
    queryKey: ['dashboard-activities', userId, userRole, primaryTeam?.team_id],
    queryFn: async () => {
      console.log('🔧 DASHBOARD-DATA-HOOK: Fetching activities for role:', userRole);
      
      if (!userId || !userRole) {
        return [];
      }

      try {
        return await DashboardDataService.getRecentActivities(
          userId, 
          userRole, 
          canViewTeamMetrics ? primaryTeam?.team_id : undefined
        );
      } catch (error) {
        console.error('🔧 DASHBOARD-DATA-HOOK: Error in activities query:', error);
        return [];
      }
    },
    enabled: !!userId && !!userRole,
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    retry: 1 // Only retry once for activities
  });

  // Combine all errors
  const combinedError = metricsError?.message || activitiesError?.message || profileError?.message || teamError?.message || null;

  const result = {
    metrics: metrics || {},
    recentActivities: recentActivities || [],
    isLoading: metricsLoading || activitiesLoading,
    error: combinedError,
    canViewSystemMetrics,
    canViewTeamMetrics,
    teamContext: primaryTeam ? {
      teamId: primaryTeam.team_id,
      teamName: primaryTeam.teams?.name || 'Unknown Team',
      locationName: primaryTeam.teams?.locations?.name || 'No Location'
    } : undefined
  };

  console.log('🔧 DASHBOARD-DATA-HOOK: Hook result:', {
    hasMetrics: !!metrics,
    activitiesCount: recentActivities?.length || 0,
    isLoading: result.isLoading,
    error: result.error,
    canViewSystemMetrics,
    canViewTeamMetrics
  });

  return result;
}
