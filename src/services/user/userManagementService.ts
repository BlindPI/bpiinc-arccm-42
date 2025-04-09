
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
    
    // Send invitation email via edge function
    const { error: emailError } = await supabase.functions.invoke('send-notification', {
      body: {
        email,
        title: "Invitation to join Certificate Management System",
        message: `You have been invited to join the Certificate Management System. Click the link below to accept the invitation.`,
        actionUrl: `${window.location.origin}/accept-invitation?token=${tokenData}`,
        type: "INFO",
        emailSubject: "Invitation to join Certificate Management System",
        emailContent: `
          <h1>You've been invited!</h1>
          <p>You have been invited to join the Certificate Management System with the role of ${role}.</p>
          <p>Click the link below to accept the invitation:</p>
          <p><a href="${window.location.origin}/accept-invitation?token=${tokenData}">Accept Invitation</a></p>
          <p>This invitation will expire in 7 days.</p>
        `
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
    
    return data || [];
  } catch (error) {
    console.error("Error fetching user invitations:", error);
    return [];
  }
};
