
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { getTestUsers } from '@/hooks/useUserProfiles';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { data: systemSettings, prefetchSystemSettings } = useSystemSettings();

  // Prefetch system settings on mount
  useEffect(() => {
    prefetchSystemSettings();
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Refresh session if token is about to expire
  useEffect(() => {
    if (session) {
      const expiresAt = new Date((session.expires_at ?? 0) * 1000);
      const timeUntilExpiry = expiresAt.getTime() - Date.now();
      
      // If token expires in less than 5 minutes, refresh it
      if (timeUntilExpiry < 300000) {
        supabase.auth.refreshSession().then(({ data: { session } }) => {
          if (session) {
            setSession(session);
            setUser(session.user);
          }
        });
      }
    }
  }, [session]);

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
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Only fetch system settings when actually needed
      const settings = await prefetchSystemSettings();
      
      // Check if test users are enabled
      if (systemSettings?.value?.enabled) {
        const testUsers = await getTestUsers();
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
      
      navigate('/');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const signOut = async () => {
    try {
      // Only fetch system settings when actually needed
      const settings = await prefetchSystemSettings();
      
      // First, check if this is a test user
      if (user?.email && systemSettings?.value?.enabled) {
        const testUsers = await getTestUsers();
        const isTestUser = testUsers.some(u => u.credentials.email === user.email);
        if (isTestUser) {
          setUser(null);
          setSession(null);
          toast.success('Test user signed out');
          navigate('/auth');
          return;
        }
      }

      // If not a test user, sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear session and user state
      setUser(null);
      setSession(null);
      toast.success('Signed out successfully');
      navigate('/auth');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut
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
