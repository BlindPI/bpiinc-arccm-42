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
    let isActive = true;
    
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
            
            // Always update session immediately - this is the source of truth
            setSession(newSession);
            
            if (newSession?.user) {
              console.log("🔍 DEBUG: Auth change - creating resilient user object");
              
              // Create minimal user object immediately for auth continuity
              const minimalUser: AuthUserWithProfile = {
                id: newSession.user.id,
                email: newSession.user.email,
                role: 'IT', // Safe default
                display_name: newSession.user.email?.split('@')[0] || 'User',
                created_at: newSession.user.created_at,
                last_sign_in_at: newSession.user.last_sign_in_at
              };
              
              // Set minimal user immediately to maintain auth state
              setUser(minimalUser);
              
              // Try to fetch full profile in background without blocking auth
              setTimeout(async () => {
                try {
                  console.log("🔍 DEBUG: Background profile fetch for:", newSession.user.id);
                  const userWithProfile = await getUserWithProfile(newSession.user);
                  
                  if (isActive && userWithProfile) {
                    console.log("🔍 DEBUG: Enhanced user profile loaded successfully");
                    setUser(userWithProfile);
                  }
                } catch (profileError) {
                  console.warn("🔍 DEBUG: Background profile fetch failed, keeping minimal user:", profileError);
                  // Keep the minimal user - don't clear auth state
                }
              }, 100); // Small delay to avoid blocking auth flow
              
            } else {
              console.log("🔍 DEBUG: Auth change - clearing user");
              setUser(null);
            }
            
            // Always set auth as ready after processing auth state change
            if (isActive) {
              console.log("🔍 DEBUG: Auth change - setting auth ready");
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
          
          // If we have a session, create minimal user immediately
          if (currentSession?.user) {
            console.log("🔍 DEBUG: Creating initial minimal user object");
            
            const minimalUser: AuthUserWithProfile = {
              id: currentSession.user.id,
              email: currentSession.user.email,
              role: 'IT', // Safe default
              display_name: currentSession.user.email?.split('@')[0] || 'User',
              created_at: currentSession.user.created_at,
              last_sign_in_at: currentSession.user.last_sign_in_at
            };
            
            setUser(minimalUser);
            
            // Try to enhance with profile data in background
            setTimeout(async () => {
              try {
                console.log("🔍 DEBUG: Initial background profile fetch");
                const userWithProfile = await getUserWithProfile(currentSession.user);
                
                if (isActive && userWithProfile) {
                  console.log("🔍 DEBUG: Initial profile enhancement successful");
                  setUser(userWithProfile);
                }
              } catch (profileError) {
                console.warn("🔍 DEBUG: Initial profile fetch failed, keeping minimal user:", profileError);
                // Keep minimal user - don't affect auth state
              }
            }, 100);
          }
          
          // Set auth as ready after initial setup
          console.log("🔍 DEBUG: Initial auth setup complete");
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
          // Even on error, ensure auth state is ready
          setLoading(false);
          setAuthReady(true);
        }
      }
    }
    
    // Set a safety timeout to ensure auth is never stuck in loading state
    const safetyTimeout = setTimeout(() => {
      if (isActive && loading) {
        console.warn("🔍 DEBUG: Auth init safety timeout triggered - forcing ready state");
        setLoading(false);
        setAuthReady(true);
      }
    }, 3000); // Reduced to 3 seconds for faster fallback
    
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
