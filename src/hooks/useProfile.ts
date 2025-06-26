
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
    hasUser: !!user
  });

  const result = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      debugLog('useProfile: Starting profile fetch for user:', user?.id);
      
      if (!user?.id) {
        debugLog('useProfile: No user ID provided');
        return null;
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
          
          // If profile doesn't exist, create a basic one
          if (error.code === 'PGRST116') {
            debugLog('useProfile: Profile not found, creating default profile');
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
              throw createError;
            }
            
            debugLog('useProfile: Created new profile:', newProfile);
            return newProfile as Profile;
          }
          
          throw error;
        }

        if (!profile) {
          debugLog('useProfile: No profile found for user:', user.id);
          throw new Error('Profile not found');
        }

        debugLog('useProfile: Successfully fetched profile:', {
          userId: user.id,
          role: profile.role,
          duration: Math.round(duration) + 'ms'
        });
        
        return profile as Profile;
      } catch (error) {
        debugError('useProfile: Unexpected error:', error);
        throw error;
      }
    },
    enabled: !!user?.id && authReady && !authLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry for missing profiles that couldn't be created
      if (error?.code === 'PGRST116') {
        return false;
      }
      // Retry once for other errors
      return failureCount < 1;
    },
    retryDelay: 1000,
  });

  debugLog('useProfile: Query result:', {
    data: !!result.data,
    isLoading: result.isLoading,
    error: !!result.error,
    dataRole: result.data?.role
  });

  return {
    ...result,
    mutate: () => result.refetch()
  } as UseQueryResult<Profile, Error> & { mutate: () => Promise<any> };
}
