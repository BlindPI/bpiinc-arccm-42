
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

// Enhanced profile fetching with retry logic and better timeout handling
export const fetchUserProfileWithRetry = async (user: User, maxRetries: number = 3): Promise<UserProfile | null> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 DEBUG: Profile fetch attempt ${attempt}/${maxRetries} for user:`, user.id);
      
      // Use a simpler, faster query first
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, role, display_name, email, created_at, updated_at, status')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error(`🔍 DEBUG: Profile fetch attempt ${attempt} failed:`, error);
        
        // If it's the last attempt, try with maybeSingle in case profile doesn't exist
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
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
        continue;
      }

      console.log(`🔍 DEBUG: Profile fetch attempt ${attempt} succeeded:`, profile);
      return profile as UserProfile;
    } catch (error) {
      console.error(`🔍 DEBUG: Profile fetch attempt ${attempt} threw error:`, error);
      
      if (attempt === maxRetries) {
        return null;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
    }
  }
  
  return null;
};

export const getUserWithProfile = async (user: User): Promise<AuthUserWithProfile> => {
  console.log("🔍 DEBUG: getUserWithProfile called for user:", user.id);
  
  // Set a longer timeout to prevent premature fallbacks
  const timeoutPromise = new Promise<AuthUserWithProfile>((_, reject) => {
    setTimeout(() => {
      reject(new Error("Profile fetch timeout after 10 seconds"));
    }, 10000); // Increased from 3 to 10 seconds
  });
  
  // Create the actual fetch promise with retry logic
  const fetchPromise = (async () => {
    try {
      console.log("🔍 DEBUG: Fetching profile with retry logic for user:", user.id);
      const startTime = performance.now();
      
      const profile = await fetchUserProfileWithRetry(user, 3);
      
      const duration = performance.now() - startTime;
      
      if (profile) {
        console.log("🔍 DEBUG: Profile fetch successful:",
          "Duration:", Math.round(duration) + "ms",
          "Role:", profile.role);

        // Return combined user and profile data
        const result = {
          id: user.id,
          email: user.email,
          role: (profile.role || 'IT') as UserRole,
          display_name: profile.display_name || user.email?.split('@')[0] || '',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at
        };
        
        console.log("🔍 DEBUG: Returning user with profile:", result.id, result.role);
        return result;
      } else {
        console.warn("🔍 DEBUG: Profile not found, using fallback");
        
        // Return minimal user data if profile fetch fails
        const fallbackUser = {
          id: user.id,
          email: user.email,
          role: 'IT' as UserRole, // Default fallback role
          display_name: user.email?.split('@')[0] || 'User',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at
        };
        
        console.log("🔍 DEBUG: Returning fallback user data");
        return fallbackUser;
      }
    } catch (error) {
      console.error('🔍 DEBUG: Error fetching user profile:', error);
      
      // Return minimal user data on error
      const fallbackUser = {
        id: user.id,
        email: user.email,
        role: 'IT' as UserRole,
        display_name: user.email?.split('@')[0] || 'User',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at
      };
      
      console.log("🔍 DEBUG: Returning fallback user data due to error");
      return fallbackUser;
    }
  })();
  
  // Race the fetch against the timeout
  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    console.error('🔍 DEBUG: Profile fetch timed out or failed:', error);
    
    // Return minimal user data on timeout
    const fallbackUser = {
      id: user.id,
      email: user.email,
      role: 'IT' as UserRole,
      display_name: user.email?.split('@')[0] || 'User',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at
    };
    
    console.log("🔍 DEBUG: Returning fallback user data due to timeout");
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
