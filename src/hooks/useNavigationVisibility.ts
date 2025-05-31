
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
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile();
  const { configurations, isLoading: configLoading, updateConfig } = useConfigurationManager();
  const { 
    mergeNavigationConfigs, 
    isLoading: teamNavLoading,
    hasTeamOverrides,
    hasProviderOverrides
  } = useTeamNavigationVisibility();
  const queryClient = useQueryClient();

  // FIXED: Simplified and more reliable readiness check
  const dependenciesReady = React.useMemo(() => {
    // Must have profile role
    const hasProfileRole = profile?.role;
    
    // Must have configurations array loaded
    const hasConfigurations = Array.isArray(configurations) && configurations.length > 0;
    
    // Must not be loading
    const notLoading = !profileLoading && !configLoading && !teamNavLoading;
    
    const isReady = hasProfileRole && hasConfigurations && notLoading;
    
    console.log('🔧 NAVIGATION: DEPENDENCIES CHECK:', {
      hasProfileRole: !!hasProfileRole,
      profileRole: profile?.role,
      hasConfigurations,
      configurationsCount: configurations?.length || 0,
      notLoading,
      profileLoading,
      configLoading,
      teamNavLoading,
      FINAL_READY: isReady
    });
    
    return isReady;
  }, [profile?.role, configurations, profileLoading, configLoading, teamNavLoading]);

  const { data: navigationConfig, isLoading: navQueryLoading, error: navQueryError } = useQuery({
    queryKey: ['navigation-visibility-config', profile?.role, hasTeamOverrides, hasProviderOverrides, configurations?.length],
    queryFn: async () => {
      console.log('🔧 NAVIGATION: === FETCHING CONFIG START ===');
      console.log('🔧 NAVIGATION: Profile role:', profile?.role);
      console.log('🔧 NAVIGATION: Dependencies ready:', dependenciesReady);
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
          console.log('🔧 NAVIGATION: SHOWING ONLY DASHBOARD + PROFILE due to invalid config');
          
          // ONLY Dashboard + Profile when config is invalid - NO FALLBACKS
          return {
            'Dashboard': { 
              enabled: true, 
              items: { 
                'Dashboard': true, 
                'Profile': true 
              } 
            }
          };
        }
      } else {
        console.warn('🚨 NAVIGATION: NO DATABASE CONFIG FOUND for role:', profile.role);
        console.log('🔧 NAVIGATION: SHOWING ONLY DASHBOARD + PROFILE - NO SA CONFIG SET');
        
        // ONLY Dashboard + Profile when no SA config exists - NO FALLBACKS
        return {
          'Dashboard': { 
            enabled: true, 
            items: { 
              'Dashboard': true, 
              'Profile': true 
            } 
          }
        };
      }
    },
    enabled: !!profile?.role && dependenciesReady,
    staleTime: 1000 * 60 * 2, // 2 minutes cache
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    retry: (failureCount, error) => {
      // Only retry if dependencies aren't ready yet
      const shouldRetry = error.message === 'Dependencies not loaded yet' && failureCount < 3;
      console.log('🔧 NAVIGATION: Query retry decision:', { failureCount, error: error.message, shouldRetry });
      return shouldRetry;
    },
    retryDelay: 200, // Quick retry for dependency loading
  });

  const isLoading = profileLoading || configLoading || navQueryLoading || teamNavLoading || !dependenciesReady;

  // Active configuration - NO FALLBACKS
  const activeConfig = React.useMemo(() => {
    console.log('🔧 NAVIGATION: === ACTIVE CONFIG CALCULATION ===');
    console.log('🔧 NAVIGATION: navigationConfig:', navigationConfig);
    console.log('🔧 NAVIGATION: profile?.role:', profile?.role);
    console.log('🔧 NAVIGATION: navQueryError:', navQueryError);
    console.log('🔧 NAVIGATION: dependenciesReady:', dependenciesReady);
    
    if (navigationConfig) {
      console.log('🔧 NAVIGATION: Using navigationConfig for', profile?.role, ':', navigationConfig);
      return navigationConfig;
    }
    
    console.log('🔧 NAVIGATION: No active config available - will show loading or minimal dashboard only');
    return null;
  }, [navigationConfig, profile?.role, navQueryError, dependenciesReady]);

  // Enhanced group visibility checking with debugging
  const isGroupVisible = (groupName: string, userRole?: string): boolean => {
    const targetRole = userRole || profile?.role;
    
    if (isLoading || !activeConfig || !targetRole) {
      console.log('🔧 GROUP-VIS: Not ready -', { isLoading, hasActiveConfig: !!activeConfig, targetRole });
      return false;
    }
    
    // Dashboard is always visible as core requirement
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
    
    // Dashboard and Profile are always visible as core requirements
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
      
      // Enhanced cache clearing with specific key invalidation
      console.log('🔧 NAVIGATION: Clearing all navigation-related cache');
      queryClient.removeQueries({ queryKey: ['navigation-visibility-config'] });
      queryClient.removeQueries({ queryKey: ['system-configurations'] });
      queryClient.invalidateQueries({ queryKey: ['system-configurations'] });
      
      // Force immediate refetch of navigation config
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

  const getNavigationConfigForRole = (role: string): NavigationVisibilityConfig | null => {
    if (!dependenciesReady) {
      console.log('🔧 NAVIGATION: Dependencies not ready for role:', role);
      return null;
    }
    
    const roleConfigKey = `visibility_${role}`;
    const config = configurations?.find(c => 
      c.category === 'navigation' && c.key === roleConfigKey
    );
    
    console.log('🔧 NAVIGATION: getNavigationConfigForRole -', { role, roleConfigKey, found: !!config?.value });
    
    if (config?.value) {
      const configValue = config.value as NavigationVisibilityConfig;
      
      if (validateConfiguration(configValue, role)) {
        return mergeNavigationConfigs(configValue, role);
      } else {
        console.error('🔧 NAVIGATION: Invalid database config for role:', role);
        return null;
      }
    }
    
    console.log('🔧 NAVIGATION: No database config found for role:', role);
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
      return { status: 'warning', message: 'No SA configuration set - showing minimal navigation only' };
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
