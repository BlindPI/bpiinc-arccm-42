
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/user-management";
import { SystemSettings } from "@/types/user-management";

export const getTestUsers = async (): Promise<Profile[]> => {
  console.log('Fetching test users...');
  const { data: testUsers, error } = await supabase
    .from('test_users')
    .select('*');

  if (error) {
    console.error('Error fetching test users:', error);
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
};

export function useUserProfiles(systemSettings?: SystemSettings | undefined) {
  return useQuery({
    queryKey: ['profiles', systemSettings?.value?.enabled],
    queryFn: async () => {
      console.log('useUserProfiles: Starting query with systemSettings:', systemSettings);
      
      try {
        // If test data is enabled, fetch test users first
        if (systemSettings?.value?.enabled === true) {
          console.log('Test users are enabled, fetching test users...');
          const testUsers = await getTestUsers();
          console.log('Retrieved test users after transform:', testUsers);
          
          // If we get test users, we can return them even if regular profiles fail
          if (testUsers.length > 0) {
            try {
              // Try to fetch regular profiles
              const { data, error } = await supabase
                .from('profiles')
                .select('*, role_transition_requests!role_transition_requests_user_id_fkey(*)')
                .order('created_at', { ascending: false });

              if (!error && data) {
                // If successful, combine both
                const combinedProfiles = [...data, ...testUsers];
                console.log('Combined profiles with test data:', combinedProfiles);
                return combinedProfiles as Profile[];
              }
            } catch (error) {
              console.error('Error fetching regular profiles:', error);
            }
            
            // If regular profiles fail, still return test users
            console.log('Returning only test users');
            return testUsers;
          }
        }

        // If not test users or test users failed, try regular profiles
        const { data, error } = await supabase
          .from('profiles')
          .select('*, role_transition_requests!role_transition_requests_user_id_fkey(*)')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching profiles:', error);
          return []; // Return empty array instead of throwing
        }

        console.log('Returning only regular profiles');
        return data as Profile[];
      } catch (error) {
        console.error('Unexpected error in useUserProfiles:', error);
        return []; // Return empty array instead of throwing
      }
    },
    // Allow queries to run even if systemSettings is undefined
    staleTime: 1000 * 60, // Cache for 1 minute
  });
}
