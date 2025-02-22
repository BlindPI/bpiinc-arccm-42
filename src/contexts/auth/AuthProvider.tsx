
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { AuthContext } from './AuthContext';
import { authService } from './authService';
import type { AuthState } from './types';

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
      await authService.signUp(email, password);
      navigate('/auth');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const systemSettings = await prefetchSystemSettings();
      const success = await authService.signIn(email, password, systemSettings, setAuthState);
      if (success) {
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
      const success = await authService.signOut(authState.user, systemSettings, setAuthState);
      if (success) {
        navigate('/auth');
      }
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  // Don't render children until auth is initialized
  if (!authState.initialized) {
    return null;
  }

  const value = {
    ...authState,
    signUp,
    signIn,
    signOut,
    loading: !authState.initialized
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
