
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthUserWithProfile, UserProfile } from '@/types/auth';

export async function getUserWithProfile(user: User): Promise<AuthUserWithProfile> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      // Return user with basic profile
      return {
        id: user.id,
        email: user.email || '',
        display_name: user.email?.split('@')[0] || 'User',
        role: 'IT',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at
      };
    }

    return {
      id: user.id,
      email: user.email || '',
      display_name: profile?.display_name || user.email?.split('@')[0] || 'User',
      role: profile?.role || 'IT',
      profile: profile as UserProfile,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at
    };
  } catch (error) {
    console.error('Error in getUserWithProfile:', error);
    return {
      id: user.id,
      email: user.email || '',
      display_name: user.email?.split('@')[0] || 'User',
      role: 'IT',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at
    };
  }
}

export async function setupProfileOnSignUp(user: User, profileData?: Partial<UserProfile>) {
  try {
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        display_name: profileData?.display_name || user.email?.split('@')[0] || 'User',
        role: profileData?.role || 'IT',
        phone: profileData?.phone,
        organization: profileData?.organization,
        job_title: profileData?.job_title,
        status: 'ACTIVE'
      });

    if (error) {
      console.error('Error setting up profile:', error);
    }
  } catch (error) {
    console.error('Error in setupProfileOnSignUp:', error);
  }
}
