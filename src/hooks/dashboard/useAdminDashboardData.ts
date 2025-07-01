
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
  // Fix: make these arrays instead of numbers for proper data structure
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
  upcomingTraining: Array<{
    id: string;
    title: string;
    date: string;
    instructor: string;
  }>;
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
        complianceIssues: 3,
        recentActivities: [
          {
            id: '1',
            type: 'certification',
            description: 'New certificate issued to John Doe',
            timestamp: new Date().toISOString()
          },
          {
            id: '2', 
            type: 'training',
            description: 'First Aid course completed',
            timestamp: new Date().toISOString()
          }
        ],
        upcomingTraining: [
          {
            id: '1',
            title: 'CPR Certification',
            date: '2024-01-15',
            instructor: 'Jane Smith'
          },
          {
            id: '2',
            title: 'Advanced First Aid',
            date: '2024-01-20',
            instructor: 'Mike Johnson'
          }
        ]
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
