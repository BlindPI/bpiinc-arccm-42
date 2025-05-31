
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConfigurationManager } from './useConfigurationManager';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from './useProfile';
import { useTeamNavigationVisibility } from './useTeamNavigationVisibility';
import { toast } from 'sonner';

export interface NavigationVisibilityConfig {
  [groupName: string]: {
    enabled: boolean;
    items: {
      [itemName: string]: boolean;
    };
  };
}

// FIXED: Correct emergency fallback configuration - IT users should only see Dashboard + Profile
const getEmergencyFallbackConfig = (role: string): NavigationVisibilityConfig => {
  console.log('🚨 EMERGENCY: Using fallback configuration for role:', role);
  
  const baseConfig = {
    'Dashboard': { 
      enabled: true, 
      items: { 
        'Dashboard': true, 
        'Profile': true 
      } 
    }
  };

  // STRICT role-specific emergency configurations
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
    'IC': baseConfig, // Only Dashboard + Profile
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
    'IN': baseConfig // Only Dashboard + Profile
  };

  return roleConfigs[role] || baseConfig;
};

// Simplified configuration validation
const validateConfiguration = (config: NavigationVisibilityConfig, role: string): boolean => {
  console.log('🔧 VALIDATION: Validating config for role:', role, config);
  
  if (!config || typeof config !== 'object') {
    console.error('🔧 VALIDATION: Invalid configuration - not an object');
    return false;
  }

  // Ensure Dashboard is always enabled
  if (!config.Dashboard || config.Dashboard.enabled !== true) {
    console.warn('🔧 VALIDATION: Dashboard not enabled, this will cause navigation issues');
    return false;
  }

  console.log('🔧 VALIDATION: Configuration is valid for role:', role);
  return true;
};

