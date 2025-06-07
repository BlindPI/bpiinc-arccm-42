
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/AuthProvider';

interface TeamMetrics {
  totalMembers: number;
  activeCertificates: number;
  completionRate: number;
  trainingHours: number;
}

interface DashboardAccess {
  canViewReports: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
}

export const useAdminDashboardData = () => {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-dashboard-data', user?.id],
    queryFn: async () => {
      // Mock data - replace with actual API calls
      const metrics: TeamMetrics = {
        totalMembers: 150,
        activeCertificates: 1250,
        completionRate: 87.5,
        trainingHours: 3420
      };

      const dashboardAccess: DashboardAccess = {
        canViewReports: user?.role === 'SA' || user?.role === 'AD',
        canManageUsers: user?.role === 'SA' || user?.role === 'AD',
        canViewAnalytics: user?.role === 'SA' || user?.role === 'AD'
      };

      const canAccessGlobalAnalytics = user?.role === 'SA' || user?.role === 'AD';
      const isTeamRestricted = user?.role === 'TL';
      const dashboardType = user?.role === 'SA' ? 'executive' : 'operational';

      return {
        metrics,
        dashboardAccess,
        canAccessGlobalAnalytics,
        isTeamRestricted,
        dashboardType,
      };
    },
    enabled: !!user
  });

  return {
    ...data,
    isLoading,
    refetch
  };
};
