
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SystemAdminMetrics {
  totalUsers: number;
  activeCourses: number;
  systemHealth: {
    status: string;
    message: string;
  };
}

export interface RecentActivity {
  id: string;
  action: string;
  timestamp: string;
  userId?: string;
}

export interface PendingApproval {
  id: string;
  type: string;
  requesterName?: string;
  createdAt: string;
}

export const useSystemAdminDashboardData = () => {
  // Get system metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['system-admin-metrics'],
    queryFn: async () => {
      try {
        // Get total users count
        const { count: totalUsers, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (usersError) throw usersError;

        // Get active courses count
        const { count: activeCourses, error: coursesError } = await supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'ACTIVE');

        if (coursesError) throw coursesError;

        return {
          totalUsers: totalUsers || 0,
          activeCourses: activeCourses || 0,
          systemHealth: {
            status: 'Healthy',
            message: 'All systems operational'
          }
        };
      } catch (error) {
        console.error('Error fetching system admin metrics:', error);
        throw error;
      }
    }
  });

  // Get recent activity from audit logs
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['system-admin-activity'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('id, action, created_at, user_id')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        return data?.map(item => ({
          id: item.id,
          action: item.action,
          timestamp: item.created_at,
          userId: item.user_id
        })) || [];
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        return [];
      }
    }
  });

  // Get pending approvals
  const { data: pendingApprovals, isLoading: approvalsLoading } = useQuery({
    queryKey: ['system-admin-approvals'],
    queryFn: async () => {
      try {
        const approvals: PendingApproval[] = [];

        // Certificate requests pending approval
        const { data: certRequests, error: certError } = await supabase
          .from('certificate_requests')
          .select('id, recipient_name, created_at')
          .eq('status', 'PENDING')
          .limit(5);

        if (!certError && certRequests) {
          approvals.push(...certRequests.map(req => ({
            id: req.id,
            type: 'Certificate Request',
            requesterName: req.recipient_name,
            createdAt: req.created_at
          })));
        }

        // Role transition requests
        const { data: roleRequests, error: roleError } = await supabase
          .from('role_transition_requests')
          .select(`
            id,
            created_at,
            profiles!role_transition_requests_user_id_fkey(display_name)
          `)
          .eq('status', 'PENDING')
          .limit(5);

        if (!roleError && roleRequests) {
          approvals.push(...roleRequests.map(req => ({
            id: req.id,
            type: 'Role Transition',
            requesterName: req.profiles?.display_name || 'Unknown',
            createdAt: req.created_at
          })));
        }

        return approvals.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } catch (error) {
        console.error('Error fetching pending approvals:', error);
        return [];
      }
    }
  });

  return {
    metrics,
    recentActivity: recentActivity || [],
    pendingApprovals: pendingApprovals || [],
    isLoading: metricsLoading || activityLoading || approvalsLoading,
    error: null
  };
};
