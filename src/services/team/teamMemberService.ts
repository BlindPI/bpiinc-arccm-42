import { supabase } from '@/integrations/supabase/client';
import { TeamMemberWithProfile } from '@/types/team-management';

export class TeamMemberService {
  static async getTeamMembers(teamId: string): Promise<TeamMemberWithProfile[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        profiles!inner(*)
      `)
      .eq('team_id', teamId);

    if (error) throw error;

    return (data || []).map(member => ({
      id: member.id,
      team_id: member.team_id,
      user_id: member.user_id,
      role: member.role as 'MEMBER' | 'ADMIN',
      status: member.status as 'active' | 'inactive' | 'on_leave' | 'suspended',
      location_assignment: member.location_assignment,
      assignment_start_date: member.assignment_start_date,
      assignment_end_date: member.assignment_end_date,
      team_position: member.team_position,
      permissions: member.permissions || {},
      created_at: member.created_at,
      updated_at: member.updated_at,
      last_activity: member.last_activity || member.updated_at,
      joined_at: member.created_at, // Add required joined_at property
      display_name: member.profiles?.display_name || 'Unknown User',
      profiles: {
        id: member.profiles?.id || '',
        display_name: member.profiles?.display_name || 'Unknown User',
        email: member.profiles?.email || '',
        role: member.profiles?.role || '',
        created_at: member.profiles?.created_at || '',
        updated_at: member.profiles?.updated_at || '',
        compliance_status: member.profiles?.compliance_status,
        last_training_date: member.profiles?.last_training_date,
        next_training_due: member.profiles?.next_training_due,
        performance_score: member.profiles?.performance_score,
        training_hours: member.profiles?.training_hours,
        certifications_count: member.profiles?.certifications_count,
        location_id: member.profiles?.location_id,
        department: member.profiles?.department,
        supervisor_id: member.profiles?.supervisor_id,
        user_id: member.profiles?.user_id
      }
    }));
  }

  static async updateMemberRole(memberId: string, newRole: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (error) throw error;
  }

  static async updateMemberStatus(memberId: string, newStatus: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .update({ status: newStatus })
      .eq('id', memberId);

    if (error) throw error;
  }

  static async removeMember(memberId: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  }

  static async addMember(teamId: string, userId: string, role: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role,
        status: 'active',
        created_at: new Date().toISOString()
      });

    if (error) throw error;
  }
}
