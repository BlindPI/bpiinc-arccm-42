
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthUserWithProfile, UserProfile } from '@/types/auth';

export interface ProfileManagementProps {
  user: AuthUserWithProfile | null;
  setUser: (user: AuthUserWithProfile | null) => void;
}

export const useProfileManagement = ({ user, setUser }: ProfileManagementProps) => {
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      if (!user) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Fix the type issue by properly updating the user state
      setUser(prev => {
        if (!prev) return null;
        // Create a new object that combines the previous user with updates
        return {
          ...prev,
          ...updates
        } as AuthUserWithProfile; // Explicit type cast to ensure correct type
      });
      
      return { success: true };
    } catch (error: any) {
      console.error("Update profile error:", error);
      return { 
        success: false, 
        error: error.message || "Failed to update profile"
      };
    }
  }, [user, setUser]);

  return {
    updateProfile
  };
};
