
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Profile } from '@/types/supabase-schema';
import { prefetchSystemSettings } from '@/hooks/useSystemSettings';
import { User } from '@supabase/supabase-js';

export const handleTestUserSignIn = async (
  email: string,
  password: string,
  settings: { value: { enabled: boolean } } | undefined
) => {
  if (settings?.value?.enabled) {
    const testUsers = await getTestUsers();
    const testUser = testUsers.find(u => 
      u.credentials?.email === email && 
      u.credentials?.password === password
    );
    
    if (testUser) {
      return {
        mockUser: {
          id: testUser.id,
          email: testUser.credentials?.email,
          created_at: testUser.created_at,
          app_metadata: {},
          user_metadata: {
            email: testUser.credentials?.email,
            email_verified: true
          },
          aud: 'authenticated',
          role: testUser.role
        } as User,
        isTestUser: true
      };
    }
  }
  return { mockUser: null, isTestUser: false };
};

export const checkTestUserSignOut = async (
  userEmail: string | undefined,
  settings: { value: { enabled: boolean } } | undefined
) => {
  if (userEmail && settings?.value?.enabled) {
    const testUsers = await getTestUsers();
    return testUsers.some(u => u.credentials?.email === userEmail);
  }
  return false;
};

export const handleSupabaseSignIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const handleSupabaseSignUp = async (email: string, password: string) => {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });
  if (error) throw error;
};

export const handleSupabaseSignOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Helper function to get test users
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
