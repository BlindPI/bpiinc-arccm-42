import { supabase } from '@/integrations/supabase/client';

export interface TeamMemberInvitation {
  id: string;
  team_id: string;
  invited_email: string;
  role: 'ADMIN' | 'MEMBER';
  invited_by: string;
  invitation_token: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled' | 'declined';
  created_at: string;
  updated_at: string;
  invited_at?: string;
  accepted_at?: string;
  cancelled_at?: string;
  declined_at?: string;
  custom_message?: string;
}

export interface InvitationResult {
  success: boolean;
  message: string;
  invitation?: TeamMemberInvitation;
}

export class TeamMemberInvitationService {
  static async inviteTeamMember(
    teamId: string,
    email: string,
    role: 'ADMIN' | 'MEMBER' = 'MEMBER',
    invitedBy: string
  ): Promise<InvitationResult> {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .single();

      if (existingUser) {
        // Check if already a team member
        const { data: existingMember } = await supabase
          .from('team_members')
          .select('id')
          .eq('team_id', teamId)
          .eq('user_id', existingUser.id)
          .single();

        if (existingMember) {
          return {
            success: false,
            message: 'User is already a member of this team'
          };
        }

        // Add existing user directly to team
        const { data: newMember, error: memberError } = await supabase
          .from('team_members')
          .insert({
            team_id: teamId,
            user_id: existingUser.id,
            role: role
          })
          .select()
          .single();

        if (memberError) throw memberError;

        return {
          success: true,
          message: 'User added to team successfully'
        };
      }

      // Create invitation for new user
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
      const invitationToken = crypto.randomUUID();

      const { data: invitation, error: inviteError } = await supabase
        .from('team_member_invitations')
        .insert({
          team_id: teamId,
          invited_email: email,
          role: role,
          invited_by: invitedBy,
          invitation_token: invitationToken,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Send invitation email via edge function
      try {
        await supabase.functions.invoke('send-invitation', {
          body: {
            email,
            teamId,
            role,
            invitationId: invitation.id,
            invitationToken
          }
        });
      } catch (emailError) {
        console.warn('Failed to send invitation email:', emailError);
        // Don't fail the invitation creation if email fails
      }

      return {
        success: true,
        message: 'Invitation sent successfully',
        invitation: {
          ...invitation,
          invited_email: invitation.invited_email
        } as TeamMemberInvitation
      };

    } catch (error: any) {
      console.error('Error inviting team member:', error);
      return {
        success: false,
        message: error.message || 'Failed to invite team member'
      };
    }
  }

  static async acceptInvitation(invitationId: string, userId: string): Promise<InvitationResult> {
    try {
      // Get invitation details
      const { data: invitation, error: inviteError } = await supabase
        .from('team_member_invitations')
        .select('*')
        .eq('id', invitationId)
        .eq('status', 'pending')
        .single();

      if (inviteError || !invitation) {
        return {
          success: false,
          message: 'Invitation not found or already processed'
        };
      }

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        await supabase
          .from('team_member_invitations')
          .update({ status: 'expired' })
          .eq('id', invitationId);

        return {
          success: false,
          message: 'Invitation has expired'
        };
      }

      // Add user to team
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: invitation.team_id,
          user_id: userId,
          role: invitation.role
        });

      if (memberError) throw memberError;

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('team_member_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId);

      if (updateError) throw updateError;

      return {
        success: true,
        message: 'Successfully joined the team'
      };

    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      return {
        success: false,
        message: error.message || 'Failed to accept invitation'
      };
    }
  }

  static async getPendingInvitations(teamId: string): Promise<TeamMemberInvitation[]> {
    try {
      const { data, error } = await supabase
        .from('team_member_invitations')
        .select('*')
        .eq('team_id', teamId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map the database results to our interface, ensuring role type safety
      return (data || []).map(item => ({
        ...item,
        role: item.role as 'ADMIN' | 'MEMBER'
      })) as TeamMemberInvitation[];

    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      return [];
    }
  }

  static async cancelInvitation(invitationId: string): Promise<InvitationResult> {
    try {
      const { error } = await supabase
        .from('team_member_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      return {
        success: true,
        message: 'Invitation cancelled successfully'
      };

    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      return {
        success: false,
        message: error.message || 'Failed to cancel invitation'
      };
    }
  }

  static async cleanupExpiredInvitations(): Promise<void> {
    try {
      await supabase
        .from('team_member_invitations')
        .update({ status: 'expired' })
        .eq('status', 'pending')
        .lt('expires_at', new Date().toISOString());

    } catch (error) {
      console.error('Error cleaning up expired invitations:', error);
    }
  }
}