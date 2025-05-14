import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthUserWithProfile } from '@/types/auth';
import { getUserWithProfile } from '@/utils/authUtils';

export const useAuthInit = () => {
  const [user, setUser] = useState<AuthUserWithProfile | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function initAuth() {
      try {
        // Get the initial session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session retrieval error:", sessionError);
          if (isMounted) {
            setAuthError(sessionError.message);
            setLoading(false);
          }
          return;
        }
        
        console.log("Auth session check:", currentSession ? "Found existing session" : "No active session");
        
        if (currentSession?.user && isMounted) {
          // Always update session immediately even if profile fetch fails
          setSession(currentSession);
          
          try {
            const userWithProfile = await getUserWithProfile(currentSession.user);
            
            if (userWithProfile && isMounted) {
              setUser(userWithProfile);
            }
          } catch (profileError) {
            console.error("Error getting user profile during init:", profileError);
            if (isMounted) {
              setAuthError("Failed to retrieve user profile");
              // Still keep the session valid
              setUser({
                id: currentSession.user.id,
                email: currentSession.user.email,
                role: 'IT',
                created_at: currentSession.user.created_at,
                last_sign_in_at: currentSession.user.last_sign_in_at,
              });
            }
          }
        }
        
        // Set up auth state change listener
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log("Auth state change:", event, newSession?.user?.id);
            
            if (newSession?.user && isMounted) {
              // Always update session immediately
              setSession(newSession);
              
              try {
                const userWithProfile = await getUserWithProfile(newSession.user);
                if (userWithProfile && isMounted) {
                  setUser(userWithProfile);
                  setAuthError(null);
                }
              } catch (error) {
                console.error("Error updating user during auth state change:", error);
                // Provide fallback user data to prevent auth loops
                if (isMounted) {
                  setUser({
                    id: newSession.user.id,
                    email: newSession.user.email,
                    role: 'IT',
                    created_at: newSession.user.created_at,
                    last_sign_in_at: newSession.user.last_sign_in_at,
                  });
                }
              }
            } else if (isMounted) {
              setUser(null);
              setSession(null);
            }
            
            if (isMounted) {
              setLoading(false);
            }
          }
        );
        
        if (isMounted) {
          setLoading(false);
          setAuthReady(true);
        }
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (isMounted) {
          setAuthError("Authentication initialization failed");
          setLoading(false);
        }
      }
    }
    
    initAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return {
    user,
    session,
    loading,
    authReady,
    authError,
    setUser,
    setSession,
    setLoading
  };
};
