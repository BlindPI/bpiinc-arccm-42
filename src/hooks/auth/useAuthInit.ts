
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
    async function initAuth() {
      try {
        // Get the initial session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        console.log("Auth session check:", currentSession ? "Found existing session" : "No active session");
        
        if (currentSession?.user) {
          const userWithProfile = await getUserWithProfile(currentSession.user);
          setUser(userWithProfile);
          setSession(currentSession);
        }
        
        // Set up auth state change listener
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log("Auth state change:", event, newSession?.user?.id);
            
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
        
        setLoading(false);
        setAuthReady(true);
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error initializing auth:", error);
        setLoading(false);
      }
    }
    
    initAuth();
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
