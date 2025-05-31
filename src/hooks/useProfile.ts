
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Profile } from "@/types/supabase-schema";
import { toast } from "sonner";

export function useProfile() {
  const { user, loading: authLoading, authReady } = useAuth();
  
  console.log("🔍 DEBUG: useProfile hook called",
    "User:", user?.id || "none",
    "Auth loading:", authLoading,
    "Auth ready:", authReady);

  const result = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      console.log('🔍 DEBUG: useProfile: Starting profile fetch for user:', user?.id,
        "Timestamp:", new Date().toISOString());
      
      if (!user?.id) {
        console.warn('🔍 DEBUG: useProfile: No user ID provided');
        return null;
      }

      try {
        console.log('🔍 DEBUG: useProfile: Fetching from profiles table for user:', user.id);
        const startTime = performance.now();
        
        // Use AbortController for timeout control
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.warn('🔍 DEBUG: useProfile: Query timeout after 5 seconds');
          controller.abort();
        }, 5000);
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, role, display_name, email, created_at, updated_at, status, phone, organization, job_title')
          .eq('id', user.id)
          .abortSignal(controller.signal)
          .single();
          
        clearTimeout(timeoutId);
        const duration = performance.now() - startTime;

        if (error) {
          console.error('🔍 DEBUG: useProfile: Error fetching profile:', error.message, error.code);
          
          // If profile doesn't exist, try with maybeSingle
          if (error.code === 'PGRST116') {
            console.log('🔍 DEBUG: useProfile: Profile not found, trying maybeSingle');
            const { data: maybeProfile, error: maybeError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();
            
            if (maybeError) {
              console.error('🔍 DEBUG: useProfile: MaybeSingle also failed:', maybeError);
              // Don't throw - let the query handle the error gracefully
              return null;
            }
            
            if (!maybeProfile) {
              console.log('🔍 DEBUG: useProfile: No profile found for user:', user.id);
              return null;
            }
            
            console.log('🔍 DEBUG: useProfile: Found profile with maybeSingle:', maybeProfile);
            return maybeProfile as Profile;
          }
          
          // For other errors, don't throw - let React Query handle retry logic
          console.error('🔍 DEBUG: useProfile: Non-recoverable error:', error);
          return null;
        }

        if (!profile) {
          console.log('🔍 DEBUG: useProfile: No profile found for user:', user.id,
            "Duration:", Math.round(duration) + "ms");
          return null;
        }

        console.log('🔍 DEBUG: useProfile: Successfully fetched profile:',
          "User:", user.id,
          "Role:", profile.role,
          "Duration:", Math.round(duration) + "ms");
        return profile as Profile;
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn('🔍 DEBUG: useProfile: Query was aborted due to timeout');
          return null;
        }
        console.error('🔍 DEBUG: useProfile: Unexpected error:', error);
        // Don't show toast for profile errors to avoid spam
        return null;
      }
    },
    enabled: !!user?.id && authReady && !authLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry for missing profiles or aborted requests
      if (error?.code === 'PGRST116' || error?.name === 'AbortError') {
        return false;
      }
      // Only retry twice for other errors
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 3000),
    // Make query more resilient by not throwing on error
    throwOnError: false,
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
