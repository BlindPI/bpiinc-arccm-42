
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/supabase-schema';

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
