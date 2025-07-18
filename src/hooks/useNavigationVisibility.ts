import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConfigurationManager } from './useConfigurationManager';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from './useProfile';
import { useTeamNavigationVisibility } from './useTeamNavigationVisibility';
import { toast } from 'sonner';
import { debugLog, debugWarn, debugError } from '@/utils/debugUtils';

export interface NavigationVisibilityConfig {
  [groupName: string]: {
    enabled: boolean;
    items: {
      [itemName: string]: boolean;
    };
  };
}

// EMERGENCY: Default full navigation for SA role to prevent lockout
const getEmergencyDefaultConfig = (role: string): NavigationVisibilityConfig => {
  debugWarn('EMERGENCY: Providing default navigation config for role:', role);
  
  if (role === 'SA') {
    // SA gets everything
    return {
      'Dashboard': {
        enabled: true,
        items: {
          'Dashboard': true,
          'Profile': true
        }
      },
      'User Management': {
        enabled: true,
        items: {
          'Users': true,
          'Teams': true,
          'Enterprise Teams': true,
          'Role Management': true,
          'Supervision': true
        }
      },
      'Provider Management': {
        enabled: true,
        items: {
          'Provider Management': true
        }
      },
      'Training Management': {
        enabled: true,
        items: {
          'Instructor System': true,
          'Training Sessions': true,
          'Student Management': true,
          'Instructor Management': true,
          'Multi-Course Builder': true,
          'Teams': true,
          'Locations': true,
          'Courses': true,
          'Training Management': true,
          'Course Scheduling': true,
          'Course Offerings': true,
          'Enrollments': true,
          'Enrollment Management': true,
          'Teaching Sessions': true
        }
      },
      'Certificates': {
        enabled: true,
        items: {
          'Certificates': true,
          'Certificate Analytics': true,
          'Rosters': true
        }
      },
      'CRM': {
        enabled: true,
        items: {
          'CRM Dashboard': true,
          'Lead Management': true,
          'Opportunities': true,
          'Activities': true,
          'Revenue Analytics': true
        }
      },
      'Analytics & Reports': {
        enabled: true,
        items: {
          'Analytics': true,
          'Executive Dashboard': true,
          'Instructor Performance': true,
          'Report Scheduler': true,
          'Reports': true
        }
      },
      'Compliance & Automation': {
        enabled: true,
        items: {
          'Automation': true,
          'Progression Path Builder': true
        }
      },
      'System Administration': {
        enabled: true,
        items: {
          'Integrations': true,
          'Notifications': true,
          'System Monitoring': true,
          'Settings': true
        }
      }
    };
  }
  
  // Other roles get basic navigation
  return {
    'Dashboard': { 
      enabled: true, 
      items: { 
        'Dashboard': true, 
        'Profile': true 
      } 
    }
  };
};

// Enhanced configuration validation
const validateConfiguration = (config: NavigationVisibilityConfig, role: string): boolean => {
  debugLog('VALIDATION: Validating config for role:', role, config);
  
  if (!config || typeof config !== 'object') {
    debugError('VALIDATION: Invalid configuration - not an object');
    return false;
  }

  // CRITICAL: Ensure Dashboard is always enabled to prevent navigation lockout
  if (!config.Dashboard || config.Dashboard.enabled !== true) {
    debugWarn('VALIDATION: Dashboard not enabled, this will cause navigation issues');
    return false;
  }

  // EMERGENCY: SA role must have Settings access to fix issues
  if (role === 'SA' && (!config['System Administration'] || !config['System Administration'].items?.Settings)) {
    debugError('VALIDATION: SA role missing Settings access - EMERGENCY ISSUE');
    return false;
  }

  debugLog('VALIDATION: Configuration is valid for role:', role);
  return true;
};

