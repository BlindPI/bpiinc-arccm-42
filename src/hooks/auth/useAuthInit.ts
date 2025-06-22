
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
        console.log('🔍 DEBUG: useAuthInit - Getting initial session');
        
        // Get initial session first
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('🔍 DEBUG: useAuthInit - Error getting session:', sessionError);
          if (mounted) {
            setLoading(false);
            setAuthReady(true);
          }
          return;
        }

        console.log('🔍 DEBUG: useAuthInit - Initial session:', initialSession?.user?.id || 'No user');
        
        // Check if session needs refresh
        let activeSession = initialSession;
        if (initialSession) {
          const now = Date.now() / 1000;
          const expiresAt = initialSession.expires_at || 0;
          const isExpired = now > expiresAt;
          const expiresInMinutes = (expiresAt - now) / 60;
          
          if (isExpired || expiresInMinutes < 5) {
            console.log('🔍 DEBUG: useAuthInit - Session expired or expiring soon, refreshing...');
            
            try {
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
                refresh_token: initialSession.refresh_token
              });
              
              if (refreshError) {
                console.error('🔍 DEBUG: useAuthInit - Session refresh failed:', refreshError);
                // Continue with expired session - auth state change will handle logout
              } else if (refreshData.session) {
                console.log('🔍 DEBUG: useAuthInit - Session refreshed successfully');
                activeSession = refreshData.session;
              }
            } catch (refreshError) {
              console.error('🔍 DEBUG: useAuthInit - Session refresh exception:', refreshError);
            }
          }
        }
        
        if (mounted) {
          setSession(activeSession);
          
          if (activeSession?.user) {
            try {
              const userWithProfile = await getUserWithProfile(activeSession.user);
              setUser(userWithProfile);
            } catch (error) {
              console.error('🔍 DEBUG: useAuthInit - Error getting initial user profile:', error);
              
              // CRITICAL: Check if error is "Auth session missing!"
              const isSessionError = error?.message?.includes('Auth session missing') ||
                                   error?.message?.includes('session');
              
              if (isSessionError) {
                console.error('🔍 DEBUG: useAuthInit - CRITICAL: Auth session missing error detected');
                // Force signOut to clear invalid state
                await supabase.auth.signOut();
                if (mounted) {
                  setUser(null);
                  setSession(null);
                }
              } else {
                // For other errors, create minimal user object
                setUser({
                  id: activeSession.user.id,
                  email: activeSession.user.email,
                  role: 'IT',
                  display_name: activeSession.user.email?.split('@')[0] || 'User',
                  created_at: activeSession.user.created_at,
                  last_sign_in_at: activeSession.user.last_sign_in_at
                });
              }
            }
          }
          
          setLoading(false);
          setAuthReady(true);
        }

        console.log('🔍 DEBUG: useAuthInit - Setting up auth state listener');
        
        // Set up auth state change listener after initial session
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('🔍 DEBUG: useAuthInit - Auth state change:', event, session?.user?.id || 'No user');
            
            if (!mounted) return;

            setSession(session);
            
            if (session?.user) {
              try {
                const userWithProfile = await getUserWithProfile(session.user);
                setUser(userWithProfile);
              } catch (error) {
                console.error('🔍 DEBUG: useAuthInit - Error getting user profile:', error);
                
                // CRITICAL: Handle "Auth session missing!" error
                const isSessionError = error?.message?.includes('Auth session missing') ||
                                     error?.message?.includes('session');
                
                if (isSessionError) {
                  console.error('🔍 DEBUG: useAuthInit - CRITICAL: Auth session missing in state change');
                  // Force signOut to clear invalid state
                  await supabase.auth.signOut();
                  setUser(null);
                  setSession(null);
                } else {
                  // For other errors, create minimal user object
                  setUser({
                    id: session.user.id,
                    email: session.user.email,
                    role: 'IT',
                    display_name: session.user.email?.split('@')[0] || 'User',
                    created_at: session.user.created_at,
                    last_sign_in_at: session.user.last_sign_in_at
                  });
                }
              }
            } else {
              setUser(null);
            }
            
            if (!authReady) {
              setLoading(false);
              setAuthReady(true);
            }
          }
        );

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
