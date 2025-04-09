
import { AuthUserWithProfile, UserProfile } from '@/types/auth';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export const fetchUserProfile = async (user: User): Promise<UserProfile | null> => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return profile;
  } catch (error) {
    console.error('Error in fetchUserProfile:', error);
    return null;
  }
};

export const getUserWithProfile = async (user: User): Promise<AuthUserWithProfile | null> => {
  if (!user) return null;
  
  const profile = await fetchUserProfile(user);
  
  if (!profile) return null;
  
  return {
    id: user.id,
    email: user.email,
    role: profile.role,
    display_name: profile.display_name || undefined
  };
};

export const setupProfileOnSignUp = async (user: User, name?: string): Promise<void> => {
  try {
    const displayName = name || user.email?.split('@')[0] || 'New User';
    
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        display_name: displayName,
        role: 'IT'
      });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
};
