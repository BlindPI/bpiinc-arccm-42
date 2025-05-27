
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigationVisibility, NavigationVisibilityConfig } from '@/hooks/useNavigationVisibility';
import { Loader2, Save, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

// Navigation structure matching AppSidebar
const NAVIGATION_GROUPS = {
  'Dashboard': ['Dashboard', 'Profile'],
  'User Management': ['Users', 'Teams', 'Role Management', 'Supervision'],
  'Training Management': ['Courses', 'Course Scheduling', 'Course Offerings', 'Enrollments', 'Enrollment Management', 'Teaching Sessions', 'Locations'],
  'Certificates': ['Certificates', 'Certificate Analytics', 'Rosters'],
  'Analytics & Reports': ['Analytics', 'Executive Dashboard', 'Instructor Performance', 'Report Scheduler', 'Reports'],
  'Compliance & Automation': ['Automation', 'Progression Path Builder'],
  'System Administration': ['Integrations', 'Notifications', 'System Monitoring', 'Settings']
};

const ROLE_LABELS = {
  SA: 'System Administrator',
  AD: 'Administrator', 
  AP: 'Authorized Provider',
  IC: 'Instructor Candidate',
  IP: 'Instructor Provisional',
  IT: 'Instructor Trainer',
  IN: 'Individual'
};

export function SidebarNavigationControl() {
  const { navigationConfig, isLoading, updateNavigationConfig } = useNavigationVisibility();
  const [localConfig, setLocalConfig] = useState<NavigationVisibilityConfig | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('SA');
  const [hasChanges, setHasChanges] = useState(false);

  React.useEffect(() => {
    if (navigationConfig && !localConfig) {
      setLocalConfig(navigationConfig);
    }
  }, [navigationConfig]);

  const handleGroupToggle = (role: string, groupName: string, enabled: boolean) => {
    if (!localConfig) return;

    const newConfig = { ...localConfig };
    if (!newConfig[role]) {
      newConfig[role] = {};
    }
    if (!newConfig[role][groupName]) {
      newConfig[role][groupName] = { enabled: true, items: {} };
    }
    
    newConfig[role][groupName].enabled = enabled;
    
    // If disabling a group, disable all its items too
    if (!enabled) {
      NAVIGATION_GROUPS[groupName as keyof typeof NAVIGATION_GROUPS]?.forEach(item => {
        if (!newConfig[role][groupName].items) {
          newConfig[role][groupName].items = {};
        }
        newConfig[role][groupName].items[item] = false;
      });
    }

    setLocalConfig(newConfig);
    setHasChanges(true);
  };

  const handleItemToggle = (role: string, groupName: string, itemName: string, enabled: boolean) => {
    if (!localConfig) return;

    const newConfig = { ...localConfig };
    if (!newConfig[role]) {
      newConfig[role] = {};
    }
    if (!newConfig[role][groupName]) {
      newConfig[role][groupName] = { enabled: true, items: {} };
    }
    if (!newConfig[role][groupName].items) {
      newConfig[role][groupName].items = {};
    }

    newConfig[role][groupName].items[itemName] = enabled;
    setLocalConfig(newConfig);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!localConfig) return;

    try {
      await updateNavigationConfig.mutateAsync(localConfig);
      setHasChanges(false);
      toast.success('Navigation settings saved successfully');
    } catch (error) {
      toast.error('Failed to save navigation settings');
    }
  };

  const handleReset = () => {
    setLocalConfig(navigationConfig);
    setHasChanges(false);
    toast.info('Changes reset');
  };

  const bulkToggleRole = (role: string, enabled: boolean) => {
    if (!localConfig) return;

    const newConfig = { ...localConfig };
    if (!newConfig[role]) {
      newConfig[role] = {};
    }

    Object.keys(NAVIGATION_GROUPS).forEach(groupName => {
      if (groupName === 'Dashboard') return; // Always keep dashboard enabled
      
      if (!newConfig[role][groupName]) {
        newConfig[role][groupName] = { enabled: true, items: {} };
      }
      newConfig[role][groupName].enabled = enabled;
      
      // Update items too
      NAVIGATION_GROUPS[groupName as keyof typeof NAVIGATION_GROUPS]?.forEach(item => {
        if (item === 'Dashboard' || item === 'Profile') return; // Always keep these enabled
        
        if (!newConfig[role][groupName].items) {
          newConfig[role][groupName].items = {};
        }
        newConfig[role][groupName].items[item] = enabled;
      });
    });

    setLocalConfig(newConfig);
    setHasChanges(true);
  };

  if (isLoading || !localConfig) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentRoleConfig = localConfig[selectedRole] || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sidebar Navigation Control</h2>
          <p className="text-muted-foreground">
            Control which navigation items are visible to each user role
          </p>
          
          {/* Current Configuration Debug Info */}
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm">
              <div className="font-medium text-blue-900 mb-1">Current Configuration Status:</div>
              <div className="text-blue-700 space-y-1">
                <div>Selected Role: <Badge variant="outline">{ROLE_LABELS[selectedRole as keyof typeof ROLE_LABELS]}</Badge></div>
                <div>Groups Enabled: {Object.values(currentRoleConfig).filter(g => g.enabled).length}</div>
                <div>Has Config: {!!navigationConfig ? '✓' : '✗'}</div>
                <div>Has Changes: {hasChanges ? '⚠️ Unsaved' : '✓ Saved'}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              Unsaved Changes
            </Badge>
          )}
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || updateNavigationConfig.isPending}>
            {updateNavigationConfig.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Role Configuration Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-amber-600 mt-1">
            ⚠️
          </div>
          <div>
            <h4 className="font-medium text-amber-900">Testing Navigation Changes</h4>
            <p className="text-sm text-amber-700 mt-1">
              To test navigation changes for role <strong>{ROLE_LABELS[selectedRole as keyof typeof ROLE_LABELS]}</strong>, 
              you need to log in as a user with that role. Changes will only be visible to users with the configured role.
            </p>
          </div>
        </div>
      </div>

      <Tabs value={selectedRole} onValueChange={setSelectedRole}>
        <TabsList className="grid w-full grid-cols-7">
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <TabsTrigger key={role} value={role} className="text-xs">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(ROLE_LABELS).map((role) => (
          <TabsContent key={role} value={role} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    Navigation Settings for {ROLE_LABELS[role as keyof typeof ROLE_LABELS]}
                    <Badge variant={role === selectedRole ? "default" : "outline"}>
                      {role}
                    </Badge>
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => bulkToggleRole(role, false)}
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => bulkToggleRole(role, true)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Show All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {/* Role Configuration Summary */}
              <div className="px-6 pb-3">
                <div className="text-sm text-muted-foreground">
                  Configuration for {ROLE_LABELS[role as keyof typeof ROLE_LABELS]} role - 
                  {Object.values(currentRoleConfig).filter(g => g.enabled).length} of {Object.keys(NAVIGATION_GROUPS).length} groups enabled
                </div>
              </div>

              <CardContent className="space-y-6">
                {Object.entries(NAVIGATION_GROUPS).map(([groupName, items]) => {
                  const groupConfig = currentRoleConfig[groupName] || { enabled: true, items: {} };
                  const isGroupEnabled = groupConfig.enabled;
                  const isDashboard = groupName === 'Dashboard';

                  return (
                    <div key={groupName} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={isGroupEnabled}
                            onCheckedChange={(enabled) => handleGroupToggle(role, groupName, enabled)}
                            disabled={isDashboard}
                          />
                          <h4 className="font-medium text-sm">
                            {groupName}
                            {isDashboard && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Always Visible
                              </Badge>
                            )}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={isGroupEnabled ? "default" : "secondary"}>
                            {items.length} items
                          </Badge>
                          {isGroupEnabled && (
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              Enabled
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {isGroupEnabled && (
                        <div className="ml-6 grid grid-cols-2 gap-2">
                          {items.map((item) => {
                            const isItemEnabled = groupConfig.items[item] ?? true;
                            const isCoreItem = item === 'Dashboard' || item === 'Profile';
                            
                            return (
                              <div key={item} className="flex items-center gap-2 text-sm">
                                <Switch
                                  checked={isItemEnabled}
                                  onCheckedChange={(enabled) => handleItemToggle(role, groupName, item, enabled)}
                                  disabled={isCoreItem}
                                />
                                <span className={`${!isItemEnabled && !isCoreItem ? 'text-muted-foreground' : ''}`}>
                                  {item}
                                  {isCoreItem && (
                                    <Badge variant="outline" className="ml-1 text-xs">
                                      Core
                                    </Badge>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
