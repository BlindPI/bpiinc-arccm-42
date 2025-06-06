
import React, { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { SettingsNavigation } from '@/components/settings/SettingsNavigation';
import { SystemConfigurationPanel } from '@/components/settings/SystemConfigurationPanel';
import { CRMNavigationSettings } from '@/components/settings/CRMNavigationSettings';
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
      case 'permissions':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions</CardTitle>
              <CardDescription>Role permission management coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">This feature is under development.</p>
            </CardContent>
          </Card>
        );
      case 'backup':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Backup & Recovery</CardTitle>
              <CardDescription>Backup configuration coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">This feature is under development.</p>
            </CardContent>
          </Card>
        );
      case 'notifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Notification settings coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">This feature is under development.</p>
            </CardContent>
          </Card>
        );
      case 'navigation':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Navigation Control</CardTitle>
              <CardDescription>General navigation settings coming soon</CardDescription>
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
