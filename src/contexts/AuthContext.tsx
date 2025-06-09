import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types/supabase-schema';

export interface AuthUserWithProfile extends User {
  profile?: Profile;
}

interface AuthContextType {
  user: AuthUserWithProfile | null;
  session: Session | null;
  loading: boolean;
  authReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userData?: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUserWithProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setUser({ ...session.user, profile });
      }
      setLoading(false);
      setAuthReady(true);
    };

    getSession();

    const { subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setUser({ ...session.user, profile });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const register = async (email: string, password: string, userData?: any): Promise<void> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const logout = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const signOut = async (): Promise<void> => {
    return logout();
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (error) throw error;
  };

  const resetPassword = async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  const updatePassword = async (password: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };

  const value = {
    user,
    session,
    loading,
    authReady,
    login,
    register,
    logout,
    updateProfile,
    resetPassword,
    updatePassword,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
