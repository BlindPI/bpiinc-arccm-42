import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthUserWithProfile } from '@/types/auth';
import { setupProfileOnSignUp } from '@/utils/authUtils';
import { toast } from '@/components/ui/use-toast';

export interface AuthMethodsProps {
  setLoading: (loading: boolean) => void;
  setUser: (user: AuthUserWithProfile | null) => void;
  setSession: (session: any) => void;
}

export const useAuthMethods = ({ setLoading, setUser, setSession }: AuthMethodsProps) => {
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
      toast({
        title: "Login failed",
        description: error.message || "Failed to login. Please check your credentials.",
        variant: "destructive",
      });
      return { 
        success: false, 
        error: error.message || "Failed to login"
      };
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
      setLoading(true);
      
      // First sign up the user through Supabase Auth
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
      
      // The profile will be created by the database trigger
      // We just need to send the welcome notification
      if (data.user) {
        await setupProfileOnSignUp(data.user, displayName);
      }
      
      return { success: true, user: data.user };
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Failed to register. Please try again.",
        variant: "destructive",
      });
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear state immediately after logout
      setUser(null);
      setSession(null);
      
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
  }, [setLoading, setUser, setSession]);

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

  // Simplified interface methods that throw errors instead of returning results
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
