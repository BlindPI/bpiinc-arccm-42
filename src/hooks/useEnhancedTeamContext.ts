
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
  const { data: userTeams = [], isLoading } = useTeamMemberships();

  const context = useMemo(() => {
    if (isLoading || !user || !profile) {
      return {
        currentTeam: null,
        currentTeamRole: null,
        allTeams: [],
        teamCount: 0,
        hasTeamMembership: false,
        isTeamAdmin: false,
        isSystemAdmin: false,
        canAccessGlobalData: false,
        canSwitchTeams: false,
        dashboardMode: 'personal' as const,
        shouldRestrictData: true,
        switchToTeam: () => {},
        setDashboardMode: () => {}
      };
    }

    const isSystemAdmin = ['SA', 'AD'].includes(profile.role);
    const hasTeams = userTeams.length > 0;
    
    // Determine current team (selected or primary)
    let currentTeam = null;
    if (selectedTeamId) {
      currentTeam = userTeams.find(tm => tm.team_id === selectedTeamId) || null;
    } else {
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

    console.log('🔧 ENHANCED-TEAM-CONTEXT:', {
      userId: user.id,
      userRole: profile.role,
      isSystemAdmin,
      hasTeams,
      currentTeam: currentTeam?.team_id,
      currentTeamRole,
      canAccessGlobalData,
      shouldRestrictData,
      defaultDashboardMode
    });

    return {
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
  }, [userTeams, user, profile, isLoading, selectedTeamId]);

  return context;
}
