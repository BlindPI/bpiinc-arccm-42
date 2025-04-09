
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";

// Mock test user for development
const createMockUser = (email: string, role: string, displayName: string): User => ({
  id: `mock-${Math.random().toString(36).substring(2, 9)}`,
  email,
  role: role,
  display_name: displayName,
  app_metadata: {},
  user_metadata: { role },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
});

// Check if a user is a test user based on email and system settings
export const isTestUserEmail = (email: string, settings: any[]): boolean => {
  const testUsersSetting = settings?.find((s) => s.key === 'testUsers');
  if (!testUsersSetting) return false;
  
  const testUsers = testUsersSetting.value;
  if (!Array.isArray(testUsers)) return false;
  
  return testUsers.some((u: any) => u.email === email);
};

// Get test user data if it's a valid test user
export const getTestUserData = (email: string, password: string, settings: any[]): any | null => {
  const testUsersSetting = settings?.find((s) => s.key === 'testUsers');
  if (!testUsersSetting) return null;
  
  const testUsers = testUsersSetting.value;
  if (!Array.isArray(testUsers)) return null;
  
  const testUser = testUsers.find((u: any) => 
    u.email === email && u.password === password
  );
  
  return testUser || null;
};

// Handle test user sign-in flow
export const handleTestUserSignIn = async (email: string, password: string, settings: any[]) => {
  const testUser = getTestUserData(email, password, settings);
  
  if (testUser) {
    console.log('Test user login detected:', email);
    
    const mockUser = createMockUser(email, testUser.role, testUser.display_name || email);
    return { 
      mockUser, 
      isTestUser: true 
    };
  }
  
  return { 
    mockUser: null, 
    isTestUser: false 
  };
};

// Check if the current user is a test user during sign-out
export const checkTestUserSignOut = async (email: string | undefined, settings: any[]) => {
  if (!email) return false;
  return isTestUserEmail(email, settings);
};

// Handle real Supabase sign-in
export const handleSupabaseSignIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    console.error('Sign in error:', error.message);
    throw error;
  }
  
  return { 
    session: data.session 
  };
};

// Handle Supabase sign-up
export const handleSupabaseSignUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth`,
    },
  });
  
  if (error) {
    console.error('Sign up error:', error.message);
    throw error;
  }

  if (data.user) {
    toast.success('Registration successful! Please check your email for verification.');
  }
  
  return data;
};

// Handle Supabase sign-out
export const handleSupabaseSignOut = async () => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Sign out error:', error.message);
    throw error;
  }
};
