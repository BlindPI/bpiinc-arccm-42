
import { useMemo } from 'react';
import { useUserRole } from './useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function useEnterpriseAccess() {
  const { user } = useAuth();
  const { permissions, role, isLoading: roleLoading } = useUserRole();

  // Check if user can manage specific team using database function
  const { data: teamPermissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['team-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return {};
      
      try {
        // Get user's teams where they are admin
        const { data: adminTeams, error } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id)
          .eq('role', 'ADMIN');

        if (error) throw error;

        const managedTeamIds = adminTeams?.map(t => t.team_id) || [];
        
        return {
          managedTeamIds,
          canManageAnyTeam: managedTeamIds.length > 0 || permissions.isSystemAdmin || permissions.isAdmin
        };
      } catch (error) {
        console.error('Error checking team permissions:', error);
        return { managedTeamIds: [], canManageAnyTeam: false };
      }
    },
    enabled: !!user?.id && !roleLoading
  });

  const enterpriseFeatures = useMemo(() => {
    const hasEnterpriseRole = ['SA', 'AD', 'AP'].includes(role || '');
    const isTeamAdmin = (teamPermissions?.managedTeamIds?.length || 0) > 0;
    
    return {
      // Core enterprise access
      hasEnterpriseAccess: hasEnterpriseRole,
      
      // Specific feature access
      canViewAnalytics: hasEnterpriseRole || isTeamAdmin,
      canManageWorkflows: hasEnterpriseRole,
      canViewCompliance: hasEnterpriseRole || isTeamAdmin,
      canAccessAuditTrail: hasEnterpriseRole,
      canManageCrossTeam: hasEnterpriseRole,
      
      // Team-specific permissions
      canCreateTeams: hasEnterpriseRole,
      canDeleteTeams: ['SA', 'AD'].includes(role || ''),
      canManageTeamMembers: hasEnterpriseRole || isTeamAdmin,
      canViewTeamAnalytics: hasEnterpriseRole || isTeamAdmin,
      
      // Administrative capabilities
      isSystemWideAdmin: ['SA', 'AD'].includes(role || ''),
      isProviderAdmin: role === 'AP',
      
      // Team management scope
      managedTeamIds: teamPermissions?.managedTeamIds || [],
      canManageAnyTeam: teamPermissions?.canManageAnyTeam || false
    };
  }, [role, permissions, teamPermissions]);

  const checkTeamAccess = (teamId: string): boolean => {
    if (enterpriseFeatures.isSystemWideAdmin) return true;
    return enterpriseFeatures.managedTeamIds.includes(teamId);
  };

  return {
    ...enterpriseFeatures,
    checkTeamAccess,
    isLoading: roleLoading || permissionsLoading,
    role,
    userId: user?.id
  };
}
