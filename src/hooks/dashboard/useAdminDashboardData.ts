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
  requestedBy: string;
  requestedAt: string;
  status: string;
}

export interface ComplianceStatus {
  id: string;
  name: string;
  complianceRate: number;
  status: 'compliant' | 'warning' | 'non-compliant';
}

export const useAdminDashboardData = () => {
  const { user } = useAuth();

  // Get the organization ID for the current user
  const { data: userOrg, isLoading: orgLoading } = useQuery({
    queryKey: ['userOrganization', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('organization')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      return data.organization;
    },
    enabled: !!user
  });

  // Fetch admin metrics
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery({
    queryKey: ['adminMetrics', userOrg],
    queryFn: async () => {
      // Get organization users count
      const { count: organizationUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization', userOrg);

      if (usersError) throw usersError;

      // Get active certifications count
      const { count: activeCertifications, error: certError } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE')
        .eq('organization', userOrg);

      if (certError) throw certError;

      // Get expiring soon count (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { count: expiringSoon, error: expiringError } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE')
        .eq('organization', userOrg)
        .lt('expiry_date', thirtyDaysFromNow.toISOString())
        .gt('expiry_date', new Date().toISOString());

      if (expiringError) throw expiringError;

      // Get compliance issues count
      const { count: complianceIssues, error: complianceError } = await supabase
        .from('compliance_issues')
        .select('*', { count: 'exact', head: true })
        .eq('organization', userOrg)
        .eq('status', 'OPEN');

      if (complianceError) throw complianceError;

      return {
        organizationUsers: organizationUsers || 0,
        activeCertifications: activeCertifications || 0,
        expiringSoon: expiringSoon || 0,
        complianceIssues: complianceIssues || 0
      };
    },
    enabled: !!user && !!userOrg
  });

  // Fetch pending approvals
  const { data: pendingApprovals, isLoading: approvalsLoading, error: approvalsError } = useQuery({
    queryKey: ['adminPendingApprovals', userOrg],
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
          profiles(display_name, organization)
        `)
        .eq('status', 'PENDING')
        .eq('profiles.organization', userOrg)
        .order('created_at', { ascending: false })
        .limit(5);

      if (roleError) throw roleError;

      // Fetch certification verification requests
      const { data: certRequests, error: certError } = await supabase
        .from('certification_verification_requests')
        .select(`
          id,
          certificate_id,
          requested_by,
          created_at,
          status,
          profiles(display_name, organization)
        `)
        .eq('status', 'PENDING')
        .eq('profiles.organization', userOrg)
        .order('created_at', { ascending: false })
        .limit(5);

      if (certError) throw certError;

      // Combine and format the requests
      const roleApprovals = roleRequests.map(req => ({
        id: req.id,
        type: 'Role Transition',
        requestedBy: req.profiles?.display_name || 'Unknown',
        requestedAt: req.created_at,
        status: req.status
      }));

      const certApprovals = certRequests.map(req => ({
        id: req.id,
        type: 'Certification Verification',
        requestedBy: req.profiles?.display_name || 'Unknown',
        requestedAt: req.created_at,
        status: req.status
      }));

      return [...roleApprovals, ...certApprovals].sort((a, b) => 
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      ).slice(0, 5);
    },
    enabled: !!user && !!userOrg
  });

  // Fetch compliance status
  const { data: complianceStatus, isLoading: complianceLoading, error: complianceError } = useQuery({
    queryKey: ['adminComplianceStatus', userOrg],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certification_compliance')
        .select(`
          id,
          certification_type,
          compliance_rate,
          organization
        `)
        .eq('organization', userOrg)
        .order('compliance_rate', { ascending: false });

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        name: item.certification_type,
        complianceRate: item.compliance_rate,
        status: item.compliance_rate >= 95 
          ? 'compliant' 
          : item.compliance_rate >= 85 
            ? 'warning' 
            : 'non-compliant'
      }));
    },
    enabled: !!user && !!userOrg
  });

  const isLoading = orgLoading || metricsLoading || approvalsLoading || complianceLoading;
  const error = metricsError || approvalsError || complianceError;

  return {
    metrics,
    pendingApprovals,
    complianceStatus,
    isLoading,
    error
  };
};