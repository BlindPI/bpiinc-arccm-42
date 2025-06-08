
import { supabase } from '@/integrations/supabase/client';
import type { MemberSkill } from '@/types/enhanced-team-management';

export class SkillsMatrixService {
  static async getUserSkills(userId: string): Promise<MemberSkill[]> {
    try {
      const { data, error } = await supabase
        .from('member_skills')
        .select('*')
        .eq('user_id', userId)
        .order('skill_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user skills:', error);
      return [];
    }
  }

  static async addUserSkill(skill: Partial<MemberSkill>): Promise<MemberSkill | null> {
    try {
      const { data, error } = await supabase
        .from('member_skills')
        .insert(skill)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding user skill:', error);
      return null;
    }
  }

  static async updateUserSkill(skillId: string, updates: Partial<MemberSkill>): Promise<MemberSkill | null> {
    try {
      const { data, error } = await supabase
        .from('member_skills')
        .update(updates)
        .eq('id', skillId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user skill:', error);
      return null;
    }
  }

  static async deleteUserSkill(skillId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('member_skills')
        .delete()
        .eq('id', skillId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting user skill:', error);
      return false;
    }
  }

  static async getTeamSkillsMatrix(teamId: string): Promise<{ user_id: string; display_name: string; skills: MemberSkill[] }[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          user_id,
          profiles!inner(display_name),
          member_skills(*)
        `)
        .eq('team_id', teamId);

      if (error) throw error;

      return (data || []).map(member => ({
        user_id: member.user_id,
        display_name: (member.profiles as any)?.display_name || 'Unknown',
        skills: (member as any).member_skills || []
      }));
    } catch (error) {
      console.error('Error fetching team skills matrix:', error);
      return [];
    }
  }
}

export const skillsMatrixService = new SkillsMatrixService();
