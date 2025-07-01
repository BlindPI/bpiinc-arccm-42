/**
 * PROVIDER MANAGEMENT SYSTEM RESTORATION - PHASE 3: MISSING FUNCTIONALITY
 * 
 * Team Member Invitation Service - Real Database Integration
 * ✅ Connects to actual database tables and functions
 * ✅ No mock or placeholder data
 * ✅ Complete email notification integration
 * ✅ Bulk invitation capabilities
 * ✅ Provider notification system
 */

import { supabase } from '@/integrations/supabase/client';

// =====================================================================================
// TEAM MEMBER INVITATION INTERFACES
// =====================================================================================

export interface TeamMemberInvitation {
  id: string;
  team_id: string;
  invited_email: string;
  invited_name?: string;
  role: 'MEMBER' | 'TRAINER' | 'SUPERVISOR' | 'ADMIN';
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  invitation_token: string;
  invited_by: string;
  invited_by_name?: string;
  custom_message?: string;
  invited_at: string;
  expires_at: string;
  accepted_at?: string;
  declined_at?: string;
  cancelled_at?: string;
  batch_id?: string;
}

export interface ProviderNotification {
  id: string;
  provider_id: string;
  notification_type: string;
  title: string;
  message: string;
  metadata?: any;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  read_at?: string;
  created_at: string;
}

export interface BulkInvitationBatch {
  id: string;
  team_id: string;
  batch_name: string;
  total_invitations: number;
  sent_invitations: number;
  accepted_invitations: number;
  declined_invitations: number;
  expired_invitations: number;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface CreateInvitationRequest {
  team_id: string;
  invited_email: string;
  invited_name?: string;
  role?: 'MEMBER' | 'TRAINER' | 'SUPERVISOR' | 'ADMIN';
  custom_message?: string;
  batch_id?: string;
}

export interface BulkInvitationRequest {
  team_id: string;
  invitations: Array<{
    email: string;
    name?: string;
  }>;
  role: 'MEMBER' | 'TRAINER' | 'SUPERVISOR' | 'ADMIN';
  custom_message?: string;
  batch_name: string;
}

// =====================================================================================
// TEAM MEMBER INVITATION SERVICE
// =====================================================================================

export class TeamMemberInvitationService {

  // =====================================================================================
  // INVITATION MANAGEMENT
  // =====================================================================================

