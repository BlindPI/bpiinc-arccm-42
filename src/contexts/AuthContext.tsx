
import React, { createContext, useContext, useEffect } from 'react';
import { useAuthProvider } from '@/hooks/useAuthProvider';
import { AuthContextType } from '@/types/auth';

// Create context with undefined as initial value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  
  // Add isLoggedIn derived property based on user existence
  const authWithIsLoggedIn = {
    ...auth,
    isLoggedIn: !!auth.user
  };
  
  // Log authentication state for debugging
  useEffect(() => {
    if (auth.loading) {
      console.log('Auth state: Loading');
    } else if (auth.user) {
      console.log('Auth state: Authenticated', auth.user.id);
    } else {
      console.log('Auth state: Not authenticated');
    }
  }, [auth.loading, auth.user]);
  
  return (
    <AuthContext.Provider value={authWithIsLoggedIn}>
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
