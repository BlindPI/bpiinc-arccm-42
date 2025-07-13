
import type { DatabaseUserRole } from "@/types/database-roles";

/**
 * Role hierarchy map for determining access levels
 */
export const ROLE_HIERARCHY: { [key in DatabaseUserRole]: number } = {
  SA: 7, // System Admin (highest)
  AD: 6, // Admin
  AP: 5, // Authorized Provider
  IC: 4, // Instructor Certified
  IP: 3, // Instructor Provisional
  IT: 2, // Instructor Trainee
  IN: 1, // Instructor New (lowest)
};

/**
 * Check if a user has the required minimum role level
 */
export const hasRequiredRole = (
  userRole: DatabaseUserRole | undefined,
  requiredRole: DatabaseUserRole
): boolean => {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

/**
 * Map of role progression paths
 */
export const ROLE_PROGRESSION: { [key in DatabaseUserRole]: DatabaseUserRole } = {
  SA: "SA", // System Admin stays the same
  AD: "SA", // Admin progresses to System Admin
  AP: "AD", // Authorized Provider progresses to Admin
  IC: "AP", // Instructor Certified progresses to Authorized Provider
  IP: "IC", // Instructor Provisional progresses to Instructor Certified
  IT: "IP", // Instructor Trainee progresses to Instructor Provisional
  IN: "IT", // Instructor New progresses to Instructor Trainee
};

/**
 * Get the next role in progression path
 */
export const getNextRole = (currentRole: DatabaseUserRole): DatabaseUserRole => {
  return ROLE_PROGRESSION[currentRole];
};

/**
 * Check if a user can request an upgrade to a specific role
 */
export const canRequestUpgrade = (
  currentRole: DatabaseUserRole | undefined,
  toRole: DatabaseUserRole
): boolean => {
  if (!currentRole) return false;
  return ROLE_PROGRESSION[currentRole] === toRole;
};

/**
 * Check if a user can review a transition request based on their role
 */
export const canReviewRequest = (
  reviewerRole: DatabaseUserRole | undefined,
  request: any
): boolean => {
  if (!reviewerRole) return false;
  
  // Only SA and AD roles can review requests
  if (reviewerRole !== 'SA' && reviewerRole !== 'AD') return false;
  
  // System Admin can review all requests
  if (reviewerRole === 'SA') return true;
  
  // Admins can review requests except for AD->SA transitions
  if (request.from_role === 'AD' && request.to_role === 'SA') return false;
  
  return true;
};

/**
 * Check if user can create teams (SA/AD only)
 */
export const canCreateTeams = (role: DatabaseUserRole | undefined): boolean => {
  if (!role) return false;
  return role === 'SA' || role === 'AD';
};

/**
 * Get team management permissions based on role
 */
export const getTeamManagementPermissions = (role: DatabaseUserRole | undefined) => {
  if (!role) return { canCreate: false, canEdit: false, canDelete: false, canManageMembers: false };
  
  const hierarchy = ROLE_HIERARCHY[role];
  
  return {
    canCreate: canCreateTeams(role), // Only SA and AD can create teams
    canEdit: hierarchy >= ROLE_HIERARCHY['AP'],
    canDelete: hierarchy >= ROLE_HIERARCHY['AD'], // AD and above
    canManageMembers: hierarchy >= ROLE_HIERARCHY['AP']
  };
};

/**
 * Check if user has enterprise features access
 */
export const hasEnterpriseFeatures = (role: DatabaseUserRole | undefined): boolean => {
  if (!role) return false;
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY['AP'];
};
