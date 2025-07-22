import React from 'react';
import { useComplianceDashboard } from '@/contexts/ComplianceDashboardContext';
import { TeamComplianceOverview } from '../team/TeamComplianceOverview';
import { TeamMemberComplianceGrid } from '../team/TeamMemberComplianceGrid';
import { TeamDocumentManager } from '../team/TeamDocumentManager';

export function TeamComplianceView() {
  const { state } = useComplianceDashboard();

  const renderContent = () => {
    switch (state.view.activeTab) {
      case 'team-members':
        return <TeamMemberComplianceGrid />;
      case 'team-documents':
        return <TeamDocumentManager />;
      default:
        return (
          <div className="space-y-6">
            {/* Overview Layout for AP Users */}
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