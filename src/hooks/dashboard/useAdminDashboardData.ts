
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

interface TeamMetrics {
  totalMembers: number;
  activeCertificates: number;
  completionRate: number;
  trainingHours: number;
  organizationUsers: number;
  expiringSoon: number;
  complianceIssues: number;
}

interface DashboardAccess {
  canViewReports: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
}

export const useAdminDashboardData = () => {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-dashboard-data', user?.id],
    queryFn: async () => {
      // Mock data - replace with actual API calls
      const metrics: TeamMetrics = {
        totalMembers: 150,
        activeCertificates: 1250,
        completionRate: 87.5,
        trainingHours: 3420,
        organizationUsers: 245,
        expiringSoon: 12,
        complianceIssues: 3
      };

      const dashboardAccess: DashboardAccess = {
        canViewReports: user?.profile?.role === 'SA' || user?.profile?.role === 'AD',
        canManageUsers: user?.profile?.role === 'SA' || user?.profile?.role === 'AD',
        canViewAnalytics: user?.profile?.role === 'SA' || user?.profile?.role === 'AD'
      };

      const canAccessGlobalAnalytics = user?.profile?.role === 'SA' || user?.profile?.role === 'AD';
      const isTeamRestricted = user?.profile?.role === 'TL';
      const dashboardType = user?.profile?.role === 'SA' ? 'executive' : 'operational';

      return {
        metrics,
        dashboardAccess,
        canAccessGlobalAnalytics,
        isTeamRestricted,
        dashboardType,
        pendingApprovals: 5,
        complianceStatus: 'good',
        error: null
      };
    },
    enabled: !!user
  });

  return {
    ...data,
    isLoading,
    error,
    refetch
  };
};
