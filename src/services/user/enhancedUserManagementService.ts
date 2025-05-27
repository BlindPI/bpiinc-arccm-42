
import { supabase } from "@/integrations/supabase/client";
import { InvitationResult, UserInvitation } from "@/types/user-management";
import { UserRole } from "@/types/supabase-schema";
import { UserRoleService } from "./userRoleService";

export class EnhancedUserManagementService {
  static async inviteUserWithDebug(
    email: string,
    role: UserRole,
    invitedBy: string
  ): Promise<InvitationResult> {
    try {
      console.log(`🔍 DEBUG: Starting invitation process for ${email} with role ${role}`);
      
      // Check user permissions first
      const permissionCheck = await UserRoleService.checkInvitationPermissions();
      if (!permissionCheck.canInvite) {
        console.error('🔍 DEBUG: Permission check failed:', permissionCheck.reason);
        return {
          success: false,
          message: permissionCheck.reason || "You don't have permission to invite users"
        };
      }

      console.log('🔍 DEBUG: Permission check passed');

      // Generate invitation token using the database function
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_invitation_token');
      
      if (tokenError) {
        console.error('🔍 DEBUG: Token generation error:', tokenError);
        throw tokenError;
      }

      console.log('🔍 DEBUG: Generated invitation token');

      // Try to create user invitation with detailed logging
      console.log('🔍 DEBUG: Attempting to insert invitation with data:', {
        email,
        initial_role: role,
        invitation_token: tokenData,
        invited_by: invitedBy
      });

      const { data: insertData, error: insertError } = await supabase
        .from('user_invitations')
        .insert({
          email,
          initial_role: role,
          invitation_token: tokenData,
          invited_by: invitedBy
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('🔍 DEBUG: Insert error details:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        throw insertError;
      }

      console.log('🔍 DEBUG: Successfully inserted invitation:', insertData);
      
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
        console.error("🔍 DEBUG: Error sending invitation email:", emailError);
        return {
          success: true,
          message: "User invited successfully, but there was an error sending the email notification.",
          email
        };
      }
      
      console.log('🔍 DEBUG: Successfully sent invitation email');
      
      return {
        success: true,
        message: "User invited successfully. An invitation email has been sent.",
        email
      };
    } catch (error: any) {
      console.error("🔍 DEBUG: Error in inviteUserWithDebug:", error);
      return {
        success: false,
        message: error.message || "Failed to invite user"
      };
    }
  }

  static async createUserDirectlyWithDebug(
    email: string,
    password: string,
    role: UserRole,
    displayName?: string
  ): Promise<InvitationResult> {
    try {
      // Check user permissions first
      const permissionCheck = await UserRoleService.checkInvitationPermissions();
      if (!permissionCheck.canInvite) {
        return {
          success: false,
          message: permissionCheck.reason || "You don't have permission to create users"
        };
      }

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
      console.error("🔍 DEBUG: Error creating user directly:", error);
      return {
        success: false,
        message: error.message || "Failed to create user"
      };
    }
  }

  static async fetchUserInvitations(): Promise<UserInvitation[]> {
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
      console.error("🔍 DEBUG: Error fetching user invitations:", error);
      return [];
    }
  }
}
