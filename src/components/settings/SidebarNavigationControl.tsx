
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigationVisibility, NavigationVisibilityConfig } from '@/hooks/useNavigationVisibility';
import { useTeamNavigationVisibility } from '@/hooks/useTeamNavigationVisibility';
import { useTeamContext } from '@/hooks/useTeamContext';
import { Loader2, Save, RotateCcw, Eye, EyeOff, AlertTriangle, RefreshCw, CheckCircle, XCircle, Users, Building2 } from 'lucide-react';
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

// Configuration validation function
const validateRoleConfiguration = (config: NavigationVisibilityConfig): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!config || typeof config !== 'object') {
    errors.push('Configuration is not a valid object');
    return { valid: false, errors };
  }

  const hasVisibleGroups = Object.values(config).some(group => group && group.enabled);
  if (!hasVisibleGroups) {
    errors.push('No navigation groups are enabled - users will not be able to navigate');
  }

  if (!config.Dashboard || !config.Dashboard.enabled) {
    errors.push('Dashboard group must be enabled for basic navigation');
  }

  if (!config.Dashboard?.items?.Dashboard || !config.Dashboard?.items?.Profile) {
    errors.push('Dashboard and Profile items must be enabled for core functionality');
  }

  return { valid: errors.length === 0, errors };
};

