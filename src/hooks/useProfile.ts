
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      console.log('useProfile: Starting profile fetch for user:', user?.id);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, role, created_at, updated_at, compliance_status, compliance_notes, last_compliance_check')
        .eq('id', user?.id)
        .maybeSingle();
      
      if (error) {
        console.error('useProfile: Error fetching profile:', error);
        throw error;
      }
      
      if (!profile) {
        console.warn('useProfile: No profile found for user:', user?.id);
      } else {
        console.log('useProfile: Successfully fetched profile:', profile);
      }
      
      return profile;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 2,
  });
}
