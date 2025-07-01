
import { supabase } from '@/integrations/supabase/client';
import type { MemberSkill } from '@/types/enhanced-team-management';

// Database interface that matches actual schema
interface MemberSkillInsert {
  skill_name: string;
  user_id?: string;
  proficiency_level?: number;
  certified?: boolean;
  certification_date?: string;
  expiry_date?: string;
  verified_by?: string;
  metadata?: any;
}

// Safe JSON conversion
function safeJsonToRecord(json: any): Record<string, any> {
  if (typeof json === 'object' && json !== null) {
    return json as Record<string, any>;
  }
  if (typeof json === 'string') {
    try {
      return JSON.parse(json);
    } catch {
      return {};
    }
  }
  return {};
}

// Safe conversion from partial to database format
function prepareSkillForInsert(skill: Partial<MemberSkill>): MemberSkillInsert | null {
  if (!skill.skill_name) {
    return null;
  }

  return {
    skill_name: skill.skill_name,
    user_id: skill.user_id,
    proficiency_level: skill.proficiency_level,
    certified: skill.certified,
    certification_date: skill.certification_date,
    expiry_date: skill.expiry_date,
    verified_by: skill.verified_by,
    metadata: skill.metadata
  };
}

// Convert database record to type-safe MemberSkill
function convertToMemberSkill(dbRecord: any): MemberSkill {
  return {
    id: dbRecord.id,
    user_id: dbRecord.user_id,
    skill_name: dbRecord.skill_name,
    proficiency_level: dbRecord.proficiency_level,
    certified: dbRecord.certified,
    certification_date: dbRecord.certification_date,
    expiry_date: dbRecord.expiry_date,
    verified_by: dbRecord.verified_by,
    metadata: safeJsonToRecord(dbRecord.metadata),
    created_at: dbRecord.created_at,
    updated_at: dbRecord.updated_at
  };
}

export class SkillsMatrixService {
  static async getUserSkills(userId: string): Promise<MemberSkill[]> {
    try {
      const { data, error } = await supabase
        .from('member_skills')
        .select('*')
        .eq('user_id', userId)
        .order('skill_name');

      if (error) throw error;
      return (data || []).map(convertToMemberSkill);
    } catch (error) {
      console.error('Error fetching user skills:', error);
      return [];
    }
  }

  static async addUserSkill(skill: Partial<MemberSkill>): Promise<MemberSkill | null> {
    try {
      const insertData = prepareSkillForInsert(skill);
      if (!insertData) {
        throw new Error('Missing required field: skill_name is required');
      }

      const { data, error } = await supabase
        .from('member_skills')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return convertToMemberSkill(data);
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
      return convertToMemberSkill(data);
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
        skills: ((member as any).member_skills || []).map(convertToMemberSkill)
      }));
    } catch (error) {
      console.error('Error fetching team skills matrix:', error);
      return [];
    }
  }
}

export const skillsMatrixService = new SkillsMatrixService();