export function useNavigationVisibility() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { configurations, updateConfig, isLoading: configLoading } = useConfigurationManager();
  const { 
    mergeNavigationConfigs, 
    isLoading: teamNavLoading,
    hasTeamOverrides,
    hasProviderOverrides
  } = useTeamNavigationVisibility();
  const queryClient = useQueryClient();

  const { data: navigationConfig, isLoading: navQueryLoading, error: navQueryError } = useQuery({
    queryKey: ['navigation-visibility-config', profile?.role, hasTeamOverrides, hasProviderOverrides],
    queryFn: async () => {
      console.log('🔧 NAVIGATION: === FETCHING CONFIG START ===');
      console.log('🔧 NAVIGATION: Role:', profile?.role);
      console.log('🔧 NAVIGATION: Available configurations:', configurations?.map(c => `${c.category}.${c.key}`));
      
      if (!profile?.role) {
        console.log('🔧 NAVIGATION: No role available, returning null');
        return null;
      }

      // FIXED: Only look for the specific role configuration
      const roleConfigKey = `visibility_${profile.role}`;
      const config = configurations?.find(c => 
        c.category === 'navigation' && c.key === roleConfigKey
      );
      
      console.log('🔧 NAVIGATION: Looking for config key:', roleConfigKey);
      console.log('🔧 NAVIGATION: Found config:', config);
      
      if (config?.value) {
        console.log('🔧 NAVIGATION: Using database configuration for', profile.role, ':', config.value);
        
        let configValue = config.value as NavigationVisibilityConfig;
        
        // Validate the database configuration
        if (validateConfiguration(configValue, profile.role)) {
          console.log('🔧 NAVIGATION: Database configuration is valid for', profile.role);
          
          // Apply team/provider overrides if available
          const finalConfig = mergeNavigationConfigs(configValue, profile.role);
          console.log('🔧 NAVIGATION: Final merged configuration for', profile.role, ':', finalConfig);
          
          return finalConfig;
        } else {
          console.error('🔧 NAVIGATION: Database configuration is invalid for role:', profile.role);
        }
      }
      
      console.warn('🔧 NAVIGATION: No valid database config found for role:', profile.role, 'using emergency fallback');
      const fallback = getEmergencyFallbackConfig(profile.role);
      console.log('🔧 NAVIGATION: Emergency fallback config:', fallback);
      return fallback;
    },
    enabled: !!profile?.role && !profileLoading && !configLoading && !teamNavLoading,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache old data
    retry: false,
  });

  const isLoading = configLoading || navQueryLoading || profileLoading || teamNavLoading || !profile?.role;

  // Active configuration with proper fallback
  const activeConfig = React.useMemo(() => {
    console.log('🔧 NAVIGATION: === ACTIVE CONFIG CALCULATION ===');
    console.log('🔧 NAVIGATION: navigationConfig:', navigationConfig);
    console.log('🔧 NAVIGATION: profile?.role:', profile?.role);
    console.log('🔧 NAVIGATION: navQueryError:', navQueryError);
    
    if (navigationConfig) {
      console.log('🔧 NAVIGATION: Using navigationConfig:', navigationConfig);
      return navigationConfig;
    }
    
    // If query failed but we have a role, use emergency fallback
    if (profile?.role && navQueryError) {
      console.warn('🔧 NAVIGATION: Query failed, using emergency fallback for role:', profile.role);
      return getEmergencyFallbackConfig(profile.role);
    }
    
    console.log('🔧 NAVIGATION: No active config available');
    return null;
  }, [navigationConfig, profile?.role, navQueryError]);

  // SIMPLIFIED: Group visibility checking
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
    return groupConfig?.enabled === true;
  };

  // SIMPLIFIED: Item visibility checking
  const isItemVisible = (groupName: string, itemName: string, userRole?: string): boolean => {
    const targetRole = userRole || profile?.role;
    
    if (isLoading || !activeConfig || !targetRole) {
      return false;
    }
    
    // Dashboard and Profile are always visible
    if (itemName === 'Dashboard' || itemName === 'Profile') {
      return true;
    }
    
    // First check if the group is visible
    if (!isGroupVisible(groupName, targetRole)) {
      return false;
    }
    
    const groupConfig = activeConfig[groupName];
    if (!groupConfig || !groupConfig.items) {
      return false;
    }
    
    // Only return true if explicitly set to true
    return groupConfig.items[itemName] === true;
  };

  const updateNavigationConfig = useMutation({
    mutationFn: async ({ role, newConfig }: { role: string; newConfig: NavigationVisibilityConfig }) => {
      console.log('🔧 NAVIGATION: Updating config for role:', role);
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      // Validate configuration before saving
      if (!validateConfiguration(newConfig, role)) {
        throw new Error('Configuration validation failed - invalid navigation structure');
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
      
      // Clear cache and refetch
      queryClient.removeQueries({ queryKey: ['navigation-visibility-config'] });
      queryClient.removeQueries({ queryKey: ['system-configurations'] });
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
      queryClient.removeQueries({ queryKey: ['system-configurations'] });
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
      
      if (validateConfiguration(configValue, role)) {
        return mergeNavigationConfigs(configValue, role);
      } else {
        console.error('🔧 NAVIGATION: Invalid database config for role:', role);
        return getEmergencyFallbackConfig(role);
      }
    }
    
    console.log('🔧 NAVIGATION: No database config found for role:', role, 'using emergency fallback');
    return getEmergencyFallbackConfig(role);
  };

  // Enhanced configuration health check
  const configurationHealth = React.useMemo(() => {
    if (!profile?.role || isLoading) {
      return { status: 'loading', message: 'Loading configuration...' };
    }

    if (!activeConfig) {
      return { status: 'error', message: 'No configuration available' };
    }

    if (!validateConfiguration(activeConfig, profile.role)) {
      return { status: 'error', message: 'Configuration validation failed' };
    }

    const hasVisibleGroups = Object.values(activeConfig).some(group => group.enabled === true);
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
    configurationHealth,
    hasTeamOverrides,
    hasProviderOverrides
  };
}
