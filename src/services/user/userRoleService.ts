
import { supabase } from '@/integrations/supabase/client';

export interface UserRoleInfo {
  id: string;
  role: string;
  canInviteUsers: boolean;
}

export class UserRoleService {
  static async getCurrentUserRole(): Promise<UserRoleInfo | null> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('🔍 DEBUG: Auth error or no user:', authError);
        return null;
      }

      console.log('🔍 DEBUG: Current auth user ID:', user.id);

      // Get user's role from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('🔍 DEBUG: Profile error:', profileError);
        return null;
      }

      if (!profile) {
        console.error('🔍 DEBUG: No profile found for user');
        return null;
      }

      console.log('🔍 DEBUG: User profile:', profile);

      const canInviteUsers = ['SA', 'AD'].includes(profile.role);
      
      return {
        id: profile.id,
        role: profile.role,
        canInviteUsers
      };
    } catch (error) {
      console.error('🔍 DEBUG: Error getting user role:', error);
      return null;
    }
  }

  static async checkInvitationPermissions(): Promise<{ canInvite: boolean; reason?: string }> {
    const userRole = await this.getCurrentUserRole();
    
    if (!userRole) {
      return { canInvite: false, reason: 'User not authenticated or no profile found' };
    }

    if (!userRole.canInviteUsers) {
      return { canInvite: false, reason: `Role '${userRole.role}' does not have permission to invite users` };
    }

    return { canInvite: true };
  }
}