  /**
   * Create a single team member invitation - REAL DATABASE
   */
  async createInvitation(request: CreateInvitationRequest): Promise<string> {
    try {
      const { data: invitationId, error } = await supabase.rpc('create_team_member_invitation', {
        p_team_id: request.team_id,
        p_invited_email: request.invited_email,
        p_invited_name: request.invited_name || null,
        p_role: request.role || 'MEMBER',
        p_custom_message: request.custom_message || null,
        p_batch_id: request.batch_id || null
      });

      if (error) throw error;
      
      // Send invitation email
      await this.sendInvitationEmail(invitationId);
      
      return invitationId;
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
  }

  /**
   * Accept team member invitation - REAL DATABASE
   */
  async acceptInvitation(invitationToken: string): Promise<string> {
    try {
      const { data: teamMemberId, error } = await supabase.rpc('accept_team_member_invitation', {
        p_invitation_token: invitationToken
      });

      if (error) throw error;
      return teamMemberId;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  /**
   * Decline team member invitation - REAL DATABASE
   */
  async declineInvitation(invitationToken: string): Promise<boolean> {
    try {
      const { data: success, error } = await supabase.rpc('decline_team_member_invitation', {
        p_invitation_token: invitationToken
      });

      if (error) throw error;
      return success;
    } catch (error) {
      console.error('Error declining invitation:', error);
      throw error;
    }
  }

  /**
   * Get team invitations - REAL DATABASE
   */
  async getTeamInvitations(teamId: string): Promise<TeamMemberInvitation[]> {
    try {
      const { data, error } = await supabase.rpc('get_team_invitations', {
        p_team_id: teamId
      });

      if (error) throw error;

      return (data || []).map((invitation: any) => ({
        id: invitation.id,
        team_id: teamId,
        invited_email: invitation.invited_email,
        invited_name: invitation.invited_name,
        role: invitation.role,
        status: invitation.status,
        invitation_token: invitation.invitation_token,
        invited_by: invitation.invited_by,
        invited_by_name: invitation.invited_by_name,
        custom_message: invitation.custom_message,
        invited_at: invitation.invited_at,
        expires_at: invitation.expires_at,
        accepted_at: invitation.accepted_at,
        declined_at: invitation.declined_at
      }));
    } catch (error) {
      console.error('Error fetching team invitations:', error);
      throw error;
    }
  }

  /**
   * Get invitation by token - REAL DATABASE
   */
  async getInvitationByToken(token: string): Promise<TeamMemberInvitation | null> {
    try {
      const { data, error } = await supabase
        .from('team_member_invitations')
        .select(`
          *,
          teams!inner(name),
          profiles!invited_by(display_name)
        `)
        .eq('invitation_token', token)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return {
        id: data.id,
        team_id: data.team_id,
        invited_email: data.invited_email,
        invited_name: data.invited_name,
        role: data.role,
        status: data.status,
        invitation_token: data.invitation_token,
        invited_by: data.invited_by,
        invited_by_name: data.profiles?.display_name,
        custom_message: data.custom_message,
        invited_at: data.invited_at,
        expires_at: data.expires_at,
        accepted_at: data.accepted_at,
        declined_at: data.declined_at
      };
    } catch (error) {
      console.error('Error fetching invitation by token:', error);
      throw error;
    }
  }

  // =====================================================================================
  // BULK INVITATION MANAGEMENT
  // =====================================================================================

  /**
   * Create bulk invitations - REAL DATABASE
   */
  async createBulkInvitations(request: BulkInvitationRequest): Promise<string> {
    try {
      // Create bulk invitation batch
      const { data: batch, error: batchError } = await supabase
        .from('bulk_invitation_batches')
        .insert({
          team_id: request.team_id,
          batch_name: request.batch_name,
          total_invitations: request.invitations.length,
          status: 'processing'
        })
        .select('id')
        .single();

      if (batchError) throw batchError;

      const batchId = batch.id;
      let sentCount = 0;

      // Create individual invitations
      for (const invitation of request.invitations) {
        try {
          await this.createInvitation({
            team_id: request.team_id,
            invited_email: invitation.email,
            invited_name: invitation.name,
            role: request.role,
            custom_message: request.custom_message,
            batch_id: batchId
          });
          sentCount++;
        } catch (error) {
          console.error(`Failed to create invitation for ${invitation.email}:`, error);
        }
      }

      // Update batch status
      await supabase
        .from('bulk_invitation_batches')
        .update({
          sent_invitations: sentCount,
          status: sentCount === request.invitations.length ? 'completed' : 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', batchId);

      return batchId;
    } catch (error) {
      console.error('Error creating bulk invitations:', error);
      throw error;
    }
  }

  /**
   * Get bulk invitation batches - REAL DATABASE
   */
  async getBulkInvitationBatches(teamId: string): Promise<BulkInvitationBatch[]> {
    try {
      const { data, error } = await supabase
        .from('bulk_invitation_batches')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching bulk invitation batches:', error);
      throw error;
    }
  }

  // =====================================================================================
  // EMAIL INTEGRATION
  // =====================================================================================

  /**
   * Send invitation email - REAL EMAIL INTEGRATION
   */
  private async sendInvitationEmail(invitationId: string): Promise<void> {
    try {
      // Get invitation details
      const { data: invitation, error: inviteError } = await supabase
        .from('team_member_invitations')
        .select(`
          *,
          teams!inner(name, locations(name)),
          profiles!invited_by(display_name)
        `)
        .eq('id', invitationId)
        .single();

      if (inviteError) throw inviteError;

      // Prepare email content
      const emailSubject = this.getEmailSubject(invitation.role);
      const emailBody = this.getEmailBody(invitation);

      // Send email via Supabase Edge Function or external service
      const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          to: invitation.invited_email,
          subject: emailSubject,
          html: emailBody,
          invitation_token: invitation.invitation_token
        }
      });

      // Log email send attempt
      await supabase
        .from('invitation_email_logs')
        .insert({
          invitation_id: invitationId,
          email_type: 'initial',
          sent_to: invitation.invited_email,
          email_subject: emailSubject,
          email_body: emailBody,
          delivery_status: emailError ? 'failed' : 'sent',
          delivery_details: emailError ? { error: emailError.message } : null
        });

      if (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't throw error - invitation is created, email can be retried
      }
    } catch (error) {
      console.error('Error in sendInvitationEmail:', error);
      // Don't throw error - invitation is created, email can be retried
    }
  }

  /**
   * Get email subject based on role
   */
  private getEmailSubject(role: string): string {
    const subjects = {
      'MEMBER': 'Invitation to Join Training Team',
      'TRAINER': 'Invitation to Join as Team Trainer',
      'SUPERVISOR': 'Invitation to Join as Team Supervisor',
      'ADMIN': 'Invitation to Join as Team Administrator'
    };
    return subjects[role as keyof typeof subjects] || subjects.MEMBER;
  }

  /**
   * Generate email body HTML
   */
  private getEmailBody(invitation: any): string {
    const baseUrl = window.location.origin;
    const acceptUrl = `${baseUrl}/accept-invitation?token=${invitation.invitation_token}`;
    const declineUrl = `${baseUrl}/decline-invitation?token=${invitation.invitation_token}`;

    const roleDescriptions = {
      'MEMBER': 'participate in training activities and access team resources',
      'TRAINER': 'conduct training sessions and manage course content',
      'SUPERVISOR': 'oversee team operations and manage team members',
      'ADMIN': 'have full team management and system administration access'
    };

    const roleDescription = roleDescriptions[invitation.role as keyof typeof roleDescriptions] || roleDescriptions.MEMBER;

    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Team Invitation</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
              .content { background: #f9fafb; padding: 30px; }
              .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
              .button.decline { background: #dc2626; }
              .footer { background: #e5e7eb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Team Invitation</h1>
              </div>
              <div class="content">
                  <h2>You're Invited to Join ${invitation.teams.name}!</h2>
                  
                  <p>Hello${invitation.invited_name ? ` ${invitation.invited_name}` : ''},</p>
                  
                  <p><strong>${invitation.profiles.display_name}</strong> has invited you to join the <strong>${invitation.teams.name}</strong> training team.</p>
                  
                  <p><strong>Your Role:</strong> ${invitation.role}</p>
                  <p>As a ${invitation.role.toLowerCase()}, you will be able to ${roleDescription}.</p>
                  
                  ${invitation.teams.locations?.name ? `<p><strong>Location:</strong> ${invitation.teams.locations.name}</p>` : ''}
                  
                  ${invitation.custom_message ? `
                  <div style="background: white; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
                      <p><strong>Personal Message:</strong></p>
                      <p>${invitation.custom_message}</p>
                  </div>
                  ` : ''}
                  
                  <p>This invitation expires on <strong>${new Date(invitation.expires_at).toLocaleDateString()}</strong>.</p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                      <a href="${acceptUrl}" class="button">Accept Invitation</a>
                      <a href="${declineUrl}" class="button decline">Decline Invitation</a>
                  </div>
                  
                  <p style="font-size: 14px; color: #6b7280;">
                      If the buttons don't work, you can copy and paste these links:<br>
                      Accept: ${acceptUrl}<br>
                      Decline: ${declineUrl}
                  </p>
              </div>
              <div class="footer">
                  <p>This invitation was sent by the Provider Management System.</p>
                  <p>If you believe you received this invitation in error, please contact support.</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  // =====================================================================================
  // PROVIDER NOTIFICATION MANAGEMENT
  // =====================================================================================

  /**
   * Create provider notification - REAL DATABASE
   */
  async createProviderNotification(
    providerId: string,
    type: string,
    title: string,
    message: string,
    metadata?: any,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ): Promise<string> {
    try {
      const { data: notificationId, error } = await supabase.rpc('create_provider_notification', {
        p_provider_id: providerId,
        p_notification_type: type,
        p_title: title,
        p_message: message,
        p_metadata: metadata,
        p_priority: priority
      });

      if (error) throw error;
      return notificationId;
    } catch (error) {
      console.error('Error creating provider notification:', error);
      throw error;
    }
  }

  /**
   * Get provider notifications - REAL DATABASE
   */
  async getProviderNotifications(
    providerId: string,
    unreadOnly: boolean = false,
    limit: number = 50
  ): Promise<ProviderNotification[]> {
    try {
      const { data, error } = await supabase.rpc('get_provider_notifications', {
        p_provider_id: providerId,
        p_unread_only: unreadOnly,
        p_limit: limit
      });

      if (error) throw error;

      return (data || []).map((notification: any) => ({
        id: notification.id,
        provider_id: providerId,
        notification_type: notification.notification_type,
        title: notification.title,
        message: notification.message,
        metadata: notification.metadata,
        priority: notification.priority,
        read_at: notification.read_at,
        created_at: notification.created_at
      }));
    } catch (error) {
      console.error('Error fetching provider notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read - REAL DATABASE
   */
  async markNotificationRead(notificationId: string): Promise<boolean> {
    try {
      const { data: success, error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId
      });

      if (error) throw error;
      return success;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // =====================================================================================
  // UTILITY FUNCTIONS
  // =====================================================================================

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if invitation is expired
   */
  isInvitationExpired(invitation: TeamMemberInvitation): boolean {
    return new Date(invitation.expires_at) <= new Date();
  }

  /**
   * Get invitation status color for UI
   */
  getStatusColor(status: string): string {
    const colors = {
      'pending': 'orange',
      'accepted': 'green',
      'declined': 'red',
      'expired': 'gray',
      'cancelled': 'gray'
    };
    return colors[status as keyof typeof colors] || 'gray';
  }

  /**
   * Get role description for UI
   */
  getRoleDescription(role: string): string {
    const descriptions = {
      'MEMBER': 'Team Member - Participate in training activities and access team resources',
      'TRAINER': 'Trainer - Conduct training sessions and manage course content',
      'SUPERVISOR': 'Supervisor - Oversee team operations and manage team members',
      'ADMIN': 'Administrator - Full team management and system administration'
    };
    return descriptions[role as keyof typeof descriptions] || descriptions.MEMBER;
  }
}

// =====================================================================================
// SINGLETON EXPORT
// =====================================================================================

export const teamMemberInvitationService = new TeamMemberInvitationService();
export default teamMemberInvitationService;