export function useNavigationVisibility() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile();
  const { configurations, isLoading: configLoading, updateConfig } = useConfigurationManager();
  const { 
    mergeNavigationConfigs, 
    isLoading: teamNavLoading,
    hasTeamOverrides,
    hasProviderOverrides
  } = useTeamNavigationVisibility();
  const queryClient = useQueryClient();

  // FIXED: Enhanced readiness check with better debugging
  const dependenciesReady = React.useMemo(() => {
    const hasProfileRole = profile?.role;
    const hasConfigurations = Array.isArray(configurations) && configurations.length > 0;
    const notLoading = !profileLoading && !configLoading && !teamNavLoading;
    
    const isReady = hasProfileRole && hasConfigurations && notLoading;
    
    debugLog('NAVIGATION: Dependencies check - ready:', isReady, {
      hasProfileRole: !!hasProfileRole,
      profileRole: profile?.role,
      hasConfigurations,
      configurationsCount: configurations?.length || 0
    });
    
    return isReady;
  }, [profile?.role, configurations, profileLoading, configLoading, teamNavLoading]);

  const { data: navigationConfig, isLoading: navQueryLoading, error: navQueryError } = useQuery({
    queryKey: ['navigation-visibility-config', profile?.role, hasTeamOverrides, hasProviderOverrides, configurations?.length],
    queryFn: async () => {
      debugLog('NAVIGATION: Fetching config for role:', profile?.role);
      
      if (!profile?.role) {
        debugLog('NAVIGATION: No role available, returning null');
        return null;
      }

      // Look for master "visibility" config first, then role-specific configs
      const navConfigs = configurations?.filter(c => c.category === 'navigation') || [];
      debugLog('NAVIGATION: Navigation configs found:', navConfigs.length);
      
      // 1. Check for master "visibility" config (contains all roles)
      const masterConfig = navConfigs.find(c => c.key === 'visibility');
      if (masterConfig?.value && typeof masterConfig.value === 'object') {
        debugLog('NAVIGATION: Found master visibility config');
        const allRolesConfig = masterConfig.value as Record<string, NavigationVisibilityConfig>;
        
        if (allRolesConfig[profile.role]) {
          debugLog('NAVIGATION: Found role config in master config for:', profile.role);
          const roleConfig = allRolesConfig[profile.role];
          
          if (validateConfiguration(roleConfig, profile.role)) {
            debugLog('NAVIGATION: Master config is VALID for', profile.role);
            return mergeNavigationConfigs(roleConfig, profile.role);
          } else {
            debugError('NAVIGATION: Master config is INVALID for role:', profile.role);
          }
        } else {
          debugWarn('NAVIGATION: Role not found in master config:', profile.role);
        }
      }
      
      // 2. Fall back to individual role-specific config
      const roleConfigKey = `visibility_${profile.role}`;
      const roleConfig = navConfigs.find(c => c.key === roleConfigKey);
      
      if (roleConfig?.value) {
        debugLog('NAVIGATION: Found individual role config for:', profile.role);
        const configValue = roleConfig.value as NavigationVisibilityConfig;
        
        if (validateConfiguration(configValue, profile.role)) {
          debugLog('NAVIGATION: Individual role config is VALID for', profile.role);
          return mergeNavigationConfigs(configValue, profile.role);
        } else {
          debugError('NAVIGATION: Individual role config is INVALID for role:', profile.role);
        }
      }
      
      // 3. EMERGENCY: Use default config to prevent lockout
      debugWarn('EMERGENCY: No valid navigation config found, using emergency default for role:', profile.role);
      const emergencyConfig = getEmergencyDefaultConfig(profile.role);
      return mergeNavigationConfigs(emergencyConfig, profile.role);
    },
    enabled: !!profile?.role && dependenciesReady,
    staleTime: 1000 * 60 * 2, // 2 minutes cache
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    retry: (failureCount, error) => {
      const shouldRetry = (!dependenciesReady || error.message === 'Dependencies not loaded yet') && failureCount < 3;
      debugLog('NAVIGATION: Query retry decision:', { failureCount, shouldRetry });
      return shouldRetry;
    },
    retryDelay: 500,
  });

  const isLoading = profileLoading || configLoading || navQueryLoading || teamNavLoading || !dependenciesReady;

  // Active configuration with emergency fallback
  const activeConfig = React.useMemo(() => {
    debugLog('NAVIGATION: Active config calculation for role:', profile?.role);
    
    if (navigationConfig) {
      debugLog('NAVIGATION: Using navigationConfig for', profile?.role);
      return navigationConfig;
    }
    
    // EMERGENCY: If still loading, provide emergency access for SA
    if (isLoading && profile?.role === 'SA') {
      debugWarn('EMERGENCY: Providing emergency SA access while loading');
      return getEmergencyDefaultConfig('SA');
    }
    
    debugLog('NAVIGATION: No active config available');
    return null;
  }, [navigationConfig, profile?.role, isLoading]);

  // Enhanced group visibility checking with emergency access
  const isGroupVisible = (groupName: string, userRole?: string): boolean => {
    const targetRole = userRole || profile?.role;
    
    if (isLoading || !targetRole) {
      // EMERGENCY: SA gets emergency access even while loading
      if (targetRole === 'SA' && (groupName === 'Dashboard' || groupName === 'System Administration' || groupName === 'Training Management')) {
        debugWarn('EMERGENCY: Granting SA emergency access to', groupName);
        return true;
      }
      return false;
    }
    
    // Dashboard is always visible as core requirement
    if (groupName === 'Dashboard') {
      return true;
    }
    
    // EMERGENCY: SA always has System Administration and Training Management access
    if (targetRole === 'SA' && (groupName === 'System Administration' || groupName === 'Training Management')) {
      debugLog('EMERGENCY: SA always has access to', groupName);
      return true;
    }
    
    if (!activeConfig) {
      debugLog('GROUP-VIS: No active config for', targetRole, groupName);
      return false;
    }
    
    const groupConfig = activeConfig[groupName];
    const isVisible = groupConfig?.enabled === true;
    
    debugLog('GROUP-VIS:', {
      role: targetRole,
      group: groupName,
      enabled: groupConfig?.enabled,
      isVisible
    });
    
    return isVisible;
  };

  // Enhanced item visibility checking with emergency access
  const isItemVisible = (groupName: string, itemName: string, userRole?: string): boolean => {
    const targetRole = userRole || profile?.role;
    
    if (isLoading || !targetRole) {
      // EMERGENCY: SA gets emergency access to critical items
      if (targetRole === 'SA' && (itemName === 'Dashboard' || itemName === 'Profile' || itemName === 'Settings' || itemName === 'Training Management')) {
        debugWarn('EMERGENCY: Granting SA emergency access to', itemName);
        return true;
      }
      return false;
    }
    
    // Core items are always visible
    if (itemName === 'Dashboard' || itemName === 'Profile') {
      return true;
    }
    
    // EMERGENCY: SA always has Settings and Training Management access
    if (targetRole === 'SA' && (itemName === 'Settings' || itemName === 'Training Management')) {
      debugLog('EMERGENCY: SA always has access to', itemName);
      return true;
    }
    
    // First check if the group is visible
    if (!isGroupVisible(groupName, targetRole)) {
      debugLog('ITEM-VIS: Group not visible:', groupName, 'for', targetRole);
      return false;
    }
    
    if (!activeConfig) {
      debugLog('ITEM-VIS: No active config for', targetRole, groupName, itemName);
      return false;
    }
    
    const groupConfig = activeConfig[groupName];
    if (!groupConfig || !groupConfig.items) {
      debugLog('ITEM-VIS: No group config or items for:', groupName, 'for', targetRole);
      return false;
    }
    
    const isVisible = groupConfig.items[itemName] === true;
    
    debugLog('ITEM-VIS:', {
      role: targetRole,
      group: groupName,
      item: itemName,
      isVisible
    });
    
    return isVisible;
  };

  const updateNavigationConfig = useMutation({
    mutationFn: async ({ role, newConfig }: { role: string; newConfig: NavigationVisibilityConfig }) => {
      debugLog('NAVIGATION: Updating config for role:', role);
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      // CRITICAL: Validate configuration before saving
      if (!validateConfiguration(newConfig, role)) {
        throw new Error('Configuration validation failed - invalid navigation structure');
      }
      
      // EMERGENCY: Prevent SA lockout
      if (role === 'SA') {
        if (!newConfig['System Administration']?.enabled || !newConfig['System Administration']?.items?.Settings) {
          throw new Error('Cannot disable System Administration or Settings for SA role - this would cause system lockout');
        }
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
      debugLog('NAVIGATION: Config updated successfully for role:', role);
      toast.success(`Navigation settings updated for ${role} role`);
      
      // Enhanced cache clearing
      debugLog('NAVIGATION: Clearing all navigation-related cache');
      queryClient.removeQueries({ queryKey: ['navigation-visibility-config'] });
      queryClient.removeQueries({ queryKey: ['system-configurations'] });
      queryClient.invalidateQueries({ queryKey: ['system-configurations'] });
      queryClient.refetchQueries({ queryKey: ['navigation-visibility-config'], exact: false });
    },
    onError: (error: any) => {
      debugError('NAVIGATION: Failed to update config:', error);
      toast.error(`Failed to update navigation settings: ${error.message}`);
    }
  });

  const getNavigationConfigForRole = (role: string): NavigationVisibilityConfig | null => {
    if (!dependenciesReady) {
      debugLog('NAVIGATION: Dependencies not ready for role:', role);
      return null;
    }
    
    // Check master config first
    const masterConfig = configurations?.find(c => c.category === 'navigation' && c.key === 'visibility');
    if (masterConfig?.value && typeof masterConfig.value === 'object') {
      const allRolesConfig = masterConfig.value as Record<string, NavigationVisibilityConfig>;
      if (allRolesConfig[role]) {
        const roleConfig = allRolesConfig[role];
        if (validateConfiguration(roleConfig, role)) {
          return mergeNavigationConfigs(roleConfig, role);
        }
      }
    }
    
    // Fall back to individual role config
    const roleConfigKey = `visibility_${role}`;
    const config = configurations?.find(c => c.category === 'navigation' && c.key === roleConfigKey);
    
    debugLog('NAVIGATION: getNavigationConfigForRole -', {
      role,
      roleConfigKey,
      found: !!config?.value
    });
    
    if (config?.value) {
      const configValue = config.value as NavigationVisibilityConfig;
      
      if (validateConfiguration(configValue, role)) {
        return mergeNavigationConfigs(configValue, role);
      } else {
        debugError('NAVIGATION: Invalid database config for role:', role);
        return null;
      }
    }
    
    debugLog('NAVIGATION: No database config found for role:', role);
    return null;
  };

  // Enhanced configuration health check
  const configurationHealth = React.useMemo(() => {
    if (!profile?.role || isLoading) {
      return { status: 'loading', message: 'Loading configuration...' };
    }

    if (!dependenciesReady) {
      return { status: 'error', message: 'Configuration dependencies not ready' };
    }

    if (!activeConfig) {
      // EMERGENCY: This is critical for SA
      if (profile.role === 'SA') {
        return { status: 'emergency', message: 'SA role has no navigation configuration - using emergency defaults' };
      }
      return { status: 'warning', message: 'No navigation configuration found - showing minimal navigation' };
    }

    if (!validateConfiguration(activeConfig, profile.role)) {
      return { status: 'error', message: 'Configuration validation failed' };
    }

    const hasVisibleGroups = Object.values(activeConfig).some(group => group.enabled === true);
    if (!hasVisibleGroups) {
      return { status: 'error', message: 'No visible navigation groups' };
    }

    return { status: 'healthy', message: 'Configuration is valid' };
  }, [activeConfig, profile?.role, isLoading, dependenciesReady]);

  return {
    navigationConfig: activeConfig,
    isLoading,
    updateNavigationConfig,
    isGroupVisible: (groupName: string) => isGroupVisible(groupName, profile?.role),
    isItemVisible: (groupName: string, itemName: string) => isItemVisible(groupName, itemName, profile?.role),
    getNavigationConfigForRole,
    configurationHealth,
    hasTeamOverrides,
    hasProviderOverrides
  };
}
