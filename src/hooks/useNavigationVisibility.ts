
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

// Emergency fallback configuration for when database config is missing or broken
const getEmergencyFallbackConfig = (role: string): NavigationVisibilityConfig => {
  console.log('🚨 EMERGENCY: Using fallback configuration for role:', role);
  
  const baseConfig = {
    'Dashboard': { enabled: true, items: { 'Dashboard': true, 'Profile': true } }
  };

  // Role-specific emergency configurations
  const roleConfigs: Record<string, NavigationVisibilityConfig> = {
    'SA': {
      ...baseConfig,
      'User Management': { enabled: true, items: { 'Users': true, 'Teams': true, 'Role Management': true, 'Supervision': true } },
      'Training Management': { enabled: true, items: { 'Courses': true, 'Course Scheduling': true, 'Course Offerings': true, 'Enrollments': true, 'Enrollment Management': true, 'Teaching Sessions': true, 'Locations': true } },
      'Certificates': { enabled: true, items: { 'Certificates': true, 'Certificate Analytics': true, 'Rosters': true } },
      'Analytics & Reports': { enabled: true, items: { 'Analytics': true, 'Executive Dashboard': true, 'Instructor Performance': true, 'Report Scheduler': true, 'Reports': true } },
      'Compliance & Automation': { enabled: true, items: { 'Automation': true, 'Progression Path Builder': true } },
      'System Administration': { enabled: true, items: { 'Integrations': true, 'Notifications': true, 'System Monitoring': true, 'Settings': true } }
    },
    'AD': {
      ...baseConfig,
      'User Management': { enabled: true, items: { 'Users': true, 'Teams': true, 'Role Management': true, 'Supervision': true } },
      'Training Management': { enabled: true, items: { 'Courses': true, 'Course Scheduling': true, 'Course Offerings': true, 'Enrollments': true, 'Enrollment Management': true, 'Teaching Sessions': true, 'Locations': true } },
      'Certificates': { enabled: true, items: { 'Certificates': true, 'Certificate Analytics': true, 'Rosters': true } },
      'Analytics & Reports': { enabled: true, items: { 'Analytics': true, 'Executive Dashboard': true, 'Instructor Performance': true, 'Report Scheduler': true, 'Reports': true } },
      'Compliance & Automation': { enabled: true, items: { 'Automation': true, 'Progression Path Builder': true } }
    },
    'AP': {
      ...baseConfig,
      'User Management': { enabled: true, items: { 'Teams': true, 'Supervision': true } },
      'Training Management': { enabled: true, items: { 'Courses': true, 'Course Scheduling': true, 'Course Offerings': true, 'Enrollments': true, 'Teaching Sessions': true, 'Locations': true } },
      'Certificates': { enabled: true, items: { 'Certificates': true, 'Certificate Analytics': true, 'Rosters': true } },
      'Analytics & Reports': { enabled: true, items: { 'Analytics': true, 'Instructor Performance': true, 'Reports': true } }
    },
    'IC': {
      ...baseConfig,
      'Training Management': { enabled: true, items: { 'Courses': true, 'Teaching Sessions': true } },
      'Certificates': { enabled: true, items: { 'Certificates': true } }
    },
    'IP': {
      ...baseConfig,
      'Training Management': { enabled: true, items: { 'Courses': true, 'Course Scheduling': true, 'Teaching Sessions': true } },
      'Certificates': { enabled: true, items: { 'Certificates': true, 'Rosters': true } }
    },
    'IT': {
      ...baseConfig,
      'Training Management': { enabled: true, items: { 'Courses': true, 'Course Scheduling': true, 'Course Offerings': true, 'Teaching Sessions': true } },
      'Certificates': { enabled: true, items: { 'Certificates': true, 'Rosters': true } }
    },
    'IN': {
      ...baseConfig,
      'Training Management': { enabled: true, items: { 'Courses': true, 'Enrollments': true } },
      'Certificates': { enabled: true, items: { 'Certificates': true } }
    }
  };

  return roleConfigs[role] || baseConfig;
};

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
        
        // Validate configuration has at least Dashboard enabled
        const configValue = config.value as NavigationVisibilityConfig;
        const hasVisibleGroups = Object.values(configValue).some(group => group.enabled);
        
        if (!hasVisibleGroups) {
          console.error('🚨 NAVIGATION EMERGENCY: Configuration has no visible groups for role:', profile.role);
          console.log('🚨 NAVIGATION: Using emergency fallback configuration');
          return getEmergencyFallbackConfig(profile.role);
        }
        
        return configValue;
      }
      
      // If no database config exists, use emergency fallback
      console.warn('🔧 NAVIGATION: No database configuration found for role:', profile.role, 'using emergency fallback');
      return getEmergencyFallbackConfig(profile.role);
    },
    enabled: !!profile?.role && !!configurations && !configLoading && !profileLoading,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    retry: false,
  });

  const isLoading = configLoading || navQueryLoading || profileLoading || !profile?.role;

  const updateNavigationConfig = useMutation({
    mutationFn: async ({ role, newConfig }: { role: string; newConfig: NavigationVisibilityConfig }) => {
      console.log('🔧 NAVIGATION: Updating role-specific navigation config for role:', role, newConfig);
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      // Validate configuration before saving
      const hasVisibleGroups = Object.values(newConfig).some(group => group.enabled);
      if (!hasVisibleGroups) {
        throw new Error('Cannot save navigation configuration with no visible groups - this would break navigation for the role');
      }
      
      // Ensure Dashboard is always enabled
      if (!newConfig.Dashboard || !newConfig.Dashboard.enabled) {
        console.warn('🚨 NAVIGATION: Forcing Dashboard to be enabled to prevent broken navigation');
        newConfig.Dashboard = { 
          enabled: true, 
          items: { 
            Dashboard: true, 
            Profile: true 
          } 
        };
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

  // Emergency restore function for broken configurations
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
      
      queryClient.removeQueries({ queryKey: ['navigation-visibility-config'] });
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
    
    // Dashboard is always visible for all roles as emergency fallback
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
    
    // Dashboard and Profile are always visible for all roles as emergency fallback
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
    
    // Return emergency fallback if no database config exists
    console.warn('🔧 NAVIGATION: No database configuration found for role:', role, 'returning emergency fallback');
    return getEmergencyFallbackConfig(role);
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
    emergencyRestoreNavigation,
    isGroupVisible: (groupName: string) => isGroupVisible(groupName, profile?.role),
    isItemVisible: (groupName: string, itemName: string) => isItemVisible(groupName, itemName, profile?.role),
    getNavigationConfigForRole,
    getVisibleNavigation
  };
}
