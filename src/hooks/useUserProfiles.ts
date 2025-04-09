
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/supabase-schema";

export function useUserProfiles(isTestDataEnabled?: boolean) {
  return useQuery({
    queryKey: ['profiles', isTestDataEnabled],
    queryFn: async () => {
      console.log('useUserProfiles: Starting query with testDataEnabled:', isTestDataEnabled);
      
      try {
        let profiles: Profile[] = [];

        // If test data is enabled, fetch test users first
        if (isTestDataEnabled === true) {
          console.log('Test users are enabled, fetching test users...');
          const testUsers = await getTestUsers();
          profiles = [...testUsers];
        }

        // Always try to fetch regular profiles
        const { data, error } = await supabase
          .from('profiles')
          .select('*');

        if (error) {
          console.error('Error fetching profiles:', error);
          // If we have test users, return those instead of throwing
          return profiles.length > 0 ? profiles : [];
        }

        if (data) {
          profiles = [...profiles, ...(data as Profile[])];
        }

        console.log('Returning profiles, count:', profiles.length);
        return profiles;
      } catch (error) {
        console.error('Unexpected error in useUserProfiles:', error);
        return []; // Return empty array as fallback
      }
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep unused data in cache for 10 minutes
    retry: 2, // Only retry twice
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000), // Exponential backoff
  });
}

// Function to get test users
const getTestUsers = async (): Promise<Profile[]> => {
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
    
    return testUsers.map(user => ({
      id: user.id,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at || user.created_at,
      is_test_data: true,
      display_name: user.display_name,
      credentials: {
        email: user.email,
        password: user.password
      }
    })) as Profile[];
  } catch (error) {
    console.error('Unexpected error fetching test users:', error);
    return [];
  }
};
