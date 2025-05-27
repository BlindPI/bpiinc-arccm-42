
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

  // Only enable query when we have both profile role AND configurations loaded
  const { data: navigationConfig, isLoading: navQueryLoading } = useQuery({
    queryKey: ['navigation-visibility-config', profile?.role],
    queryFn: () => {
      console.log('🔍 Navigation Hook: Fetching navigation config with role:', profile?.role);
      
      const config = configurations?.find(c => 
        c.category === 'navigation' && c.key === 'visibility'
      );
      
      console.log('🔍 Navigation Hook: Found stored navigation config:', !!config?.value);
      
      if (config?.value) {
        return config.value as NavigationVisibilityConfig;
      }
      
      console.log('🔍 Navigation Hook: Using default navigation config for role:', profile?.role);
      return DEFAULT_NAVIGATION_CONFIG;
    },
    enabled: !!profile?.role && !!configurations && !configLoading && !profileLoading,
    staleTime: 0, // Remove stale time to prevent cache issues
    gcTime: 1000 * 60 * 5, // Keep cache for 5 minutes but always refetch
  });

  // Combined loading state - must wait for ALL dependencies
  const isLoading = configLoading || navQueryLoading || profileLoading || !profile?.role;

  // Invalidate navigation config when profile role changes
  React.useEffect(() => {
    if (profile?.role) {
      console.log('🔍 Navigation Hook: Profile role loaded, invalidating navigation config');
      queryClient.invalidateQueries({ queryKey: ['navigation-visibility-config'] });
    }
  }, [profile?.role, queryClient]);

  const updateNavigationConfig = useMutation({
    mutationFn: async (newConfig: NavigationVisibilityConfig) => {
      console.log('🔍 Navigation Hook: Updating navigation config:', newConfig);
      
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
      console.log('🔍 Navigation Hook: Navigation config updated successfully');
      toast.success('Navigation settings updated successfully');
      
      // Clear all navigation-related cache and force refetch
      queryClient.removeQueries({ queryKey: ['navigation-visibility-config'] });
      queryClient.invalidateQueries({ queryKey: ['system-configurations'] });
      
      // Force immediate refetch with current profile role
      if (profile?.role) {
        queryClient.refetchQueries({ 
          queryKey: ['navigation-visibility-config', profile.role],
          exact: true 
        });
      }
    },
    onError: (error: any) => {
      console.error('🔍 Navigation Hook: Failed to update navigation config:', error);
      toast.error(`Failed to update navigation settings: ${error.message}`);
    },
    retry: 1,
  });

  const isGroupVisible = (groupName: string, userRole?: string): boolean => {
    // If still loading or no config available, return false to prevent showing defaults
    if (isLoading || !navigationConfig || !profile?.role) {
      console.log('🔍 Navigation Hook: Still loading, hiding group:', groupName);
      return false;
    }
    
    const currentUserRole = userRole || profile.role;
    if (!currentUserRole) {
      console.log('🔍 Navigation Hook: No user role available for group:', groupName);
      return false;
    }
    
    // Dashboard is always visible
    if (groupName === 'Dashboard') return true;
    
    const roleConfig = navigationConfig[currentUserRole];
    if (!roleConfig) {
      console.log('🔍 Navigation Hook: No role config for', currentUserRole, 'group:', groupName);
      return false;
    }
    
    const groupConfig = roleConfig[groupName];
    const isVisible = groupConfig?.enabled ?? false;
    
    console.log('🔍 Navigation Hook: Group visibility check:', {
      groupName,
      userRole: currentUserRole,
      isVisible,
      hasGroupConfig: !!groupConfig,
      isLoading
    });
    
    return isVisible;
  };

  const isItemVisible = (groupName: string, itemName: string, userRole?: string): boolean => {
    // If still loading or no config available, return false to prevent showing defaults
    if (isLoading || !navigationConfig || !profile?.role) {
      console.log('🔍 Navigation Hook: Still loading, hiding item:', itemName);
      return false;
    }
    
    const currentUserRole = userRole || profile.role;
    if (!currentUserRole) {
      console.log('🔍 Navigation Hook: No user role for item check:', itemName);
      return false;
    }
    
    // Dashboard and Profile are always visible
    if (itemName === 'Dashboard' || itemName === 'Profile') return true;
    
    // First check if the group is visible
    if (!isGroupVisible(groupName, currentUserRole)) return false;
    
    const roleConfig = navigationConfig[currentUserRole];
    if (!roleConfig) return false;
    
    const groupConfig = roleConfig[groupName];
    if (!groupConfig) return false;
    
    const itemConfig = groupConfig.items[itemName];
    const isVisible = itemConfig ?? true; // Items default to true if not specifically set
    
    console.log('🔍 Navigation Hook: Item visibility check:', {
      groupName,
      itemName,
      userRole: currentUserRole,
      isVisible,
      hasItemConfig: itemConfig !== undefined,
      isLoading
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
