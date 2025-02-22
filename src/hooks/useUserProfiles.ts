
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
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*, role_transition_requests!role_transition_requests_user_id_fkey(*)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching profiles:', error);
        throw error;
      }

      console.log('Fetched regular profiles:', data);

      if (systemSettings?.value?.enabled === true) {
        console.log('Test users are enabled, fetching test users...');
        const testUsers = await getTestUsers();
        console.log('Retrieved test users after transform:', testUsers);
        const combinedProfiles = [...data, ...testUsers];
        console.log('Combined profiles with test data:', combinedProfiles);
        return combinedProfiles as Profile[];
      }

      console.log('Test users are disabled, returning only regular profiles');
      return data as Profile[];
    },
    enabled: !!systemSettings,
  });
}
