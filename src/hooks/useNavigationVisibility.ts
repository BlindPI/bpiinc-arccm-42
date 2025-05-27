
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

const DEFAULT_NAVIGATION_CONFIG: { [role: string]: NavigationVisibilityConfig } = {
  SA: {
    'Dashboard': { enabled: true, items: {} },
    'User Management': { enabled: true, items: {} },
    'Training Management': { enabled: true, items: {} },
    'Certificates': { enabled: true, items: {} },
    'Analytics & Reports': { enabled: true, items: {} },
    'Compliance & Automation': { enabled: true, items: {} },
    'System Administration': { enabled: true, items: {} }
  },
  AD: {
    'Dashboard': { enabled: true, items: {} },
    'User Management': { enabled: true, items: {} },
    'Training Management': { enabled: true, items: {} },
    'Certificates': { enabled: true, items: {} },
    'Analytics & Reports': { enabled: true, items: {} },
    'Compliance & Automation': { enabled: true, items: {} },
    'System Administration': { enabled: false, items: {} }
  },
  AP: {
    'Dashboard': { enabled: true, items: {} },
    'User Management': { enabled: false, items: {} },
    'Training Management': { enabled: true, items: {} },
    'Certificates': { enabled: true, items: {} },
    'Analytics & Reports': { enabled: true, items: {} },
    'Compliance & Automation': { enabled: false, items: {} },
    'System Administration': { enabled: false, items: {} }
  },
  IC: {
    'Dashboard': { enabled: true, items: {} },
    'User Management': { enabled: false, items: {} },
    'Training Management': { enabled: false, items: {} },
    'Certificates': { enabled: true, items: {} },
    'Analytics & Reports': { enabled: false, items: {} },
    'Compliance & Automation': { enabled: false, items: {} },
    'System Administration': { enabled: false, items: {} }
  },
  IP: {
    'Dashboard': { enabled: true, items: {} },
    'User Management': { enabled: false, items: {} },
    'Training Management': { enabled: true, items: {} },
    'Certificates': { enabled: true, items: {} },
    'Analytics & Reports': { enabled: false, items: {} },
    'Compliance & Automation': { enabled: false, items: {} },
    'System Administration': { enabled: false, items: {} }
  },
  IT: {
    'Dashboard': { enabled: true, items: {} },
    'User Management': { enabled: false, items: {} },
    'Training Management': { enabled: true, items: {} },
    'Certificates': { enabled: true, items: {} },
    'Analytics & Reports': { enabled: false, items: {} },
    'Compliance & Automation': { enabled: false, items: {} },
    'System Administration': { enabled: false, items: {} }
  },
  IN: {
    'Dashboard': { enabled: true, items: {} },
    'User Management': { enabled: false, items: {} },
    'Training Management': { enabled: false, items: {} },
    'Certificates': { enabled: true, items: {} },
    'Analytics & Reports': { enabled: false, items: {} },
    'Compliance & Automation': { enabled: false, items: {} },
    'System Administration': { enabled: false, items: {} }
  }
};

export function useNavigationVisibility() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { configurations, updateConfig, isLoading: configLoading } = useConfigurationManager();
  const queryClient = useQueryClient();

  const { data: navigationConfig, isLoading: navQueryLoading } = useQuery({
    queryKey: ['navigation-visibility-config', profile?.role],
    queryFn: () => {
      console.log('🔧 NAVIGATION FIX: Fetching role-specific navigation config for role:', profile?.role);
      
      if (!profile?.role) {
        console.log('🔧 NAVIGATION FIX: No role available');
        return null;
      }

      // Look for role-specific configuration
      const roleConfigKey = `visibility_${profile.role}`;
      const config = configurations?.find(c => 
        c.category === 'navigation' && c.key === roleConfigKey
      );
      
      if (config?.value) {
        console.log('🔧 NAVIGATION FIX: Found role-specific DATABASE configuration for', profile.role);
        console.log('🔧 NAVIGATION FIX: Database config for role:', config.value);
        return config.value as NavigationVisibilityConfig;
      }
      
      console.log('🔧 NAVIGATION FIX: Using DEFAULT configuration for role:', profile.role);
      const defaultConfig = DEFAULT_NAVIGATION_CONFIG[profile.role];
      console.log('🔧 NAVIGATION FIX: Default config:', defaultConfig);
      return defaultConfig || DEFAULT_NAVIGATION_CONFIG.IN; // Fallback to IN role
    },
    enabled: !!profile?.role && !!configurations && !configLoading && !profileLoading,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  });

  const isLoading = configLoading || navQueryLoading || profileLoading || !profile?.role;

  const updateNavigationConfig = useMutation({
    mutationFn: async ({ role, newConfig }: { role: string; newConfig: NavigationVisibilityConfig }) => {
      console.log('🔧 NAVIGATION FIX: Updating role-specific navigation config for role:', role, newConfig);
      
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
      console.log('🔧 NAVIGATION FIX: Role-specific navigation config updated successfully for role:', role);
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
      console.error('🔧 NAVIGATION FIX: Failed to update role-specific navigation config:', error);
      toast.error(`Failed to update navigation settings: ${error.message}`);
    },
    retry: 1,
  });

  const isGroupVisible = (groupName: string, userRole?: string): boolean => {
    const targetRole = userRole || profile?.role;
    
    console.log('🔧 NAVIGATION FIX: Checking group visibility:', {
      groupName,
      targetRole,
      isLoading,
      hasNavigationConfig: !!navigationConfig
    });

    if (isLoading || !navigationConfig || !targetRole) {
      console.log('🔧 NAVIGATION FIX: Still loading, hiding group:', groupName);
      return false;
    }
    
    // Dashboard is always visible
    if (groupName === 'Dashboard') {
      return true;
    }
    
    const groupConfig = navigationConfig[groupName];
    if (!groupConfig) {
      console.log('🔧 NAVIGATION FIX: No group config found for:', groupName);
      return false;
    }
    
    const isVisible = groupConfig.enabled ?? false;
    
    console.log('🔧 NAVIGATION FIX: Group visibility result:', {
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
    
    // Dashboard and Profile are always visible
    if (itemName === 'Dashboard' || itemName === 'Profile') {
      return true;
    }
    
    // First check if the group is visible
    const groupVisible = isGroupVisible(groupName, targetRole);
    if (!groupVisible) {
      console.log('🔧 NAVIGATION FIX: Item hidden because group is hidden:', itemName);
      return false;
    }
    
    const groupConfig = navigationConfig[groupName];
    if (!groupConfig) {
      return false;
    }
    
    const itemConfig = groupConfig.items[itemName];
    const isVisible = itemConfig ?? true; // Items default to true if not specifically set
    
    console.log('🔧 NAVIGATION FIX: Item visibility result:', {
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
    
    return DEFAULT_NAVIGATION_CONFIG[role] || DEFAULT_NAVIGATION_CONFIG.IN;
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
