
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

  useEffect(() => {
    async function initAuth() {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        console.log("Auth session check:", currentSession ? "Found existing session" : "No active session");
        
        if (currentSession?.user) {
          const userWithProfile = await getUserWithProfile(currentSession.user);
          setUser(userWithProfile);
          setSession(currentSession);
        }
        
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
        toast.error("Failed to initialize authentication");
      }
    }
    
    initAuth();
  }, []);

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

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      if (!user) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
      
      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          ...updates
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

  // Define the RPC function signature properly
  type CreateUserFromInvitationFn = {
    Args: { invitation_token: string; password: string };
    Returns: { success: boolean; message: string; email: string };
  };

  const acceptInvitation = useCallback(async (
    token: string, 
    password: string, 
    displayName?: string
  ) => {
    try {
      setLoading(true);
      
      // Properly type the RPC call with the function name as the first parameter
      // and the function signature as the second parameter
      const { data, error: invitationError } = await supabase.rpc<
        'create_user_from_invitation', 
        CreateUserFromInvitationFn
      >(
        'create_user_from_invitation',
        { invitation_token: token, password }
      );
      
      if (invitationError) throw invitationError;
      
      // Handle case where data is undefined
      if (!data) {
        throw new Error('Failed to accept invitation: No response data');
      }
      
      // Check if operation was successful
      if (!data.success) {
        throw new Error(data.message || 'Failed to accept invitation');
      }
      
      // Use the email from the successful response for login
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password,
      });
      
      if (loginError) throw loginError;
      
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
    
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    updatePassword,
    acceptInvitation,
    
    signUp,
    signIn,
    signOut
  };
};
