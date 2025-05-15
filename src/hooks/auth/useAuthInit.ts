
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
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    
    async function initAuth() {
      try {
        console.log("Starting auth initialization");
        
        // First set up auth state change listener
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log("Auth state change:", event, newSession?.user?.id);
            
            if (!isMounted) return;
            
            if (newSession?.user) {
              try {
                const userWithProfile = await getUserWithProfile(newSession.user);
                
                if (isMounted) {
                  setUser(userWithProfile);
                  setSession(newSession);
                  console.log("Auth state updated with user:", userWithProfile.email);
                }
              } catch (profileError) {
                console.error("Error getting user profile:", profileError);
                
                if (isMounted) {
                  // Still set the basic user even if profile fetch fails
                  setUser({
                    id: newSession.user.id,
                    email: newSession.user.email,
                    created_at: newSession.user.created_at,
                    last_sign_in_at: newSession.user.last_sign_in_at
                  });
                  setSession(newSession);
                }
              }
            } else {
              if (isMounted) {
                setUser(null);
                setSession(null);
                console.log("Auth state cleared - no user");
              }
            }
            
            if (isMounted) {
              setLoading(false);
            }
          }
        );
        
        // Then get the initial session
        if (isMounted) {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          
          console.log("Initial session check:", currentSession ? "Found existing session" : "No active session");
          
          if (currentSession?.user && isMounted) {
            try {
              const userWithProfile = await getUserWithProfile(currentSession.user);
              
              if (isMounted) {
                setUser(userWithProfile);
                setSession(currentSession);
                console.log("Initial session set with user:", userWithProfile.email);
              }
            } catch (profileError) {
              console.error("Error getting initial profile:", profileError);
              
              if (isMounted) {
                // Still set the basic user even if profile fetch fails
                setUser({
                  id: currentSession.user.id,
                  email: currentSession.user.email,
                  created_at: currentSession.user.created_at,
                  last_sign_in_at: currentSession.user.last_sign_in_at
                });
                setSession(currentSession);
              }
            }
          }
          
          setLoading(false);
          setAuthReady(true);
          setAuthInitialized(true);
          console.log("Auth initialization complete");
        }
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error initializing auth:", error);
        
        if (isMounted) {
          setLoading(false);
          setAuthReady(true); // Still mark auth as ready to prevent blocking the app
          setAuthInitialized(true);
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
    authInitialized,
    setUser,
    setSession,
    setLoading
  };
};
