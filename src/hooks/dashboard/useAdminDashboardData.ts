
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AdminMetrics {
  organizationUsers: number;
  activeCertifications: number;
  expiringSoon: number;
  complianceIssues: number;
}

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

export const useAdminDashboardData = () => {
  const { user } = useAuth();

  // Get admin metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['admin-metrics', user?.id],
    queryFn: async () => {
      try {
        // Get organization users count (simplified - all users for now)
        const { count: organizationUsers, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'ACTIVE');

        if (usersError) throw usersError;

        // Get active certifications
        const { count: activeCertifications, error: certsError } = await supabase
          .from('certificates')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'ACTIVE');

        if (certsError) throw certsError;

        // Get expiring certificates (within 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const { data: expiringCerts, error: expiringError } = await supabase
          .from('certificates')
          .select('expiry_date')
          .eq('status', 'ACTIVE');

        if (expiringError) throw expiringError;

        let expiringSoon = 0;
        if (expiringCerts) {
          expiringSoon = expiringCerts.filter(cert => {
            try {
              const expiryDate = new Date(cert.expiry_date);
              return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
            } catch {
              return false;
            }
          }).length;
        }

        // Get compliance issues
        const { count: complianceIssues, error: complianceError } = await supabase
          .from('compliance_issues')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'OPEN');

        if (complianceError) throw complianceError;

        return {
          organizationUsers: organizationUsers || 0,
          activeCertifications: activeCertifications || 0,
          expiringSoon,
          complianceIssues: complianceIssues || 0
        };
      } catch (error) {
        console.error('Error fetching admin metrics:', error);
        throw error;
      }
    },
    enabled: !!user
  });

  // Get pending approvals
  const { data: pendingApprovals, isLoading: approvalsLoading } = useQuery({
    queryKey: ['admin-pending-approvals', user?.id],
    queryFn: async () => {
      try {
        const approvals: PendingApproval[] = [];

        // Certificate requests
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

        return approvals;
      } catch (error) {
        console.error('Error fetching pending approvals:', error);
        return [];
      }
    },
    enabled: !!user
  });

  // Get compliance status
  const { data: complianceStatus, isLoading: complianceLoading } = useQuery({
    queryKey: ['admin-compliance-status', user?.id],
    queryFn: async () => {
      try {
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
    enabled: !!user
  });

  return {
    metrics,
    pendingApprovals: pendingApprovals || [],
    complianceStatus: complianceStatus || [],
    isLoading: metricsLoading || approvalsLoading || complianceLoading,
    error: null
  };
};
