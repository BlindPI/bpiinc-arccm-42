
import { useQuery } from '@tanstack/react-query';
import { useProfile } from '@/hooks/useProfile';

export interface TeamMetrics {
  organizationUsers: number;
  activeCertifications: number;
  expiringSoon: number;
  complianceIssues: number;
}

export interface DashboardAccess {
  canAccessGlobalAnalytics: boolean;
  isTeamRestricted: boolean;
  dashboardType: string;
}

export function useTeamScopedDashboardData() {
  const { data: profile } = useProfile();

  // Determine access level based on user role
  const canAccessGlobalAnalytics = profile?.role === 'SA'; // System Admin only
  const isTeamRestricted = !canAccessGlobalAnalytics;
  const dashboardType = canAccessGlobalAnalytics ? 'Global Analytics' : 'Team Dashboard';

  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ['team-dashboard-metrics', profile?.id],
    queryFn: async (): Promise<TeamMetrics> => {
      // Mock metrics for team dashboard
      return {
        organizationUsers: 25,
        activeCertifications: 145,
        expiringSoon: 8,
        complianceIssues: 2
      };
    },
    enabled: !!profile
  });

  return {
    metrics: metrics || {
      organizationUsers: 0,
      activeCertifications: 0,
      expiringSoon: 0,
      complianceIssues: 0
    },
    dashboardAccess: {
      canAccessGlobalAnalytics,
      isTeamRestricted,
      dashboardType
    } as DashboardAccess,
    canAccessGlobalAnalytics,
    isTeamRestricted,
    dashboardType,
    isLoading,
    refetch
  };
}
