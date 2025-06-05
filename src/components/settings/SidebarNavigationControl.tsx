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
import { useConfigurationManager } from '@/hooks/useConfigurationManager';
import { Loader2, Save, RotateCcw, Eye, EyeOff, AlertTriangle, CheckCircle, XCircle, Users, Building2 } from 'lucide-react';
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
  'System Administration': ['Integrations', 'Notifications', 'System Monitoring', 'Settings'],
  'CRM' : ['CRM Dashboard', 'Lead Management', 'Opportunities', 'Activities', 'Revenue Analytics']
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
    getNavigationConfigForRole,
    configurationHealth,
    hasTeamOverrides,
    hasProviderOverrides
  } = useNavigationVisibility();
  
  const { updateConfig, configurations } = useConfigurationManager();
  
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
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});

  // Load all role configurations on mount
  React.useEffect(() => {
    console.log('🔧 NAV-CONTROL: Loading all role configurations');
    
    // Get the master config if it exists
    const masterConfig = configurations?.find(c => c.category === 'navigation' && c.key === 'visibility');
    
    if (masterConfig?.value && typeof masterConfig.value === 'object') {
      console.log('🔧 NAV-CONTROL: Loading from master config');
      const allRolesConfig = masterConfig.value as Record<string, NavigationVisibilityConfig>;
      
      Object.keys(ROLE_LABELS).forEach(role => {
        if (allRolesConfig[role]) {
          console.log('✅ Loaded master config for role:', role);
          setLocalConfigs(prev => ({
            ...prev,
            [role]: allRolesConfig[role]
          }));
        } else {
          console.warn('❌ No master config found for role:', role);
          // Set emergency default for missing configs
          const emergencyConfig = role === 'SA' ? {
            'Dashboard': { enabled: true, items: { 'Dashboard': true, 'Profile': true } },
            'System Administration': { enabled: true, items: { 'Settings': true, 'System Monitoring': true, 'Integrations': true, 'Notifications': true } },
            'User Management': { enabled: true, items: { 'Users': true, 'Teams': true, 'Role Management': true, 'Supervision': true } },
            'Training Management': { enabled: true, items: { 'Courses': true, 'Course Scheduling': true, 'Course Offerings': true, 'Enrollments': true, 'Enrollment Management': true, 'Teaching Sessions': true, 'Locations': true } },
            'Certificates': { enabled: true, items: { 'Certificates': true, 'Certificate Analytics': true, 'Rosters': true } },
            'Analytics & Reports': { enabled: true, items: { 'Analytics': true, 'Executive Dashboard': true, 'Instructor Performance': true, 'Report Scheduler': true, 'Reports': true } },
            'Compliance & Automation': { enabled: true, items: { 'Automation': true, 'Progression Path Builder': true } }
          } : {
            'Dashboard': { enabled: true, items: { 'Dashboard': true, 'Profile': true } }
          };
          setLocalConfigs(prev => ({
            ...prev,
            [role]: emergencyConfig
          }));
        }
      });
    } else {
      // Fall back to individual role configs
      console.log('🔧 NAV-CONTROL: No master config, loading individual configs');
      Object.keys(ROLE_LABELS).forEach(role => {
        const roleConfig = getNavigationConfigForRole(role);
        if (roleConfig) {
          console.log('✅ Loaded individual config for role:', role);
          setLocalConfigs(prev => ({
            ...prev,
            [role]: roleConfig
          }));
        }
      });
    }
  }, [getNavigationConfigForRole, configurations]);

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

    // EMERGENCY: Prevent SA lockout
    if (role === 'SA') {
      if (!configToSave['System Administration']?.enabled || !configToSave['System Administration']?.items?.Settings) {
        toast.error('Cannot disable System Administration or Settings for SA role - this would cause system lockout');
        return;
      }
    }

    // Final validation before save
    const validation = validateRoleConfiguration(configToSave);
    if (!validation.valid) {
      toast.error(`Cannot save invalid configuration: ${validation.errors.join(', ')}`);
      return;
    }

    setSavingStates(prev => ({ ...prev, [role]: true }));

    try {
      console.log('🔧 NAV-CONTROL: SAVING navigation config for role:', role);
      
      // FIXED: Save to master config instead of individual role config
      const masterConfig = configurations?.find(c => c.category === 'navigation' && c.key === 'visibility');
      
      let updatedMasterConfig: Record<string, NavigationVisibilityConfig>;
      
      if (masterConfig?.value && typeof masterConfig.value === 'object') {
        // Update existing master config
        updatedMasterConfig = {
          ...masterConfig.value,
          [role]: configToSave
        };
      } else {
        // Create new master config with all current local configs
        updatedMasterConfig = {
          ...localConfigs,
          [role]: configToSave
        };
      }
      
      console.log('🔧 NAV-CONTROL: Updating master config with:', updatedMasterConfig);
      
      await updateConfig.mutateAsync({
        category: 'navigation',
        key: 'visibility',
        value: updatedMasterConfig,
        reason: `Updated navigation visibility settings for ${role} role via master config`
      });
      
      setHasChanges(prev => ({
        ...prev,
        [role]: false
      }));
      
      console.log('✅ NAV-CONTROL: Save successful for role:', role);
      toast.success(`Navigation settings saved for ${ROLE_LABELS[role as keyof typeof ROLE_LABELS]} role`);
      
    } catch (error: any) {
      console.error('🚨 NAV-CONTROL: Save failed for role:', role, error);
      toast.error(`Failed to save navigation settings for ${role} role: ${error.message}`);
    } finally {
      setSavingStates(prev => ({ ...prev, [role]: false }));
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

  // Show emergency recovery interface if needed
  if (configurationHealth.status === 'emergency' || configurationHealth.status === 'error') {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">EMERGENCY NAVIGATION RECOVERY</div>
            <div className="text-sm mt-1">
              Critical navigation configuration issues detected. Use the controls below to restore navigation access.
            </div>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Emergency Recovery Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                The navigation system is in emergency mode. All role configurations are being restored to safe defaults.
              </p>
              
              <div className="grid gap-4">
                {Object.keys(ROLE_LABELS).map(role => (
                  <div key={role} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{ROLE_LABELS[role as keyof typeof ROLE_LABELS]} ({role})</div>
                      <div className="text-sm text-gray-500">
                        {localConfigs[role] ? 'Configuration loaded' : 'Using emergency defaults'}
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleSave(role)}
                      disabled={savingStates[role]}
                      variant={role === 'SA' ? 'default' : 'outline'}
                    >
                      {savingStates[role] ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Restore {role}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <div>Save Mode: <Badge variant="secondary">Master Config</Badge></div>
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
            disabled={!hasChanges[selectedRole] || savingStates[selectedRole] || (currentValidation && !currentValidation.valid)}
          >
            {savingStates[selectedRole] ? (
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
                  All navigation settings are stored in the database master config and applied globally to users with the selected role. 
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
