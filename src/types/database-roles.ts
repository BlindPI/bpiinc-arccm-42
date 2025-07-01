
// Database-aligned role types - matching actual Supabase profiles table
export type DatabaseUserRole = 'SA' | 'AD' | 'AP' | 'IC' | 'IP' | 'IT' | 'IN';

export const ROLE_LABELS: Record<DatabaseUserRole, string> = {
  SA: 'System Administrator',
  AD: 'Administrator', 
  AP: 'Authorized Provider',
  IC: 'Instructor Certified',
  IP: 'Instructor Provisional',
  IT: 'Instructor Trainee',
  IN: 'Instructor New'
};

export const ROLE_HIERARCHY: Record<DatabaseUserRole, number> = {
  SA: 7, // Highest
  AD: 6,
  AP: 5,
  IC: 4,
  IP: 3,
  IT: 2,
  IN: 1  // Lowest
};

export const TEAM_MANAGEMENT_ROLES: DatabaseUserRole[] = ['SA', 'AD', 'AP'];
export const INSTRUCTOR_ROLES: DatabaseUserRole[] = ['IC', 'IP', 'IT', 'IN'];

export function canManageTeams(role: DatabaseUserRole): boolean {
  return TEAM_MANAGEMENT_ROLES.includes(role);
}

export function canManageMembers(role: DatabaseUserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY['AP'];
}

export function hasEnterpriseAccess(role: DatabaseUserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY['AP'];
}
