
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/user-management";
import { toast } from "sonner";

export function useProfile(userId?: string | null) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      console.log('useProfile: Starting profile fetch for user:', userId);
      
      if (!userId) {
        console.warn('useProfile: No user ID provided');
        return null;
      }

      try {
        // Try to fetch the existing profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error('useProfile: Error fetching profile:', error);
          throw error;
        }

        // If no profile exists, create one
        if (!profile) {
          console.log('useProfile: No profile found, creating new profile for user:', userId);
          
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([
              { 
                id: userId,
                role: 'IT', // Default role for new users
                created_at: new Date().toISOString()
              }
            ])
            .select()
            .single();

          if (insertError) {
            console.error('useProfile: Error creating profile:', insertError);
            toast.error('Failed to create user profile. Please try again or contact support.');
            throw insertError;
          }

          console.log('useProfile: Successfully created new profile:', newProfile);
          return newProfile as Profile;
        }

        console.log('useProfile: Successfully fetched profile:', profile);
        return profile as Profile;
      } catch (error) {
        console.error('useProfile: Unexpected error:', error);
        toast.error('Error accessing user profile. Please try again or contact support.');
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep unused data in cache for 10 minutes
    retry: 2, // Only retry twice
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000), // Exponential backoff
  });
}
