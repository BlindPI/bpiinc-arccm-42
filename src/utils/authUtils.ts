
import { AuthUserWithProfile, UserProfile, UserRole } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const fetchUserProfile = async (user: User): Promise<UserProfile | null> => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return profile as UserProfile;
  } catch (error) {
    console.error('Error in fetchUserProfile:', error);
    return null;
  }
};

export const getUserWithProfile = async (user: User): Promise<AuthUserWithProfile> => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    // Return combined user and profile data
    return {
      id: user.id,
      email: user.email,
      role: (profile?.role || 'IT') as UserRole,
      display_name: profile?.display_name || user.email?.split('@')[0] || '',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Return minimal user data if profile fetch fails
    return {
      id: user.id,
      email: user.email,
      role: 'IT' as UserRole,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at
    };
  }
};

export const setupProfileOnSignUp = async (user: User, name?: string): Promise<void> => {
  try {
    const displayName = name || user.email?.split('@')[0] || 'New User';
    
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        display_name: displayName,
        role: 'IT' as UserRole
      });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
};
