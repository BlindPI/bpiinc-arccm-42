
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Profile } from "@/types/supabase-schema";
import { toast } from "sonner";
import { debugLog, debugWarn, debugError } from "@/utils/debugUtils";

export function useProfile() {
  const { user, loading: authLoading, authReady } = useAuth();
  
  console.log("🔧 useProfile: Hook called", {
    userId: user?.id || "none",
    authLoading,
    authReady,
    hasUserProfile: !!user?.profile,
    userProfileData: user?.profile ? { role: user.profile.role, email: user.profile.email } : null
  });

  const result = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      console.log('🔧 useProfile: Starting profile fetch for user:', user?.id);
      
      if (!user?.id) {
        console.log('🔧 useProfile: No user ID provided');
        return null;
      }

      try {
        console.log('🔧 useProfile: Fetching from profiles table for user:', user.id);
        const startTime = performance.now();
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, role, display_name, email, created_at, updated_at, status, phone, organization, job_title')
          .eq('id', user.id)
          .single();
          
        const duration = performance.now() - startTime;

        if (error) {
          console.error('🔧 useProfile: Error fetching profile:', error.message, error.code);
          
          // If profile doesn't exist, try with maybeSingle
          if (error.code === 'PGRST116') {
            console.log('🔧 useProfile: Profile not found, trying maybeSingle');
            const { data: maybeProfile, error: maybeError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();
            
            if (maybeError) {
              console.error('🔧 useProfile: MaybeSingle also failed:', maybeError);
              return null;
            }
            
            if (!maybeProfile) {
              console.log('🔧 useProfile: No profile found for user:', user.id);
              return null;
            }
            
            console.log('🔧 useProfile: Found profile with maybeSingle');
            return maybeProfile as Profile;
          }
          
          console.error('🔧 useProfile: Non-recoverable error:', error);
          return null;
        }

        if (!profile) {
          console.log('🔧 useProfile: No profile found for user:', user.id, 'Duration:', Math.round(duration) + 'ms');
          return null;
        }

        console.log('🔧 useProfile: Successfully fetched profile for user:', user.id, 'Role:', profile.role, 'Duration:', Math.round(duration) + 'ms');
        return profile as Profile;
      } catch (error) {
        console.error('🔧 useProfile: Unexpected error:', error);
        return null;
      }
    },
    enabled: !!user?.id, // Simplified - just need user ID
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnMount: false, // Don't refetch if we have data
    refetchOnWindowFocus: false, // Don't refetch on window focus
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

  console.log('🔧 useProfile: Query result:', {
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
