// File: src/components/dashboard/ComplianceDashboardWithTiers.tsx

import React, { useState } from 'react';
import { Card } from './components/ui/card';
import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { useAuth } from './contexts/AuthContext';
import { useComplianceTier } from './hooks/useComplianceTier';
import { useComplianceRequirements } from './hooks/useComplianceRequirements';
import { ComplianceTierService } from './services/compliance/complianceTierService';
import { TierStatusHeader } from './TierStatusHeader';
import { TierRequirementSection } from './TierRequirementSection';
import { TierSwitchDialog } from './TierSwitchDialog';
import { TierBenefitsOverview } from './TierBenefitsOverview';
import { TierAdvancementSection } from './TierAdvancementSection';
import { TierComparisonChart } from './TierComparisonChart';

export function ComplianceDashboardWithTiers() {
  // State for dialogs
  const [tierSwitchDialogOpen, setTierSwitchDialogOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<any>(null);
  
  // Get user context
  const { user } = useAuth();
  
  // Get tier information
  const { data: tierInfo, isLoading: tierLoading } = useComplianceTier(user?.id);
  
  // Current tier and role
  const tier = tierInfo?.tier || 'basic';
  const role = tierInfo?.role || 'IT';
  
  // Get requirements for current tier and role
  const { data: requirements, isLoading: requirementsLoading } = useComplianceRequirements(
    user?.id,
    role,
    tier
  );
  
  // Group requirements by category
  const groupedRequirements = React.useMemo(() => {
    if (!requirements) return {};
    
    // Group by category
    return requirements.reduce((groups: Record<string, any[]>, item: any) => {
      const category = item.category || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    }, {});
  }, [requirements]);
  
  // Handle tier switch
  const handleTierSwitch = async (targetTier: string, reason: string): Promise<void> => {
    try {
      await ComplianceTierService.switchTier(user?.id!, targetTier, reason);
      // Don't return any value to match the Promise<void> type
    } catch (error) {
      console.error('Failed to switch tier:', error);
      throw error;
    }
  };
  
  // Generate mock data for analytics dashboard
  const getAnalyticsData = () => {
    return {
      metrics: [
        { metric: 'Completion Rate', basic: 75, robust: 45 },
        { metric: 'Documentation', basic: 60, robust: 90 },
        { metric: 'Teaching Skills', basic: 50, robust: 85 },
        { metric: 'Assessment', basic: 80, robust: 70 },
        { metric: 'Mentoring', basic: 30, robust: 95 }
      ],
      distribution: [
        { name: 'Basic Tier', value: 65 },
        { name: 'Robust Tier', value: 35 }
      ],
      completionTime: [
        { name: 'Documentation', basic: 14, robust: 28 },
        { name: 'Skills', basic: 21, robust: 42 },
        { name: 'Assessment', basic: 7, robust: 21 }
      ],
      performance: [
        { name: 'Week 1', basic: 10, robust: 5 },
        { name: 'Week 2', basic: 25, robust: 15 },
        { name: 'Week 3', basic: 45, robust: 30 },
        { name: 'Week 4', basic: 70, robust: 45 },
        { name: 'Week 5', basic: 85, robust: 60 },
        { name: 'Week 6', basic: 95, robust: 75 }
      ],
      total: 100
    };
  };
  
  // Loading state
  if (tierLoading || requirementsLoading) {
    return <div className="p-6">Loading dashboard...</div>;
  }
  
  return (
    <div className="space-y-6 p-6">
      {/* Tier Status Header */}
      <TierStatusHeader
        tierInfo={tierInfo!}
        onOpenTierSwitch={() => setTierSwitchDialogOpen(true)}
      />
      
      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="requirements" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="benefits">Tier Benefits</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        {/* Requirements Tab */}
        <TabsContent value="requirements" className="space-y-6 mt-6">
          {/* Requirements by Category */}
          {Object.entries(groupedRequirements).map(([category, reqs]) => (
            <TierRequirementSection
              key={category}
              title={category}
              requirements={reqs}
              tier={tier as 'basic' | 'robust'}
              onRequirementClick={setSelectedRequirement}
            />
          ))}
          
          {/* Tier Advancement Section (for basic tier only) */}
          {tier === 'basic' && (
            <TierAdvancementSection
              canAdvance={tierInfo?.can_advance_tier || false}
              blockedReason={tierInfo?.advancement_blocked_reason}
              completedRequirements={tierInfo?.completed_requirements || 0}
              totalRequirements={tierInfo?.requirements_count || 1}
              onRequestAdvancement={() => setTierSwitchDialogOpen(true)}
            />
          )}
        </TabsContent>
        
        {/* Benefits Tab */}
        <TabsContent value="benefits" className="space-y-6 mt-6">
          <TierBenefitsOverview
            tier={tier as 'basic' | 'robust'}
            role={role}
            onTierChange={(newTier) => {
              if (newTier !== tier) {
                setTierSwitchDialogOpen(true);
              }
            }}
          />
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TierComparisonChart
              data={getAnalyticsData()}
              role={role}
              comparisonType="metrics"
            />
            
            <TierComparisonChart
              data={getAnalyticsData()}
              role={role}
              comparisonType="distribution"
            />
            
            <TierComparisonChart
              data={getAnalyticsData()}
              role={role}
              comparisonType="completion"
            />
            
            <TierComparisonChart
              data={getAnalyticsData()}
              role={role}
              comparisonType="performance"
            />
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Tier Switch Dialog */}
      <TierSwitchDialog
        isOpen={tierSwitchDialogOpen}
        onClose={() => setTierSwitchDialogOpen(false)}
        currentTier={tier}
        targetTier={tier === 'basic' ? 'robust' : 'basic'}
        onConfirm={handleTierSwitch}
        role={role}
        userId={user?.id}
      />
    </div>
  );
}