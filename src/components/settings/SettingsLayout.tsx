
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Users, 
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { SettingsOverview } from './SettingsOverview';
import { SidebarNavigationControl } from './SidebarNavigationControl';
import { useNavigationVisibility } from '@/hooks/useNavigationVisibility';
import { useProfile } from '@/hooks/useProfile';

export const SettingsLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { configurationHealth } = useNavigationVisibility();
  const { data: profile } = useProfile();

  // EMERGENCY: Show critical navigation status
  const showEmergencyAlert = configurationHealth.status === 'emergency' || 
                            configurationHealth.status === 'error';

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: SettingsIcon,
      component: SettingsOverview
    },
    {
      id: 'navigation',
      label: 'Navigation Control',
      icon: Users,
      component: SidebarNavigationControl,
      requiresRole: ['SA', 'AD'] // Only SA and AD can manage navigation
    },
    {
      id: 'security',
      label: 'Security',
      icon: Shield,
      component: () => <div className="p-8 text-center text-gray-500">Security settings coming soon</div>
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      component: () => <div className="p-8 text-center text-gray-500">Notification settings coming soon</div>
    }
  ];

  // Filter tabs based on user role
  const visibleTabs = tabs.filter(tab => {
    if (!tab.requiresRole) return true;
    return tab.requiresRole.includes(profile?.role || '');
  });

  // If no valid tabs, show error
  if (visibleTabs.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access system settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Auto-select first available tab if current tab is not accessible
  React.useEffect(() => {
    if (!visibleTabs.find(tab => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id || 'overview');
    }
  }, [visibleTabs, activeTab]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage system configuration, navigation access, and security settings
          </p>
        </div>
        
        {/* Navigation Health Status */}
        <div className="flex items-center gap-2">
          <Badge variant={configurationHealth.status === 'healthy' ? 'default' : 'destructive'}>
            {configurationHealth.status === 'healthy' && <CheckCircle className="h-3 w-3 mr-1" />}
            {showEmergencyAlert && <AlertTriangle className="h-3 w-3 mr-1" />}
            {configurationHealth.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* EMERGENCY: Critical navigation alert */}
      {showEmergencyAlert && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">CRITICAL NAVIGATION ISSUE</div>
            <div className="text-sm mt-1">
              {configurationHealth.message}
              {profile?.role === 'SA' && (
                <span className="block mt-1">
                  As a System Administrator, you have emergency access to fix this issue.
                  Use the Navigation Control tab to restore proper navigation settings.
                </span>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          {visibleTabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {visibleTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <Card>
              <CardContent className="p-6">
                <tab.component />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
