
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
  const [initAttempts, setInitAttempts] = useState<number>(0);

  useEffect(() => {
    console.log("🔍 DEBUG: useAuthInit effect running, attempt:", initAttempts);
    let isActive = true; // Flag to prevent state updates after unmount
    
    // Safety mechanism to prevent infinite loops
    if (initAttempts > 3) {
      console.error("🔍 DEBUG: Too many auth init attempts, forcing loading to false");
      setLoading(false);
      setAuthReady(true);
      return;
    }
    
    async function initAuth() {
      try {
        console.log("🔍 DEBUG: initAuth started, loading:", loading);
        
        // Get the initial session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        console.log("🔍 DEBUG: Auth session check:",
          currentSession ? `Found session for user ${currentSession.user?.id}` : "No active session",
          "Session expires:", currentSession?.expires_at ? new Date(currentSession.expires_at * 1000).toISOString() : "N/A"
        );
        
        // First set session regardless of profile fetch success
        if (isActive && currentSession) {
          setSession(currentSession);
        }
        
        // Then try to get the profile
        if (currentSession?.user) {
          console.log("🔍 DEBUG: Fetching profile for user:", currentSession.user.id);
          try {
            const userWithProfile = await getUserWithProfile(currentSession.user);
            console.log("🔍 DEBUG: Profile fetched:", userWithProfile ? "Success" : "Failed",
              "Role:", userWithProfile?.role);
            
            if (isActive) {
              setUser(userWithProfile);
            }
          } catch (profileError) {
            console.error("🔍 DEBUG: Error fetching initial profile:", profileError);
            // Continue even if profile fetch fails - don't block auth
            if (isActive) {
              // Create minimal user object if profile fetch fails
              setUser({
                id: currentSession.user.id,
                email: currentSession.user.email,
                role: 'IT',
                created_at: currentSession.user.created_at,
                last_sign_in_at: currentSession.user.last_sign_in_at
              });
            }
          }
        }
        
        // Set up auth state change listener
        const { data: { subscription } } = await supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log("🔍 DEBUG: Auth state change:", event,
              newSession?.user?.id,
              "Timestamp:", new Date().toISOString());
            
            // Always update session immediately
            if (isActive) {
              setSession(newSession);
            }
            
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
            
            // Always set loading to false after auth state change
            if (isActive) {
              console.log("🔍 DEBUG: Auth change - setting loading to false");
              setLoading(false);
            }
          }
        );
        
        // Set loading to false after initial setup, regardless of profile fetch
        if (isActive) {
          console.log("🔍 DEBUG: Initial auth setup complete, setting loading to false");
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
          
          // Increment attempt counter to prevent infinite loops
          setInitAttempts(prev => prev + 1);
        }
      }
    }
    
    // Set a timeout to ensure loading state is cleared even if auth init hangs
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
  }, [initAttempts]);

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
