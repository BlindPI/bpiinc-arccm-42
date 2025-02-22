
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/user-management";
import { SystemSettings } from "@/types/user-management";

export const getTestUsers = async (): Promise<Profile[]> => {
  const { data: testUsers, error } = await supabase
    .from('test_users')
    .select('*');

  if (error) {
    console.error('Error fetching test users:', error);
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

export function useUserProfiles(systemSettings?: SystemSettings | undefined) {
  return useQuery({
    queryKey: ['profiles', systemSettings?.value?.enabled],
    queryFn: async () => {
      console.log('Fetching profiles');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*, role_transition_requests!role_transition_requests_user_id_fkey(*)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching profiles:', error);
        throw error;
      }

      console.log('Fetched profiles:', data);

      if (systemSettings?.value?.enabled === true) {
        console.log('Adding test users to profiles');
        const testUsers = await getTestUsers();
        const combinedProfiles = [...data, ...testUsers];
        console.log('Combined profiles with test data:', combinedProfiles);
        return combinedProfiles as Profile[];
      }

      return data as Profile[];
    },
    enabled: !!systemSettings,
  });
}
