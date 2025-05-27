
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigationVisibility, NavigationVisibilityConfig } from '@/hooks/useNavigationVisibility';
import { Loader2, Save, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { ROLE_LABELS } from '@/lib/roles';

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

export function SidebarNavigationControl() {
  const { isLoading, updateNavigationConfig, getNavigationConfigForRole } = useNavigationVisibility();
  const [localConfigs, setLocalConfigs] = useState<Record<string, NavigationVisibilityConfig>>({});
  const [selectedRole, setSelectedRole] = useState<string>('SA');
  const [hasChanges, setHasChanges] = useState<Record<string, boolean>>({});

  // Load configuration for the selected role
  React.useEffect(() => {
    if (!localConfigs[selectedRole]) {
      const roleConfig = getNavigationConfigForRole(selectedRole);
      if (roleConfig) {
        setLocalConfigs(prev => ({
          ...prev,
          [selectedRole]: roleConfig
        }));
      }
    }
  }, [selectedRole, getNavigationConfigForRole]);

  const handleGroupToggle = (role: string, groupName: string, enabled: boolean) => {
    const currentConfig = localConfigs[role] || {};
    
    const newConfig = { ...currentConfig };
    if (!newConfig[groupName]) {
      newConfig[groupName] = { enabled: true, items: {} };
    }
    
    newConfig[groupName].enabled = enabled;
    
    // If disabling a group, disable all its items too
    if (!enabled) {
      NAVIGATION_GROUPS[groupName as keyof typeof NAVIGATION_GROUPS]?.forEach(item => {
        if (!newConfig[groupName].items) {
          newConfig[groupName].items = {};
        }
        newConfig[groupName].items[item] = false;
      });
    }

    setLocalConfigs(prev => ({
      ...prev,
      [role]: newConfig
    }));
    
    setHasChanges(prev => ({
      ...prev,
      [role]: true
    }));
  };

  const handleItemToggle = (role: string, groupName: string, itemName: string, enabled: boolean) => {
    const currentConfig = localConfigs[role] || {};
    
    const newConfig = { ...currentConfig };
    if (!newConfig[groupName]) {
      newConfig[groupName] = { enabled: true, items: {} };
    }
    if (!newConfig[groupName].items) {
      newConfig[groupName].items = {};
    }

    newConfig[groupName].items[itemName] = enabled;
    
    setLocalConfigs(prev => ({
      ...prev,
      [role]: newConfig
    }));
    
    setHasChanges(prev => ({
      ...prev,
      [role]: true
    }));
  };

  const handleSave = async (role: string) => {
    const configToSave = localConfigs[role];
    if (!configToSave) return;

    try {
      await updateNavigationConfig.mutateAsync({ role, newConfig: configToSave });
      setHasChanges(prev => ({
        ...prev,
        [role]: false
      }));
      toast.success(`Navigation settings saved for ${ROLE_LABELS[role as keyof typeof ROLE_LABELS]} role`);
    } catch (error) {
      toast.error(`Failed to save navigation settings for ${role} role`);
    }
  };

  const handleReset = (role: string) => {
    const originalConfig = getNavigationConfigForRole(role);
    if (originalConfig) {
      setLocalConfigs(prev => ({
        ...prev,
        [role]: originalConfig
      }));
      setHasChanges(prev => ({
        ...prev,
        [role]: false
      }));
      toast.info(`Changes reset for ${role} role`);
    }
  };

  const bulkToggleRole = (role: string, enabled: boolean) => {
    const currentConfig = localConfigs[role] || {};
    const newConfig = { ...currentConfig };

    Object.keys(NAVIGATION_GROUPS).forEach(groupName => {
      if (groupName === 'Dashboard') return; // Always keep dashboard enabled
      
      if (!newConfig[groupName]) {
        newConfig[groupName] = { enabled: true, items: {} };
      }
      newConfig[groupName].enabled = enabled;
      
      // Update items too
      NAVIGATION_GROUPS[groupName as keyof typeof NAVIGATION_GROUPS]?.forEach(item => {
        if (item === 'Dashboard' || item === 'Profile') return; // Always keep these enabled
        
        if (!newConfig[groupName].items) {
          newConfig[groupName].items = {};
        }
        newConfig[groupName].items[item] = enabled;
      });
    });

    setLocalConfigs(prev => ({
      ...prev,
      [role]: newConfig
    }));
    
    setHasChanges(prev => ({
      ...prev,
      [role]: true
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentRoleConfig = localConfigs[selectedRole] || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Role-Based Navigation Control</h2>
          <p className="text-muted-foreground">
            Configure navigation visibility for each user role independently
          </p>
          
          {/* Configuration Status */}
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm">
              <div className="font-medium text-blue-900 mb-1">Configuring Navigation for:</div>
              <div className="text-blue-700 space-y-1">
                <div>Role: <Badge variant="outline">{ROLE_LABELS[selectedRole as keyof typeof ROLE_LABELS]} ({selectedRole})</Badge></div>
                <div>Groups Enabled: {Object.values(currentRoleConfig).filter(g => g.enabled).length}</div>
                <div>Has Unsaved Changes: {hasChanges[selectedRole] ? '⚠️ Yes' : '✓ No'}</div>
                <div className="mt-1 text-orange-600 font-medium">
                  ⚠️ Changes only affect users with the selected role, not your own navigation
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {hasChanges[selectedRole] && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              Unsaved Changes for {selectedRole}
            </Badge>
          )}
          <Button 
            variant="outline" 
            onClick={() => handleReset(selectedRole)} 
            disabled={!hasChanges[selectedRole]}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset {selectedRole}
          </Button>
          <Button 
            onClick={() => handleSave(selectedRole)} 
            disabled={!hasChanges[selectedRole] || updateNavigationConfig.isPending}
          >
            {updateNavigationConfig.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save {selectedRole} Settings
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
            <h4 className="font-medium text-amber-900">Role-Specific Configuration</h4>
            <p className="text-sm text-amber-700 mt-1">
              You are configuring navigation for <strong>{ROLE_LABELS[selectedRole as keyof typeof ROLE_LABELS]} ({selectedRole})</strong> role. 
              These changes will only affect users with that specific role. Your own navigation remains unchanged unless you configure your own role.
            </p>
          </div>
        </div>
      </div>

      <Tabs value={selectedRole} onValueChange={setSelectedRole}>
        <TabsList className="grid w-full grid-cols-7">
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <TabsTrigger key={role} value={role} className="text-xs">
              {role}
              {hasChanges[role] && <span className="ml-1 text-orange-500">*</span>}
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
              
              <div className="px-6 pb-3">
                <div className="text-sm text-muted-foreground">
                  Configuration for {ROLE_LABELS[role as keyof typeof ROLE_LABELS]} users - 
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
