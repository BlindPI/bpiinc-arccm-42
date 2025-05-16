
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
  
  useEffect(() => {
    let isMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;
    
    async function initAuth() {
      try {
        // Set up auth state change listener first to catch any authentication events
        const { data: authListener } = await supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log("Auth state change:", event, newSession?.user?.id);
            
            if (!isMounted) return;
            
            if (newSession?.user) {
              const userWithProfile = await getUserWithProfile(newSession.user);
              setUser(userWithProfile);
              setSession(newSession);
            } else {
              setUser(null);
              setSession(null);
            }
            
            setLoading(false);
          }
        );
        
        subscription = authListener.subscription;
        
        // Then check the initial session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (isMounted) {
          console.log("Auth session check:", currentSession ? "Found existing session" : "No active session");
          
          if (currentSession?.user) {
            const userWithProfile = await getUserWithProfile(currentSession.user);
            setUser(userWithProfile);
            setSession(currentSession);
          }
          
          setLoading(false);
          setAuthReady(true);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (isMounted) {
          setLoading(false);
          setAuthReady(true);
        }
      }
    }
    
    initAuth();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
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
