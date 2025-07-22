import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { ComplianceDashboardProvider, useComplianceDashboard } from '@/contexts/ComplianceDashboardContext';
import { ComplianceDashboardHeader } from './ComplianceDashboardHeader';
import { ComplianceNavigation } from './ComplianceNavigation';
import { PersonalComplianceView } from './views/PersonalComplianceView';
import { TeamComplianceView } from './views/TeamComplianceView';
import { AdminComplianceView } from './views/AdminComplianceView';
import { ComplianceUploadModal } from './ComplianceUploadModal';
import { ComplianceNotifications } from './ComplianceNotifications';

interface ComplianceDashboardProps {
  userId: string;
  userRole: string;
  displayName: string;
}

function ComplianceDashboardContent() {
  const { state } = useComplianceDashboard();

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="h-16 bg-white border-b"></div>
          <div className="p-6 space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {state.error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Render role-specific view with TierRequirementsMatrix
  const renderMainContent = () => {
    switch (state.userRole) {
      case 'SA':
      case 'AD':
        return <AdminComplianceView />;
      case 'AP':
        return <TeamComplianceView />;
      default:
        return <PersonalComplianceView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <ComplianceDashboardHeader />
      </div>
      
      {/* Desktop Navigation */}
      <div className="hidden md:block">
        <ComplianceNavigation />
      </div>
      
      {/* Main Content - Shows TierRequirementsMatrix with Basic vs Robust comparison */}
      <main className="container mx-auto px-4 py-6">
        {renderMainContent()}
      </main>
      
      {/* Modals */}
      <ComplianceUploadModal />
      <ComplianceNotifications />
    </div>
  );
}

export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = (props) => {
  return (
    <ComplianceDashboardProvider {...props}>
      <ComplianceDashboardContent />
    </ComplianceDashboardProvider>
  );
};