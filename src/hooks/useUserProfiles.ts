
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/user-management";
import { SystemSettings } from "@/types/user-management";

export const getTestUsers = (): Profile[] => [
  {
    id: 'test-sa',
    role: 'SA',
    created_at: new Date().toISOString(),
    is_test_data: true,
    display_name: "Alex Thompson",
    credentials: {
      email: "test.sa@example.com",
      password: "TestSA123!"
    }
  },
  {
    id: 'test-ad',
    role: 'AD',
    created_at: new Date().toISOString(),
    is_test_data: true,
    display_name: "Sarah Chen",
    credentials: {
      email: "test.ad@example.com",
      password: "TestAD123!"
    }
  },
  {
    id: 'test-ap',
    role: 'AP',
    created_at: new Date().toISOString(),
    is_test_data: true,
    display_name: "Michael Rodriguez",
    credentials: {
      email: "test.ap@example.com",
      password: "TestAP123!"
    }
  },
  {
    id: 'test-ic',
    role: 'IC',
    created_at: new Date().toISOString(),
    is_test_data: true,
    display_name: "Emma Wilson",
    credentials: {
      email: "test.ic@example.com",
      password: "TestIC123!"
    }
  },
  {
    id: 'test-ip',
    role: 'IP',
    created_at: new Date().toISOString(),
    is_test_data: true,
    display_name: "David Park",
    credentials: {
      email: "test.ip@example.com",
      password: "TestIP123!"
    }
  },
  {
    id: 'test-it',
    role: 'IT',
    created_at: new Date().toISOString(),
    is_test_data: true,
    display_name: "Lisa Martinez",
    credentials: {
      email: "test.it@example.com",
      password: "TestIT123!"
    }
  },
];

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
        const testUsers = getTestUsers();
        const combinedProfiles = [...data, ...testUsers];
        console.log('Combined profiles with test data:', combinedProfiles);
        return combinedProfiles as Profile[];
      }

      return data as Profile[];
    },
    enabled: !!systemSettings,
  });
}
