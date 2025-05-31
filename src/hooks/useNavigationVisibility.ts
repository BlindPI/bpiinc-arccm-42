
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConfigurationManager } from './useConfigurationManager';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from './useProfile';
import { toast } from 'sonner';

export interface NavigationVisibilityConfig {
  [groupName: string]: {
    enabled: boolean;
    items: {
      [itemName: string]: boolean;
    };
  };
}

// Emergency fallback configuration - used only when database config is completely broken
const getEmergencyFallbackConfig = (role: string): NavigationVisibilityConfig => {
  console.log('🚨 EMERGENCY: Using fallback configuration for role:', role);
  
  const baseConfig = {
    'Dashboard': { enabled: true, items: { 'Dashboard': true, 'Profile': true } }
  };

  // Role-specific emergency configurations
  const roleConfigs: Record<string, NavigationVisibilityConfig> = {
    'SA': {
      ...baseConfig,
      'User Management': { enabled: true, items: { 'Users': true, 'Teams': true, 'Role Management': true, 'Supervision': true } },
      'Training Management': { enabled: true, items: { 'Courses': true, 'Course Scheduling': true, 'Course Offerings': true, 'Enrollments': true, 'Enrollment Management': true, 'Teaching Sessions': true, 'Locations': true } },
      'Certificates': { enabled: true, items: { 'Certificates': true, 'Certificate Analytics': true, 'Rosters': true } },
      'Analytics & Reports': { enabled: true, items: { 'Analytics': true, 'Executive Dashboard': true, 'Instructor Performance': true, 'Report Scheduler': true, 'Reports': true } },
      'Compliance & Automation': { enabled: true, items: { 'Automation': true, 'Progression Path Builder': true } },
      'System Administration': { enabled: true, items: { 'Integrations': true, 'Notifications': true, 'System Monitoring': true, 'Settings': true } }
    },
    'AD': {
      ...baseConfig,
      'User Management': { enabled: true, items: { 'Users': true, 'Teams': true, 'Role Management': true, 'Supervision': true } },
      'Training Management': { enabled: true, items: { 'Courses': true, 'Course Scheduling': true, 'Course Offerings': true, 'Enrollments': true, 'Enrollment Management': true, 'Teaching Sessions': true, 'Locations': true } },
      'Certificates': { enabled: true, items: { 'Certificates': true, 'Certificate Analytics': true, 'Rosters': true } },
      'Analytics & Reports': { enabled: true, items: { 'Analytics': true, 'Executive Dashboard': true, 'Instructor Performance': true, 'Report Scheduler': true, 'Reports': true } },
      'Compliance & Automation': { enabled: true, items: { 'Automation': true, 'Progression Path Builder': true } }
    },
    'AP': {
      ...baseConfig,
      'User Management': { enabled: true, items: { 'Teams': true, 'Supervision': true } },
      'Training Management': { enabled: true, items: { 'Courses': true, 'Course Scheduling': true, 'Course Offerings': true, 'Enrollments': true, 'Teaching Sessions': true, 'Locations': true } },
      'Certificates': { enabled: true, items: { 'Certificates': true, 'Certificate Analytics': true, 'Rosters': true } },
      'Analytics & Reports': { enabled: true, items: { 'Analytics': true, 'Instructor Performance': true, 'Reports': true } }
    },
    'IC': {
      ...baseConfig,
      'Training Management': { enabled: true, items: { 'Courses': true, 'Teaching Sessions': true } },
      'Certificates': { enabled: true, items: { 'Certificates': true } }
    },
    'IP': {
      ...baseConfig,
      'Training Management': { enabled: true, items: { 'Courses': true, 'Course Scheduling': true, 'Teaching Sessions': true } },
      'Certificates': { enabled: true, items: { 'Certificates': true, 'Rosters': true } }
    },
    'IT': {
      ...baseConfig,
      'Training Management': { enabled: true, items: { 'Courses': true, 'Course Scheduling': true, 'Course Offerings': true, 'Teaching Sessions': true } },
      'Certificates': { enabled: true, items: { 'Certificates': true, 'Rosters': true } }
    },
    'IN': {
      ...baseConfig,
      'Training Management': { enabled: true, items: { 'Courses': true, 'Enrollments': true } },
      'Certificates': { enabled: true, items: { 'Certificates': true } }
    }
  };

  return roleConfigs[role] || baseConfig;
};

