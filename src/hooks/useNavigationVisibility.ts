
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
    'Training Management': { enabled: true, items: {} },
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

  // Debug logging for profile role
  React.useEffect(() => {
    if (profile?.role) {
      console.log('🔍 NAVIGATION DEBUG: User profile loaded with role:', profile.role);
    }
  }, [profile?.role]);

  const { data: navigationConfig, isLoading: navQueryLoading } = useQuery({
    queryKey: ['navigation-visibility-config', profile?.role],
    queryFn: () => {
      console.log('🔍 NAVIGATION DEBUG: Fetching navigation config for role:', profile?.role);
      
      const config = configurations?.find(c => 
        c.category === 'navigation' && c.key === 'visibility'
      );
      
      if (config?.value) {
        console.log('🔍 NAVIGATION DEBUG: Found stored navigation config:', config.value);
        console.log('🔍 NAVIGATION DEBUG: Config for current role:', config.value[profile?.role || '']);
        return config.value as NavigationVisibilityConfig;
      }
      
      console.log('🔍 NAVIGATION DEBUG: Using default navigation config for role:', profile?.role);
      console.log('🔍 NAVIGATION DEBUG: Default config for current role:', DEFAULT_NAVIGATION_CONFIG[profile?.role || '']);
      return DEFAULT_NAVIGATION_CONFIG;
    },
    enabled: !!profile?.role && !!configurations && !configLoading && !profileLoading,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  });

  // Debug log the final navigation config
  React.useEffect(() => {
    if (navigationConfig && profile?.role) {
      console.log('🔍 NAVIGATION DEBUG: Final navigation config loaded:', {
        userRole: profile.role,
        hasConfig: !!navigationConfig,
        roleConfig: navigationConfig[profile.role],
        allRoles: Object.keys(navigationConfig)
      });
    }
  }, [navigationConfig, profile?.role]);

  const isLoading = configLoading || navQueryLoading || profileLoading || !profile?.role;

  React.useEffect(() => {
    if (profile?.role) {
      console.log('🔍 NAVIGATION DEBUG: Profile role changed, invalidating cache');
      queryClient.invalidateQueries({ queryKey: ['navigation-visibility-config'] });
    }
  }, [profile?.role, queryClient]);

  const updateNavigationConfig = useMutation({
    mutationFn: async (newConfig: NavigationVisibilityConfig) => {
      console.log('🔍 NAVIGATION DEBUG: Updating navigation config:', newConfig);
      
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
      console.log('🔍 NAVIGATION DEBUG: Navigation config updated successfully');
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
      console.error('🔍 NAVIGATION DEBUG: Failed to update navigation config:', error);
      toast.error(`Failed to update navigation settings: ${error.message}`);
    },
    retry: 1,
  });

  const isGroupVisible = (groupName: string, userRole?: string): boolean => {
    const currentUserRole = userRole || profile?.role;
    
    console.log('🔍 NAVIGATION DEBUG: Checking group visibility:', {
      groupName,
      currentUserRole,
      isLoading,
      hasNavigationConfig: !!navigationConfig,
      hasProfile: !!profile?.role
    });

    if (isLoading || !navigationConfig || !currentUserRole) {
      console.log('🔍 NAVIGATION DEBUG: Still loading or missing data, hiding group:', groupName);
      return false;
    }
    
    // Dashboard is always visible
    if (groupName === 'Dashboard') {
      console.log('🔍 NAVIGATION DEBUG: Dashboard always visible');
      return true;
    }
    
    const roleConfig = navigationConfig[currentUserRole];
    if (!roleConfig) {
      console.log('🔍 NAVIGATION DEBUG: No role config found for:', currentUserRole);
      return false;
    }
    
    const groupConfig = roleConfig[groupName];
    const isVisible = groupConfig?.enabled ?? false;
    
    console.log('🔍 NAVIGATION DEBUG: Group visibility result:', {
      groupName,
      userRole: currentUserRole,
      isVisible,
      hasGroupConfig: !!groupConfig,
      groupConfig
    });
    
    return isVisible;
  };

  const isItemVisible = (groupName: string, itemName: string, userRole?: string): boolean => {
    const currentUserRole = userRole || profile?.role;
    
    console.log('🔍 NAVIGATION DEBUG: Checking item visibility:', {
      groupName,
      itemName,
      currentUserRole,
      isLoading,
      hasNavigationConfig: !!navigationConfig
    });

    if (isLoading || !navigationConfig || !currentUserRole) {
      console.log('🔍 NAVIGATION DEBUG: Still loading or missing data, hiding item:', itemName);
      return false;
    }
    
    // Dashboard and Profile are always visible
    if (itemName === 'Dashboard' || itemName === 'Profile') {
      console.log('🔍 NAVIGATION DEBUG: Core item always visible:', itemName);
      return true;
    }
    
    // First check if the group is visible
    const groupVisible = isGroupVisible(groupName, currentUserRole);
    if (!groupVisible) {
      console.log('🔍 NAVIGATION DEBUG: Item hidden because group is hidden:', itemName);
      return false;
    }
    
    const roleConfig = navigationConfig[currentUserRole];
    if (!roleConfig) {
      console.log('🔍 NAVIGATION DEBUG: No role config for item check:', currentUserRole);
      return false;
    }
    
    const groupConfig = roleConfig[groupName];
    if (!groupConfig) {
      console.log('🔍 NAVIGATION DEBUG: No group config for item check:', groupName);
      return false;
    }
    
    const itemConfig = groupConfig.items[itemName];
    const isVisible = itemConfig ?? true; // Items default to true if not specifically set
    
    console.log('🔍 NAVIGATION DEBUG: Item visibility result:', {
      groupName,
      itemName,
      userRole: currentUserRole,
      isVisible,
      hasItemConfig: itemConfig !== undefined,
      itemConfig,
      groupConfig
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
