
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamContext } from './useTeamContext';
import { NavigationVisibilityConfig } from './useNavigationVisibility';
import { toast } from 'sonner';

export interface TeamNavigationConfig {
  id: string;
  teamId: string;
  roleType: string;
  configOverrides: Partial<NavigationVisibilityConfig>;
  isActive: boolean;
}

export interface ProviderNavigationConfig {
  id: string;
  providerId: string;
  configOverrides: Partial<NavigationVisibilityConfig>;
  isActive: boolean;
}

export function useTeamNavigationVisibility() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { primaryTeam, shouldUseTeamDashboard } = useTeamContext();

  // Fetch team-specific navigation overrides
  const { data: teamNavigationConfigs, isLoading: teamConfigLoading } = useQuery({
    queryKey: ['team-navigation-configs', primaryTeam?.team_id],
    queryFn: async () => {
      if (!primaryTeam?.team_id) return [];
      
      console.log('🔧 TEAM-NAV: Fetching team navigation configs for team:', primaryTeam.team_id);
      
      const { data, error } = await supabase
        .from('team_navigation_configs')
        .select('*')
        .eq('team_id', primaryTeam.team_id)
        .eq('is_active', true);

      if (error) {
        console.error('🔧 TEAM-NAV: Error fetching team configs:', error);
        throw error;
      }

      console.log('🔧 TEAM-NAV: Retrieved team configs:', data);
      return data as TeamNavigationConfig[];
    },
    enabled: !!primaryTeam?.team_id && shouldUseTeamDashboard,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch provider-specific navigation overrides for AP users
  const { data: providerNavigationConfigs, isLoading: providerConfigLoading } = useQuery({
    queryKey: ['provider-navigation-configs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // First, get the provider ID for this user
      const { data: providerData, error: providerError } = await supabase
        .from('authorized_providers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (providerError || !providerData) {
        console.log('🔧 PROVIDER-NAV: No provider found for user:', user.id);
        return [];
      }

      console.log('🔧 PROVIDER-NAV: Fetching provider navigation configs for provider:', providerData.id);
      
      const { data, error } = await supabase
        .from('provider_navigation_configs')
        .select('*')
        .eq('provider_id', providerData.id)
        .eq('is_active', true);

      if (error) {
        console.error('🔧 PROVIDER-NAV: Error fetching provider configs:', error);
        throw error;
      }

      console.log('🔧 PROVIDER-NAV: Retrieved provider configs:', data);
      return data as ProviderNavigationConfig[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation to update team navigation config
  const updateTeamNavigationConfig = useMutation({
    mutationFn: async ({ 
      teamId, 
      roleType, 
      configOverrides 
    }: { 
      teamId: string; 
      roleType: string; 
      configOverrides: Partial<NavigationVisibilityConfig> 
    }) => {
      console.log('🔧 TEAM-NAV: Updating team navigation config:', { teamId, roleType, configOverrides });
      
      const { data, error } = await supabase
        .from('team_navigation_configs')
        .upsert({
          team_id: teamId,
          role_type: roleType,
          config_overrides: configOverrides,
          created_by: user?.id,
          is_active: true
        }, {
          onConflict: 'team_id,role_type'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Team navigation settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['team-navigation-configs'] });
      queryClient.invalidateQueries({ queryKey: ['navigation-visibility-config'] });
    },
    onError: (error: any) => {
      console.error('🔧 TEAM-NAV: Failed to update team config:', error);
      toast.error(`Failed to update team navigation settings: ${error.message}`);
    }
  });

  // Mutation to update provider navigation config
  const updateProviderNavigationConfig = useMutation({
    mutationFn: async ({ 
      providerId, 
      configOverrides 
    }: { 
      providerId: string; 
      configOverrides: Partial<NavigationVisibilityConfig> 
    }) => {
      console.log('🔧 PROVIDER-NAV: Updating provider navigation config:', { providerId, configOverrides });
      
      const { data, error } = await supabase
        .from('provider_navigation_configs')
        .upsert({
          provider_id: providerId,
          config_overrides: configOverrides,
          created_by: user?.id,
          is_active: true
        }, {
          onConflict: 'provider_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Provider navigation settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['provider-navigation-configs'] });
      queryClient.invalidateQueries({ queryKey: ['navigation-visibility-config'] });
    },
    onError: (error: any) => {
      console.error('🔧 PROVIDER-NAV: Failed to update provider config:', error);
      toast.error(`Failed to update provider navigation settings: ${error.message}`);
    }
  });

  // Helper function to merge navigation configs with team/provider overrides
  const mergeNavigationConfigs = (
    baseConfig: NavigationVisibilityConfig,
    userRole: string
  ): NavigationVisibilityConfig => {
    let mergedConfig = { ...baseConfig };

    // Apply team-specific overrides if available
    if (teamNavigationConfigs && teamNavigationConfigs.length > 0) {
      const teamConfig = teamNavigationConfigs.find(tc => tc.roleType === userRole);
      if (teamConfig && teamConfig.configOverrides) {
        console.log('🔧 TEAM-NAV: Applying team overrides for role:', userRole, teamConfig.configOverrides);
        mergedConfig = deepMergeConfigs(mergedConfig, teamConfig.configOverrides);
      }
    }

    // Apply provider-specific overrides if available (for AP users)
    if (providerNavigationConfigs && providerNavigationConfigs.length > 0) {
      const providerConfig = providerNavigationConfigs[0]; // Should only be one per provider
      if (providerConfig && providerConfig.configOverrides) {
        console.log('🔧 PROVIDER-NAV: Applying provider overrides:', providerConfig.configOverrides);
        mergedConfig = deepMergeConfigs(mergedConfig, providerConfig.configOverrides);
      }
    }

    return mergedConfig;
  };

  // Deep merge function for navigation configs
  const deepMergeConfigs = (
    base: NavigationVisibilityConfig,
    override: Partial<NavigationVisibilityConfig>
  ): NavigationVisibilityConfig => {
    const result = { ...base };
    
    Object.keys(override).forEach(groupName => {
      const overrideGroup = override[groupName];
      if (overrideGroup) {
        if (!result[groupName]) {
          result[groupName] = { enabled: false, items: {} };
        }
        
        result[groupName] = {
          enabled: overrideGroup.enabled !== undefined ? overrideGroup.enabled : result[groupName].enabled,
          items: {
            ...result[groupName].items,
            ...overrideGroup.items
          }
        };
      }
    });
    
    return result;
  };

  return {
    teamNavigationConfigs,
    providerNavigationConfigs,
    isLoading: teamConfigLoading || providerConfigLoading,
    updateTeamNavigationConfig,
    updateProviderNavigationConfig,
    mergeNavigationConfigs,
    hasTeamOverrides: teamNavigationConfigs && teamNavigationConfigs.length > 0,
    hasProviderOverrides: providerNavigationConfigs && providerNavigationConfigs.length > 0
  };
}
