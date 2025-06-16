import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from './useProfile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DatabaseUserRole } from '@/types/database-roles';

export interface AdminTeamContext {
  isSystemAdmin: boolean;
  hasGlobalTeamAccess: boolean;
  canManageAllTeams: boolean;
  canViewAllTeams: boolean;
  canCreateTeams: boolean;
  canDeleteTeams: boolean;
  canManageMembers: boolean;
  canViewAnalytics: boolean;
  userRole: DatabaseUserRole | null;
  loading: boolean;
}

export interface GlobalTeamData {
  id: string;
  name: string;
  description?: string;
  team_type: string;
  status: 'active' | 'inactive' | 'suspended';
  performance_score: number;
  location_id?: string;
  provider_id?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
  monthly_targets: Record<string, any>;
  current_metrics: Record<string, any>;
  member_count: number;
  location?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
  };
  provider?: {
    id: string;
    name: string;
    provider_type: string;
    status: string;
  };
}

// Hook for administrative team context - bypasses team membership requirements
export function useAdminTeamContext(): AdminTeamContext {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const adminContext = useMemo(() => {
    if (profileLoading || !user || !profile) {
      return {
        isSystemAdmin: false,
        hasGlobalTeamAccess: false,
        canManageAllTeams: false,
        canViewAllTeams: false,
        canCreateTeams: false,
        canDeleteTeams: false,
        canManageMembers: false,
        canViewAnalytics: false,
        userRole: null,
        loading: true
      };
    }

    const userRole = profile.role as DatabaseUserRole;
    const isSystemAdmin = ['SA', 'AD'].includes(userRole);
    
    // SA/AD users get full global access without team membership requirements
    const hasGlobalTeamAccess = isSystemAdmin;
    const canManageAllTeams = isSystemAdmin;
    const canViewAllTeams = isSystemAdmin;
    const canCreateTeams = isSystemAdmin;
    const canDeleteTeams = userRole === 'SA'; // Only SA can delete teams
    const canManageMembers = isSystemAdmin;
    const canViewAnalytics = isSystemAdmin;

    console.log('🔧 ADMIN-TEAM-CONTEXT: Administrative context calculated:', {
      userRole,
      isSystemAdmin,
      hasGlobalTeamAccess,
      canManageAllTeams,
      canViewAllTeams,
      canCreateTeams,
      canDeleteTeams,
      canManageMembers,
      canViewAnalytics
    });

    return {
      isSystemAdmin,
      hasGlobalTeamAccess,
      canManageAllTeams,
      canViewAllTeams,
      canCreateTeams,
      canDeleteTeams,
      canManageMembers,
      canViewAnalytics,
      userRole,
      loading: false
    };
  }, [user, profile, profileLoading]);

  return adminContext;
}

// Hook to fetch all teams for administrative oversight
export function useAdminTeamData() {
  const { hasGlobalTeamAccess } = useAdminTeamContext();

  return useQuery({
    queryKey: ['admin-teams'],
    queryFn: async (): Promise<GlobalTeamData[]> => {
      if (!hasGlobalTeamAccess) {
        throw new Error('Insufficient permissions for global team access');
      }

      console.log('🔧 ADMIN-TEAMS: Starting admin teams query...');

      // DIAGNOSTIC: Run our diagnostic function first
      try {
        const { runSimpleTeamDiagnostics } = await import('@/utils/simpleTeamDiagnostics');
        const diagnostics = await runSimpleTeamDiagnostics();
        console.log('🔧 ADMIN-TEAMS: DIAGNOSTIC RESULTS:', diagnostics);
      } catch (diagError) {
        console.warn('🔧 ADMIN-TEAMS: Diagnostic failed:', diagError);
      }

      // Use the new safe function first
      try {
        const { data: teamsData, error: safeError } = await supabase
          .rpc('get_teams_safe');

        if (safeError) {
          console.warn('🔧 ADMIN-TEAMS: Safe function failed, trying direct approach:', safeError);
          throw safeError;
        }

        console.log('🔧 ADMIN-TEAMS: Safe function successful, fetching related data...');

        // Get locations separately
        const { data: locationsData } = await supabase
          .from('locations')
          .select('id, name, address, city, state');

        // Get providers separately (if table exists)
        const { data: providersData } = await supabase
          .from('providers')
          .select('id, name, provider_type, status');

        // Get team member counts using the safe function
        const memberCounts: Record<string, number> = {};
        for (const team of teamsData || []) {
          try {
            const { data: members } = await supabase
              .rpc('fetch_team_members_with_profiles', { p_team_id: team.id });
            memberCounts[team.id] = members?.length || 0;
          } catch (memberError) {
            console.warn(`🔧 ADMIN-TEAMS: Could not get member count for team ${team.id}:`, memberError);
            memberCounts[team.id] = 0;
          }
        }

        // Combine the data
        return (teamsData || []).map((team: any) => {
          const location = locationsData?.find(l => l.id === team.location_id);
          const provider = providersData?.find(p => p.id === team.provider_id);

          return {
            id: team.id,
            name: team.name,
            description: team.description,
            team_type: team.team_type,
            status: team.status,
            performance_score: team.performance_score || 0,
            location_id: team.location_id,
            provider_id: team.provider_id,
            created_by: team.created_by,
            created_at: team.created_at,
            updated_at: team.updated_at,
            metadata: typeof team.metadata === 'string'
              ? JSON.parse(team.metadata)
              : team.metadata || {},
            monthly_targets: typeof team.monthly_targets === 'string'
              ? JSON.parse(team.monthly_targets)
              : team.monthly_targets || {},
            current_metrics: typeof team.current_metrics === 'string'
              ? JSON.parse(team.current_metrics)
              : team.current_metrics || {},
            location,
            provider,
            member_count: memberCounts[team.id] || 0
          } as GlobalTeamData;
        });

      } catch (safeError) {
        console.error('🔧 ADMIN-TEAMS: Safe function failed, trying basic fallback:', safeError);
        
        // Final fallback: Return empty array with proper structure
        console.warn('🔧 ADMIN-TEAMS: All methods failed, returning empty array');
        return [];
      }
    },
    enabled: hasGlobalTeamAccess,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute for real-time updates
    retry: (failureCount, error) => {
      console.log(`🔧 ADMIN-TEAMS: Query retry ${failureCount}:`, error);
      return failureCount < 2; // Retry up to 2 times
    },
  });
}

