
import React, { createContext, useContext } from 'react';
import { useAuthProvider } from '@/hooks/useAuthProvider';
import { AuthContextType } from '@/types/auth';

// Create context with undefined as initial value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  
  // Add debug logging for auth state changes
  React.useEffect(() => {
    console.log('Auth context state updated:', { 
      hasUser: !!auth.user,
      hasSession: !!auth.session,
      isLoading: auth.loading
    });
  }, [auth.user, auth.session, auth.loading]);
  
  return (
    <AuthContext.Provider value={auth}>
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
