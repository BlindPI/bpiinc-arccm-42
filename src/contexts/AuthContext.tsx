
import React, { createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { setupProfileOnSignUp, getUserWithProfile } from '@/utils/authUtils';
import { useAuthInit } from '@/hooks/auth/useAuthInit';
import type { AuthContextType, AuthUserWithProfile, UserProfile } from '@/types/auth';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading, authReady, setUser } = useAuthInit();

  const signIn = async (email: string, password: string): Promise<void> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    if (data.user) {
      const userWithProfile = await getUserWithProfile(data.user);
      setUser(userWithProfile);
    }
  };

  const signUp = async (email: string, password: string, userData?: Partial<UserProfile>): Promise<void> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    if (data.user) {
      await setupProfileOnSignUp(data.user, userData);
      const userWithProfile = await getUserWithProfile(data.user);
      setUser(userWithProfile);
    }
  };

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      throw error;
    }
    setUser(null);
  };

  const acceptInvitation = async (token: string, password: string): Promise<void> => {
    // Implementation for invitation acceptance
    throw new Error('Invitation acceptance not yet implemented');
  };

  const value: AuthContextType = {
    user,
    login: signIn,
    logout: signOut,
    signOut,
    signIn,
    signUp,
    acceptInvitation,
    loading,
    authReady
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
