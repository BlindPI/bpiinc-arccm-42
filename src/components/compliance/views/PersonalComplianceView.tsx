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

  // CRITICAL: SA/AD users should NEVER access personal compliance views
  // They manage others, not their own compliance
  if (state.userRole === 'SA' || state.userRole === 'AD') {
    return (
      <div className="min-h-64 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">🚫</div>
          <h3 className="text-xl font-semibold text-gray-900">Access Denied</h3>
          <p className="text-gray-600 max-w-md">
            SA/AD admin users manage compliance for others and do not have personal compliance records.
            Use the admin tabs to manage user compliance across the organization.
          </p>
          <div className="text-sm text-gray-500">
            Switch to: Overview, Verification Queue, User Management, or System Settings
          </div>
        </div>
      </div>
    );
  }

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
            userRole={state.userRole as 'AP' | 'IC' | 'IP' | 'IT' | 'SA' | 'AD'}
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
              userRole={state.userRole as 'AP' | 'IC' | 'IP' | 'IT' | 'SA' | 'AD'}
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