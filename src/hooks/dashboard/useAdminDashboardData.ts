
// DEPRECATED: This hook has been replaced with useTeamScopedDashboardData for security
// This file is kept for backward compatibility but should not be used in new code

import { useTeamScopedDashboardData } from './useTeamScopedDashboardData';

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

/**
 * @deprecated Use useTeamScopedDashboardData instead for secure team-based data access
 * This hook is maintained for backward compatibility only
 */
export const useAdminDashboardData = () => {
  console.warn('useAdminDashboardData is deprecated. Use useTeamScopedDashboardData instead for secure data access.');
  
  // Delegate to the secure team-scoped implementation
  const teamScopedData = useTeamScopedDashboardData();
  
  return {
    metrics: teamScopedData.metrics ? {
      organizationUsers: teamScopedData.metrics.organizationUsers,
      activeCertifications: teamScopedData.metrics.activeCertifications,
      expiringSoon: teamScopedData.metrics.expiringSoon,
      complianceIssues: teamScopedData.metrics.complianceIssues
    } : undefined,
    pendingApprovals: teamScopedData.pendingApprovals,
    complianceStatus: teamScopedData.complianceStatus,
    isLoading: teamScopedData.isLoading,
    error: teamScopedData.error
  };
};
