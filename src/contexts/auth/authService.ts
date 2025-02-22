
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getTestUsers } from '@/utils/testUsers';
import { User } from '@supabase/supabase-js';
import { AuthState } from './types';

export const authService = {
  async signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    
    if (error) throw error;
    
    toast.success('Registration successful! Please check your email for verification.');
  },

  async signIn(
    email: string, 
    password: string, 
    systemSettings: any,
    setAuthState: (state: AuthState) => void
  ) {
    // Handle test user sign in
    if (systemSettings?.value?.enabled) {
      const testUsers = await getTestUsers();
      const testUser = testUsers.find(u => 
        u.credentials.email === email && 
        u.credentials.password === password
      );
      
      if (testUser) {
        const mockUser = {
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
        } as User;
        
        setAuthState({
          user: mockUser,
          session: null,
          initialized: true
        });
        
        toast.success('Signed in as test user');
        return true;
      }
    }

    // Handle regular user sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    if (data.session) {
      setAuthState({
        user: data.session.user,
        session: data.session,
        initialized: true
      });
      return true;
    }

    return false;
  },

  async signOut(
    currentUser: User | null,
    systemSettings: any,
    setAuthState: (state: AuthState) => void
  ) {
    // Handle test user sign out
    if (currentUser?.email && systemSettings?.value?.enabled) {
      const testUsers = await getTestUsers();
      const isTestUser = testUsers.some(u => u.credentials.email === currentUser?.email);
      
      if (isTestUser) {
        setAuthState({
          user: null,
          session: null,
          initialized: true
        });
        toast.success('Test user signed out');
        return true;
      }
    }

    // Handle regular user sign out
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    setAuthState({
      user: null,
      session: null,
      initialized: true
    });
    
    toast.success('Signed out successfully');
    return true;
  }
};
