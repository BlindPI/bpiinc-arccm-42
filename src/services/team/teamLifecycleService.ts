
import { supabase } from '@/integrations/supabase/client';
import type { TeamWorkflow, TeamLifecycleEvent, TeamBulkOperation } from '@/types/team-lifecycle';
import type { Team } from '@/types/team-management';

export class TeamLifecycleService {
  // Archive Team
  async archiveTeam(teamId: string, reason: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('teams')
      .update({
        status: 'inactive',
        archived_at: new Date().toISOString(),
        archived_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', teamId);

    if (error) throw error;

    // Log lifecycle event
    await this.logLifecycleEvent(teamId, 'team_archived', {
      reason,
      archived_by: userId
    }, userId);
  }

  // Merge Teams
  async mergeTeams(
    sourceTeamIds: string[], 
    targetTeamId: string, 
    userId: string
  ): Promise<void> {
    // Move all members from source teams to target team
    for (const sourceTeamId of sourceTeamIds) {
      const { error: memberError } = await supabase
        .from('team_members')
        .update({ team_id: targetTeamId })
        .eq('team_id', sourceTeamId);

      if (memberError) throw memberError;

      // Archive source team
      await this.archiveTeam(sourceTeamId, `Merged into team ${targetTeamId}`, userId);

      // Log merge event
      await this.logLifecycleEvent(targetTeamId, 'team_merged', {
        source_team_id: sourceTeamId,
        merged_by: userId
      }, userId);
    }
  }

  // Split Team
  async splitTeam(
    sourceTeamId: string,
    newTeamData: {
      name: string;
      description?: string;
      location_id?: string;
    },
    memberIds: string[],
    userId: string
  ): Promise<string> {
    // Create new team
    const { data: newTeam, error: teamError } = await supabase
      .from('teams')
      .insert({
        ...newTeamData,
        team_type: 'operational',
        status: 'active',
        split_from_team_id: sourceTeamId,
        created_by: userId
      })
      .select()
      .single();

    if (teamError) throw teamError;

    // Move selected members to new team
    const { error: memberError } = await supabase
      .from('team_members')
      .update({ team_id: newTeam.id })
      .in('id', memberIds);

    if (memberError) throw memberError;

    // Log split events
    await this.logLifecycleEvent(sourceTeamId, 'team_split', {
      new_team_id: newTeam.id,
      moved_members: memberIds.length,
      split_by: userId
    }, userId);

    await this.logLifecycleEvent(newTeam.id, 'team_created_from_split', {
      source_team_id: sourceTeamId,
      initial_members: memberIds.length,
      created_by: userId
    }, userId);

    return newTeam.id;
  }

  // Transfer Team
  async transferTeam(
    teamId: string,
    newOwnerId: string,
    userId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('teams')
      .update({
        created_by: newOwnerId,
        updated_at: new Date().toISOString()
      })
      .eq('id', teamId);

    if (error) throw error;

    // Update team admin
    const { error: memberError } = await supabase
      .from('team_members')
      .update({ role: 'ADMIN' })
      .eq('team_id', teamId)
      .eq('user_id', newOwnerId);

    if (memberError) throw memberError;

    await this.logLifecycleEvent(teamId, 'team_transferred', {
      new_owner: newOwnerId,
      transferred_by: userId
    }, userId);
  }

  // Log Lifecycle Event
  async logLifecycleEvent(
    teamId: string,
    eventType: string,
    eventData: Record<string, any>,
    performedBy: string,
    affectedUserId?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('team_lifecycle_events')
      .insert({
        team_id: teamId,
        event_type: eventType,
        event_data: eventData,
        performed_by: performedBy,
        affected_user_id: affectedUserId
      });

    if (error) throw error;
  }

  // Get Lifecycle Events
  async getLifecycleEvents(teamId: string): Promise<TeamLifecycleEvent[]> {
    const { data, error } = await supabase
      .from('team_lifecycle_events')
      .select(`
        *,
        profiles:performed_by(display_name)
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const teamLifecycleService = new TeamLifecycleService();
