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
