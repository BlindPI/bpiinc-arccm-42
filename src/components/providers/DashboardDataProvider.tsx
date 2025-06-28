
import React, { ReactNode } from 'react';
import { ComplianceTierProvider } from '@/contexts/ComplianceTierContext';
import { DashboardUIProvider } from '@/contexts/DashboardUIContext';
import { DashboardContextProvider, UIComplianceTierInfo } from '@/contexts/DashboardContext';
import { useUIRequirements, UIRequirement } from '@/hooks/useComplianceRequirements';
import { useComplianceTier } from '@/hooks/useComplianceTier';
import { useComplianceRealtimeUpdates } from '@/hooks/useComplianceRealtimeUpdates';

// Provider props
interface DashboardDataProviderProps {
  userId: string;
  role: string;
  children: ReactNode;
}

/**
 * DashboardDataProvider combines multiple context providers and data fetching hooks
 * to provide a unified data source for dashboard components. It handles:
 * 
 * 1. Fetching tier information for the user
 * 2. Fetching requirements relevant to the user's role
 * 3. Setting up real-time updates for both
 * 4. Providing UI configuration based on tier
 * 
 * This enables role-specific dashboards to render with the correct data and styling
 * based on the user's compliance tier.
 */
export function DashboardDataProvider({ 
  userId, 
  role,
  children 
}: DashboardDataProviderProps) {
  // Get the compliance tier information
  const { 
    data: tierInfo, 
    isLoading: tierLoading, 
    error: tierError 
  } = useComplianceTier(userId);
  
  // Get requirements filtered for this user role - using the correct hook
  const { 
    data: requirements, 
    isLoading: reqLoading, 
    error: reqError 
  } = useUIRequirements(userId, role);
  
  // Enable real-time updates for compliance data
  useComplianceRealtimeUpdates(userId);
  
  // Combine loading and error states
  const isLoading = tierLoading || reqLoading;
  const error = tierError || reqError || null;
  
  return (
    <ComplianceTierProvider tier={tierInfo?.tier || 'basic'}>
      <DashboardUIProvider 
        config={{
          theme_color: tierInfo?.tier === 'robust' ? '#8B5CF6' : '#3B82F6',
          icon: 'dashboard',
          dashboard_layout: 'grid',
          welcome_message: `Welcome to your ${tierInfo?.tier === 'robust' ? 'Comprehensive' : 'Essential'} compliance dashboard`,
          progress_visualization: 'circular',
          quick_actions: ['refresh', 'filter', 'export']
        }}
      >
        <DashboardContextProvider
          userId={userId}
          role={role}
          tierInfo={tierInfo || null}
          requirements={requirements || []}
          isLoading={isLoading}
          error={error}
        >
          {children}
        </DashboardContextProvider>
      </DashboardUIProvider>
    </ComplianceTierProvider>
  );
}

// Re-export interfaces and hooks from Dashboard context for convenience
export { UIComplianceTierInfo, UIRequirement };
export { useDashboard } from '@/contexts/DashboardContext';
