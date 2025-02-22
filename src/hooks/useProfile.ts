
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Profile } from "@/types/user-management";

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('useProfile: No user ID available, skipping fetch');
        return null;
      }

      console.log('useProfile: Starting profile fetch using Supabase for user:', user.id);
      console.log('useProfile: Supabase client URL:', supabase.supabaseUrl);
      
      // Fetch profile directly without session check since Supabase client handles auth
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('useProfile: Supabase error:', error);
        throw error;
      }

      if (!profile) {
        console.log('useProfile: No profile found for user:', user.id);
        return null;
      }

      console.log('useProfile: Successfully fetched profile:', profile);
      return profile as Profile;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep unused data in cache for 10 minutes
    retry: 1, // Only retry once
    retryDelay: 1000, // Wait 1 second before retrying
  });
}
