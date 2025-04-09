
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types for the RPC functions
type CreateUserFromInvitationFn = {
  Args: { invitation_token: string; password: string };
  Returns: { success: boolean; message: string; email: string };
};

export interface InvitationsProps {
  setLoading: (loading: boolean) => void;
}

export const useInvitations = ({ setLoading }: InvitationsProps) => {
  const acceptInvitation = useCallback(async (
    token: string, 
    password: string, 
    displayName?: string
  ) => {
    try {
      setLoading(true);
      
      // Using the correct type definition for RPC
      const { data, error: invitationError } = await supabase.rpc<CreateUserFromInvitationFn>(
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
  }, [setLoading]);

  return {
    acceptInvitation
  };
};
