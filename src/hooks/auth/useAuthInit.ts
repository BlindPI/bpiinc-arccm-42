
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthUserWithProfile } from '@/types/auth';
import { getUserWithProfile } from '@/utils/authUtils';

// Add a debug flag to help with troubleshooting
const DEBUG_AUTH = false;

export const useAuthInit = () => {
  const [user, setUser] = useState<AuthUserWithProfile | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  
  // Track if component is mounted to prevent state updates after unmount
  useEffect(() => {
    let isMounted = true;
    let authStateChangeTimeout: NodeJS.Timeout | null = null;
    
    async function initAuth() {
      if (DEBUG_AUTH) console.log("[Auth Debug] Starting auth initialization");
      
      try {
        // First get the initial session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        // Set up the auth state change listener BEFORE processing the current session
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (DEBUG_AUTH) console.log(`[Auth Debug] Auth state change: ${event}`, newSession?.user?.id);
            
            if (!isMounted) return;
            
            // Clear any pending timeout to prevent race conditions
            if (authStateChangeTimeout) {
              clearTimeout(authStateChangeTimeout);
            }
            
            // Use a timeout to avoid potential deadlocks with Supabase auth
            // and ensure we're not in the middle of another auth operation
            authStateChangeTimeout = setTimeout(async () => {
              try {
                if (newSession?.user) {
                  try {
                    if (DEBUG_AUTH) console.log("[Auth Debug] Getting user profile");
                    const userWithProfile = await getUserWithProfile(newSession.user);
                    
                    if (isMounted) {
                      setUser(userWithProfile);
                      setSession(newSession);
                      if (DEBUG_AUTH) console.log("[Auth Debug] User profile set:", userWithProfile.email);
                    }
                  } catch (profileError) {
                    console.error("[Auth Debug] Error getting user profile:", profileError);
                    
                    if (isMounted) {
                      // Still set the basic user even if profile fetch fails
                      setUser({
                        id: newSession.user.id,
                        email: newSession.user.email,
                        created_at: newSession.user.created_at,
                        last_sign_in_at: newSession.user.last_sign_in_at
                      });
                      setSession(newSession);
                      if (DEBUG_AUTH) console.log("[Auth Debug] Basic user set without profile");
                    }
                  } finally {
                    if (isMounted) {
                      setLoading(false);
                    }
                  }
                } else {
                  if (isMounted) {
                    setUser(null);
                    setSession(null);
                    setLoading(false);
                    if (DEBUG_AUTH) console.log("[Auth Debug] No user found, state cleared");
                  }
                }
              } catch (timeoutError) {
                console.error("[Auth Debug] Error in auth state change handler:", timeoutError);
                if (isMounted) {
                  setLoading(false);
                }
              }
            }, 10); // Small delay to prevent immediate execution
          }
        );
        
        // Now process the current session (if any)
        if (currentSession?.user && isMounted) {
          try {
            if (DEBUG_AUTH) console.log("[Auth Debug] Processing initial session");
            const userWithProfile = await getUserWithProfile(currentSession.user);
            
            if (isMounted) {
              setUser(userWithProfile);
              setSession(currentSession);
              if (DEBUG_AUTH) console.log("[Auth Debug] Initial session set with user:", userWithProfile.email);
            }
          } catch (profileError) {
            console.error("[Auth Debug] Error getting initial profile:", profileError);
            
            if (isMounted) {
              // Still set the basic user even if profile fetch fails
              setUser({
                id: currentSession.user.id,
                email: currentSession.user.email,
                created_at: currentSession.user.created_at,
                last_sign_in_at: currentSession.user.last_sign_in_at
              });
              setSession(currentSession);
              if (DEBUG_AUTH) console.log("[Auth Debug] Initial basic user set without profile");
            }
          }
        } else if (isMounted) {
          if (DEBUG_AUTH) console.log("[Auth Debug] No initial session found");
        }
        
        // Finalize the initialization regardless of session state
        if (isMounted) {
          setLoading(false);
          setAuthReady(true);
          setAuthInitialized(true);
          if (DEBUG_AUTH) console.log("[Auth Debug] Auth initialization complete");
        }
        
        return () => {
          if (subscription) {
            subscription.unsubscribe();
          }
        };
      } catch (error) {
        console.error("[Auth Debug] Error initializing auth:", error);
        
        if (isMounted) {
          setLoading(false);
          setAuthReady(true);
          setAuthInitialized(true);
          if (DEBUG_AUTH) console.log("[Auth Debug] Auth initialization failed but marked as ready");
        }
        
        return () => {};
      }
    }
    
    initAuth();
    
    return () => {
      isMounted = false;
      if (authStateChangeTimeout) {
        clearTimeout(authStateChangeTimeout);
      }
    };
  }, []);

  return {
    user,
    session,
    loading,
    authReady,
    authInitialized,
    setUser,
    setSession,
    setLoading
  };
};
