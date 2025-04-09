
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/supabase-schema';
import { RoleTransitionRequest } from '@/hooks/useRoleTransitions';

/**
 * Get a user's role using the database security function
 * This helps avoid RLS recursion issues
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_user_role', { user_id: userId });
    
    if (error) throw error;
    return data as UserRole;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Check if a user has the required role or higher
 */
export function hasRequiredRole(userRole: UserRole | undefined | null, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  
  const roleHierarchy: { [key in UserRole]: number } = {
    'SA': 5,
    'AD': 4,
    'AP': 3,
    'IC': 2,
    'IP': 1,
    'IT': 0
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Get the next role in the progression
 */
export function getNextRole(currentRole: UserRole): UserRole {
  const roleProgression: { [key in UserRole]: UserRole } = {
    'IT': 'IP',
    'IP': 'IC',
    'IC': 'AP',
    'AP': 'AD',
    'AD': 'SA',
    'SA': 'SA'
  };
  
  return roleProgression[currentRole];
}

/**
 * Check if a user can request an upgrade to a specified role
 */
export function canRequestUpgrade(currentRole: UserRole | undefined | null, targetRole: UserRole): boolean {
  if (!currentRole) return false;
  
  // Get the next role in progression
  const nextRole = getNextRole(currentRole);
  
  // Can only request upgrade to the next role in the progression
  return nextRole === targetRole;
}

/**
 * Check if a user can review a role transition request
 */
export function canReviewRequest(reviewerRole: UserRole | undefined | null, request: RoleTransitionRequest): boolean {
  if (!reviewerRole) return false;
  
  // Determine required role to review based on the target role
  const requiredReviewerRole = getRequiredReviewerRole(request.to_role);
  
  // Check if the reviewer has the required role or higher
  return hasRequiredRole(reviewerRole, requiredReviewerRole);
}

/**
 * Get the required role to review a transition to the specified role
 */
function getRequiredReviewerRole(targetRole: UserRole): UserRole {
  const reviewRequirements: { [key in UserRole]: UserRole } = {
    'IT': 'IC', // Anyone IC or above can review IT transitions
    'IP': 'AP', // AP or above can review IP transitions
    'IC': 'AP', // AP or above can review IC transitions
    'AP': 'AD', // Only AD or SA can review AP transitions
    'AD': 'SA', // Only SA can review AD transitions
    'SA': 'SA'  // SA transitions not allowed
  };
  
  return reviewRequirements[targetRole];
}

/**
 * Filter transition requests for a user
 */
export function filterTransitionRequests(
  requests: RoleTransitionRequest[] | undefined,
  userId: string,
  reviewerFunction: (request: RoleTransitionRequest) => boolean
): {
  pendingRequests: RoleTransitionRequest[];
  userHistory: RoleTransitionRequest[];
  reviewableRequests: RoleTransitionRequest[];
} {
  if (!requests) {
    return {
      pendingRequests: [],
      userHistory: [],
      reviewableRequests: []
    };
  }
  
  // Find pending requests for the current user
  const pendingRequests = requests.filter(
    req => req.user_id === userId && req.status === 'PENDING'
  );
  
  // All requests for the current user (history)
  const userHistory = requests.filter(
    req => req.user_id === userId
  ).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  // Requests that the current user can review (based on their role)
  const reviewableRequests = requests.filter(
    req => req.status === 'PENDING' && 
           req.user_id !== userId && 
           reviewerFunction(req)
  );
  
  return {
    pendingRequests,
    userHistory,
    reviewableRequests
  };
}

/**
 * Get audit requests based on role transitions
 */
export function getAuditRequests(
  requests: RoleTransitionRequest[],
  userRole: UserRole | undefined
): {
  itToIpTransitions: RoleTransitionRequest[];
  ipToIcTransitions: RoleTransitionRequest[];
} {
  const itToIpTransitions = requests.filter(
    req => req.from_role === 'IT' && req.to_role === 'IP'
  );
  
  const ipToIcTransitions = requests.filter(
    req => req.from_role === 'IP' && req.to_role === 'IC'
  );
  
  return {
    itToIpTransitions,
    ipToIcTransitions
  };
}
