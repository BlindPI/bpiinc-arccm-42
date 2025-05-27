
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConfigurationManager } from './useConfigurationManager';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from './useProfile';
import { toast } from 'sonner';

export interface NavigationVisibilityConfig {
  [role: string]: {
    [group: string]: {
      enabled: boolean;
      items: {
        [itemName: string]: boolean;
      };
    };
  };
}

const DEFAULT_NAVIGATION_CONFIG: NavigationVisibilityConfig = {
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
    'Training Management': { enabled: false, items: {} }, // FIXED: Correctly disabled for IC
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
      console.log('🔧 NAVIGATION FIX: Fetching navigation config for role:', profile?.role);
      
      const config = configurations?.find(c => 
        c.category === 'navigation' && c.key === 'visibility'
      );
      
      if (config?.value) {
        console.log('🔧 NAVIGATION FIX: Found DATABASE configuration');
        console.log('🔧 NAVIGATION FIX: Database config for IC role:', config.value['IC']);
        return config.value as NavigationVisibilityConfig;
      }
      
      console.log('🔧 NAVIGATION FIX: Using DEFAULT configuration (IC Training Management should be DISABLED)');
      console.log('🔧 NAVIGATION FIX: Default config for IC role:', DEFAULT_NAVIGATION_CONFIG['IC']);
      return DEFAULT_NAVIGATION_CONFIG;
    },
    enabled: !!profile?.role && !!configurations && !configLoading && !profileLoading,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  });

  const isLoading = configLoading || navQueryLoading || profileLoading || !profile?.role;

  const updateNavigationConfig = useMutation({
    mutationFn: async (newConfig: NavigationVisibilityConfig) => {
      console.log('🔧 NAVIGATION FIX: Updating navigation config:', newConfig);
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      return updateConfig.mutateAsync({
        category: 'navigation',
        key: 'visibility',
        value: newConfig,
        reason: 'Updated navigation visibility settings'
      });
    },
    onSuccess: () => {
      console.log('🔧 NAVIGATION FIX: Navigation config updated successfully');
      toast.success('Navigation settings updated successfully');
      
      queryClient.removeQueries({ queryKey: ['navigation-visibility-config'] });
      queryClient.invalidateQueries({ queryKey: ['system-configurations'] });
      
      if (profile?.role) {
        queryClient.refetchQueries({ 
          queryKey: ['navigation-visibility-config', profile.role],
          exact: true 
        });
      }
    },
    onError: (error: any) => {
      console.error('🔧 NAVIGATION FIX: Failed to update navigation config:', error);
      toast.error(`Failed to update navigation settings: ${error.message}`);
    },
    retry: 1,
  });

  const isGroupVisible = (groupName: string, userRole?: string): boolean => {
    const currentUserRole = userRole || profile?.role;
    
    console.log('🔧 NAVIGATION FIX: Checking group visibility:', {
      groupName,
      currentUserRole,
      isLoading,
      hasNavigationConfig: !!navigationConfig
    });

    if (isLoading || !navigationConfig || !currentUserRole) {
      console.log('🔧 NAVIGATION FIX: Still loading, hiding group:', groupName);
      return false;
    }
    
    // Dashboard is always visible
    if (groupName === 'Dashboard') {
      return true;
    }
    
    const roleConfig = navigationConfig[currentUserRole];
    if (!roleConfig) {
      console.log('🔧 NAVIGATION FIX: No role config found for:', currentUserRole);
      return false;
    }
    
    const groupConfig = roleConfig[groupName];
    const isVisible = groupConfig?.enabled ?? false;
    
    console.log('🔧 NAVIGATION FIX: Group visibility result:', {
      groupName,
      userRole: currentUserRole,
      isVisible,
      groupConfig: groupConfig
    });
    
    return isVisible;
  };

  const isItemVisible = (groupName: string, itemName: string, userRole?: string): boolean => {
    const currentUserRole = userRole || profile?.role;
    
    if (isLoading || !navigationConfig || !currentUserRole) {
      return false;
    }
    
    // Dashboard and Profile are always visible
    if (itemName === 'Dashboard' || itemName === 'Profile') {
      return true;
    }
    
    // First check if the group is visible
    const groupVisible = isGroupVisible(groupName, currentUserRole);
    if (!groupVisible) {
      console.log('🔧 NAVIGATION FIX: Item hidden because group is hidden:', itemName);
      return false;
    }
    
    const roleConfig = navigationConfig[currentUserRole];
    if (!roleConfig) {
      return false;
    }
    
    const groupConfig = roleConfig[groupName];
    if (!groupConfig) {
      return false;
    }
    
    const itemConfig = groupConfig.items[itemName];
    const isVisible = itemConfig ?? true; // Items default to true if not specifically set
    
    console.log('🔧 NAVIGATION FIX: Item visibility result:', {
      groupName,
      itemName,
      userRole: currentUserRole,
      isVisible
    });
    
    return isVisible;
  };

  const getVisibleNavigation = (userRole?: string) => {
    if (!userRole || !navigationConfig || isLoading) return null;
    
    const currentUserRole = userRole || profile?.role;
    if (!currentUserRole) return null;

    return {
      isGroupVisible: (groupName: string) => isGroupVisible(groupName, currentUserRole),
      isItemVisible: (groupName: string, itemName: string) => isItemVisible(groupName, itemName, currentUserRole)
    };
  };

  return {
    navigationConfig,
    isLoading,
    updateNavigationConfig,
    isGroupVisible: (groupName: string) => isGroupVisible(groupName, profile?.role),
    isItemVisible: (groupName: string, itemName: string) => isItemVisible(groupName, itemName, profile?.role),
    getVisibleNavigation
  };
}
