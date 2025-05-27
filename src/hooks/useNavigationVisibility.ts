
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

export function useNavigationVisibility() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { configurations, updateConfig, isLoading: configLoading } = useConfigurationManager();
  const queryClient = useQueryClient();

  const { data: navigationConfig, isLoading: navQueryLoading } = useQuery({
    queryKey: ['navigation-visibility-config', profile?.role],
    queryFn: () => {
      console.log('🔧 NAVIGATION: Fetching role-specific navigation config for role:', profile?.role);
      
      if (!profile?.role) {
        console.log('🔧 NAVIGATION: No role available');
        return null;
      }

      // Look for role-specific configuration
      const roleConfigKey = `visibility_${profile.role}`;
      const config = configurations?.find(c => 
        c.category === 'navigation' && c.key === roleConfigKey
      );
      
      if (config?.value) {
        console.log('🔧 NAVIGATION: Found role-specific DATABASE configuration for', profile.role);
        return config.value as NavigationVisibilityConfig;
      }
      
      // If no database config exists, throw an error - no more fallbacks
      console.error('🔧 NAVIGATION ERROR: No database configuration found for role:', profile.role);
      throw new Error(`No navigation configuration found for role: ${profile.role}`);
    },
    enabled: !!profile?.role && !!configurations && !configLoading && !profileLoading,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    retry: false, // Don't retry on missing config
  });

  const isLoading = configLoading || navQueryLoading || profileLoading || !profile?.role;

  const updateNavigationConfig = useMutation({
    mutationFn: async ({ role, newConfig }: { role: string; newConfig: NavigationVisibilityConfig }) => {
      console.log('🔧 NAVIGATION: Updating role-specific navigation config for role:', role, newConfig);
      
      if (!user?.id) {
        throw new Error('User not authenticated');
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
      console.log('🔧 NAVIGATION: Role-specific navigation config updated successfully for role:', role);
      toast.success(`Navigation settings updated for ${role} role`);
      
      queryClient.removeQueries({ queryKey: ['navigation-visibility-config'] });
      queryClient.invalidateQueries({ queryKey: ['system-configurations'] });
      
      // Refetch for all roles since admin might be viewing different role settings
      queryClient.refetchQueries({ 
        queryKey: ['navigation-visibility-config'],
        exact: false 
      });
    },
    onError: (error: any) => {
      console.error('🔧 NAVIGATION: Failed to update role-specific navigation config:', error);
      toast.error(`Failed to update navigation settings: ${error.message}`);
    },
    retry: 1,
  });

  const isGroupVisible = (groupName: string, userRole?: string): boolean => {
    const targetRole = userRole || profile?.role;
    
    console.log('🔧 NAVIGATION: Checking group visibility:', {
      groupName,
      targetRole,
      isLoading,
      hasNavigationConfig: !!navigationConfig
    });

    if (isLoading || !navigationConfig || !targetRole) {
      console.log('🔧 NAVIGATION: Still loading or no config, hiding group:', groupName);
      return false;
    }
    
    // Dashboard is always visible for all roles
    if (groupName === 'Dashboard') {
      return true;
    }
    
    const groupConfig = navigationConfig[groupName];
    if (!groupConfig) {
      console.log('🔧 NAVIGATION: No group config found for:', groupName, 'in role:', targetRole);
      return false;
    }
    
    const isVisible = groupConfig.enabled ?? false;
    
    console.log('🔧 NAVIGATION: Group visibility result:', {
      groupName,
      userRole: targetRole,
      isVisible,
      groupConfig: groupConfig
    });
    
    return isVisible;
  };

  const isItemVisible = (groupName: string, itemName: string, userRole?: string): boolean => {
    const targetRole = userRole || profile?.role;
    
    if (isLoading || !navigationConfig || !targetRole) {
      return false;
    }
    
    // Dashboard and Profile are always visible for all roles
    if (itemName === 'Dashboard' || itemName === 'Profile') {
      return true;
    }
    
    // First check if the group is visible
    const groupVisible = isGroupVisible(groupName, targetRole);
    if (!groupVisible) {
      console.log('🔧 NAVIGATION: Item hidden because group is hidden:', itemName, 'for role:', targetRole);
      return false;
    }
    
    const groupConfig = navigationConfig[groupName];
    if (!groupConfig) {
      return false;
    }
    
    const itemConfig = groupConfig.items[itemName];
    const isVisible = itemConfig ?? true; // Items default to true if not specifically set
    
    console.log('🔧 NAVIGATION: Item visibility result:', {
      groupName,
      itemName,
      userRole: targetRole,
      isVisible
    });
    
    return isVisible;
  };

  // Function to get navigation config for a specific role (used by admin to configure other roles)
  const getNavigationConfigForRole = (role: string): NavigationVisibilityConfig | null => {
    if (!configurations) return null;
    
    const roleConfigKey = `visibility_${role}`;
    const config = configurations.find(c => 
      c.category === 'navigation' && c.key === roleConfigKey
    );
    
    if (config?.value) {
      return config.value as NavigationVisibilityConfig;
    }
    
    // No fallback to defaults - return null if not in database
    console.warn('🔧 NAVIGATION: No database configuration found for role:', role);
    return null;
  };

  const getVisibleNavigation = (userRole?: string) => {
    const targetRole = userRole || profile?.role;
    if (!targetRole || !navigationConfig || isLoading) return null;

    return {
      isGroupVisible: (groupName: string) => isGroupVisible(groupName, targetRole),
      isItemVisible: (groupName: string, itemName: string) => isItemVisible(groupName, itemName, targetRole)
    };
  };

  return {
    navigationConfig,
    isLoading,
    updateNavigationConfig,
    isGroupVisible: (groupName: string) => isGroupVisible(groupName, profile?.role),
    isItemVisible: (groupName: string, itemName: string) => isItemVisible(groupName, itemName, profile?.role),
    getNavigationConfigForRole,
    getVisibleNavigation
  };
}
