
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
  const { data: profile } = useProfile();
  const { configurations, updateConfig } = useConfigurationManager();
  const queryClient = useQueryClient();

  const { data: navigationConfig, isLoading } = useQuery({
    queryKey: ['navigation-visibility-config'],
    queryFn: () => {
      console.log('🔍 Fetching navigation config from configurations:', configurations);
      
      const config = configurations?.find(c => 
        c.category === 'navigation' && c.key === 'visibility'
      );
      
      console.log('🔍 Found navigation config:', config);
      
      if (config?.value) {
        return config.value as NavigationVisibilityConfig;
      }
      
      console.log('🔍 Using default navigation config');
      return DEFAULT_NAVIGATION_CONFIG;
    },
    enabled: !!configurations,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const updateNavigationConfig = useMutation({
    mutationFn: async (newConfig: NavigationVisibilityConfig) => {
      console.log('🔍 Updating navigation config:', newConfig);
      
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
      console.log('🔍 Navigation config updated successfully');
      toast.success('Navigation settings updated successfully');
      
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['navigation-visibility-config'] });
      queryClient.invalidateQueries({ queryKey: ['system-configurations'] });
      
      // Force refetch to ensure immediate UI update
      queryClient.refetchQueries({ queryKey: ['navigation-visibility-config'] });
    },
    onError: (error: any) => {
      console.error('🔍 Failed to update navigation config:', error);
      toast.error(`Failed to update navigation settings: ${error.message}`);
    },
    retry: 1,
  });

  const isGroupVisible = (groupName: string, userRole?: string): boolean => {
    if (!navigationConfig || !userRole) return true;
    
    // Dashboard and Profile are always visible
    if (groupName === 'Dashboard') return true;
    
    const roleConfig = navigationConfig[userRole];
    if (!roleConfig) return true;
    
    const groupConfig = roleConfig[groupName];
    return groupConfig?.enabled ?? true;
  };

  const isItemVisible = (groupName: string, itemName: string, userRole?: string): boolean => {
    if (!navigationConfig || !userRole) return true;
    
    // Dashboard and Profile are always visible
    if (itemName === 'Dashboard' || itemName === 'Profile') return true;
    
    // First check if the group is visible
    if (!isGroupVisible(groupName, userRole)) return false;
    
    const roleConfig = navigationConfig[userRole];
    if (!roleConfig) return true;
    
    const groupConfig = roleConfig[groupName];
    if (!groupConfig) return true;
    
    const itemConfig = groupConfig.items[itemName];
    return itemConfig ?? true;
  };

  const getVisibleNavigation = (userRole?: string) => {
    if (!userRole || !navigationConfig) return null;
    
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
