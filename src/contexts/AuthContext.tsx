
import React, { createContext, useContext } from 'react';
import { useAuthProvider } from '@/hooks/useAuthProvider';
import { AuthContextType } from '@/types/auth';

// Create a context with the correct initial value type
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  
  // Map auth provider values to match AuthContextType
  const authContextValue: AuthContextType = {
    user: auth.user, 
    session: auth.session,
    loading: auth.loading,
    authReady: auth.authReady,
    
    // Required by AuthContextType
    signUp: auth.signUp,
    signIn: auth.signIn,
    signOut: auth.signOut,
    
    // Optional methods
    login: auth.login,
    register: auth.register,
    resetPassword: auth.resetPassword,
    updateProfile: auth.updateProfile,
    updatePassword: auth.updatePassword,
    acceptInvitation: auth.acceptInvitation
  };
  
  return (
    <AuthContext.Provider value={authContextValue}>
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
