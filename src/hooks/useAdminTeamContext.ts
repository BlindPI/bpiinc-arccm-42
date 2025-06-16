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

      // Use direct query for now until we can add the new function to the types
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          location:locations(id, name, address, city, state),
          provider:providers(id, name, provider_type, status),
          team_members!inner(count)
        `);
      
      if (error) {
        console.error('Error fetching admin teams:', error);
        throw error;
      }
      
      return (data || []).map((team: any) => {
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
          location: team.location,
          provider: team.provider,
          member_count: Array.isArray(team.team_members) ? team.team_members.length : 0
        } as GlobalTeamData;
      });
    },
    enabled: hasGlobalTeamAccess,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute for real-time updates
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

      // Calculate statistics directly from the database
      const [teamsResult, membersResult] = await Promise.all([
        supabase.from('teams').select('status, team_type, performance_score'),
        supabase.from('team_members').select('status').eq('status', 'active')
      ]);
      
      if (teamsResult.error) {
        console.error('Error fetching team statistics:', teamsResult.error);
        throw teamsResult.error;
      }

      if (membersResult.error) {
        console.error('Error fetching member statistics:', membersResult.error);
        throw membersResult.error;
      }

      const teams = teamsResult.data || [];
      const members = membersResult.data || [];

      const totalTeams = teams.length;
      const totalMembers = members.length;
      const activeTeams = teams.filter(t => t.status === 'active').length;
      const inactiveTeams = teams.filter(t => t.status === 'inactive').length;
      const suspendedTeams = teams.filter(t => t.status === 'suspended').length;
      
      const averagePerformance = teams.length > 0
        ? Math.round(teams.reduce((sum, team) => sum + (team.performance_score || 0), 0) / teams.length)
        : 0;

      return {
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
    },
    enabled: hasGlobalTeamAccess,
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}