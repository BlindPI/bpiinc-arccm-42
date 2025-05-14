
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
          setAuthError(sessionError.message);
          setLoading(false);
          return;
        }
        
        console.log("Auth session check:", currentSession ? "Found existing session" : "No active session");
        
        if (currentSession?.user && isMounted) {
          try {
            const userWithProfile = await getUserWithProfile(currentSession.user);
            
            if (userWithProfile && isMounted) {
              setUser(userWithProfile);
              setSession(currentSession);
            } else if (isMounted) {
              // If we couldn't get the profile, still set the session but not the user
              // This will allow the app to redirect to profile setup if needed
              setSession(currentSession);
            }
          } catch (profileError) {
            console.error("Error getting user profile during init:", profileError);
            if (isMounted) {
              setAuthError("Failed to retrieve user profile");
            }
          }
        }
        
        // Set up auth state change listener
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log("Auth state change:", event, newSession?.user?.id);
            
            if (newSession?.user && isMounted) {
              try {
                const userWithProfile = await getUserWithProfile(newSession.user);
                if (userWithProfile && isMounted) {
                  setUser(userWithProfile);
                  setSession(newSession);
                  setAuthError(null);
                }
              } catch (error) {
                console.error("Error updating user during auth state change:", error);
                // Still update the session to prevent auth loops
                if (isMounted) {
                  setSession(newSession);
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
