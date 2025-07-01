
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

      // Use the edge function instead of direct database access
      console.log('🔍 DEBUG: Calling send-invitation edge function');
      
      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-invitation', {
        body: {
          email,
          invitationToken: null, // Will be generated in the edge function
          invitedBy,
          role
        }
      });
      
      if (emailError) {
        console.error("🔍 DEBUG: Error calling send-invitation function:", emailError);
        return {
          success: false,
          message: `Failed to send invitation: ${emailError.message}`
        };
      }
      
      if (!emailResult?.success) {
        console.error("🔍 DEBUG: Edge function returned error:", emailResult?.error);
        return {
          success: false,
          message: emailResult?.message || "Failed to send invitation"
        };
      }
      
      console.log('🔍 DEBUG: Successfully sent invitation using edge function');
      
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
