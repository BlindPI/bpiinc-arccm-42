// File: src/components/dashboard/FixedRoleBasedDashboard.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useComplianceTierRealtime } from '@/hooks/useComplianceTier';
import { useComplianceRealtimeUpdates } from '@/hooks/useComplianceRealtimeUpdates';

// Import role-specific dashboards
import { ITDashboard } from './role-dashboards/ITDashboard';
import { IPDashboard } from './role-dashboards/IPDashboard';
import { ICDashboard } from './role-dashboards/ICDashboard';
import { EnhancedProviderDashboard } from './EnhancedProviderDashboard';

// Import context providers
import { ComplianceTierProvider } from '@/contexts/ComplianceTierContext';
import { DashboardUIProvider } from '@/contexts/DashboardUIContext';

// Import UI components  
import { DashboardSidebar } from './DashboardSidebar';
import { ComplianceTierBanner } from '@/components/compliance/ComplianceTierBanner';
import { TierSwitchDialog } from '@/components/dialogs/TierSwitchDialog';
import { RequirementDetailDrawer } from '@/components/compliance/RequirementDetailDrawer';

import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ComplianceTierService } from '@/services/compliance/complianceTierService';

export function FixedRoleBasedDashboard() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: tierInfo, isLoading: tierLoading } = useComplianceTierRealtime(user?.id);
  
  // UI State Management
  const [dashboardView, setDashboardView] = useState<'overview' | 'compliance' | 'progress'>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeRequirement, setActiveRequirement] = useState<string | null>(null);
  const [showTierSwitchDialog, setShowTierSwitchDialog] = useState(false);
  
  // Enable real-time updates
  useComplianceRealtimeUpdates(user?.id);
  
  // Get user role
  const userRole = profile?.role;
  
  // Handle tier switch
  const handleTierSwitch = async (newTier: string, reason: string) => {
    try {
      const result = await ComplianceTierService.switchUserTier(
        user!.id,
        newTier as 'basic' | 'robust',
        user!.id,
        reason
      );
      
      if (result.success) {
        setShowTierSwitchDialog(false);
        toast.success('Tier switched successfully!');
      } else {
        toast.error(result.message || 'Failed to switch tier');
      }
    } catch (error) {
      console.error('Tier switch error:', error);
      toast.error('Failed to switch tier. Please try again.');
    }
  };
  
  // Handle requirement updates
  const handleRequirementUpdate = (requirementId: string) => {
    // The real-time hooks will automatically update the data
    console.log('Requirement updated:', requirementId);
  };
  
  // Enhanced role-specific dashboard rendering with UI context
  const renderRoleSpecificDashboard = () => {
    if (!userRole || !tierInfo) {
      return <DashboardSkeleton />;
    }
    
    const dashboardProps = {
      tierInfo,
      uiConfig: tierInfo.ui_config,
      dashboardView,
      onViewChange: setDashboardView,
      activeRequirement,
      onRequirementSelect: setActiveRequirement,
    };
    
    switch (userRole) {
      case 'IT':
        return (
          <ComplianceTierProvider tier={tierInfo.tier}>
            <DashboardUIProvider config={tierInfo.ui_config}>
              <ITDashboard {...dashboardProps} />
            </DashboardUIProvider>
          </ComplianceTierProvider>
        );
        
      case 'IP':
        return (
          <ComplianceTierProvider tier={tierInfo.tier}>
            <DashboardUIProvider config={tierInfo.ui_config}>
              <IPDashboard {...dashboardProps} />
            </DashboardUIProvider>
          </ComplianceTierProvider>
        );
        
      case 'IC':
        return (
          <ComplianceTierProvider tier={tierInfo.tier}>
            <DashboardUIProvider config={tierInfo.ui_config}>
              <ICDashboard {...dashboardProps} />
            </DashboardUIProvider>
          </ComplianceTierProvider>
        );
        
      case 'AP':
        return (
          <ComplianceTierProvider tier={tierInfo.tier}>
            <EnhancedProviderDashboard 
              {...dashboardProps}
              config={{
                complianceEnabled: true,
                tierInfo: tierInfo
              }}
            />
          </ComplianceTierProvider>
        );
        
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Unknown Role: {userRole}
              </h2>
              <p className="text-gray-600 mt-2">
                This role is not recognized. Please contact support.
              </p>
            </div>
          </div>
        );
    }
  };
  
  // Loading state
  if (profileLoading || tierLoading) {
    return <DashboardLoadingScreen />;
  }
  
  // Error state
  if (!profile || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Unable to Load Dashboard
          </h2>
          <p className="text-gray-600 mt-2">
            Please refresh the page or contact support if the problem persists.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Collapsible Sidebar with Role-Specific Navigation */}
      <DashboardSidebar
        role={userRole}
        tier={tierInfo?.tier}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView={dashboardView}
        onViewChange={setDashboardView}
        quickStats={{
          compliance: tierInfo?.completion_percentage || 0,
          nextDue: tierInfo?.next_requirement?.due_date,
          tier: tierInfo?.tier
        }}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        {/* Tier Status Banner */}
        <ComplianceTierBanner
          tier={tierInfo?.tier}
          canAdvance={tierInfo?.can_advance_tier}
          completionPercentage={tierInfo?.completion_percentage}
          onTierSwitch={() => setShowTierSwitchDialog(true)}
        />
        
        {/* Dashboard Content */}
        <main className="p-6">
          {renderRoleSpecificDashboard()}
        </main>
      </div>
      
      {/* Global UI Elements */}
      <TierSwitchDialog
        isOpen={showTierSwitchDialog}
        onClose={() => setShowTierSwitchDialog(false)}
        currentTier={tierInfo?.tier}
        targetTier={tierInfo?.tier === 'basic' ? 'robust' : 'basic'}
        onConfirm={handleTierSwitch}
      />
      
      <RequirementDetailDrawer
        requirementId={activeRequirement}
        isOpen={!!activeRequirement}
        onClose={() => setActiveRequirement(null)}
        onUpdate={handleRequirementUpdate}
      />
    </div>
  );
}

// Dashboard skeleton component
function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 bg-gray-200 rounded animate-pulse" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}

function DashboardLoadingScreen() {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white border-r">
        <div className="p-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-2 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-6 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <h3 className="text-lg font-semibold mt-4">Loading Dashboard</h3>
          <p className="text-muted-foreground">Please wait while we load your compliance data...</p>
        </div>
      </div>
    </div>
  );
}