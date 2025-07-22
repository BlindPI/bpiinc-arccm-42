import React from 'react';
import { useComplianceDashboard } from '@/contexts/ComplianceDashboardContext';
import { PersonalComplianceProgress } from '../personal/PersonalComplianceProgress';
import { DocumentUploadCenter } from '../personal/DocumentUploadCenter';
import { RequirementsChecklist } from '../personal/RequirementsChecklist';
import { ActionItemsPanel } from '../personal/ActionItemsPanel';
import { TierRequirementsMatrix } from './TierRequirementsMatrix';
import { ComplianceTierService } from '@/services/compliance/complianceTierService';

export function PersonalComplianceView() {
  const { state, dispatch } = useComplianceDashboard();

  const handleUploadDocument = (requirementName: string, tier: 'basic' | 'robust') => {
    // Switch to upload tab and set the requirement context
    dispatch({
      type: 'SET_VIEW',
      payload: { activeTab: 'upload' }
    });
    // Additional logic to pre-select the requirement could go here
  };

  const handleTierSwitch = async (newTier: 'basic' | 'robust') => {
    try {
      const result = await ComplianceTierService.switchComplianceTier(state.userId, newTier);
      if (result.success) {
        // Refresh the dashboard data
        dispatch({ type: 'SET_LOADING', payload: true });
        // The context should handle the refresh automatically
      }
    } catch (error) {
      console.error('Error switching tier:', error);
    }
  };

  const renderContent = () => {
    switch (state.view.activeTab) {
      case 'my-compliance':
        return <PersonalComplianceProgress />;
      case 'requirements':
        return (
          <TierRequirementsMatrix
            userRole={state.userRole as 'AP' | 'IC' | 'IP' | 'IT'}
            currentTier={state.data.tierInfo?.tier || 'basic'}
            userComplianceRecords={state.data.complianceRecords}
            onUploadDocument={handleUploadDocument}
            onTierSwitch={handleTierSwitch}
          />
        );
      case 'upload':
        return <DocumentUploadCenter />;
      case 'actions':
        return <ActionItemsPanel />;
      default:
        return (
          <div className="space-y-6">
            {/* PHASE 1-4 IMPLEMENTATION: Enhanced Overview with TierRequirementsMatrix */}
            <TierRequirementsMatrix
              userRole={state.userRole as 'AP' | 'IC' | 'IP' | 'IT'}
              currentTier={state.data.tierInfo?.tier || 'basic'}
              userComplianceRecords={state.data.complianceRecords}
              onUploadDocument={handleUploadDocument}
              onTierSwitch={handleTierSwitch}
              className="mb-6"
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RequirementsChecklist />
              <ActionItemsPanel />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {renderContent()}
    </div>
  );
}