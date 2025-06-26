
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Profile } from "@/types/supabase-schema";
import { toast } from "sonner";
import { debugLog, debugWarn, debugError } from "@/utils/debugUtils";

export function useProfile() {
  const { user, loading: authLoading, authReady } = useAuth();
  
  debugLog("useProfile: Hook called", {
    userId: user?.id || "none",
    authLoading,
    authReady,
    hasUserProfile: !!user?.profile,
    userProfileData: user?.profile ? { role: user.profile.role, email: user.profile.email } : null
  });

  const result = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      debugLog('useProfile: Starting profile fetch for user:', user?.id);
      
      if (!user?.id) {
        debugLog('useProfile: No user ID provided');
        return null;
      }

      // If user already has profile data, use it but still verify with database
      if (user.profile && user.profile.role) {
        debugLog('useProfile: Using existing user.profile data:', user.profile);
        return user.profile as Profile;
      }

      try {
        debugLog('useProfile: Fetching from profiles table for user:', user.id);
        const startTime = performance.now();
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, role, display_name, email, created_at, updated_at, status, phone, organization, job_title, compliance_tier')
          .eq('id', user.id)
          .single();
          
        const duration = performance.now() - startTime;

        if (error) {
          debugError('useProfile: Error fetching profile:', error.message, error.code);
          
          // If profile doesn't exist, try with maybeSingle
          if (error.code === 'PGRST116') {
            debugLog('useProfile: Profile not found, trying maybeSingle');
            const { data: maybeProfile, error: maybeError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();
            
            if (maybeError) {
              debugError('useProfile: MaybeSingle also failed:', maybeError);
              return null;
            }
            
            if (!maybeProfile) {
              debugLog('useProfile: No profile found for user:', user.id);
              // Create a basic profile if none exists
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: user.id,
                  role: 'IT', // Default role
                  display_name: user.email?.split('@')[0] || 'User',
                  email: user.email,
                  status: 'ACTIVE',
                  compliance_tier: 'basic'
                })
                .select()
                .single();
                
              if (createError) {
                debugError('useProfile: Failed to create profile:', createError);
                return null;
              }
              
              debugLog('useProfile: Created new profile:', newProfile);
              return newProfile as Profile;
            }
            
            debugLog('useProfile: Found profile with maybeSingle');
            return maybeProfile as Profile;
          }
          
          debugError('useProfile: Non-recoverable error:', error);
          return null;
        }

        if (!profile) {
          debugLog('useProfile: No profile found for user:', user.id, 'Duration:', Math.round(duration) + 'ms');
          return null;
        }

        debugLog('useProfile: Successfully fetched profile for user:', user.id, 'Role:', profile.role, 'Duration:', Math.round(duration) + 'ms');
        return profile as Profile;
      } catch (error) {
        debugError('useProfile: Unexpected error:', error);
        return null;
      }
    },
    enabled: !!user?.id && authReady && !authLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry for missing profiles
      if (error?.code === 'PGRST116') {
        return false;
      }
      // Only retry once for other errors
      return failureCount < 1;
    },
    retryDelay: 1000,
    // Make query more resilient by not throwing on error
    throwOnError: false,
  });

  debugLog('useProfile: Query result:', {
    data: !!result.data,
    isLoading: result.isLoading,
    error: !!result.error,
    dataRole: result.data?.role
  });

  // Add the mutate function to the result
  return {
    ...result,
    mutate: () => {
      // This will trigger a refetch of the profile data
      return result.refetch();
    }
  } as UseQueryResult<Profile, Error> & { mutate: () => Promise<any> };
}
