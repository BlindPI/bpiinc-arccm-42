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

// FIXED - Strict emergency fallback configuration - only SA and AD get full access
const getEmergencyFallbackConfig = (role: string): NavigationVisibilityConfig => {
  console.log('🚨 EMERGENCY: Using fallback configuration for role:', role);
  
  // CRITICAL: Most roles should ONLY see Dashboard + Profile - NOTHING ELSE
  const restrictedConfig = {
    'Dashboard': { 
      enabled: true, 
      items: { 
        'Dashboard': true, 
        'Profile': true 
      } 
    }
  };

  // ONLY SA and AD get full access in emergency fallback
  if (role === 'SA') {
    return {
      ...restrictedConfig,
      'User Management': { enabled: true, items: { 'Users': true, 'Teams': true, 'Role Management': true, 'Supervision': true } },
      'Training Management': { enabled: true, items: { 'Courses': true, 'Course Scheduling': true, 'Course Offerings': true, 'Enrollments': true, 'Enrollment Management': true, 'Teaching Sessions': true, 'Locations': true } },
      'Certificates': { enabled: true, items: { 'Certificates': true, 'Certificate Analytics': true, 'Rosters': true } },
      'Analytics & Reports': { enabled: true, items: { 'Analytics': true, 'Executive Dashboard': true, 'Instructor Performance': true, 'Report Scheduler': true, 'Reports': true } },
      'Compliance & Automation': { enabled: true, items: { 'Automation': true, 'Progression Path Builder': true } },
      'System Administration': { enabled: true, items: { 'Integrations': true, 'Notifications': true, 'System Monitoring': true, 'Settings': true } }
    };
  }

  if (role === 'AD') {
    return {
      ...restrictedConfig,
      'User Management': { enabled: true, items: { 'Users': true, 'Teams': true, 'Role Management': true, 'Supervision': true } },
      'Training Management': { enabled: true, items: { 'Courses': true, 'Course Scheduling': true, 'Course Offerings': true, 'Enrollments': true, 'Enrollment Management': true, 'Teaching Sessions': true, 'Locations': true } },
      'Certificates': { enabled: true, items: { 'Certificates': true, 'Certificate Analytics': true, 'Rosters': true } },
      'Analytics & Reports': { enabled: true, items: { 'Analytics': true, 'Executive Dashboard': true, 'Instructor Performance': true, 'Report Scheduler': true, 'Reports': true } },
      'Compliance & Automation': { enabled: true, items: { 'Automation': true, 'Progression Path Builder': true } }
    };
  }

  // ALL OTHER ROLES: AP, IC, IP, IT, IN - get ONLY Dashboard + Profile
  console.log('🚨 EMERGENCY: Restricting role', role, 'to Dashboard + Profile only');
  return restrictedConfig;
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

      // Look for role-specific config in database
      const roleConfigKey = `visibility_${profile.role}`;
      console.log('🔧 NAVIGATION: Looking for database config key:', roleConfigKey);
      
      const config = configurations?.find(c => 
        c.category === 'navigation' && c.key === roleConfigKey
      );
      
      console.log('🔧 NAVIGATION: Found database config for', roleConfigKey, ':', config?.value);
      
      if (config?.value) {
        console.log('🔧 NAVIGATION: Database configuration found for', profile.role);
        
        let configValue = config.value as NavigationVisibilityConfig;
        
        // Validate the database configuration
        if (validateConfiguration(configValue, profile.role)) {
          console.log('🔧 NAVIGATION: Database configuration is VALID for', profile.role);
          
          // Apply team/provider overrides if available
          const finalConfig = mergeNavigationConfigs(configValue, profile.role);
          console.log('🔧 NAVIGATION: Final merged configuration for', profile.role, ':', finalConfig);
          
          return finalConfig;
        } else {
          console.error('🔧 NAVIGATION: Database configuration is INVALID for role:', profile.role);
          console.log('🔧 NAVIGATION: Using emergency fallback due to invalid database config');
        }
      } else {
        console.warn('🚨 NAVIGATION: NO DATABASE CONFIG FOUND for role:', profile.role);
        console.log('🔧 NAVIGATION: Using emergency fallback due to missing database config');
      }
      
      // Use emergency fallback (now properly restricted for most roles)
      const fallback = getEmergencyFallbackConfig(profile.role);
      console.log('🔧 NAVIGATION: Emergency fallback config for', profile.role, ':', fallback);
      return fallback;
    },
    enabled: !!profile?.role && !profileLoading && !configLoading && !teamNavLoading,
    staleTime: 0, // Always fetch fresh data - no caching
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
      console.log('🔧 NAVIGATION: Using navigationConfig for', profile?.role, ':', navigationConfig);
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

  // Enhanced group visibility checking with debugging
  const isGroupVisible = (groupName: string, userRole?: string): boolean => {
    const targetRole = userRole || profile?.role;
    
    if (isLoading || !activeConfig || !targetRole) {
      console.log('🔧 GROUP-VIS: Not ready -', { isLoading, hasActiveConfig: !!activeConfig, targetRole });
      return false;
    }
    
    // Dashboard is always visible as emergency fallback
    if (groupName === 'Dashboard') {
      console.log('🔧 GROUP-VIS: Dashboard always visible for', targetRole);
      return true;
    }
    
    const groupConfig = activeConfig[groupName];
    const isVisible = groupConfig?.enabled === true;
    
    console.log('🔧 GROUP-VIS:', {
      role: targetRole,
      group: groupName,
      enabled: groupConfig?.enabled,
      isVisible
    });
    
    return isVisible;
  };

  // Enhanced item visibility checking with debugging
  const isItemVisible = (groupName: string, itemName: string, userRole?: string): boolean => {
    const targetRole = userRole || profile?.role;
    
    if (isLoading || !activeConfig || !targetRole) {
      console.log('🔧 ITEM-VIS: Not ready -', { isLoading, hasActiveConfig: !!activeConfig, targetRole });
      return false;
    }
    
    // Dashboard and Profile are always visible
    if (itemName === 'Dashboard' || itemName === 'Profile') {
      console.log('🔧 ITEM-VIS: Core item always visible:', itemName, 'for', targetRole);
      return true;
    }
    
    // First check if the group is visible
    if (!isGroupVisible(groupName, targetRole)) {
      console.log('🔧 ITEM-VIS: Group not visible:', groupName, 'for', targetRole);
      return false;
    }
    
    const groupConfig = activeConfig[groupName];
    if (!groupConfig || !groupConfig.items) {
      console.log('🔧 ITEM-VIS: No group config or items for:', groupName, 'for', targetRole);
      return false;
    }
    
    // Only return true if explicitly set to true
    const isVisible = groupConfig.items[itemName] === true;
    
    console.log('🔧 ITEM-VIS:', {
      role: targetRole,
      group: groupName,
      item: itemName,
      value: groupConfig.items[itemName],
      isVisible
    });
    
    return isVisible;
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
      
      // Enhanced cache clearing
      console.log('🔧 NAVIGATION: Clearing all navigation-related cache');
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
      
      // Enhanced cache clearing
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
    
    console.log('🔧 NAVIGATION: getNavigationConfigForRole -', { role, roleConfigKey, found: !!config?.value });
    
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
