
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/user-management";

export const getTestUsers = async (): Promise<Profile[]> => {
  console.log('Fetching test users...');
  try {
    const { data: testUsers, error } = await supabase
      .from('test_users')
      .select('*');

    if (error) {
      console.error('Error fetching test users:', error);
      return [];
    }

    if (!testUsers) {
      console.log('No test users found');
      return [];
    }

    console.log('Retrieved test users:', testUsers);
    
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
  } catch (error) {
    console.error('Unexpected error fetching test users:', error);
    return [];
  }
};

type UseUserProfilesOptions = {
  enabled?: boolean;
};

export function useUserProfiles(isTestDataEnabled?: boolean, options: UseUserProfilesOptions = {}) {
  return useQuery({
    queryKey: ['profiles', isTestDataEnabled],
    queryFn: async () => {
      console.log('useUserProfiles: Starting query with testDataEnabled:', isTestDataEnabled);
      
      try {
        let profiles: Profile[] = [];

        if (isTestDataEnabled === true) {
          console.log('Test users are enabled, fetching test users...');
          const testUsers = await getTestUsers();
          console.log('Retrieved test users after transform:', testUsers);
          profiles = [...testUsers];
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*, role_transition_requests!role_transition_requests_user_id_fkey(*)')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching profiles:', error);
          return profiles.length > 0 ? profiles : [];
        }

        if (data) {
          profiles = [...profiles, ...data];
        }

        console.log('Returning profiles, count:', profiles.length);
        return profiles as Profile[];
      } catch (error) {
        console.error('Unexpected error in useUserProfiles:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep unused data in cache for 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000),
    ...options,
  });
}
