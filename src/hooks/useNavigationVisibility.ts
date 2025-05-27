
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
  const { configurations, updateConfig, isLoading: configLoading } = useConfigurationManager();
  const queryClient = useQueryClient();

  const { data: navigationConfig, isLoading: navQueryLoading } = useQuery({
    queryKey: ['navigation-visibility-config'],
    queryFn: () => {
      console.log('🔍 Navigation Hook: Fetching navigation config from configurations:', configurations?.length);
      
      const config = configurations?.find(c => 
        c.category === 'navigation' && c.key === 'visibility'
      );
      
      console.log('🔍 Navigation Hook: Found navigation config:', !!config?.value);
      
      if (config?.value) {
        return config.value as NavigationVisibilityConfig;
      }
      
      console.log('🔍 Navigation Hook: Using default navigation config');
      return DEFAULT_NAVIGATION_CONFIG;
    },
    enabled: !!configurations && !configLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Combined loading state
  const isLoading = configLoading || navQueryLoading;

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
      
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['navigation-visibility-config'] });
      queryClient.invalidateQueries({ queryKey: ['system-configurations'] });
      
      // Force refetch to ensure immediate UI update
      queryClient.refetchQueries({ queryKey: ['navigation-visibility-config'] });
    },
    onError: (error: any) => {
      console.error('🔍 Navigation Hook: Failed to update navigation config:', error);
      toast.error(`Failed to update navigation settings: ${error.message}`);
    },
    retry: 1,
  });

  const isGroupVisible = (groupName: string, userRole?: string): boolean => {
    if (!navigationConfig) {
      console.log('🔍 Navigation Hook: No navigation config available');
      return false; // Return false instead of true when no config
    }
    
    const currentUserRole = userRole || profile?.role;
    if (!currentUserRole) {
      console.log('🔍 Navigation Hook: No user role available');
      return false; // Return false instead of true when no role
    }
    
    // Dashboard is always visible
    if (groupName === 'Dashboard') return true;
    
    const roleConfig = navigationConfig[currentUserRole];
    if (!roleConfig) {
      console.log('🔍 Navigation Hook: No role config for', currentUserRole);
      return false; // Return false instead of true when no role config
    }
    
    const groupConfig = roleConfig[groupName];
    const isVisible = groupConfig?.enabled ?? false; // Default to false instead of true
    
    console.log('🔍 Navigation Hook: Group visibility check:', {
      groupName,
      userRole: currentUserRole,
      isVisible,
      hasGroupConfig: !!groupConfig
    });
    
    return isVisible;
  };

  const isItemVisible = (groupName: string, itemName: string, userRole?: string): boolean => {
    if (!navigationConfig) {
      console.log('🔍 Navigation Hook: No navigation config for item check');
      return false; // Return false instead of true when no config
    }
    
    const currentUserRole = userRole || profile?.role;
    if (!currentUserRole) {
      console.log('🔍 Navigation Hook: No user role for item check');
      return false; // Return false instead of true when no role
    }
    
    // Dashboard and Profile are always visible
    if (itemName === 'Dashboard' || itemName === 'Profile') return true;
    
    // First check if the group is visible
    if (!isGroupVisible(groupName, currentUserRole)) return false;
    
    const roleConfig = navigationConfig[currentUserRole];
    if (!roleConfig) return false; // Return false instead of true when no role config
    
    const groupConfig = roleConfig[groupName];
    if (!groupConfig) return false; // Return false instead of true when no group config
    
    const itemConfig = groupConfig.items[itemName];
    const isVisible = itemConfig ?? true; // Items default to true if not specifically set
    
    console.log('🔍 Navigation Hook: Item visibility check:', {
      groupName,
      itemName,
      userRole: currentUserRole,
      isVisible,
      hasItemConfig: itemConfig !== undefined
    });
    
    return isVisible;
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
