
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUserWithProfile } from '@/utils/authUtils';
import type { AuthUserWithProfile } from '@/types/auth';

export const useAuthInit = () => {
  const [user, setUser] = useState<AuthUserWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const userWithProfile = await getUserWithProfile(session.user);
          setUser(userWithProfile);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
        setAuthReady(true);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const userWithProfile = await getUserWithProfile(session.user);
          setUser(userWithProfile);
        } else {
          setUser(null);
        }
        setLoading(false);
        setAuthReady(true);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    loading,
    authReady,
    setUser,
    session: user ? { user } : null,
    setSession: setUser,
    setLoading
  };
};
