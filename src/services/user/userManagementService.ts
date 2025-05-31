
import { supabase } from "@/integrations/supabase/client";
import { InvitationResult, UserInvitation } from "@/types/user-management";
import { UserRole } from "@/types/supabase-schema";

export const inviteUser = async (
  email: string,
  role: UserRole,
  invitedBy: string
): Promise<InvitationResult> => {
  try {
    console.log(`Inviting user ${email} with role ${role}`);
    
    // Generate invitation token
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('generate_invitation_token');
    
    if (tokenError) throw tokenError;
    
    // Create user invitation in database
    const { data, error } = await supabase
      .from('user_invitations')
      .insert({
        email,
        initial_role: role,
        invitation_token: tokenData,
        invited_by: invitedBy
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Send invitation email via the custom send-invitation edge function
    const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-invitation', {
      body: {
        email,
        invitationToken: tokenData,
        invitedBy,
        role
      }
    });
    
    if (emailError) {
      console.error("Error sending invitation email:", emailError);
      return {
        success: true,
        message: "User invited successfully, but there was an error sending the email notification.",
        email
      };
    }
    
    if (!emailResult?.success) {
      console.error("Email service returned error:", emailResult?.error);
      return {
        success: true,
        message: "User invited successfully, but there was an error sending the email notification.",
        email
      };
    }
    
    return {
      success: true,
      message: "User invited successfully. An invitation email has been sent.",
      email
    };
  } catch (error: any) {
    console.error("Error inviting user:", error);
    return {
      success: false,
      message: error.message || "Failed to invite user"
    };
  }
};

export const createUserDirectly = async (
  email: string,
  password: string,
  role: UserRole,
  displayName?: string
): Promise<InvitationResult> => {
  try {
    // Call the create-user edge function to create a user with admin privileges
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: {
        email,
        password,
        role,
        display_name: displayName || email.split('@')[0]
      }
    });
    
    if (error) throw error;
    
    if (!data.success) {
      throw new Error(data.message || "Failed to create user");
    }
    
    return {
      success: true,
      message: "User created successfully",
      email
    };
  } catch (error: any) {
    console.error("Error creating user directly:", error);
    return {
      success: false,
      message: error.message || "Failed to create user"
    };
  }
};

export const fetchUserInvitations = async (): Promise<UserInvitation[]> => {
  try {
    const { data, error } = await supabase
      .from('user_invitations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Make sure to cast the initial_role field to UserRole
    return (data || []).map(invitation => ({
      ...invitation,
      initial_role: invitation.initial_role as UserRole
    }));
  } catch (error) {
    console.error("Error fetching user invitations:", error);
    return [];
  }
};
