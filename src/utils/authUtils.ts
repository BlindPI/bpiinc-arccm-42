
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getTestUsers } from '@/hooks/useUserProfiles';
import { prefetchSystemSettings } from '@/hooks/useSystemSettings';
import { User } from '@supabase/supabase-js';

export const handleTestUserSignIn = async (
  email: string,
  password: string,
  settings: any
) => {
  if (settings?.value?.enabled) {
    const testUsers = await getTestUsers();
    const testUser = testUsers.find(u => 
      u.credentials.email === email && 
      u.credentials.password === password
    );
    
    if (testUser) {
      return {
        mockUser: {
          id: testUser.id,
          email: testUser.credentials.email,
          created_at: testUser.created_at,
          app_metadata: {},
          user_metadata: {
            email: testUser.credentials.email,
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
  settings: any
) => {
  if (userEmail && settings?.value?.enabled) {
    const testUsers = await getTestUsers();
    return testUsers.some(u => u.credentials.email === userEmail);
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
