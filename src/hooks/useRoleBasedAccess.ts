
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RLSPolicyService } from '@/services/security/rlsPolicyService';

export function useRoleBasedAccess() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setPermissions({});
      setUserRole(null);
      setLoading(false);
      return;
    }

    const checkPermissions = async () => {
      try {
        const role = await RLSPolicyService.getUserRole(user.id);
        setUserRole(role);

        const resources = [
          'analytics',
          'user_management', 
          'course_management',
          'scheduling',
          'certificates',
          'rosters',
          'teams'
        ];

        const permissionChecks = await Promise.all(
          resources.map(async (resource) => {
            const hasPermission = await RLSPolicyService.checkUserPermissions(user.id, resource);
            return [resource, hasPermission];
          })
        );

        const permissionsMap = Object.fromEntries(permissionChecks);
        setPermissions(permissionsMap);
      } catch (error) {
        console.error('Error checking permissions:', error);
        setPermissions({});
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [user?.id]);

  const hasPermission = (resource: string): boolean => {
    return permissions[resource] || false;
  };

  const isAdmin = (): boolean => {
    return userRole === 'SA' || userRole === 'AD';
  };

  const isInstructor = (): boolean => {
    return ['SA', 'AD', 'IP', 'IT', 'IC'].includes(userRole || '');
  };

  return {
    permissions,
    userRole,
    loading,
    hasPermission,
    isAdmin,
    isInstructor
  };
}
