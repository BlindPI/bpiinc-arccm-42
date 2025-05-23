import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SystemAdminMetrics {
  totalUsers: number;
  activeCourses: number;
  systemHealth: {
    status: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    message: string;
  };
}

export interface RecentActivity {
  id: string;
  action: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}

export interface PendingApproval {
  id: string;
  type: string;
  requestedBy: string;
  requestedAt: string;
  status: string;
}

export const useSystemAdminDashboardData = () => {
  const { user } = useAuth();

  // Fetch system metrics
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['systemAdminMetrics'],
    queryFn: async () => {
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

      // Check system health
      // This could be expanded to check various system components
      const systemHealth = {
        status: 'Excellent' as const,
        message: 'All systems operational'
      };

      return {
        totalUsers: totalUsers || 0,
        activeCourses: activeCourses || 0,
        systemHealth
      };
    },
    enabled: !!user
  });

  // Fetch recent activity
  const { data: recentActivity, isLoading: activityLoading, error: activityError } = useQuery({
    queryKey: ['systemAdminRecentActivity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          id,
          action,
          created_at,
          user_id,
          profiles(display_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        action: item.action,
        timestamp: item.created_at,
        userId: item.user_id,
        userName: item.profiles?.display_name
      }));
    },
    enabled: !!user
  });

  // Fetch pending approvals
  const { data: pendingApprovals, isLoading: approvalsLoading, error: approvalsError } = useQuery({
    queryKey: ['systemAdminPendingApprovals'],
    queryFn: async () => {
      // Fetch role transition requests
      const { data: roleRequests, error: roleError } = await supabase
        .from('role_transition_requests')
        .select(`
          id,
          user_id,
          from_role,
          to_role,
          created_at,
          status,
          profiles(display_name)
        `)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })
        .limit(5);

      if (roleError) throw roleError;

      // Fetch course approval requests
      const { data: courseRequests, error: courseError } = await supabase
        .from('course_approval_requests')
        .select(`
          id,
          course_id,
          requested_by,
          created_at,
          status,
          profiles(display_name)
        `)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })
        .limit(5);

      if (courseError) throw courseError;

      // Combine and format the requests
      const roleApprovals = roleRequests.map(req => ({
        id: req.id,
        type: 'Role Transition',
        requestedBy: req.profiles?.display_name || 'Unknown',
        requestedAt: req.created_at,
        status: req.status
      }));

      const courseApprovals = courseRequests.map(req => ({
        id: req.id,
        type: 'Course Approval',
        requestedBy: req.profiles?.display_name || 'Unknown',
        requestedAt: req.created_at,
        status: req.status
      }));

      return [...roleApprovals, ...courseApprovals].sort((a, b) => 
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      ).slice(0, 5);
    },
    enabled: !!user
  });

  const isLoading = metricsLoading || activityLoading || approvalsLoading;
  const error = metricsError || activityError || approvalsError;

  return {
    metrics,
    recentActivity,
    pendingApprovals,
    isLoading,
    error
  };
};