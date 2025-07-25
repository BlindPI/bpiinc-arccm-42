
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

// Helper function to safely parse JSON metadata
function safeParseMetadata(metadata: any): Record<string, any> {
  if (typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata)) {
    return metadata;
  }
  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata);
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
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

      // Log the ownership transfer using real database function
      await supabase.rpc('log_team_lifecycle_event', {
        p_team_id: transfer.teamId,
        p_event_type: 'ownership_transferred',
        p_event_data: {
          from_user: transfer.currentOwnerId,
          to_user: transfer.newOwnerId,
          reason: transfer.reason
        },
        p_affected_user_id: transfer.newOwnerId,
        p_old_values: { owner: transfer.currentOwnerId },
        p_new_values: { owner: transfer.newOwnerId }
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

      // Log the promotion using real database function
      await supabase.rpc('log_team_lifecycle_event', {
        p_team_id: promotion.teamId,
        p_event_type: 'role_changed',
        p_event_data: {
          member_id: promotion.memberId,
          new_role: promotion.newRole,
          permissions: promotion.permissions
        },
        p_affected_user_id: promotion.memberId
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

      // Mark team as self-managed using real metadata update
      const currentMetadata = await this.getTeamMetadata(teamId);
      const updatedMetadata = {
        ...currentMetadata,
        self_managed: true,
        independence_date: new Date().toISOString(),
        former_sa_ad_members: saAdMembers?.map(m => m.user_id) || []
      };

      const { error: updateError } = await supabase
        .from('teams')
        .update({
          metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId);

      if (updateError) throw updateError;

      // Log the independence event
      await supabase.rpc('log_team_lifecycle_event', {
        p_team_id: teamId,
        p_event_type: 'independence_enabled',
        p_event_data: {
          new_owner: newOwnerId,
          former_sa_ad_count: saAdMembers?.length || 0
        }
      });

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

  // Get team self-management status using real database queries
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

      // Safely parse metadata
      const metadata = safeParseMetadata(team?.metadata);
      
      const owner = members?.find(m => {
        const memberPerms = safeParseMetadata(m.permissions);
        return memberPerms?.owner === true;
      });
      
      const saAdMembers = members?.filter(m => ['SA', 'AD'].includes(m.profiles?.role));

      return {
        isSelfManaged: metadata?.self_managed === true,
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

  // Get real team metadata
  private async getTeamMetadata(teamId: string): Promise<Record<string, any>> {
    try {
      const { data: team, error } = await supabase
        .from('teams')
        .select('metadata')
        .eq('id', teamId)
        .single();

      if (error) throw error;
      return safeParseMetadata(team?.metadata);
    } catch (error) {
      console.error('Error getting team metadata:', error);
      return {};
    }
  }
}

export const teamSelfManagementService = new TeamSelfManagementService();
