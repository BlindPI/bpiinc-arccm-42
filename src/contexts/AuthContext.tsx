
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { getTestUsers } from '@/hooks/useUserProfiles';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { data: systemSettings } = useSystemSettings();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      toast.success('Registration successful! Please check your email for verification.');
      navigate('/auth');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Check if test users are enabled
      if (systemSettings?.value?.enabled) {
        const testUsers = getTestUsers();
        const testUser = testUsers.find(u => 
          u.credentials.email === email && 
          u.credentials.password === password
        );
        
        if (testUser) {
          // Create a mock User object for test users that matches Supabase User type
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
          
          setUser(mockUser);
          toast.success('Signed in as test user');
          navigate('/');
          return;
        }
      }

      // If not a test user or test users are disabled, proceed with normal auth
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      navigate('/');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const signOut = async () => {
    try {
      if (user?.email && systemSettings?.value?.enabled) {
        // Check if this is a test user
        const testUsers = getTestUsers();
        const isTestUser = testUsers.some(u => u.credentials.email === user.email);
        if (isTestUser) {
          setUser(null);
          navigate('/auth');
          return;
        }
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/auth');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
