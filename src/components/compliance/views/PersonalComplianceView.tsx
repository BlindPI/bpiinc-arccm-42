import React from 'react';
import { useComplianceDashboard } from '@/contexts/ComplianceDashboardContext';
import { PersonalComplianceProgress } from '../personal/PersonalComplianceProgress';
import { DocumentUploadCenter } from '../personal/DocumentUploadCenter';
import { RequirementsChecklist } from '../personal/RequirementsChecklist';
import { ActionItemsPanel } from '../personal/ActionItemsPanel';

export function PersonalComplianceView() {
  const { state } = useComplianceDashboard();

  const renderContent = () => {
    switch (state.view.activeTab) {
      case 'my-compliance':
        return <PersonalComplianceProgress />;
      case 'upload':
        return <DocumentUploadCenter />;
      case 'actions':
        return <ActionItemsPanel />;
      default:
        return (
          <div className="space-y-6">
            {/* Overview Layout for Personal Users */}
            <PersonalComplianceProgress />
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