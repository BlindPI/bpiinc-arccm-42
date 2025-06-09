
// Database-aligned role types - matching actual Supabase profiles table
export type DatabaseUserRole = 'SA' | 'AD' | 'AP' | 'IC' | 'IP' | 'IT' | 'IN' | 'TL' | 'ST';

export const ROLE_LABELS: Record<DatabaseUserRole, string> = {
  SA: 'System Administrator',
  AD: 'Administrator', 
  AP: 'Authorized Provider',
  IC: 'Instructor Certified',
  IP: 'Instructor Provisional',
  IT: 'Instructor Trainee',
  IN: 'Instructor New',
  TL: 'Team Leader',
  ST: 'Student'
};

export const ROLE_HIERARCHY: Record<DatabaseUserRole, number> = {
  SA: 9, // Highest
  AD: 8,
  AP: 7,
  IC: 6,
  IP: 5,
  IT: 4,
  IN: 3,
  TL: 2,
  ST: 1  // Lowest
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
