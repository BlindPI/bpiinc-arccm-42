import React from 'react';
import { useComplianceDashboard } from '@/contexts/ComplianceDashboardContext';
import { AdminDocumentVerification } from '../admin/AdminDocumentVerification';
import { AdminUserManagement } from '../admin/AdminUserManagement';
import { AdminSystemSettings } from '../admin/AdminSystemSettings';
import { AdminComplianceOverview } from '../admin/AdminComplianceOverview';
import { PersonalComplianceView } from './PersonalComplianceView';

export function AdminComplianceView() {
  const { state } = useComplianceDashboard();

  const renderContent = () => {
    switch (state.view.activeTab) {
      case 'verification':
        return <AdminDocumentVerification />;
      case 'user-management':
        return <AdminUserManagement />;
      case 'system-settings':
        return <AdminSystemSettings />;
      case 'requirements':
        // SA/AD users can access the Requirements Matrix to understand compliance structure
        return <PersonalComplianceView />;
      default:
        return (
          <div className="space-y-6">
            {/* Overview Layout for SA/AD Users */}
            <AdminComplianceOverview />
            <AdminDocumentVerification />
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