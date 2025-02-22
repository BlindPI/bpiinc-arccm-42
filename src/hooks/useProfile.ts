
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      console.log('useProfile: Starting profile fetch for user:', user?.id);
      
      if (!user?.id) {
        console.warn('useProfile: No user ID provided');
        return null;
      }

      // First get the role using the RPC function
      const { data: role, error: roleError } = await supabase.rpc('get_user_role', {
        user_id: user.id
      });
      
      if (roleError) {
        console.error('useProfile: Error fetching role:', roleError);
        throw roleError;
      }

      // Then fetch other profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, created_at, updated_at, compliance_status, compliance_notes, last_compliance_check')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error('useProfile: Error fetching profile data:', profileError);
        throw profileError;
      }
      
      const profile = {
        ...profileData,
        role
      };

      console.log('useProfile: Successfully fetched profile:', profile);
      return profile;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 2,
  });
}
