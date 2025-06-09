
// Import unified UserRole type from single source of truth
import type { UserRole } from '@/types/supabase-schema';

export type { UserRole } from '@/types/supabase-schema';

export const ROLE_LABELS: Record<UserRole, string> = {
  'SA': 'System Administrator',
  'AD': 'Administrator',
  'AP': 'Authorized Provider',
  'TL': 'Team Leader',
  'IC': 'Instructor Candidate',
  'IP': 'Instructor Provisional',
  'IT': 'Instructor Trainer',
  'IN': 'Instructor',
  'ITC': 'Instructor Trainer Candidate',
  'S': 'Student',
  'N': 'New User',
  'ST': 'Student'
};

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'ST': 1,
  'S': 1,
  'N': 1,
  'IN': 2,
  'IT': 3,
  'IP': 4,
  'IC': 5,
  'ITC': 6,
  'TL': 7,
  'AP': 8,
  'AD': 9,
  'SA': 10
};

export const canManageRole = (userRole: UserRole, targetRole: UserRole): boolean => {
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
};

export const getRolePermissions = (role: UserRole) => {
  const permissions = {
    canManageUsers: false,
    canManageTeams: false,
    canManageCourses: false,
    canViewReports: false,
    canManageSystem: false,
    canManageProviders: false
  };

  switch (role) {
    case 'SA':
      return { 
        ...permissions, 
        canManageUsers: true, 
        canManageTeams: true, 
        canManageCourses: true,
        canViewReports: true,
        canManageSystem: true,
        canManageProviders: true
      };
    case 'AD':
      return { 
        ...permissions, 
        canManageUsers: true, 
        canManageTeams: true, 
        canManageCourses: true,
        canViewReports: true,
        canManageProviders: true
      };
    case 'AP':
      return { 
        ...permissions, 
        canManageTeams: true, 
        canManageCourses: true,
        canViewReports: true
      };
    case 'TL':
      return { 
        ...permissions, 
        canManageTeams: true, 
        canViewReports: true
      };
    case 'IC':
    case 'IP':
    case 'IT':
    case 'IN':
    case 'ITC':
      return { 
        ...permissions, 
        canViewReports: true
      };
    default:
      return permissions;
  }
};
