
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/user-management";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useProfile() {
  const { user, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('useProfile: No user ID available, skipping fetch');
        return null;
      }

      console.log('useProfile: Starting profile fetch for user:', user.id);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('useProfile: Supabase error:', error);
          toast.error('Failed to load profile');
          throw error;
        }

        if (!data) {
          console.log('useProfile: No profile found for user:', user.id);
          return null;
        }

        console.log('useProfile: Successfully fetched profile:', data);
        return data as Profile;
      } catch (error) {
        console.error('useProfile: Unexpected error:', error);
        toast.error('An unexpected error occurred while loading profile');
        throw error;
      }
    },
    enabled: !authLoading && !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep unused data in cache for 10 minutes
    retry: 1, // Only retry once
    retryDelay: 1000, // Wait 1 second before retrying
  });
}
