
import { useQuery } from '@tanstack/react-query';

export interface SystemAdminMetrics {
  totalUsers: number;
  activeCourses: number;
  totalCertificates: number;
  pendingRequests: number;
  systemHealth: {
    status: string;
    message: string;
  };
}

export function useSystemAdminDashboardData() {
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['system-admin-metrics'],
    queryFn: async (): Promise<SystemAdminMetrics> => {
      return {
        totalUsers: 1247,
        activeCourses: 89,
        totalCertificates: 3456,
        pendingRequests: 23,
        systemHealth: {
          status: 'healthy',
          message: 'All systems operational'
        }
      };
    }
  });

  const { data: recentActivity = [], isLoading: activityLoading } = useQuery({
    queryKey: ['system-admin-activity'],
    queryFn: async () => {
      return [
        { 
          id: '1', 
          action: 'User registration', 
          timestamp: new Date().toISOString(),
          requesterName: 'John Doe',
          createdAt: new Date().toISOString()
        },
        { 
          id: '2', 
          action: 'Certificate issued', 
          timestamp: new Date().toISOString(),
          requesterName: 'Jane Smith',
          createdAt: new Date().toISOString()
        }
      ];
    }
  });

  const { data: pendingApprovals = [], isLoading: approvalsLoading } = useQuery({
    queryKey: ['system-admin-approvals'],
    queryFn: async () => {
      return [
        { 
          id: '1', 
          type: 'provider_approval', 
          requester: 'John Doe',
          requesterName: 'John Doe',
          createdAt: new Date().toISOString()
        },
        { 
          id: '2', 
          type: 'course_approval', 
          requester: 'Jane Smith',
          requesterName: 'Jane Smith',
          createdAt: new Date().toISOString()
        }
      ];
    }
  });

  return {
    metrics,
    recentActivity,
    pendingApprovals,
    isLoading: metricsLoading || activityLoading || approvalsLoading,
    error: metricsError?.message || null
  };
}
