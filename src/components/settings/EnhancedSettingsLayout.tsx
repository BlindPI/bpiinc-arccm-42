
import React, { useState } from 'react';
import { SettingsHeader } from './SettingsHeader';
import { SettingsOverview } from './SettingsOverview';
import { SettingsNavigation } from './SettingsNavigation';
import { SystemConfigurationPanel } from './SystemConfigurationPanel';
import { EmailTemplateManager } from './EmailTemplateManager';
import { RolePermissionManager } from './RolePermissionManager';
import { BackupRecoverySettings } from './BackupRecoverySettings';
import { SidebarNavigationControl } from './SidebarNavigationControl';
import { NotificationSettings } from '../notifications/NotificationSettings';
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';
import { Card, CardContent } from '@/components/ui/card';
import { InlineLoader } from '@/components/ui/LoadingStates';

export const EnhancedSettingsLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('configuration');
  const { userRole, isLoading } = useRoleBasedAccess();
  const isSystemAdmin = userRole === 'SA';

  if (isLoading) {
    return <InlineLoader message="Loading settings..." />;
  }

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'configuration':
        return <SystemConfigurationPanel />;
      case 'email':
        return <EmailTemplateManager />;
      case 'permissions':
        return <RolePermissionManager />;
      case 'backup':
        return <BackupRecoverySettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'navigation':
        return isSystemAdmin ? <SidebarNavigationControl /> : null;
      default:
        return <SystemConfigurationPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <SettingsHeader />

        {/* Overview Cards */}
        <SettingsOverview />

        {/* Navigation Cards */}
        <SettingsNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isSystemAdmin={isSystemAdmin}
        />

        {/* Content Area */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 md:p-8">
            <div className="animate-fade-in">
              {renderActiveContent()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
