
import { supabase } from '@/integrations/supabase/client';
import type { TeamLifecycleEvent } from '@/types/team-management';

export interface TeamArchivalRequest {
  teamId: string;
  reason: string;
  archivedBy: string;
  archiveDate: string;
}

export interface TeamSplitRequest {
  originalTeamId: string;
  newTeamData: {
    name: string;
    description?: string;
    location_id?: string;
  };
  memberIds: string[];
  createdBy: string;
}

export interface TeamTransferRequest {
  teamId: string;
  newOwnerId: string;
  transferredBy: string;
  reason?: string;
}

export class TeamLifecycleService {
  static async logLifecycleEvent(
    teamId: string,
    eventType: string,
    eventData: Record<string, any>,
    performedBy: string,
    affectedUserId?: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('log_team_lifecycle_event', {
        p_team_id: teamId,
        p_event_type: eventType,
        p_event_data: eventData,
        p_affected_user_id: affectedUserId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error logging lifecycle event:', error);
      throw error;
    }
  }

  static async getTeamLifecycleEvents(teamId: string): Promise<TeamLifecycleEvent[]> {
    try {
      const { data, error } = await supabase
        .from('team_lifecycle_events')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching lifecycle events:', error);
      return [];
    }
  }

  // Alias for component compatibility
  static async getLifecycleEvents(teamId: string): Promise<TeamLifecycleEvent[]> {
    return this.getTeamLifecycleEvents(teamId);
  }

  static async archiveTeam(
    teamId: string,
    reason: string,
    archivedBy: string
  ): Promise<void> {
    try {
      // Update team status to archived
      const { error: updateError } = await supabase
        .from('teams')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString() 
        })
        .eq('id', teamId);

      if (updateError) throw updateError;

      // Log the archival event
      await this.logLifecycleEvent(
        teamId,
        'team_archived',
        { reason, archived_date: new Date().toISOString() },
        archivedBy
      );

      // Update all team members to inactive
      const { error: membersError } = await supabase
        .from('team_members')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('team_id', teamId);

      if (membersError) throw membersError;

    } catch (error) {
      console.error('Error archiving team:', error);
      throw error;
    }
  }

  static async splitTeam(
    originalTeamId: string,
    newTeamData: {
      name: string;
      description?: string;
      location_id?: string;
    },
    memberIds: string[],
    createdBy: string
  ): Promise<string> {
    try {
      // Get original team data
      const { data: originalTeam, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', originalTeamId)
        .single();

      if (teamError) throw teamError;

      // Create new team
      const { data: newTeam, error: createError } = await supabase
        .from('teams')
        .insert({
          name: newTeamData.name,
          description: newTeamData.description,
          team_type: originalTeam.team_type,
          location_id: newTeamData.location_id || originalTeam.location_id,
          provider_id: originalTeam.provider_id,
          created_by: createdBy,
          status: 'active',
          performance_score: 0
        })
        .select()
        .single();

      if (createError) throw createError;

      // Transfer specified members to new team
      if (memberIds.length > 0) {
        const { error: transferError } = await supabase
          .from('team_members')
          .update({ team_id: newTeam.id })
          .in('id', memberIds);

        if (transferError) throw transferError;
      }

      // Log the split event
      await this.logLifecycleEvent(
        originalTeamId,
        'team_split',
        { 
          new_team_id: newTeam.id, 
          new_team_name: newTeamData.name,
          members_transferred: memberIds.length 
        },
        createdBy
      );

      return newTeam.id;
    } catch (error) {
      console.error('Error splitting team:', error);
      throw error;
    }
  }

  static async transferTeam(
    teamId: string,
    newOwnerId: string,
    transferredBy: string,
    reason?: string
  ): Promise<void> {
    try {
      // Update team's created_by to new owner
      const { error: updateError } = await supabase
        .from('teams')
        .update({ 
          created_by: newOwnerId,
          updated_at: new Date().toISOString() 
        })
        .eq('id', teamId);

      if (updateError) throw updateError;

      // Ensure new owner is a team admin
      const { error: memberError } = await supabase
        .from('team_members')
        .upsert({
          team_id: teamId,
          user_id: newOwnerId,
          role: 'ADMIN',
          status: 'active',
          permissions: { admin: true, manage_members: true },
          assignment_start_date: new Date().toISOString()
        });

      if (memberError) throw memberError;

      // Log the transfer event
      await this.logLifecycleEvent(
        teamId,
        'team_transferred',
        { 
          new_owner_id: newOwnerId,
          previous_owner_id: transferredBy,
          reason: reason || 'Manual transfer'
        },
        transferredBy,
        newOwnerId
      );

    } catch (error) {
      console.error('Error transferring team:', error);
      throw error;
    }
  }
}

export const teamLifecycleService = new TeamLifecycleService();
