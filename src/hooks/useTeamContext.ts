
import { useMemo } from 'react';
import { useTeamMemberships } from './useTeamMemberships';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from './useProfile';

export interface TeamContext {
  hasTeamMembership: boolean;
  primaryTeam: any | null;
  allTeams: any[];
  isTeamMember: boolean;
  teamRole: 'ADMIN' | 'MEMBER' | null;
  shouldUseTeamDashboard: boolean;
  teamLocation: any | null;
  isTeamAdmin: boolean;
  canManageTeamNavigation: boolean;
}

export function useTeamContext(): TeamContext {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: userTeams = [], isLoading } = useTeamMemberships();

  const teamContext = useMemo(() => {
    if (isLoading || !user || !profile) {
      return {
        hasTeamMembership: false,
        primaryTeam: null,
        allTeams: [],
        isTeamMember: false,
        teamRole: null,
        shouldUseTeamDashboard: false,
        teamLocation: null,
        isTeamAdmin: false,
        canManageTeamNavigation: false
      };
    }

    const hasTeams = userTeams.length > 0;
    const primaryTeam = userTeams.find(tm => tm.role === 'ADMIN') || userTeams[0] || null;
    
    // Ensure teamRole is properly typed - map database values to expected types
    let teamRole: 'ADMIN' | 'MEMBER' | null = null;
    if (primaryTeam?.role) {
      teamRole = primaryTeam.role === 'ADMIN' ? 'ADMIN' : 'MEMBER';
    }
    
    const isTeamAdmin = teamRole === 'ADMIN';
    
    // Only non-admin users should use team dashboard, unless they're team admins
    const shouldUseTeamDashboard = hasTeams && (!['SA', 'AD'].includes(profile.role) || isTeamAdmin);
    
    // Team admins and system/app admins can manage team navigation
    const canManageTeamNavigation = isTeamAdmin || ['SA', 'AD'].includes(profile.role);

    console.log('🔧 TEAM-CONTEXT: Team context calculated:', {
      hasTeams,
      primaryTeam: primaryTeam?.team_id,
      teamRole,
      isTeamAdmin,
      shouldUseTeamDashboard,
      canManageTeamNavigation,
      userRole: profile.role
    });

    return {
      hasTeamMembership: hasTeams,
      primaryTeam,
      allTeams: userTeams,
      isTeamMember: hasTeams,
      teamRole,
      shouldUseTeamDashboard,
      teamLocation: primaryTeam?.teams?.locations || null,
      isTeamAdmin,
      canManageTeamNavigation
    };
  }, [userTeams, user, profile, isLoading]);

  return teamContext;
}
