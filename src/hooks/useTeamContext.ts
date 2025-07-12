
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
  isSystemAdmin: boolean;
  shouldUseAdminInterface: boolean;
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
        canManageTeamNavigation: false,
        isSystemAdmin: false,
        shouldUseAdminInterface: false
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
    const isSystemAdmin = ['SA', 'AD'].includes(profile.role);
    
    // CRITICAL FIX: SA/AD users should use administrative interface, not team dashboard
    // Only use team dashboard for regular team members and team admins
    const shouldUseTeamDashboard = hasTeams && !isSystemAdmin;
    
    // SA/AD users should use the administrative interface for global oversight
    const shouldUseAdminInterface = isSystemAdmin;
    
    // System admins and team admins can manage team navigation
    const canManageTeamNavigation = isTeamAdmin || isSystemAdmin;

    console.log('🔧 TEAM-CONTEXT: Team context calculated:', {
      hasTeams,
      primaryTeam: primaryTeam?.team_id,
      teamRole,
      isTeamAdmin,
      shouldUseTeamDashboard,
      shouldUseAdminInterface,
      canManageTeamNavigation,
      userRole: profile.role,
      isSystemAdmin
    });

    return {
      hasTeamMembership: hasTeams,
      primaryTeam,
      allTeams: userTeams,
      isTeamMember: hasTeams,
      teamRole,
      shouldUseTeamDashboard,
      teamLocation: null, // Location data not available in flat structure
      isTeamAdmin,
      canManageTeamNavigation,
      isSystemAdmin,
      shouldUseAdminInterface
    };
  }, [userTeams, user, profile, isLoading]);

  return teamContext;
}
