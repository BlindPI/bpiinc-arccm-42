
import { useMemo } from 'react';
import { useTeamMemberships } from './useTeamMemberships';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from './useProfile';

export interface EnhancedTeamContext {
  // Current team selection
  currentTeam: any | null;
  currentTeamRole: 'ADMIN' | 'MEMBER' | null;
  
  // All user teams
  allTeams: any[];
  teamCount: number;
  
  // Access control
  hasTeamMembership: boolean;
  isTeamAdmin: boolean;
  isSystemAdmin: boolean;
  canAccessGlobalData: boolean;
  canSwitchTeams: boolean;
  
  // Dashboard configuration
  dashboardMode: 'personal' | 'team' | 'organization';
  shouldRestrictData: boolean;
  
  // Team switching
  switchToTeam: (teamId: string) => void;
  setDashboardMode: (mode: 'personal' | 'team' | 'organization') => void;
}

export function useEnhancedTeamContext(selectedTeamId?: string): EnhancedTeamContext {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: userTeams = [], isLoading: teamsLoading } = useTeamMemberships();

  const context = useMemo(() => {
    console.log('🔧 ENHANCED-TEAM-CONTEXT: Computing context', {
      userId: user?.id,
      profileRole: profile?.role,
      userProfileRole: user?.profile?.role,
      teamsLoading,
      teamsCount: userTeams.length
    });

    // Get user role from either source
    const userRole = profile?.role || user?.profile?.role;
    
    // Don't block if teams are loading - provide safe defaults
    const isSystemAdmin = userRole ? ['SA', 'AD'].includes(userRole) : false;
    const hasTeams = userTeams.length > 0;
    
    // Determine current team (selected or primary)
    let currentTeam = null;
    if (selectedTeamId && userTeams.length > 0) {
      currentTeam = userTeams.find(tm => tm.team_id === selectedTeamId) || null;
    } else if (userTeams.length > 0) {
      // Default to first admin team, then any team
      currentTeam = userTeams.find(tm => tm.role === 'ADMIN') || userTeams[0] || null;
    }
    
    const currentTeamRole = currentTeam?.role as 'ADMIN' | 'MEMBER' | null;
    const isTeamAdmin = currentTeamRole === 'ADMIN';
    
    // Access control logic
    const canAccessGlobalData = isSystemAdmin;
    const canSwitchTeams = userTeams.length > 1;
    const shouldRestrictData = !isSystemAdmin && hasTeams;
    
    // Default dashboard mode based on context
    let defaultDashboardMode: 'personal' | 'team' | 'organization' = 'personal';
    if (isSystemAdmin) {
      defaultDashboardMode = 'organization';
    } else if (hasTeams && currentTeam) {
      defaultDashboardMode = 'team';
    }

    const result = {
      currentTeam,
      currentTeamRole,
      allTeams: userTeams,
      teamCount: userTeams.length,
      hasTeamMembership: hasTeams,
      isTeamAdmin,
      isSystemAdmin,
      canAccessGlobalData,
      canSwitchTeams,
      dashboardMode: defaultDashboardMode,
      shouldRestrictData,
      switchToTeam: (teamId: string) => {
        console.log('🔄 Switching to team:', teamId);
        // This will be handled by parent component state
      },
      setDashboardMode: (mode: 'personal' | 'team' | 'organization') => {
        console.log('🔄 Setting dashboard mode:', mode);
        // This will be handled by parent component state
      }
    };

    console.log('🔧 ENHANCED-TEAM-CONTEXT: Result:', {
      currentTeam: result.currentTeam?.team_id,
      hasTeamMembership: result.hasTeamMembership,
      isSystemAdmin: result.isSystemAdmin,
      dashboardMode: result.dashboardMode
    });

    return result;
  }, [userTeams, user, profile, selectedTeamId, teamsLoading]);

  return context;
}
