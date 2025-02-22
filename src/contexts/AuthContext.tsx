
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
  
  const { prefetchSystemSettings } = useSystemSettings();

  useEffect(() => {
    // Initialize auth state and set up listener
    let mounted = true;

    const initialize = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return;

    const checkSessionExpiry = () => {
      const expiresAt = new Date((session.expires_at ?? 0) * 1000);
      const timeUntilExpiry = expiresAt.getTime() - Date.now();
      
      if (timeUntilExpiry < 300000) {
        supabase.auth.refreshSession().then(({ data: { session: newSession } }) => {
          if (newSession) {
            setSession(newSession);
            setUser(newSession.user);
          }
        });
      }
    };

    const intervalId = setInterval(checkSessionExpiry, 60000);
    
    return () => clearInterval(intervalId);
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
      const settings = await prefetchSystemSettings();
      
      if (settings?.value?.enabled) {
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
          
          setUser(mockUser);
          toast.success('Signed in as test user');
          navigate('/');
          return;
        }
      }

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
      const settings = await prefetchSystemSettings();
      
      if (user?.email && settings?.value?.enabled) {
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

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
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
