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

// Enhanced profile fetching with faster timeout and better error handling
export const fetchUserProfileWithRetry = async (user: User, maxRetries: number = 2): Promise<UserProfile | null> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 DEBUG: Profile fetch attempt ${attempt}/${maxRetries} for user:`, user.id);
      
      // Use AbortController for timeout control
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout per attempt
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, role, display_name, email, created_at, updated_at, status')
        .eq('id', user.id)
        .abortSignal(controller.signal)
        .single();

      clearTimeout(timeoutId);

      if (error) {
        console.error(`🔍 DEBUG: Profile fetch attempt ${attempt} failed:`, error);
        
        // If it's the last attempt, try with maybeSingle
        if (attempt === maxRetries) {
          const { data: fallbackProfile, error: fallbackError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          
          if (fallbackError) {
            console.error('🔍 DEBUG: Fallback profile fetch also failed:', fallbackError);
            return null;
          }
          
          return fallbackProfile as UserProfile;
        }
        
        // Shorter wait between retries
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        continue;
      }

      console.log(`🔍 DEBUG: Profile fetch attempt ${attempt} succeeded:`, profile);
      return profile as UserProfile;
    } catch (error) {
      console.error(`🔍 DEBUG: Profile fetch attempt ${attempt} threw error:`, error);
      
      if (attempt === maxRetries) {
        return null;
      }
      
      // Shorter wait between retries
      await new Promise(resolve => setTimeout(resolve, 500 * attempt));
    }
  }
  
  return null;
};

// More resilient getUserWithProfile that never throws and always returns a valid user
export const getUserWithProfile = async (user: User): Promise<AuthUserWithProfile> => {
  console.log("🔍 DEBUG: getUserWithProfile called for user:", user.id);
  
  // Create fallback user immediately
  const fallbackUser: AuthUserWithProfile = {
    id: user.id,
    email: user.email,
    role: 'IT' as UserRole,
    display_name: user.email?.split('@')[0] || 'User',
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at
  };
  
  try {
    console.log("🔍 DEBUG: Attempting to fetch profile with timeout");
    
    // Use a Promise.race with shorter timeout for resilience
    const profilePromise = fetchUserProfileWithRetry(user, 2);
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.warn("🔍 DEBUG: Profile fetch timeout - using fallback");
        resolve(null);
      }, 3000); // 3 second total timeout
    });
    
    const profile = await Promise.race([profilePromise, timeoutPromise]);
    
    if (profile) {
      console.log("🔍 DEBUG: Profile fetch successful, enhancing user object");
      
      return {
        ...fallbackUser,
        role: (profile.role || 'IT') as UserRole,
        display_name: profile.display_name || fallbackUser.display_name,
        // Add any other profile fields as needed
      };
    } else {
      console.log("🔍 DEBUG: Profile fetch failed or timed out, using fallback user");
      return fallbackUser;
    }
  } catch (error) {
    console.warn('🔍 DEBUG: Error in getUserWithProfile, using fallback:', error);
    return fallbackUser;
  }
};

export const setupProfileOnSignUp = async (user: User, profileData?: Partial<UserProfile> | string): Promise<void> => {
  try {
    console.log("🔍 DEBUG: setupProfileOnSignUp called for user:", user.id);
    console.log("🔍 DEBUG: setupProfileOnSignUp profile data:", profileData);
    
    // With the trigger in place, we don't need to manually create the profile
    // But we can still send a welcome notification
    let displayName: string;
    
    if (typeof profileData === 'string') {
      displayName = profileData || user.email?.split('@')[0] || 'New User';
    } else {
      displayName = profileData?.display_name || user.email?.split('@')[0] || 'New User';
    }
    
    console.log("🔍 DEBUG: setupProfileOnSignUp sending welcome notification to:", user.email);
    
    // Send welcome notification to the new user
    try {
      const { data, error } = await supabase.functions.invoke('send-notification', {
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
      
      if (error) {
        console.error('🔍 DEBUG: Error sending welcome notification:', error);
      } else {
        console.log('🔍 DEBUG: Welcome notification sent successfully:', data);
      }
    } catch (notificationError) {
      console.error('🔍 DEBUG: Error sending welcome notification:', notificationError);
      // Don't throw here to prevent blocking account creation
    }
  } catch (error) {
    console.error('🔍 DEBUG: Error in setupProfileOnSignUp:', error);
    // Don't throw here as the profile is created by the database trigger
  }
};
