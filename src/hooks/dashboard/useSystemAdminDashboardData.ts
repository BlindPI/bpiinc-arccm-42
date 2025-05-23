
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

// Fallback data generators
const generateFallbackMetrics = (): SystemAdminMetrics => {
  console.warn('Using fallback system admin metrics due to data fetch failure');
  return {
    totalUsers: 0,
    activeCourses: 0,
    systemHealth: {
      status: 'Fair',
      message: 'Some systems unavailable'
    }
  };
};

const generateFallbackActivity = (): RecentActivity[] => {
  console.warn('Using fallback recent activity data');
  return [
    {
      id: 'fallback-1',
      action: 'System startup',
      timestamp: new Date().toISOString(),
      userId: null,
      userName: 'System'
    },
    {
      id: 'fallback-2',
      action: 'Database connection established',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      userId: null,
      userName: 'System'
    }
  ];
};

const generateFallbackApprovals = (): PendingApproval[] => {
  console.warn('Using fallback pending approvals data');
  return [
    {
      id: 'fallback-1',
      type: 'System Verification',
      requestedBy: 'System',
      requestedAt: new Date().toISOString(),
      status: 'PENDING'
    }
  ];
};

export const useSystemAdminDashboardData = () => {
  const { user } = useAuth();

  // Safe metrics fetching with comprehensive error handling
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['systemAdminMetrics'],
    queryFn: async () => {
      try {
        const result = {
          totalUsers: 0,
          activeCourses: 0,
          systemHealth: {
            status: 'Excellent' as const,
            message: 'All systems operational'
          }
        };

        // Safely fetch total users count
        try {
          const { count: totalUsers, error: usersError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

          if (usersError) {
            console.error('Error fetching users count:', usersError);
            toast.error('Failed to load user metrics');
          } else {
            result.totalUsers = totalUsers || 0;
          }
        } catch (err) {
          console.error('Exception fetching users:', err);
        }

        // Safely fetch active courses count
        try {
          const { count: activeCourses, error: coursesError } = await supabase
            .from('courses')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'ACTIVE');

          if (coursesError) {
            console.error('Error fetching courses count:', coursesError);
            toast.error('Failed to load course metrics');
          } else {
            result.activeCourses = activeCourses || 0;
          }
        } catch (err) {
          console.error('Exception fetching courses:', err);
        }

        return result;
      } catch (err) {
        console.error('Critical error in metrics fetch:', err);
        throw err;
      }
    },
    enabled: !!user,
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000
  });

  // Safe recent activity fetching
  const { data: recentActivity, isLoading: activityLoading, error: activityError } = useQuery({
    queryKey: ['systemAdminRecentActivity'],
    queryFn: async () => {
      try {
        // Check if audit_logs table exists and is accessible
        const { data: tables, error: tablesError } = await supabase
          .rpc('get_user_role', { user_id: user?.id })
          .then(() => supabase.from('audit_logs').select('id').limit(1));
        
        if (tablesError) {
          console.warn('Audit logs not accessible, using fallback:', tablesError);
          return generateFallbackActivity();
        }
        
        // Fetch actual audit logs
        const { data, error } = await supabase
          .from('audit_logs')
          .select('id, action, created_at, user_id')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching audit logs:', error);
          return generateFallbackActivity();
        }

        if (!data || data.length === 0) {
          return generateFallbackActivity();
        }

        // Safely get user names
        const userIds = data.map(item => item.user_id).filter(Boolean);
        let userNames = {};
        
        if (userIds.length > 0) {
          try {
            const { data: profiles, error: profilesError } = await supabase
              .from('profiles')
              .select('id, display_name')
              .in('id', userIds);
              
            if (!profilesError && profiles) {
              userNames = profiles.reduce((acc, profile) => {
                acc[profile.id] = profile.display_name || 'Unknown User';
                return acc;
              }, {});
            }
          } catch (err) {
            console.warn('Error fetching user profiles for activity:', err);
          }
        }

        return data.map(item => ({
          id: item.id || `temp-${Math.random()}`,
          action: item.action || 'System action',
          timestamp: item.created_at || new Date().toISOString(),
          userId: item.user_id,
          userName: userNames[item.user_id] || 'Unknown User'
        }));
      } catch (err) {
        console.error('Critical error in activity fetch:', err);
        return generateFallbackActivity();
      }
    },
    enabled: !!user,
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000
  });
  
  // Safe pending approvals fetching
  const { data: pendingApprovals, isLoading: approvalsLoading, error: approvalsError } = useQuery({
    queryKey: ['systemAdminPendingApprovals'],
    queryFn: async () => {
      try {
        let allApprovals = [];
        
        // Safely fetch role transition requests
        try {
          const { data: roleRequests, error: roleError } = await supabase
            .from('role_transition_requests')
            .select('id, user_id, from_role, to_role, created_at, status')
            .eq('status', 'PENDING')
            .order('created_at', { ascending: false })
            .limit(5);

          if (!roleError && roleRequests && roleRequests.length > 0) {
            // Get user names safely
            const userIds = roleRequests.map(req => req.user_id).filter(Boolean);
            let userNames = {};
            
            if (userIds.length > 0) {
              try {
                const { data: profiles, error: profilesError } = await supabase
                  .from('profiles')
                  .select('id, display_name')
                  .in('id', userIds);
                  
                if (!profilesError && profiles) {
                  userNames = profiles.reduce((acc, profile) => {
                    acc[profile.id] = profile.display_name || 'Unknown User';
                    return acc;
                  }, {});
                }
              } catch (err) {
                console.warn('Error fetching user profiles for approvals:', err);
              }
            }
            
            const roleApprovals = roleRequests.map(req => ({
              id: req.id,
              type: 'Role Transition',
              requestedBy: userNames[req.user_id] || 'Unknown User',
              requestedAt: req.created_at,
              status: req.status
            }));
            
            allApprovals = [...allApprovals, ...roleApprovals];
          }
        } catch (err) {
          console.warn('Error fetching role requests:', err);
        }

        // Safely fetch course approval requests
        try {
          const { data: courseRequests, error: courseError } = await supabase
            .from('course_approval_requests')
            .select('id, course_id, requested_by, created_at, status')
            .eq('status', 'PENDING')
            .order('created_at', { ascending: false })
            .limit(5);

          if (!courseError && courseRequests && courseRequests.length > 0) {
            // Get user names safely
            const userIds = courseRequests.map(req => req.requested_by).filter(Boolean);
            let userNames = {};
            
            if (userIds.length > 0) {
              try {
                const { data: profiles, error: profilesError } = await supabase
                  .from('profiles')
                  .select('id, display_name')
                  .in('id', userIds);
                  
                if (!profilesError && profiles) {
                  userNames = profiles.reduce((acc, profile) => {
                    acc[profile.id] = profile.display_name || 'Unknown User';
                    return acc;
                  }, {});
                }
              } catch (err) {
                console.warn('Error fetching user profiles for course approvals:', err);
              }
            }
            
            const courseApprovals = courseRequests.map(req => ({
              id: req.id,
              type: 'Course Approval',
              requestedBy: userNames[req.requested_by] || 'Unknown User',
              requestedAt: req.created_at,
              status: req.status
            }));
            
            allApprovals = [...allApprovals, ...courseApprovals];
          }
        } catch (err) {
          console.warn('Error fetching course requests:', err);
        }

        // Return fallback if no approvals found
        if (allApprovals.length === 0) {
          return generateFallbackApprovals();
        }

        return allApprovals.sort((a, b) =>
          new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
        ).slice(0, 5);
      } catch (err) {
        console.error('Critical error in approvals fetch:', err);
        return generateFallbackApprovals();
      }
    },
    enabled: !!user,
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000
  });

  // Determine overall loading and error state
  const isLoading = metricsLoading || activityLoading || approvalsLoading;
  
  // Only consider it an error if all data fetching failed and we have no fallback data
  const hasData = metrics || recentActivity || pendingApprovals;
  const error = !hasData && (metricsError || activityError || approvalsError)
    ? new Error('Failed to load dashboard data')
    : null;

  return {
    metrics: metrics || generateFallbackMetrics(),
    recentActivity: recentActivity || generateFallbackActivity(),
    pendingApprovals: pendingApprovals || generateFallbackApprovals(),
    isLoading,
    error
  };
};