// Configuration validation function
const validateConfiguration = (config: NavigationVisibilityConfig): boolean => {
  if (!config || typeof config !== 'object') {
    console.error('🔧 NAVIGATION: Invalid configuration - not an object');
    return false;
  }

  const hasVisibleGroups = Object.values(config).some(group => group && group.enabled);
  if (!hasVisibleGroups) {
    console.error('🔧 NAVIGATION: Invalid configuration - no visible groups');
    return false;
  }

  // Ensure Dashboard is always enabled
  if (!config.Dashboard || !config.Dashboard.enabled) {
    console.warn('🔧 NAVIGATION: Dashboard not enabled, this will cause navigation issues');
    return false;
  }

  return true;
};

export function useNavigationVisibility() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { configurations, updateConfig, isLoading: configLoading } = useConfigurationManager();
  const queryClient = useQueryClient();

  const { data: navigationConfig, isLoading: navQueryLoading, error: navQueryError } = useQuery({
    queryKey: ['navigation-visibility-config', profile?.role],
    queryFn: async () => {
      console.log('🔧 NAVIGATION: Fetching config for role:', profile?.role);
      console.log('🔧 NAVIGATION: Available configurations:', configurations?.length);
      
      if (!profile?.role) {
        console.log('🔧 NAVIGATION: No role available');
        return null;
      }

      // Look for role-specific configuration in database
      const roleConfigKey = `visibility_${profile.role}`;
      const config = configurations?.find(c => 
        c.category === 'navigation' && c.key === roleConfigKey
      );
      
      if (config?.value) {
        console.log('🔧 NAVIGATION: Found DATABASE configuration for', profile.role);
        const configValue = config.value as NavigationVisibilityConfig;
        
        // Validate the database configuration
        if (validateConfiguration(configValue)) {
          console.log('🔧 NAVIGATION: Database configuration is valid for', profile.role);
          return configValue;
        } else {
          console.error('🔧 NAVIGATION: Database configuration is invalid for role:', profile.role);
          // Return emergency fallback for broken database config
          return getEmergencyFallbackConfig(profile.role);
        }
      }
      
      console.warn('🔧 NAVIGATION: No database config found for role:', profile.role, 'using emergency fallback');
      return getEmergencyFallbackConfig(profile.role);
    },
    enabled: !!profile?.role && !profileLoading,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  const isLoading = configLoading || navQueryLoading || profileLoading || !profile?.role;

  // Active configuration with proper fallback hierarchy
  const activeConfig = React.useMemo(() => {
    if (navigationConfig) {
      return navigationConfig;
    }
    
    // If query failed but we have a role, use emergency fallback
    if (profile?.role && navQueryError) {
      console.warn('🔧 NAVIGATION: Query failed, using emergency fallback for role:', profile.role);
      return getEmergencyFallbackConfig(profile.role);
    }
    
    return null;
  }, [navigationConfig, profile?.role, navQueryError]);

  const updateNavigationConfig = useMutation({
    mutationFn: async ({ role, newConfig }: { role: string; newConfig: NavigationVisibilityConfig }) => {
      console.log('🔧 NAVIGATION: Updating config for role:', role);
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      // Validate configuration before saving
      if (!validateConfiguration(newConfig)) {
        throw new Error('Configuration validation failed - invalid navigation structure');
      }
      
      // Ensure Dashboard is always enabled
      if (!newConfig.Dashboard || !newConfig.Dashboard.enabled) {
        console.warn('🚨 NAVIGATION: Forcing Dashboard to be enabled');
        newConfig.Dashboard = { 
          enabled: true, 
          items: { 
            Dashboard: true, 
            Profile: true 
          } 
        };
      }
      
      const roleConfigKey = `visibility_${role}`;
      
      return updateConfig.mutateAsync({
        category: 'navigation',
        key: roleConfigKey,
        value: newConfig,
        reason: `Updated navigation visibility settings for ${role} role`
      });
    },
    onSuccess: (_, { role }) => {
      console.log('🔧 NAVIGATION: Config updated successfully for role:', role);
      toast.success(`Navigation settings updated for ${role} role`);
      
      queryClient.removeQueries({ queryKey: ['navigation-visibility-config'] });
      queryClient.invalidateQueries({ queryKey: ['system-configurations'] });
      queryClient.refetchQueries({ 
        queryKey: ['navigation-visibility-config'],
        exact: false 
      });
    },
    onError: (error: any) => {
      console.error('🔧 NAVIGATION: Failed to update config:', error);
      toast.error(`Failed to update navigation settings: ${error.message}`);
    }
  });

  const emergencyRestoreNavigation = useMutation({
    mutationFn: async (role: string) => {
      console.log('🚨 EMERGENCY RESTORE: Restoring navigation for role:', role);
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      const emergencyConfig = getEmergencyFallbackConfig(role);
      const roleConfigKey = `visibility_${role}`;
      
      return updateConfig.mutateAsync({
        category: 'navigation',
        key: roleConfigKey,
        value: emergencyConfig,
        reason: `Emergency restore of navigation for ${role} role`
      });
    },
    onSuccess: (_, role) => {
      console.log('🚨 EMERGENCY RESTORE: Successfully restored navigation for role:', role);
      toast.success(`Emergency navigation restored for ${role} role`);
      
      queryClient.removeQueries({ queryKey: ['navigation-visibility-config'] });
      queryClient.invalidateQueries({ queryKey: ['system-configurations'] });
      queryClient.refetchQueries({ 
        queryKey: ['navigation-visibility-config'],
        exact: false 
      });
    },
    onError: (error: any) => {
      console.error('🚨 EMERGENCY RESTORE: Failed to restore navigation:', error);
      toast.error(`Failed to restore navigation: ${error.message}`);
    }
  });

  const isGroupVisible = (groupName: string, userRole?: string): boolean => {
    const targetRole = userRole || profile?.role;
    
    if (isLoading || !activeConfig || !targetRole) {
      return false;
    }
    
    // Dashboard is always visible as emergency fallback
    if (groupName === 'Dashboard') {
      return true;
    }
    
    const groupConfig = activeConfig[groupName];
    if (!groupConfig) {
      return false;
    }
    
    return groupConfig.enabled ?? false;
  };

  const isItemVisible = (groupName: string, itemName: string, userRole?: string): boolean => {
    const targetRole = userRole || profile?.role;
    
    if (isLoading || !activeConfig || !targetRole) {
      return false;
    }
    
    // Dashboard and Profile are always visible as emergency fallback
    if (itemName === 'Dashboard' || itemName === 'Profile') {
      return true;
    }
    
    // First check if the group is visible
    const groupVisible = isGroupVisible(groupName, targetRole);
    if (!groupVisible) {
      return false;
    }
    
    const groupConfig = activeConfig[groupName];
    if (!groupConfig) {
      return false;
    }
    
    const itemConfig = groupConfig.items[itemName];
    return itemConfig ?? true;
  };

  const getNavigationConfigForRole = (role: string): NavigationVisibilityConfig | null => {
    if (!configurations) {
      console.log('🔧 NAVIGATION: No configurations available, using emergency fallback for role:', role);
      return getEmergencyFallbackConfig(role);
    }
    
    const roleConfigKey = `visibility_${role}`;
    const config = configurations.find(c => 
      c.category === 'navigation' && c.key === roleConfigKey
    );
    
    if (config?.value) {
      const configValue = config.value as NavigationVisibilityConfig;
      if (validateConfiguration(configValue)) {
        return configValue;
      } else {
        console.error('🔧 NAVIGATION: Invalid database config for role:', role);
        return getEmergencyFallbackConfig(role);
      }
    }
    
    console.log('🔧 NAVIGATION: No database config found for role:', role, 'using emergency fallback');
    return getEmergencyFallbackConfig(role);
  };

  const getVisibleNavigation = (userRole?: string) => {
    const targetRole = userRole || profile?.role;
    if (!targetRole || !activeConfig || isLoading) return null;

    return {
      isGroupVisible: (groupName: string) => isGroupVisible(groupName, targetRole),
      isItemVisible: (groupName: string, itemName: string) => isItemVisible(groupName, itemName, targetRole)
    };
  };

  // Configuration health check
  const configurationHealth = React.useMemo(() => {
    if (!profile?.role || isLoading) {
      return { status: 'loading', message: 'Loading configuration...' };
    }

    if (!activeConfig) {
      return { status: 'error', message: 'No configuration available' };
    }

    if (!validateConfiguration(activeConfig)) {
      return { status: 'error', message: 'Configuration validation failed' };
    }

    const hasVisibleGroups = Object.values(activeConfig).some(group => group.enabled);
    if (!hasVisibleGroups) {
      return { status: 'error', message: 'No visible navigation groups' };
    }

    return { status: 'healthy', message: 'Configuration is valid' };
  }, [activeConfig, profile?.role, isLoading]);

  return {
    navigationConfig: activeConfig,
    isLoading,
    updateNavigationConfig,
    emergencyRestoreNavigation,
    isGroupVisible: (groupName: string) => isGroupVisible(groupName, profile?.role),
    isItemVisible: (groupName: string, itemName: string) => isItemVisible(groupName, itemName, profile?.role),
    getNavigationConfigForRole,
    getVisibleNavigation,
    configurationHealth
  };
}
