
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SystemConfigurationPanel } from './SystemConfigurationPanel';
import { EmailTemplateManager } from './EmailTemplateManager';
import { RolePermissionManager } from './RolePermissionManager';
import { BackupRecoverySettings } from './BackupRecoverySettings';
import { SidebarNavigationControl } from './SidebarNavigationControl';
import { NotificationSettings } from '../notifications/NotificationSettings';
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';
import { 
  Settings, 
  Mail, 
  Shield, 
  Database, 
  Bell,
  Navigation
} from 'lucide-react';

export const SettingsLayout: React.FC = () => {
  const { userRole } = useRoleBasedAccess();
  const isSystemAdmin = userRole === 'SA';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">
          Configure and manage your training management system
        </p>
      </div>

      <Tabs defaultValue="configuration" className="w-full">
        <TabsList className={`grid w-full ${isSystemAdmin ? 'grid-cols-6' : 'grid-cols-5'}`}>
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Configuration</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email Templates</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Permissions</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Backup</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          {isSystemAdmin && (
            <TabsTrigger value="navigation" className="flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              <span className="hidden sm:inline">Navigation</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="configuration" className="mt-6">
          <SystemConfigurationPanel />
        </TabsContent>

        <TabsContent value="email" className="mt-6">
          <EmailTemplateManager />
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <RolePermissionManager />
        </TabsContent>

        <TabsContent value="backup" className="mt-6">
          <BackupRecoverySettings />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationSettings />
        </TabsContent>

        {isSystemAdmin && (
          <TabsContent value="navigation" className="mt-6">
            <SidebarNavigationControl />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
