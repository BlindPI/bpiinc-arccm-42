
import { useCallback } from 'react';
import { NavigateFunction } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthUserWithProfile, UserProfile } from '@/types/auth';
import { setupProfileOnSignUp } from '@/utils/authUtils';

export interface AuthMethodsProps {
  setLoading: (loading: boolean) => void;
  setUser: (user: AuthUserWithProfile | null) => void;
  setSession: (session: any) => void;
  navigate: NavigateFunction;
}

export const useAuthMethods = ({ setLoading, setUser, setSession, navigate }: AuthMethodsProps) => {
  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      
      console.log("🔍 DEBUG: useAuthMethods - Attempting login for:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("🔍 DEBUG: useAuthMethods - Login error:", error);
        throw error;
      }
      
      console.log("🔍 DEBUG: useAuthMethods - Login successful for user:", data.user?.id);
      return { success: true, user: data.user };
    } catch (error: any) {
      console.error("🔍 DEBUG: useAuthMethods - Login failed:", error);
      return { 
        success: false, 
        error: error.message || "Failed to login"
      };
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const register = useCallback(async (email: string, password: string, profileData?: Partial<UserProfile>) => {
    try {
      setLoading(true);
      
      console.log("🔍 DEBUG: useAuthMethods - Attempting registration for:", email);
      console.log("🔍 DEBUG: useAuthMethods - Profile data:", profileData);
      
      const displayName = profileData?.display_name || email.split('@')[0];
      
      // First sign up the user through Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            phone: profileData?.phone,
            organization: profileData?.organization,
            job_title: profileData?.job_title
          }
        }
      });
      
      if (error) {
        console.error("🔍 DEBUG: useAuthMethods - Registration error:", error);
        throw error;
      }
      
      console.log("🔍 DEBUG: useAuthMethods - Registration successful:", data.user?.id);
      
      // The profile will be created by the database trigger
      // We just need to send the welcome notification
      if (data.user) {
        console.log("🔍 DEBUG: useAuthMethods - Setting up profile for new user");
        await setupProfileOnSignUp(data.user, profileData);
      }
      
      return { success: true, user: data.user };
    } catch (error: any) {
      console.error("🔍 DEBUG: useAuthMethods - Registration failed:", error);
      return { 
        success: false, 
        error: error.message || "Failed to register"
      };
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔍 DEBUG: useAuthMethods - Attempting logout");
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      console.log("🔍 DEBUG: useAuthMethods - Logout successful");
      
      // Navigate to landing page after successful logout
      navigate('/landing', { replace: true });
      
      return { success: true };
    } catch (error: any) {
      console.error("🔍 DEBUG: useAuthMethods - Logout error:", error);
      return {
        success: false,
        error: error.message || "Failed to logout"
      };
    } finally {
      setLoading(false);
    }
  }, [setLoading, navigate]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      console.log("🔍 DEBUG: useAuthMethods - Attempting password reset for:", email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      console.log("🔍 DEBUG: useAuthMethods - Password reset email sent");
      return { success: true };
    } catch (error: any) {
      console.error("🔍 DEBUG: useAuthMethods - Password reset error:", error);
      return { 
        success: false, 
        error: error.message || "Failed to send password reset email"
      };
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    try {
      console.log("🔍 DEBUG: useAuthMethods - Attempting password update");
      
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      console.log("🔍 DEBUG: useAuthMethods - Password updated successfully");
      return { success: true };
    } catch (error: any) {
      console.error("🔍 DEBUG: useAuthMethods - Password update error:", error);
      return { 
        success: false, 
        error: error.message || "Failed to update password"
      };
    }
  }, []);

  // Simplified interface methods that throw errors instead of returning results
  const signUp = useCallback(async (email: string, password: string, profileData?: Partial<UserProfile>) => {
    console.log("🔍 DEBUG: useAuthMethods - signUp called with:", { email, profileData });
    const result = await register(email, password, profileData);
    if (!result.success) {
      throw new Error(result.error);
    }
  }, [register]);

  const signIn = useCallback(async (email: string, password: string) => {
    console.log("🔍 DEBUG: useAuthMethods - signIn called with:", email);
    const result = await login(email, password);
    if (!result.success) {
      throw new Error(result.error);
    }
  }, [login]);

  const signOut = useCallback(async () => {
    console.log("🔍 DEBUG: useAuthMethods - signOut called");
    const result = await logout();
    if (!result.success) {
      throw new Error(result.error);
    }
  }, [logout]);

  return {
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
    signUp,
    signIn,
    signOut
  };
};
