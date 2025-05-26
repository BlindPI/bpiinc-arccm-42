
import { UserRole } from "@/lib/roles";

/**
 * Role hierarchy map for determining access levels
 */
export const ROLE_HIERARCHY: { [key in UserRole]: number } = {
  SA: 6, // System Admin (highest)
  AD: 5, // Admin
  AP: 4, // Authorized Provider
  IC: 3, // Instructor Certified
  IP: 2, // Instructor Provisional
  IT: 1, // Instructor Trainee
  IN: 0, // Instructor New (lowest)
};

/**
 * Check if a user has the required minimum role level
 */
export const hasRequiredRole = (
  userRole: UserRole | undefined,
  requiredRole: UserRole
): boolean => {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

/**
 * Map of role progression paths
 */
export const ROLE_PROGRESSION: { [key in UserRole]: UserRole } = {
  SA: "SA", // System Admin stays the same
  AD: "SA", // Admin progresses to System Admin
  AP: "AD", // Authorized Provider progresses to Admin
  IC: "AP", // Instructor Certified progresses to Authorized Provider
  IP: "IC", // Instructor Provisional progresses to Instructor Certified
  IT: "IP", // Instructor Trainee progresses to Instructor Provisional
  IN: "IT", // Instructor New progresses to Instructor Trainee
};

/**
 * Map of role fast track progression paths (skipping levels)
 */
export const ROLE_FAST_TRACK: { [key in UserRole]: UserRole } = {
  SA: "SA", // System Admin stays the same
  AD: "SA", // Admin fast tracks to System Admin
  AP: "AD", // Authorized Provider fast tracks to Admin
  IC: "AP", // Instructor Certified fast tracks to Authorized Provider
  IP: "AP", // Instructor Provisional fast tracks to Authorized Provider
  IT: "IC", // Instructor Trainee fast tracks to Instructor Certified
  IN: "IT", // Instructor New fast tracks to Instructor Trainee
};

/**
 * Get the next role in progression path
 */
export const getNextRole = (currentRole: UserRole): UserRole => {
  return ROLE_PROGRESSION[currentRole];
};

/**
 * Check if a user can request an upgrade to a specific role
 */
export const canRequestUpgrade = (
  currentRole: UserRole | undefined,
  toRole: UserRole
): boolean => {
  if (!currentRole) return false;
  return ROLE_PROGRESSION[currentRole] === toRole;
};

/**
 * Check if a user can review a transition request based on their role
 */
export const canReviewRequest = (
  reviewerRole: UserRole | undefined,
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
 * Filter transition requests into different categories
 */
export const filterTransitionRequests = (
  requests: any[],
  userId: string,
  canReviewFn: (request: any) => boolean
) => {
  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const userHistory = requests.filter(r => r.user_id === userId);
  const reviewableRequests = pendingRequests.filter(r => canReviewFn(r));

  return {
    pendingRequests,
    userHistory,
    reviewableRequests,
  };
};

/**
 * Get audit requests based on pending requests and role
 */
export const getAuditRequests = (
  pendingRequests: any[],
  userRole: UserRole | undefined
) => {
  const itToIpTransitions = pendingRequests.filter(
    r => r.from_role === 'IT' && r.to_role === 'IP'
  );
  
  const ipToIcTransitions = pendingRequests.filter(
    r => r.from_role === 'IP' && r.to_role === 'IC'
  );

  return {
    itToIpTransitions,
    ipToIcTransitions,
  };
};

