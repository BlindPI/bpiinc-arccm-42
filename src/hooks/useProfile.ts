
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Profile } from "@/types/supabase-schema";
import { toast } from "sonner";
import { debugLog, debugWarn, debugError } from "@/utils/debugUtils";

export function useProfile() {
  const { user, loading: authLoading, authReady } = useAuth();
  
  debugLog("useProfile hook called", {
    userId: user?.id || "none",
    authLoading,
    authReady
  });

  const result = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      debugLog('useProfile: Starting profile fetch for user:', user?.id);
      
      if (!user?.id) {
        debugWarn('useProfile: No user ID provided');
        return null;
      }

      try {
        debugLog('useProfile: Fetching from profiles table for user:', user.id);
        const startTime = performance.now();
        
        // Use AbortController for timeout control
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          debugWarn('useProfile: Query timeout after 5 seconds');
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
              return null;
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
        if (error.name === 'AbortError') {
          debugWarn('useProfile: Query was aborted due to timeout');
          return null;
        }
        debugError('useProfile: Unexpected error:', error);
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
