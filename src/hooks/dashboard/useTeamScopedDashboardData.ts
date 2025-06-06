import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { TeamScopedAnalyticsService } from '@/services/analytics/teamScopedAnalyticsService';

export interface PendingApproval {
  id: string;
  type: string;
  requesterName?: string;
}

export interface ComplianceStatus {
  id: string;
  name: string;
  complianceRate: number;
  status: 'compliant' | 'warning' | 'critical';
}

export const useTeamScopedDashboardData = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  // Get user's dashboard access level
  const { data: dashboardAccess, isLoading: accessLoading } = useQuery({
    queryKey: ['dashboard-access', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return TeamScopedAnalyticsService.getUserDashboardAccess(user.id);
    },
    enabled: !!user?.id
  });

  // Get team-scoped metrics
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery({
    queryKey: ['team-scoped-metrics', user?.id, profile?.role],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return TeamScopedAnalyticsService.getTeamScopedMetrics(user.id);
    },
    enabled: !!user?.id && !!profile,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Get pending approvals (simplified for now)
  const { data: pendingApprovals, isLoading: approvalsLoading } = useQuery({
    queryKey: ['team-scoped-pending-approvals', user?.id, dashboardAccess?.dashboardType],
    queryFn: async () => {
      if (!user?.id || !dashboardAccess) return [];
      
      try {
        const approvals: PendingApproval[] = [];

        // Only SA and AD users can see certificate requests for now
        if (dashboardAccess.canAccessMultiTeam) {
          const { data: certRequests, error: certError } = await supabase
            .from('certificate_requests')
            .select('id, recipient_name')
            .eq('status', 'PENDING')
            .limit(5);

          if (!certError && certRequests) {
            approvals.push(...certRequests.map(req => ({
              id: req.id,
              type: 'Certificate Request',
              requesterName: req.recipient_name
            })));
          }
        }

        return approvals;
      } catch (error) {
        console.error('Error fetching pending approvals:', error);
        return [];
      }
    },
    enabled: !!user?.id && !!dashboardAccess
  });

  // Get compliance status (simplified for now)
  const { data: complianceStatus, isLoading: complianceLoading } = useQuery({
    queryKey: ['team-scoped-compliance-status', user?.id, dashboardAccess?.dashboardType],
    queryFn: async () => {
      if (!user?.id || !dashboardAccess) return [];

      try {
        // Only show compliance data for users who can access multi-team analytics
        if (!dashboardAccess.canAccessMultiTeam) {
          return [];
        }

        // Get instructors and their compliance
        const { data: instructors, error } = await supabase
          .from('profiles')
          .select('id, display_name, role')
          .in('role', ['IT', 'IP', 'IC']);

        if (error) throw error;

        const complianceData: ComplianceStatus[] = [];

        for (const instructor of instructors || []) {
          // Calculate compliance based on recent teaching activity
          const { count: recentSessions } = await supabase
            .from('teaching_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('instructor_id', instructor.id)
            .gte('session_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

          const complianceRate = Math.min((recentSessions || 0) * 20, 100);
          const status = complianceRate >= 80 ? 'compliant' : 
                        complianceRate >= 60 ? 'warning' : 'critical';

          complianceData.push({
            id: instructor.id,
            name: instructor.display_name || 'Unknown',
            complianceRate,
            status
          });
        }

        return complianceData.slice(0, 5);
      } catch (error) {
        console.error('Error fetching compliance status:', error);
        return [];
      }
    },
    enabled: !!user?.id && !!dashboardAccess
  });

  const isLoading = accessLoading || metricsLoading || approvalsLoading || complianceLoading;

  return {
    // Metrics data
    metrics,
    pendingApprovals: pendingApprovals || [],
    complianceStatus: complianceStatus || [],
    
    // Access control
    dashboardAccess,
    canAccessGlobalAnalytics: dashboardAccess?.canAccessGlobal || false,
    canAccessMultiTeamAnalytics: dashboardAccess?.canAccessMultiTeam || false,
    isTeamRestricted: dashboardAccess?.isTeamRestricted || true,
    dashboardType: dashboardAccess?.dashboardType || 'team_scoped',
    
    // Loading states
    isLoading,
    error: null,
    
    // Refetch function
    refetch: refetchMetrics
  };
};

// Import supabase for the queries above
import { supabase } from '@/integrations/supabase/client';