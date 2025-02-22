
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { getTestUsers } from '@/utils/testUsers';

interface AuthState {
  user: User | null;
  session: Session | null;
  initialized: boolean;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean; // Added loading property
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    initialized: false
  });
  const navigate = useNavigate();
  const { prefetchSystemSettings } = useSystemSettings();

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setAuthState({
            user: session.user,
            session,
            initialized: true
          });
          await prefetchSystemSettings();
        } else {
          setAuthState(state => ({ ...state, initialized: true }));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthState(state => ({ ...state, initialized: true }));
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setAuthState({
          user: session?.user ?? null,
          session,
          initialized: true
        });

        if (session?.user) {
          await prefetchSystemSettings();
        }
      }
    );

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [prefetchSystemSettings]);

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) throw error;
      
      toast.success('Registration successful! Please check your email for verification.');
      navigate('/auth');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const systemSettings = await prefetchSystemSettings();
      
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
          navigate('/');
          return;
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
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const systemSettings = await prefetchSystemSettings();
      
      // Handle test user sign out
      if (authState.user?.email && systemSettings?.value?.enabled) {
        const testUsers = await getTestUsers();
        const isTestUser = testUsers.some(u => u.credentials.email === authState.user?.email);
        
        if (isTestUser) {
          setAuthState({
            user: null,
            session: null,
            initialized: true
          });
          toast.success('Test user signed out');
          navigate('/auth');
          return;
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
      navigate('/auth');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  // Don't render children until auth is initialized
  if (!authState.initialized) {
    return null;
  }

  const value: AuthContextType = {
    ...authState,
    signUp,
    signIn,
    signOut,
    loading: !authState.initialized // Add loading property that's the opposite of initialized
  };

  return (
    <AuthContext.Provider value={value}>
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
