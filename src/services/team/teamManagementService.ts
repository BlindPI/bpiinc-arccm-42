
import { supabase } from '@/integrations/supabase/client';
import { EnhancedTeam } from '@/types/team-management';

export class TeamManagementService {
  static async getProviderTeams(providerId: string): Promise<EnhancedTeam[]> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        location:locations(*),
        provider:authorized_providers(*)
      `)
      .eq('provider_id', providerId);
    
    if (error) throw error;
    return data || [];
  }

  static async getTeamById(teamId: string): Promise<EnhancedTeam | null> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        location:locations(*),
        provider:authorized_providers(*)
      `)
      .eq('id', teamId)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateTeamMember(memberId: string, updates: any) {
    const { data, error } = await supabase
      .from('team_members')
      .update(updates)
      .eq('id', memberId);
    
    if (error) throw error;
    return data;
  }

  static async removeTeamMember(memberId: string) {
    const { data, error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);
    
    if (error) throw error;
    return data;
  }
}
