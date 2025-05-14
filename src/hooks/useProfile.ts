
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Profile } from "@/types/supabase-schema";
import { toast } from "sonner";

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      console.log('useProfile: Starting profile fetch for user:', user?.id);
      
      if (!user?.id) {
        console.warn('useProfile: No user ID provided');
        return null;
      }

      try {
        // Just try to fetch the existing profile
        // With the trigger, profiles are created automatically on signup
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('useProfile: Error fetching profile:', error);
          throw error;
        }

        if (!profile) {
          console.log('useProfile: No profile found for user:', user.id);
          
          // Attempt to create the profile if it doesn't exist
          try {
            // Extract display name from email if available
            const displayName = user.email ? user.email.split('@')[0] : 'New User';
            
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert([{ 
                id: user.id, 
                display_name: displayName,
                role: 'IT', // default role
                email: user.email
              }])
              .select('*')
              .single();
              
            if (createError) {
              console.error('useProfile: Error creating profile:', createError);
              throw createError;
            }
            
            console.log('useProfile: Successfully created profile:', newProfile);
            return newProfile as Profile;
          } catch (createErr) {
            console.error('useProfile: Error creating profile:', createErr);
            throw createErr;
          }
        }

        console.log('useProfile: Successfully fetched profile:', profile);
        return profile as Profile;
      } catch (error) {
        console.error('useProfile: Unexpected error:', error);
        toast.error('Error accessing user profile. Please try again or contact support.');
        throw error;
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
    gcTime: 1000 * 60 * 10, // Keep unused data in cache for 10 minutes
    retry: 2, // Only retry twice
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000), // Exponential backoff
    onSuccess: (data) => {
      // Make user's profile data available throughout the app
      if (data) {
        queryClient.setQueryData(['currentUserProfile'], data);
      }
    }
  });
}
