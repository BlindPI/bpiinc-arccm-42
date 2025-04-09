
import { useAuthInit } from './auth/useAuthInit';
import { useAuthMethods } from './auth/useAuthMethods';
import { useProfileManagement } from './auth/useProfileManagement';
import { useInvitations } from './auth/useInvitations';
import { toast } from 'sonner';

export const useAuthProvider = () => {
  const { 
    user, 
    session, 
    loading, 
    authReady, 
    setUser, 
    setSession, 
    setLoading 
  } = useAuthInit();

  const {
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
    signUp,
    signIn,
    signOut
  } = useAuthMethods({ setLoading, setUser, setSession });

  const { updateProfile } = useProfileManagement({ user, setUser });

  const { acceptInvitation } = useInvitations({ setLoading });

  return {
    // State
    user,
    session,
    loading,
    authReady,
    
    // Auth methods
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    updatePassword,
    acceptInvitation,
    
    // Simplified interface
    signUp,
    signIn,
    signOut
  };
};
