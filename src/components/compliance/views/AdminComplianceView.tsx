import React from 'react';
import { useComplianceDashboard } from '@/contexts/ComplianceDashboardContext';
import { AdminDocumentVerification } from '../admin/AdminDocumentVerification';
import { AdminUserManagement } from '../admin/AdminUserManagement';
import { AdminSystemSettings } from '../admin/AdminSystemSettings';
import { AdminComplianceOverview } from '../admin/AdminComplianceOverview';
import { PersonalComplianceView } from './PersonalComplianceView';
import UserComplianceManager from '../admin/UserComplianceManager';
import { TierRequirementsMatrix } from './TierRequirementsMatrix';

export function AdminComplianceView() {
  const { state } = useComplianceDashboard();

  const renderContent = () => {
    switch (state.view.activeTab) {
      case 'verification':
        return <AdminDocumentVerification />;
      case 'user-management':
        return <AdminUserManagement />;
      case 'user-compliance':
        return <UserComplianceManager />;
      case 'system-settings':
        return <AdminSystemSettings />;
      case 'requirements':
        // SA/AD users see TierRequirementsMatrix with admin context - no personal data
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600 font-medium">Admin Requirements View:</span>
                <span className="text-blue-800">Review Basic vs Robust compliance requirements structure</span>
              </div>
            </div>
            {/* Import TierRequirementsMatrix - it will handle SA/AD properly */}
            <TierRequirementsMatrix
              userRole={state.userRole as 'SA' | 'AD'}
              currentTier="basic"
              userComplianceRecords={[]}
              className="admin-requirements-view"
            />
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            {/* Admin Overview - NO PERSONAL COMPLIANCE DATA */}
            <AdminComplianceOverview />
            
            {/* Document Verification Queue - Compact Section */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Verification Queue</h3>
              <p className="text-gray-600 text-sm mb-4">Review and approve pending compliance documents</p>
              <AdminDocumentVerification />
            </div>
            
            {/* User Compliance Management - Full Width */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">User Compliance Management</h3>
              <p className="text-gray-600 text-sm mb-4">Manage individual user compliance records by role with full-width dashboard</p>
              <UserComplianceManager />
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