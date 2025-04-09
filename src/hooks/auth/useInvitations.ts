
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define the proper type for the create_user_from_invitation RPC function response
interface CreateUserFromInvitationResponse {
  success: boolean;
  message: string;
  email: string;
}

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
      
      // Using the correct type definition for RPC with proper types for function name and params
      const { data, error: invitationError } = await supabase.rpc(
        'create_user_from_invitation',
        { invitation_token: token, password }
      );
      
      if (invitationError) throw invitationError;
      
      // Handle case where data is undefined
      if (!data) {
        throw new Error('Failed to accept invitation: No response data');
      }
      
      // Handle array response by checking if it's an array and accessing first element
      const responseData = Array.isArray(data) ? data[0] : data;
      
      // Type assertion to safely access the properties
      const typedResponse = responseData as CreateUserFromInvitationResponse;
      
      // Check if operation was successful
      if (!typedResponse.success) {
        throw new Error(typedResponse.message || 'Failed to accept invitation');
      }
      
      // Use the email from the successful response for login
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: typedResponse.email,
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
