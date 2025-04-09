
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthUserWithProfile, UserProfile } from '@/types/auth';
import { toast } from 'sonner';

export interface ProfileManagementProps {
  user: AuthUserWithProfile | null;
  setUser: (user: AuthUserWithProfile | null) => void;
}

export const useProfileManagement = ({ user, setUser }: ProfileManagementProps) => {
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      if (!user) throw new Error("User not authenticated");
      
      console.log("Updating profile with:", updates);
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Create a merged user object with the updates
      if (user) {
        const updatedUser: AuthUserWithProfile = {
          ...user,
          ...updates
        };
        setUser(updatedUser);
      }
      
      toast.success("Profile updated successfully");
      return { success: true };
    } catch (error: any) {
      console.error("Update profile error:", error);
      toast.error(error.message || "Failed to update profile");
      return { 
        success: false, 
        error: error.message || "Failed to update profile"
      };
    }
  }, [user, setUser]);

  const getExtendedProfile = useCallback(async () => {
    try {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        // Update the user state with the full profile data
        const updatedUser: AuthUserWithProfile = {
          ...user,
          ...data,
          // Ensure role is properly typed
          role: data.role as AuthUserWithProfile['role']
        };
        setUser(updatedUser);
      }
      
      return { success: true, data };
    } catch (error: any) {
      console.error("Get extended profile error:", error);
      return { 
        success: false, 
        error: error.message || "Failed to retrieve profile"
      };
    }
  }, [user, setUser]);

  return {
    updateProfile,
    getExtendedProfile
  };
};
