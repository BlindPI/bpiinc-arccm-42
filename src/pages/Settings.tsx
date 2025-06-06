
import React, { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { SettingsNavigation } from '@/components/settings/SettingsNavigation';
import { SystemConfigurationPanel } from '@/components/settings/SystemConfigurationPanel';
import { CRMNavigationSettings } from '@/components/settings/CRMNavigationSettings';
import { SidebarNavigationControl } from '@/components/settings/SidebarNavigationControl';
import { RolePermissionManager } from '@/components/settings/RolePermissionManager';
import { BackupRecoverySettings } from '@/components/settings/BackupRecoverySettings';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { SettingsOverview } from '@/components/settings/SettingsOverview';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('configuration');
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
          <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isSystemAdmin = profile?.role === 'SA';
  const isAdmin = profile?.role === 'SA' || profile?.role === 'AD';

  const renderContent = () => {
    switch (activeTab) {
      case 'configuration':
        return <SystemConfigurationPanel />;
      case 'crm-navigation':
        if (!isSystemAdmin) {
          return (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Access Restricted
                </CardTitle>
                <CardDescription>
                  CRM navigation settings are only available to System Administrators.
                </CardDescription>
              </CardHeader>
            </Card>
          );
        }
        return <CRMNavigationSettings />;
      case 'navigation':
        if (!isAdmin) {
          return (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Access Restricted
                </CardTitle>
                <CardDescription>
                  Navigation control settings are only available to System Administrators and Administrators.
                </CardDescription>
              </CardHeader>
            </Card>
          );
        }
        return <SidebarNavigationControl />;
      case 'permissions':
        if (!isAdmin) {
          return (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Access Restricted
                </CardTitle>
                <CardDescription>
                  Role permission management is only available to System Administrators and Administrators.
                </CardDescription>
              </CardHeader>
            </Card>
          );
        }
        return <RolePermissionManager />;
      case 'backup':
        if (!isSystemAdmin) {
          return (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Access Restricted
                </CardTitle>
                <CardDescription>
                  Backup and recovery settings are only available to System Administrators.
                </CardDescription>
              </CardHeader>
            </Card>
          );
        }
        return <BackupRecoverySettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'email':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Email template configuration coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">This feature is under development.</p>
            </CardContent>
          </Card>
        );
      default:
        return <SystemConfigurationPanel />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure system settings and manage application preferences
        </p>
      </div>

      {/* Overview Section */}
      <SettingsOverview />

      <SettingsNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isSystemAdmin={isSystemAdmin}
      />

      {renderContent()}
    </div>
  );
};

export default Settings;
