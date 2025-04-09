
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthUserWithProfile, UserProfile } from "@/types/auth";
import { getUserWithProfile, setupProfileOnSignUp } from "@/utils/authUtils";
import { toast } from "sonner";

export const useAuthProvider = () => {
  const [user, setUser] = useState<AuthUserWithProfile | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authReady, setAuthReady] = useState<boolean>(false);

  // Initialize auth state
  useEffect(() => {
    async function initAuth() {
      try {
        // Check for existing session
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
        
        // Cleanup subscription on unmount
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error initializing auth:", error);
        setLoading(false);
        toast.error("Failed to initialize authentication");
      }
    }
    
    initAuth();
  }, []);

  // Login with email and password
  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      return { success: true, user: data.user };
    } catch (error: any) {
      console.error("Login error:", error);
      return { 
        success: false, 
        error: error.message || "Failed to login"
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Register a new user
  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0]
          }
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        await setupProfileOnSignUp(data.user, displayName);
      }
      
      return { success: true, user: data.user };
    } catch (error: any) {
      console.error("Registration error:", error);
      return { 
        success: false, 
        error: error.message || "Failed to register"
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout current user
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error("Logout error:", error);
      return { 
        success: false, 
        error: error.message || "Failed to logout"
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error("Reset password error:", error);
      return { 
        success: false, 
        error: error.message || "Failed to send password reset email"
      };
    }
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      if (!user) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update the local user state with new profile data
      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          ...updates // Update the user directly since AuthUserWithProfile has the same properties
        };
      });
      
      return { success: true };
    } catch (error: any) {
      console.error("Update profile error:", error);
      return { 
        success: false, 
        error: error.message || "Failed to update profile"
      };
    }
  }, [user]);

  // Update user password
  const updatePassword = useCallback(async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error("Update password error:", error);
      return { 
        success: false, 
        error: error.message || "Failed to update password"
      };
    }
  }, []);

  // Accept an invitation and create a new user
  const acceptInvitation = useCallback(async (
    token: string, 
    password: string, 
    displayName?: string
  ) => {
    try {
      setLoading(true);
      
      // First verify the invitation token
      const { data: invitationData, error: invitationError } = await supabase.rpc(
        'create_user_from_invitation',
        { invitation_token: token, password }
      );
      
      if (invitationError) throw invitationError;
      
      if (!invitationData.success) {
        throw new Error(invitationData.message);
      }
      
      // Sign in with the new credentials
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: invitationData.email,
        password,
      });
      
      if (loginError) throw loginError;
      
      // Update display name if provided
      if (displayName && loginData.user) {
        await supabase
          .from('profiles')
          .update({ display_name: displayName })
          .eq('id', loginData.user.id);
      }
      
      return { success: true, user: loginData.user };
    } catch (error: any) {
      console.error("Accept invitation error:", error);
      return { 
        success: false, 
        error: error.message || "Failed to accept invitation"
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Mapping to AuthContextType interface
  const signUp = useCallback(async (email: string, password: string) => {
    const result = await register(email, password);
    if (!result.success) {
      throw new Error(result.error);
    }
  }, [register]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await login(email, password);
    if (!result.success) {
      throw new Error(result.error);
    }
  }, [login]);

  const signOut = useCallback(async () => {
    const result = await logout();
    if (!result.success) {
      throw new Error(result.error);
    }
  }, [logout]);

  return {
    user,
    session,
    loading,
    authReady,
    
    // Original methods
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    updatePassword,
    acceptInvitation,
    
    // Methods for AuthContextType compatibility
    signUp,
    signIn,
    signOut
  };
};
