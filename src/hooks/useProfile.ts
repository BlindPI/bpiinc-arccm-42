
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
        console.warn('🔍 DEBUG: useProfile: No user ID provided, auth loading:', authLoading);
        return null;
      }

      try {
        console.log('🔍 DEBUG: useProfile: Fetching from profiles table for user:', user.id);
        const startTime = performance.now();
        
        // Use a more focused query for better performance
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, role, display_name, email, created_at, updated_at, status, phone, organization, job_title')
          .eq('id', user.id)
          .single();
          
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
              throw maybeError;
            }
            
            if (!maybeProfile) {
              console.log('🔍 DEBUG: useProfile: No profile found for user:', user.id);
              return null;
            }
            
            console.log('🔍 DEBUG: useProfile: Found profile with maybeSingle:', maybeProfile);
            return maybeProfile as Profile;
          }
          
          throw error;
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
        console.error('🔍 DEBUG: useProfile: Unexpected error:', error);
        toast.error('Error accessing user profile. Please try refreshing the page.');
        throw error;
      }
    },
    enabled: !!user?.id && authReady && !authLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes - cache profile data
    gcTime: 1000 * 60 * 10, // Keep unused data in cache for 10 minutes
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors, but not for missing profiles
      if (error.code === 'PGRST116') {
        return false; // Don't retry for missing profiles
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 5000), // Exponential backoff
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
