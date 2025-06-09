
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getUserWithProfile } from '@/utils/authUtils';
import { AuthUserWithProfile } from '@/types/auth';
import { validateSupabaseConfiguration, logConfigurationStatus } from '@/utils/configurationValidator';

export const useAuthInit = () => {
  const [user, setUser] = useState<AuthUserWithProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    console.log('🔍 DEBUG: useAuthInit - Starting authentication initialization');
    
    // Validate configuration before proceeding
    const configValidation = validateSupabaseConfiguration();
    logConfigurationStatus();
    
    if (!configValidation.isValid) {
      console.error('🔍 DEBUG: useAuthInit - Configuration invalid, cannot proceed');
      setLoading(false);
      setAuthReady(false);
      return;
    }

    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔍 DEBUG: useAuthInit - Setting up auth state listener');
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔍 DEBUG: useAuthInit - Auth state change:', event, session?.user?.id || 'No user');
            
            if (!mounted) return;

            setSession(session);
            
            if (session?.user) {
              try {
                const userWithProfile = await getUserWithProfile(session.user);
                if (mounted) {
                  setUser(userWithProfile);
                }
              } catch (error) {
                console.error('🔍 DEBUG: useAuthInit - Error getting user profile:', error);
                if (mounted) {
                  setUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    display_name: session.user.email?.split('@')[0] || 'User',
                    role: 'IT',
                    created_at: session.user.created_at,
                    last_sign_in_at: session.user.last_sign_in_at
                  });
                }
              }
            } else {
              if (mounted) {
                setUser(null);
              }
            }
            
            if (mounted) {
              setLoading(false);
              setAuthReady(true);
            }
          }
        );

        console.log('🔍 DEBUG: useAuthInit - Getting initial session');
        
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🔍 DEBUG: useAuthInit - Error getting session:', error);
          if (mounted) {
            setLoading(false);
            setAuthReady(true);
          }
          return;
        }

        console.log('🔍 DEBUG: useAuthInit - Initial session:', initialSession?.user?.id || 'No user');
        
        if (mounted) {
          setSession(initialSession);
          
          if (initialSession?.user) {
            try {
              const userWithProfile = await getUserWithProfile(initialSession.user);
              setUser(userWithProfile);
            } catch (error) {
              console.error('🔍 DEBUG: useAuthInit - Error getting initial user profile:', error);
              setUser({
                id: initialSession.user.id,
                email: initialSession.user.email || '',
                display_name: initialSession.user.email?.split('@')[0] || 'User',
                role: 'IT',
                created_at: initialSession.user.created_at,
                last_sign_in_at: initialSession.user.last_sign_in_at
              });
            }
          }
          
          setLoading(false);
          setAuthReady(true);
        }

        // Cleanup function
        return () => {
          console.log('🔍 DEBUG: useAuthInit - Cleaning up auth subscription');
          subscription.unsubscribe();
        };

      } catch (error) {
        console.error('🔍 DEBUG: useAuthInit - Critical auth initialization error:', error);
        if (mounted) {
          setLoading(false);
          setAuthReady(false);
        }
      }
    };

    const cleanup = initializeAuth();
    
    return () => {
      mounted = false;
      cleanup?.then(cleanupFn => cleanupFn?.());
    };
  }, []);

  return {
    user,
    session,
    loading,
    authReady,
    setUser,
    setSession,
    setLoading
  };
};