export function SidebarNavigationControl() {
  const { 
    isLoading, 
    updateNavigationConfig, 
    emergencyRestoreNavigation, 
    getNavigationConfigForRole,
    configurationHealth,
    hasTeamOverrides,
    hasProviderOverrides
  } = useNavigationVisibility();
  
  const {
    updateTeamNavigationConfig,
    updateProviderNavigationConfig,
    teamNavigationConfigs,
    providerNavigationConfigs
  } = useTeamNavigationVisibility();
  
  const { canManageTeamNavigation, primaryTeam, isTeamAdmin } = useTeamContext();
  
  const [localConfigs, setLocalConfigs] = useState<Record<string, NavigationVisibilityConfig>>({});
  const [selectedRole, setSelectedRole] = useState<string>('SA');
  const [selectedTab, setSelectedTab] = useState<string>('role-config');
  const [hasChanges, setHasChanges] = useState<Record<string, boolean>>({});
  const [validationResults, setValidationResults] = useState<Record<string, { valid: boolean; errors: string[] }>>({});

  // Emergency recovery function with enhanced error handling
  const emergencyRestore = async (role: string) => {
    try {
      console.log('🚨 EMERGENCY: Restoring navigation for role:', role);
      await emergencyRestoreNavigation.mutateAsync(role);
      
      // Reload the configuration after emergency restore
      const restoredConfig = getNavigationConfigForRole(role);
      if (restoredConfig) {
        setLocalConfigs(prev => ({
          ...prev,
          [role]: restoredConfig
        }));
        
        // Validate the restored configuration
        const validation = validateRoleConfiguration(restoredConfig);
        setValidationResults(prev => ({
          ...prev,
          [role]: validation
        }));
      }
      
      setHasChanges(prev => ({
        ...prev,
        [role]: false
      }));
      
      toast.success(`Emergency navigation restored for ${ROLE_LABELS[role as keyof typeof ROLE_LABELS]} role`);
    } catch (error) {
      console.error('🚨 EMERGENCY: Failed to restore navigation:', error);
      toast.error(`Failed to restore navigation for ${role} role`);
    }
  };

  // Load configuration for the selected role with enhanced validation
  React.useEffect(() => {
    if (!localConfigs[selectedRole]) {
      const roleConfig = getNavigationConfigForRole(selectedRole);
      if (roleConfig) {
        setLocalConfigs(prev => ({
          ...prev,
          [selectedRole]: roleConfig
        }));

        // Validate the loaded configuration
        const validation = validateRoleConfiguration(roleConfig);
        setValidationResults(prev => ({
          ...prev,
          [selectedRole]: validation
        }));

        if (!validation.valid) {
          console.warn('🚨 WARNING: Role configuration has validation errors for:', selectedRole);
          toast.warning(`Configuration issues detected for ${selectedRole} role`);
        }
      } else {
        console.warn('No database configuration found for role:', selectedRole);
        toast.warning(`No navigation configuration found for ${selectedRole} role in database`);
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

    // Validate the new configuration
    const validation = validateRoleConfiguration(newConfig);
    setValidationResults(prev => ({
      ...prev,
      [role]: validation
    }));

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
    
    // Validate the new configuration
    const validation = validateRoleConfiguration(newConfig);
    setValidationResults(prev => ({
      ...prev,
      [role]: validation
    }));
    
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
    if (!configToSave) {
      toast.error(`No configuration to save for ${role} role`);
      return;
    }

    // Final validation before save
    const validation = validateRoleConfiguration(configToSave);
    if (!validation.valid) {
      toast.error(`Cannot save invalid configuration: ${validation.errors.join(', ')}`);
      return;
    }

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
      
      // Validate the reset configuration
      const validation = validateRoleConfiguration(originalConfig);
      setValidationResults(prev => ({
        ...prev,
        [role]: validation
      }));
      
      setHasChanges(prev => ({
        ...prev,
        [role]: false
      }));
      toast.info(`Changes reset for ${role} role`);
    } else {
      toast.warning(`No original configuration found for ${role} role`);
    }
  };

  const bulkToggleRole = (role: string, enabled: boolean) => {
    const currentConfig = localConfigs[role] || {};
    const newConfig = { ...currentConfig };

    Object.keys(NAVIGATION_GROUPS).forEach(groupName => {
      // CRITICAL: Always keep Dashboard enabled to prevent broken navigation
      if (groupName === 'Dashboard') {
        if (!newConfig[groupName]) {
          newConfig[groupName] = { enabled: true, items: {} };
        }
        newConfig[groupName].enabled = true;
        // Keep Dashboard and Profile always enabled
        if (!newConfig[groupName].items) {
          newConfig[groupName].items = {};
        }
        newConfig[groupName].items['Dashboard'] = true;
        newConfig[groupName].items['Profile'] = true;
        return;
      }
      
      if (!newConfig[groupName]) {
        newConfig[groupName] = { enabled: true, items: {} };
      }
      newConfig[groupName].enabled = enabled;
      
      // Update items too
      NAVIGATION_GROUPS[groupName as keyof typeof NAVIGATION_GROUPS]?.forEach(item => {
        if (!newConfig[groupName].items) {
          newConfig[groupName].items = {};
        }
        newConfig[groupName].items[item] = enabled;
      });
    });

    // Validate the bulk change
    const validation = validateRoleConfiguration(newConfig);
    setValidationResults(prev => ({
      ...prev,
      [role]: validation
    }));

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
  const currentValidation = validationResults[selectedRole];
  const hasVisibleGroups = Object.values(currentRoleConfig).some(group => group.enabled);

  // Determine available tabs based on user permissions
  const availableTabs = [
    { id: 'role-config', label: 'Role Configuration', icon: Users },
    ...(canManageTeamNavigation ? [{ id: 'team-config', label: 'Team Overrides', icon: Building2 }] : [])
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Role-Based Navigation Control</h2>
          <p className="text-muted-foreground">
            Configure navigation visibility for each user role with team and provider overrides
          </p>
          
          {/* Enhanced Configuration Status */}
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm">
              <div className="font-medium text-blue-900 mb-1">System Status:</div>
              <div className="text-blue-700 space-y-1">
                <div>Selected Role: <Badge variant="outline">{ROLE_LABELS[selectedRole as keyof typeof ROLE_LABELS]} ({selectedRole})</Badge></div>
                <div>Groups Enabled: {Object.values(currentRoleConfig).filter(g => g.enabled).length}</div>
                <div>Unsaved Changes: {hasChanges[selectedRole] ? '⚠️ Yes' : '✓ No'}</div>
                <div>System Health: <Badge variant={configurationHealth.status === 'healthy' ? 'default' : 'destructive'}>{configurationHealth.status}</Badge></div>
                <div>Team Overrides: <Badge variant={hasTeamOverrides ? 'default' : 'secondary'}>{hasTeamOverrides ? 'Active' : 'None'}</Badge></div>
                <div>Provider Overrides: <Badge variant={hasProviderOverrides ? 'default' : 'secondary'}>{hasProviderOverrides ? 'Active' : 'None'}</Badge></div>
              </div>
            </div>
          </div>

          {/* Enhanced Validation Alert */}
          {currentValidation && !currentValidation.valid && (
            <Alert variant="destructive" className="mt-2">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">Configuration Issues:</div>
                <ul className="list-disc list-inside text-sm mt-1">
                  {currentValidation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Success validation */}
          {currentValidation && currentValidation.valid && (
            <Alert variant="default" className="mt-2 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Configuration is valid and ready to save.
              </AlertDescription>
            </Alert>
          )}

          {/* Critical Navigation Alert */}
          {!hasVisibleGroups && (
            <Alert variant="destructive" className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">CRITICAL: No Navigation Groups Enabled</div>
                <div className="text-sm mt-1">
                  Users with the {selectedRole} role will not be able to navigate the application.
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => emergencyRestore(selectedRole)}
                    disabled={emergencyRestoreNavigation.isPending}
                  >
                    {emergencyRestoreNavigation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Emergency Restore
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
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
            disabled={!hasChanges[selectedRole] || updateNavigationConfig.isPending || (currentValidation && !currentValidation.valid)}
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

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          {availableTabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="role-config" className="space-y-4">
          {/* Enhanced Role Configuration Warning */}
          <Alert variant="default" className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              <div>
                <h4 className="font-medium text-amber-900">Database-Driven Role Configuration</h4>
                <p className="text-sm text-amber-700 mt-1">
                  All navigation settings are stored in the database and applied globally to users with the selected role. 
                  Changes affect <strong>ALL {selectedRole} users immediately</strong> after saving.
                  {(hasTeamOverrides || hasProviderOverrides) && (
                    <span className="block mt-1 font-medium">
                      Team/Provider overrides are currently active and will modify these base settings.
                    </span>
                  )}
                </p>
              </div>
            </AlertDescription>
          </Alert>

          <Tabs value={selectedRole} onValueChange={setSelectedRole}>
            <TabsList className="grid w-full grid-cols-7">
              {Object.entries(ROLE_LABELS).map(([role, label]) => {
                const roleValidation = validationResults[role];
                return (
                  <TabsTrigger key={role} value={role} className="text-xs relative">
                    {role}
                    {hasChanges[role] && <span className="ml-1 text-orange-500">*</span>}
                    {roleValidation && !roleValidation.valid && (
                      <XCircle className="h-3 w-3 text-red-500 absolute -top-1 -right-1" />
                    )}
                  </TabsTrigger>
                );
              })}
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
                        {validationResults[role] && (
                          <Badge variant={validationResults[role].valid ? "default" : "destructive"}>
                            {validationResults[role].valid ? "Valid" : "Invalid"}
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => bulkToggleRole(role, false)}
                          disabled={!hasVisibleGroups}
                          title="This will keep Dashboard enabled to prevent broken navigation"
                        >
                          <EyeOff className="h-4 w-4 mr-2" />
                          Hide Most
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => bulkToggleRole(role, true)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Show All
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => emergencyRestore(role)}
                          disabled={emergencyRestoreNavigation.isPending}
                        >
                          {emergencyRestoreNavigation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 mr-2" />
                          )}
                          Emergency Restore
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
                                    Required
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
                                          Required
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
        </TabsContent>

        {canManageTeamNavigation && (
          <TabsContent value="team-config" className="space-y-4">
            <Alert variant="default" className="border-blue-200 bg-blue-50">
              <Users className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <div>
                  <h4 className="font-medium text-blue-900">Team Navigation Overrides</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Configure team-specific navigation overrides that modify the base role settings for team members.
                    {isTeamAdmin && primaryTeam && (
                      <span className="block mt-1 font-medium">
                        You are managing overrides for team: {primaryTeam.teams?.name}
                      </span>
                    )}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
            
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Team Navigation Management</h3>
              <p>Advanced team-specific navigation configuration coming soon</p>
              <div className="mt-4 text-sm">
                <p>Current team overrides: {teamNavigationConfigs?.length || 0}</p>
                <p>Current provider overrides: {providerNavigationConfigs?.length || 0}</p>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
