
import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';

export interface NavigationVisibilityConfig {
  visibleGroups: string[];
  hiddenGroups: string[];
  customOrder?: string[];
}

// Emergency default configuration - matches the new structure
const EMERGENCY_DEFAULT_CONFIG: NavigationVisibilityConfig = {
  visibleGroups: [
    'dashboard',
    'provider-compliance',
    'user-management', 
    'training-education',
    'compliance-automation',
    'analytics-reporting',
    'system-tools'
  ],
  hiddenGroups: [],
  customOrder: [
    'dashboard',
    'provider-compliance',
    'user-management',
    'training-education', 
    'compliance-automation',
    'analytics-reporting',
    'system-tools'
  ]
};

export function useNavigationVisibility() {
  const { data: profile } = useProfile();
  const [config, setConfig] = useState<NavigationVisibilityConfig>(EMERGENCY_DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNavigationConfig = async () => {
      try {
        if (!profile?.id) {
          setConfig(EMERGENCY_DEFAULT_CONFIG);
          setIsLoading(false);
          return;
        }

        // Try to load from database
        const { data, error } = await supabase
          .from('system_configurations')
          .select('value')
          .eq('category', 'navigation')
          .eq('key', 'sidebar_visibility')
          .single();

        if (error || !data) {
          console.log('Using emergency default navigation config');
          setConfig(EMERGENCY_DEFAULT_CONFIG);
        } else {
          const dbConfig = data.value as NavigationVisibilityConfig;
          // Validate and merge with defaults
          const mergedConfig = {
            ...EMERGENCY_DEFAULT_CONFIG,
            ...dbConfig,
            visibleGroups: dbConfig.visibleGroups || EMERGENCY_DEFAULT_CONFIG.visibleGroups
          };
          setConfig(mergedConfig);
        }
      } catch (error) {
        console.error('Error loading navigation config:', error);
        setConfig(EMERGENCY_DEFAULT_CONFIG);
      } finally {
        setIsLoading(false);
      }
    };

    loadNavigationConfig();
  }, [profile?.id]);

  const updateVisibility = async (newConfig: Partial<NavigationVisibilityConfig>) => {
    try {
      const updatedConfig = { ...config, ...newConfig };
      
      // Update in database
      const { error } = await supabase
        .from('system_configurations')
        .upsert({
          category: 'navigation',
          key: 'sidebar_visibility',
          value: updatedConfig,
          data_type: 'object',
          description: 'Sidebar navigation visibility configuration',
          is_public: false,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating navigation config:', error);
        return false;
      }

      setConfig(updatedConfig);
      return true;
    } catch (error) {
      console.error('Error updating navigation visibility:', error);
      return false;
    }
  };

  const toggleGroup = async (groupId: string) => {
    const isVisible = config.visibleGroups.includes(groupId);
    
    if (isVisible) {
      // Hide the group
      const newVisibleGroups = config.visibleGroups.filter(id => id !== groupId);
      const newHiddenGroups = [...config.hiddenGroups, groupId];
      
      return await updateVisibility({
        visibleGroups: newVisibleGroups,
        hiddenGroups: newHiddenGroups
      });
    } else {
      // Show the group
      const newVisibleGroups = [...config.visibleGroups, groupId];
      const newHiddenGroups = config.hiddenGroups.filter(id => id !== groupId);
      
      return await updateVisibility({
        visibleGroups: newVisibleGroups,
        hiddenGroups: newHiddenGroups
      });
    }
  };

  return {
    visibleGroups: config.visibleGroups,
    hiddenGroups: config.hiddenGroups,
    customOrder: config.customOrder,
    isLoading,
    toggleGroup,
    updateVisibility
  };
}
