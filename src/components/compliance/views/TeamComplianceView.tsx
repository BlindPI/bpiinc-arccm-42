import React from 'react';
import { useComplianceDashboard } from '@/contexts/ComplianceDashboardContext';
import { TeamComplianceOverview } from '../team/TeamComplianceOverview';
import { TeamMemberComplianceGrid } from '../team/TeamMemberComplianceGrid';
import { TeamDocumentManager } from '../team/TeamDocumentManager';
import { TierRequirementsMatrix } from './TierRequirementsMatrix';
import { ComplianceTierService } from '@/services/compliance/complianceTierService';

export function TeamComplianceView() {
  const { state, dispatch } = useComplianceDashboard();

  const handleUploadDocument = (requirementName: string, tier: 'basic' | 'robust') => {
    // Switch to upload functionality for team members
    dispatch({
      type: 'SET_VIEW',
      payload: { activeTab: 'team-documents' }
    });
  };

  const handleTierSwitch = async (newTier: 'basic' | 'robust') => {
    try {
      // For AP users, this could handle tier management for team members
      const result = await ComplianceTierService.switchComplianceTier(state.userId, newTier);
      if (result.success) {
        // Refresh the dashboard data
        dispatch({ type: 'SET_LOADING', payload: true });
      }
    } catch (error) {
      console.error('Error switching tier:', error);
    }
  };

  const renderContent = () => {
    switch (state.view.activeTab) {
      case 'team-members':
        return <TeamMemberComplianceGrid />;
      case 'team-documents':
        return <TeamDocumentManager />;
      default:
        return (
          <div className="space-y-6">
            {/* PHASE 1-4: Enhanced Team View with Tier Requirements */}
            <TierRequirementsMatrix
              userRole={state.userRole as 'AP' | 'IC' | 'IP' | 'IT'}
              currentTier={state.data.tierInfo?.tier || 'basic'}
              userComplianceRecords={state.data.complianceRecords}
              onUploadDocument={handleUploadDocument}
              onTierSwitch={handleTierSwitch}
              className="mb-6"
            />
            <TeamComplianceOverview />
            <TeamMemberComplianceGrid />
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