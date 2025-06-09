
import { UserRole } from "@/types/auth";

export const ROLE_LABELS: Record<UserRole, string> = {
  'SA': 'System Administrator',
  'AD': 'Administrator',
  'AP': 'Authorized Provider',
  'TL': 'Team Leader',
  'IC': 'Instructor Certified',
  'IP': 'Instructor Provisional',
  'IT': 'Instructor Training',
  'IN': 'Instructor New',
  'ST': 'Student'
};

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'ST': 1,
  'IN': 2,
  'IT': 3,
  'IP': 4,
  'IC': 5,
  'TL': 6,
  'AP': 7,
  'AD': 8,
  'SA': 9
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
      return { 
        ...permissions, 
        canViewReports: true
      };
    default:
      return permissions;
  }
};
