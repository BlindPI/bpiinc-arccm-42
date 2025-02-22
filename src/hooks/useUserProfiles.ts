
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/user-management";

export const getTestUsers = async (): Promise<Profile[]> => {
  const { data: testUsers, error } = await supabase
    .from('test_users')
    .select('*');

  if (error) {
    console.error('Error fetching test users:', error);
    return [];
  }

  if (!testUsers?.length) {
    return [];
  }

  return testUsers.map(user => ({
    id: user.id,
    role: user.role,
    created_at: user.created_at,
    is_test_data: true,
    display_name: user.display_name,
    credentials: {
      email: user.email,
      password: user.password
    }
  }));
};

export function useUserProfiles(isTestDataEnabled?: boolean, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['profiles', isTestDataEnabled],
    queryFn: async () => {
      try {
        let profiles: Profile[] = [];

        // Fetch test users if enabled
        if (isTestDataEnabled) {
          const testUsers = await getTestUsers();
          profiles = [...testUsers];
        }

        // Fetch regular profiles
        const { data, error } = await supabase
          .from('profiles')
          .select('*, role_transition_requests!role_transition_requests_user_id_fkey(*)')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          profiles = [...profiles, ...data];
        }

        return profiles;
      } catch (error) {
        console.error('Error in useUserProfiles:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
    ...options,
  });
}
