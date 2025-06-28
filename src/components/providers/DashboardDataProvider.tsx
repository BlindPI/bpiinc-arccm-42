
import React, { ReactNode } from 'react';
import { ComplianceTierProvider } from '@/contexts/ComplianceTierContext';
import { DashboardUIProvider } from '@/contexts/DashboardUIContext';
import { DashboardContextProvider } from '@/contexts/DashboardContext';
import { useUIRequirements, UIRequirement } from '@/hooks/useComplianceRequirements';
import { useComplianceTier } from '@/hooks/useComplianceTier';
import { useComplianceRealtimeUpdates } from '@/hooks/useComplianceRealtimeUpdates';

// Provider props
interface DashboardDataProviderProps {
  userId?: string;
  role: string;
  children: ReactNode;
}

/**
 * DashboardDataProvider combines multiple context providers and data fetching hooks
 * to provide a unified data source for dashboard components.
 */
export function DashboardDataProvider({ 
  userId, 
  role,
  children 
}: DashboardDataProviderProps) {
  const { 
    data: tierInfo, 
    isLoading: tierLoading, 
    error: tierError 
  } = useComplianceTier(userId);
  
  const { 
    data: requirements, 
    isLoading: reqLoading, 
    error: reqError 
  } = useUIRequirements(userId, role);
  
  useComplianceRealtimeUpdates(userId);
  
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
          userId={userId || ''}
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

export { UIRequirement };
export { useDashboard } from '@/contexts/DashboardContext';
