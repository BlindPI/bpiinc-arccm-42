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
    locationCity?: string;
    locationState?: string;
    locationAddress?: string;
    apUserName?: string;
    apUserEmail?: string;
    apUserPhone?: string;
  };
}

export function useRoleBasedDashboardData(): RoleBasedDashboardData {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: teamMemberships = [] } = useTeamMemberships();

  const userRole = profile?.role;
  const userId = user?.id;
  const primaryTeam = teamMemberships[0]; // Use first team as primary

  console.log('🔍 useRoleBasedDashboardData - Debug Info:', {
    userId,
    userRole,
    teamMemberships: teamMemberships.length,
    primaryTeam: primaryTeam ? {
      team_id: primaryTeam.team_id,
      role: primaryTeam.role
    } : 'None'
  });

  // Determine access levels based on role
  const canViewSystemMetrics = userRole ? ['SA', 'AD'].includes(userRole) : false;
  const isAPUser = userRole === 'AP';
  const canViewTeamMetrics = (!!primaryTeam && !canViewSystemMetrics) || isAPUser;

  // Get metrics based on role and access level
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['dashboard-metrics', userId, userRole, primaryTeam?.team_id],
    queryFn: async () => {
      if (!userId || !userRole) {
        throw new Error('User not authenticated');
      }

      // System admins get global metrics
      if (canViewSystemMetrics) {
        return DashboardDataService.getSystemAdminMetrics();
      }

      // AP users get location-based metrics
      if (isAPUser) {
        return DashboardDataService.getAPUserMetrics(userId);
      }

      // Team members get team-scoped metrics
      if (canViewTeamMetrics && primaryTeam) {
        return DashboardDataService.getTeamScopedMetrics(primaryTeam.team_id, userId);
      }

      // Instructors get instructor-specific metrics
      if (['IC', 'IP', 'IT'].includes(userRole)) {
        return DashboardDataService.getInstructorMetrics(userId);
      }

      // Students and others get personal metrics
      return DashboardDataService.getStudentMetrics(userId);
    },
    enabled: !!userId && !!userRole,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000 // Consider data stale after 2 minutes
  });

  // Get recent activities based on role and context
  const { data: recentActivities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['dashboard-activities', userId, userRole, primaryTeam?.team_id],
    queryFn: async () => {
      if (!userId || !userRole) {
        return [];
      }

      return DashboardDataService.getRecentActivities(
        userId, 
        userRole, 
        canViewTeamMetrics && !isAPUser ? primaryTeam?.team_id : undefined
      );
    },
    enabled: !!userId && !!userRole,
    refetchInterval: 10 * 60 * 1000 // Refetch every 10 minutes
  });

  // For AP users, create a team context based on their location
  const getTeamContext = () => {
    if (isAPUser && metrics) {
      return {
        teamId: 'ap-location', // Placeholder ID for AP users
        teamName: metrics.locationName || 'Location Dashboard',
        locationName: metrics.locationName || 'No Location',
        locationCity: metrics.locationCity,
        locationState: metrics.locationState,
        locationAddress: metrics.locationAddress,
        apUserName: metrics.apUserName,
        apUserEmail: metrics.apUserEmail,
        apUserPhone: metrics.apUserPhone
      };
    }
    
    if (primaryTeam && metrics) {
      return {
        teamId: primaryTeam.team_id,
        teamName: metrics.locationName || 'Unknown Team',
        locationName: metrics.locationName || 'No Location',
        locationCity: metrics.locationCity,
        locationState: metrics.locationState,
        locationAddress: metrics.locationAddress,
        apUserName: metrics.apUserName,
        apUserEmail: metrics.apUserEmail,
        apUserPhone: metrics.apUserPhone
      };
    }
    
    return undefined;
  };

  return {
    metrics: metrics || {},
    recentActivities: recentActivities || [],
    isLoading: metricsLoading || activitiesLoading,
    error: metricsError?.message || null,
    canViewSystemMetrics,
    canViewTeamMetrics: canViewTeamMetrics || isAPUser,
    teamContext: getTeamContext()
  };
}