// Hook to fetch global team statistics for administrative dashboard
export function useAdminTeamStatistics() {
  const { hasGlobalTeamAccess } = useAdminTeamContext();

  return useQuery({
    queryKey: ['admin-team-statistics'],
    queryFn: async () => {
      if (!hasGlobalTeamAccess) {
        throw new Error('Insufficient permissions for team statistics');
      }

      console.log('🔧 ADMIN-STATS: Starting team statistics query...');

      try {
        // Try the new safe function first
        const { data: statsData, error: statsError } = await supabase
          .rpc('get_team_statistics_safe');
        
        if (statsError) {
          console.warn('🔧 ADMIN-STATS: Safe function failed, trying direct query:', statsError);
          
          // Fallback to direct query
          const { data: teams, error: teamsError } = await supabase
            .from('teams')
            .select('status, team_type, performance_score');
          
          if (teamsError) {
            console.error('🔧 ADMIN-STATS: Teams query failed:', teamsError);
            throw teamsError;
          }

          console.log('🔧 ADMIN-STATS: Direct teams query successful, getting member statistics...');

          // Try to get member statistics using the safe function approach
          let totalMembers = 0;
          try {
            // First try direct query
            const { data: members, error: membersError } = await supabase
              .from('team_members')
              .select('status')
              .eq('status', 'active');

            if (membersError) {
              console.warn('🔧 ADMIN-STATS: Direct member query failed, using fallback:', membersError);
              
              // Fallback: Count members using the safe function for each team
              for (const team of teams || []) {
                try {
                  const { data: teamMembers } = await supabase
                    .rpc('fetch_team_members_with_profiles', { p_team_id: team.id });
                  totalMembers += teamMembers?.filter(m => m.status === 'active').length || 0;
                } catch (memberError) {
                  console.warn(`🔧 ADMIN-STATS: Could not count members for team ${team.id}:`, memberError);
                }
              }
            } else {
              totalMembers = members?.length || 0;
            }
          } catch (memberError) {
            console.warn('🔧 ADMIN-STATS: All member counting methods failed:', memberError);
            totalMembers = 0;
          }

          const teamsData = teams || [];
          const totalTeams = teamsData.length;
          const activeTeams = teamsData.filter(t => t.status === 'active').length;
          const inactiveTeams = teamsData.filter(t => t.status === 'inactive').length;
          const suspendedTeams = teamsData.filter(t => t.status === 'suspended').length;
          
          const averagePerformance = teamsData.length > 0
            ? Math.round(teamsData.reduce((sum, team) => sum + (team.performance_score || 0), 0) / teamsData.length)
            : 0;

          const statistics = {
            totalTeams,
            totalMembers,
            averagePerformance,
            averageCompliance: 0, // Will be calculated when compliance data is available
            teamsByLocation: {}, // Will be populated when location data is available
            performanceByTeamType: {}, // Will be populated when needed
            activeTeams,
            inactiveTeams,
            suspendedTeams
          };

          console.log('🔧 ADMIN-STATS: Statistics calculated successfully:', statistics);
          return statistics;
        } else {
          // Safe function succeeded
          console.log('🔧 ADMIN-STATS: Safe function successful:', statsData);
          const stats = statsData[0] || {};
          return {
            totalTeams: Number(stats.total_teams) || 0,
            totalMembers: 0, // Will be calculated separately
            averagePerformance: Number(stats.average_performance) || 0,
            averageCompliance: 0,
            teamsByLocation: {},
            performanceByTeamType: {},
            activeTeams: Number(stats.active_teams) || 0,
            inactiveTeams: Number(stats.inactive_teams) || 0,
            suspendedTeams: Number(stats.suspended_teams) || 0
          };
        }

      } catch (error) {
        console.error('🔧 ADMIN-STATS: Statistics query failed completely:', error);
        
        // Return safe defaults if everything fails
        return {
          totalTeams: 0,
          totalMembers: 0,
          averagePerformance: 0,
          averageCompliance: 0,
          teamsByLocation: {},
          performanceByTeamType: {},
          activeTeams: 0,
          inactiveTeams: 0,
          suspendedTeams: 0
        };
      }
    },
    enabled: hasGlobalTeamAccess,
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // Refetch every 5 minutes
    retry: (failureCount, error) => {
      console.log(`🔧 ADMIN-STATS: Query retry ${failureCount}:`, error);
      return failureCount < 2; // Retry up to 2 times
    },
  });
}