
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import type { DatabaseUserRole } from '@/types/database-roles';
import { canManageTeams, canManageMembers, hasEnterpriseAccess } from '@/types/database-roles';

export function useUserRole() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  
  const [permissions, setPermissions] = useState({
    canManageTeams: false,
    canManageMembers: false,
    hasEnterpriseAccess: false,
    isSystemAdmin: false,
    isAdmin: false
  });

  useEffect(() => {
    if (!isLoading && profile?.role) {
      const role = profile.role as DatabaseUserRole;
      
      setPermissions({
        canManageTeams: canManageTeams(role),
        canManageMembers: canManageMembers(role),
        hasEnterpriseAccess: hasEnterpriseAccess(role),
        isSystemAdmin: role === 'SA',
        isAdmin: role === 'SA' || role === 'AD'
      });
    }
  }, [profile?.role, isLoading]);

  return {
    role: profile?.role as DatabaseUserRole | undefined,
    permissions,
    isLoading,
    userId: user?.id
  };
}
