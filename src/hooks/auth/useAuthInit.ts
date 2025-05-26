
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
    console.log("🔍 DEBUG: useAuthInit effect running");
    let isActive = true; // Flag to prevent state updates after unmount
    
    async function initAuth() {
      try {
        console.log("🔍 DEBUG: initAuth started");
        
        // Set up auth state change listener FIRST
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log("🔍 DEBUG: Auth state change:", event,
              newSession?.user?.id || "no user",
              "Timestamp:", new Date().toISOString());
            
            if (!isActive) return;
            
            // Always update session immediately
            setSession(newSession);
            
            if (newSession?.user) {
              console.log("🔍 DEBUG: Auth change - fetching profile for:", newSession.user.id);
              try {
                const userWithProfile = await getUserWithProfile(newSession.user);
                console.log("🔍 DEBUG: Auth change - profile result:",
                  userWithProfile ? "Success" : "Failed",
                  "Role:", userWithProfile?.role);
                
                if (isActive) {
                  setUser(userWithProfile);
                }
              } catch (profileError) {
                console.error("🔍 DEBUG: Error fetching profile on auth change:", profileError);
                // Continue even if profile fetch fails
                if (isActive) {
                  // Create minimal user object if profile fetch fails
                  setUser({
                    id: newSession.user.id,
                    email: newSession.user.email,
                    role: 'IT',
                    created_at: newSession.user.created_at,
                    last_sign_in_at: newSession.user.last_sign_in_at
                  });
                }
              }
            } else {
              console.log("🔍 DEBUG: Auth change - clearing user");
              if (isActive) {
                setUser(null);
              }
            }
            
            // Always set loading to false and auth ready after auth state change
            if (isActive) {
              console.log("🔍 DEBUG: Auth change - setting loading to false and auth ready");
              setLoading(false);
              setAuthReady(true);
            }
          }
        );
        
        // THEN get the initial session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        console.log("🔍 DEBUG: Initial session check:",
          currentSession ? `Found session for user ${currentSession.user?.id}` : "No active session");
        
        if (isActive) {
          setSession(currentSession);
          
          // If we have a session, try to get the profile
          if (currentSession?.user) {
            console.log("🔍 DEBUG: Fetching initial profile for user:", currentSession.user.id);
            try {
              const userWithProfile = await getUserWithProfile(currentSession.user);
              console.log("🔍 DEBUG: Initial profile fetched:", userWithProfile ? "Success" : "Failed",
                "Role:", userWithProfile?.role);
              
              setUser(userWithProfile);
            } catch (profileError) {
              console.error("🔍 DEBUG: Error fetching initial profile:", profileError);
              // Continue even if profile fetch fails - don't block auth
              setUser({
                id: currentSession.user.id,
                email: currentSession.user.email,
                role: 'IT',
                created_at: currentSession.user.created_at,
                last_sign_in_at: currentSession.user.last_sign_in_at
              });
            }
          }
          
          // Set loading to false and auth ready after initial setup
          console.log("🔍 DEBUG: Initial auth setup complete, setting loading to false and auth ready");
          setLoading(false);
          setAuthReady(true);
        }
        
        return () => {
          console.log("🔍 DEBUG: useAuthInit cleanup - unsubscribing");
          isActive = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("🔍 DEBUG: Error initializing auth:", error);
        if (isActive) {
          // Always ensure loading is set to false even on error
          setLoading(false);
          setAuthReady(true);
        }
      }
    }
    
    // Set a timeout to ensure auth state is cleared even if init hangs
    const safetyTimeout = setTimeout(() => {
      if (isActive && loading) {
        console.warn("🔍 DEBUG: Auth init safety timeout triggered - forcing loading to false");
        setLoading(false);
        setAuthReady(true);
      }
    }, 5000); // 5 second safety timeout
    
    initAuth();
    
    return () => {
      clearTimeout(safetyTimeout);
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
