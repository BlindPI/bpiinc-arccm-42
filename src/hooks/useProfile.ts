
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/supabase-schema";
import { toast } from "sonner";

export function useProfile() {
  // First, get the current session directly from Supabase
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      console.log('🔍 DEBUG: useProfile: Starting profile fetch',
        "Timestamp:", new Date().toISOString());
      
      try {
        // Get the session directly from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user?.id) {
          console.warn('🔍 DEBUG: useProfile: No user session found');
          return null;
        }
        
        const userId = session.user.id;
        console.log('🔍 DEBUG: useProfile: Fetching from profiles table for user:', userId);
        const startTime = performance.now();
        
        // Fetch the profile using the session user ID
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
          
        const duration = performance.now() - startTime;

        if (error) {
          console.error('🔍 DEBUG: useProfile: Error fetching profile:', error.message, error.code);
          throw error;
        }

        if (!profile) {
          console.log('🔍 DEBUG: useProfile: No profile found for user:', userId,
            "Duration:", Math.round(duration) + "ms");
          return null;
        }

        console.log('🔍 DEBUG: useProfile: Successfully fetched profile:',
          "User:", userId,
          "Role:", profile.role,
          "Duration:", Math.round(duration) + "ms");
        return profile as Profile;
      } catch (error) {
        console.error('🔍 DEBUG: useProfile: Unexpected error:', error);
        toast.error('Error accessing user profile. Please try again or contact support.');
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep unused data in cache for 10 minutes
    retry: 2, // Only retry twice
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000), // Exponential backoff
  });
}
