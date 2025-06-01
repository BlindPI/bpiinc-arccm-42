
import { supabase } from '@/integrations/supabase/client';

export interface TeamOwnershipTransfer {
  teamId: string;
  currentOwnerId: string;
  newOwnerId: string;
  reason?: string;
}

export interface TeamMemberPromotion {
  teamId: string;
  memberId: string;
  newRole: 'MEMBER' | 'ADMIN';
  permissions: Record<string, any>;
}

export class TeamSelfManagementService {
  // Transfer team ownership to enable SA/AD independence
  async transferTeamOwnership(transfer: TeamOwnershipTransfer): Promise<void> {
    try {
      // Start transaction-like operations
      const { error: promoteError } = await supabase
        .from('team_members')
        .update({
          role: 'ADMIN',
          permissions: { 
            admin: true, 
            manage_members: true, 
            manage_settings: true,
            owner: true 
          },
          team_position: 'Team Owner',
          updated_at: new Date().toISOString()
        })
        .eq('team_id', transfer.teamId)
        .eq('user_id', transfer.newOwnerId);

      if (promoteError) throw promoteError;

      // Demote or remove previous SA/AD members if they exist
      const { error: demoteError } = await supabase
        .from('team_members')
        .update({
          role: 'MEMBER',
          permissions: {},
          team_position: 'Former Admin',
          updated_at: new Date().toISOString()
        })
        .eq('team_id', transfer.teamId)
        .eq('user_id', transfer.currentOwnerId)
        .neq('user_id', transfer.newOwnerId);

      if (demoteError) throw demoteError;

      // Log the ownership transfer
      await this.logTeamAction(transfer.teamId, 'ownership_transfer', {
        from_user: transfer.currentOwnerId,
        to_user: transfer.newOwnerId,
        reason: transfer.reason
      });

    } catch (error) {
      console.error('Error transferring team ownership:', error);
      throw error;
    }
  }

  // Enable team self-management by promoting members
  async promoteTeamMember(promotion: TeamMemberPromotion): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          role: promotion.newRole,
          permissions: promotion.permissions,
          team_position: promotion.newRole === 'ADMIN' ? 'Team Admin' : 'Team Member',
          updated_at: new Date().toISOString()
        })
        .eq('team_id', promotion.teamId)
        .eq('user_id', promotion.memberId);

      if (error) throw error;

      await this.logTeamAction(promotion.teamId, 'member_promotion', {
        member_id: promotion.memberId,
        new_role: promotion.newRole,
        permissions: promotion.permissions
      });

    } catch (error) {
      console.error('Error promoting team member:', error);
      throw error;
    }
  }

  // Remove SA/AD dependency from teams
  async enableTeamIndependence(teamId: string, newOwnerId: string): Promise<void> {
    try {
      // Get current SA/AD members
      const { data: saAdMembers, error: fetchError } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles!inner(role)
        `)
        .eq('team_id', teamId)
        .in('profiles.role', ['SA', 'AD']);

      if (fetchError) throw fetchError;

      // Transfer ownership to designated member
      if (saAdMembers && saAdMembers.length > 0) {
        await this.transferTeamOwnership({
          teamId,
          currentOwnerId: saAdMembers[0].user_id,
          newOwnerId,
          reason: 'Team independence initiative'
        });
      }

      // Mark team as self-managed
      const { error: updateError } = await supabase
        .from('teams')
        .update({
          metadata: {
            self_managed: true,
            independence_date: new Date().toISOString(),
            former_sa_ad_members: saAdMembers?.map(m => m.user_id) || []
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId);

      if (updateError) throw updateError;

    } catch (error) {
      console.error('Error enabling team independence:', error);
      throw error;
    }
  }

  // Bulk member management operations
  async bulkUpdateMemberRoles(
    teamId: string, 
    updates: Array<{ memberId: string; role: 'MEMBER' | 'ADMIN'; permissions: Record<string, any> }>
  ): Promise<void> {
    try {
      for (const update of updates) {
        await this.promoteTeamMember({
          teamId,
          memberId: update.memberId,
          newRole: update.role,
          permissions: update.permissions
        });
      }
    } catch (error) {
      console.error('Error in bulk member role update:', error);
      throw error;
    }
  }

  // Get team self-management status
  async getTeamManagementStatus(teamId: string): Promise<{
    isSelfManaged: boolean;
    hasOwner: boolean;
    ownerInfo?: any;
    saAdDependency: boolean;
  }> {
    try {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('metadata')
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;

      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles!inner(role, display_name)
        `)
        .eq('team_id', teamId);

      if (membersError) throw membersError;

      const owner = members?.find(m => m.permissions?.owner === true);
      const saAdMembers = members?.filter(m => ['SA', 'AD'].includes(m.profiles?.role));

      return {
        isSelfManaged: team?.metadata?.self_managed === true,
        hasOwner: !!owner,
        ownerInfo: owner ? {
          id: owner.user_id,
          name: owner.profiles?.display_name,
          role: owner.profiles?.role
        } : null,
        saAdDependency: (saAdMembers?.length || 0) > 0
      };

    } catch (error) {
      console.error('Error getting team management status:', error);
      throw error;
    }
  }

  // Log team management actions
  private async logTeamAction(
    teamId: string, 
    action: string, 
    details: Record<string, any>
  ): Promise<void> {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          entity_type: 'team',
          entity_id: teamId,
          action,
          details,
          user_id: (await supabase.auth.getUser()).data.user?.id
        });
    } catch (error) {
      console.error('Error logging team action:', error);
      // Don't throw - logging failures shouldn't break the main operation
    }
  }
}

export const teamSelfManagementService = new TeamSelfManagementService();
