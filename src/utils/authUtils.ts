
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
    // With the trigger in place, we don't need to manually create the profile
    // But we can still send a welcome notification
    const displayName = name || user.email?.split('@')[0] || 'New User';
    
    // Send welcome notification to the new user
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          userId: user.id,
          recipientEmail: user.email,
          recipientName: displayName,
          type: 'WELCOME',
          title: 'Welcome to Assured Response Training Center',
          message: 'Your account has been created successfully. Get started by exploring our training courses and certification options.',
          category: 'ACCOUNT',
          priority: 'NORMAL',
          sendEmail: true,
          actionUrl: `${window.location.origin}/profile`
        }
      });
    } catch (notificationError) {
      console.error('Error sending welcome notification:', notificationError);
      // Don't throw here to prevent blocking account creation
    }
  } catch (error) {
    console.error('Error in setupProfileOnSignUp:', error);
    // Don't throw here as the profile is created by the database trigger
  }
};
