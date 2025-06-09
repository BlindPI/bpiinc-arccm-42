
import { supabase } from '@/integrations/supabase/client';

export interface TeamMemberWithProfile {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  last_activity: string;
  permissions: string[];
  profiles: {
    id: string;
    display_name: string;
    email: string;
    role: string;
    organization?: string;
    phone?: string;
    job_title?: string;
  };
}

export class RealEnterpriseTeamService {
  static async getTeamMembers(teamId: string): Promise<TeamMemberWithProfile[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        profiles:user_id (
          id,
          display_name,
          email,
          role,
          organization,
          phone,
          job_title
        )
      `)
      .eq('team_id', teamId)
      .order('joined_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async updateMemberRole(memberId: string, newRole: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId);

    if (error) throw error;
  }

  static async updateMemberStatus(memberId: string, newStatus: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
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
        joined_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  static async bulkUpdateMembers(memberIds: string[], updates: Partial<TeamMemberWithProfile>): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .in('id', memberIds);

    if (error) throw error;
  }
}
