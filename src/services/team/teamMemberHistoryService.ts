
import { supabase } from '@/integrations/supabase/client';

export interface TeamMemberStatusHistory {
  id: string;
  team_member_id: string;
  old_status?: string;
  new_status?: string;
  old_role?: string;
  new_role?: string;
  changed_by?: string;
  reason?: string;
  effective_date: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface TeamMemberAssignment {
  id: string;
  team_member_id: string;
  location_id: string;
  assignment_type: 'primary' | 'secondary' | 'temporary';
  start_date: string;
  end_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export class TeamMemberHistoryService {
  static async getStatusHistory(teamMemberId: string): Promise<TeamMemberStatusHistory[]> {
    try {
      const { data, error } = await supabase
        .from('team_member_status_history')
        .select('*')
        .eq('team_member_id', teamMemberId)
        .order('effective_date', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      return (data || []).map(item => ({
        id: item.id,
        team_member_id: item.team_member_id,
        old_status: item.old_status,
        new_status: item.new_status,
        old_role: item.old_role,
        new_role: item.new_role,
        changed_by: item.changed_by,
        reason: item.reason,
        effective_date: item.effective_date,
        metadata: (item.metadata as any) || {},
        created_at: item.created_at
      }));
    } catch (error) {
      console.error('Error fetching member status history:', error);
      return [];
    }
  }

  static async logStatusChange(
    teamMemberId: string,
    oldStatus: string,
    newStatus: string,
    oldRole?: string,
    newRole?: string,
    reason?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('team_member_status_history')
        .insert({
          team_member_id: teamMemberId,
          old_status: oldStatus,
          new_status: newStatus,
          old_role: oldRole,
          new_role: newRole,
          reason: reason || 'Manual update',
          metadata: {}
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error logging status change:', error);
      return null;
    }
  }

  static async getLocationAssignments(teamMemberId: string): Promise<TeamMemberAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('team_member_assignments')
        .select('*')
        .eq('team_member_id', teamMemberId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      return (data || []).map(item => ({
        id: item.id,
        team_member_id: item.team_member_id,
        location_id: item.location_id,
        assignment_type: item.assignment_type as 'primary' | 'secondary' | 'temporary',
        start_date: item.start_date,
        end_date: item.end_date,
        created_by: item.created_by,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
    } catch (error) {
      console.error('Error fetching location assignments:', error);
      return [];
    }
  }

  static async createLocationAssignment(
    teamMemberId: string,
    locationId: string,
    assignmentType: 'primary' | 'secondary' | 'temporary',
    endDate?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('team_member_assignments')
        .insert({
          team_member_id: teamMemberId,
          location_id: locationId,
          assignment_type: assignmentType,
          end_date: endDate
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating location assignment:', error);
      return null;
    }
  }
}

export const teamMemberHistoryService = new TeamMemberHistoryService();
