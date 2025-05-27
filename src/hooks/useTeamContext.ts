
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
        teamLocation: null
      };
    }

    const hasTeams = userTeams.length > 0;
    const primaryTeam = userTeams.find(tm => tm.role === 'ADMIN') || userTeams[0] || null;
    
    // Ensure teamRole is properly typed - map database values to expected types
    let teamRole: 'ADMIN' | 'MEMBER' | null = null;
    if (primaryTeam?.role) {
      teamRole = primaryTeam.role === 'ADMIN' ? 'ADMIN' : 'MEMBER';
    }
    
    // Only non-admin users should use team dashboard
    const shouldUseTeamDashboard = hasTeams && !['SA', 'AD'].includes(profile.role);

    return {
      hasTeamMembership: hasTeams,
      primaryTeam,
      allTeams: userTeams,
      isTeamMember: hasTeams,
      teamRole,
      shouldUseTeamDashboard,
      teamLocation: primaryTeam?.teams?.locations || null
    };
  }, [userTeams, user, profile, isLoading]);

  return teamContext;
}
