
import { supabase } from '@/integrations/supabase/client';
import type { LeadScoringRule } from '@/types/crm';

export class LeadScoringService {
  static async getLeadScoringRules(): Promise<LeadScoringRule[]> {
    try {
      const { data, error } = await supabase
        .from('crm_lead_scoring_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;

      return (data || []).map(rule => ({
        id: rule.id,
        rule_name: rule.rule_name,
        rule_description: rule.rule_description,
        field_name: rule.field_name,
        operator: rule.operator as LeadScoringRule['operator'],
        field_value: rule.field_value,
        score_points: rule.score_points,
        priority: rule.priority || 1,
        is_active: rule.is_active,
        created_at: rule.created_at,
        updated_at: rule.updated_at,
        created_by: rule.created_by || rule.created_at
      }));
    } catch (error) {
      console.error('Error fetching lead scoring rules:', error);
      return [];
    }
  }

  static async createLeadScoringRule(rule: Omit<LeadScoringRule, 'id' | 'created_at' | 'updated_at'>): Promise<LeadScoringRule | null> {
    try {
      const { data, error } = await supabase
        .from('crm_lead_scoring_rules')
        .insert(rule)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        rule_name: data.rule_name,
        rule_description: data.rule_description,
        field_name: data.field_name,
        operator: data.operator as LeadScoringRule['operator'],
        field_value: data.field_value,
        score_points: data.score_points,
        priority: data.priority || 1,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by || data.created_at
      };
    } catch (error) {
      console.error('Error creating lead scoring rule:', error);
      return null;
    }
  }

  static async updateLeadScoringRule(id: string, updates: Partial<LeadScoringRule>): Promise<LeadScoringRule | null> {
    try {
      const { data, error } = await supabase
        .from('crm_lead_scoring_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        rule_name: data.rule_name,
        rule_description: data.rule_description,
        field_name: data.field_name,
        operator: data.operator as LeadScoringRule['operator'],
        field_value: data.field_value,
        score_points: data.score_points,
        priority: data.priority || 1,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by || data.created_at
      };
    } catch (error) {
      console.error('Error updating lead scoring rule:', error);
      return null;
    }
  }

  static async deleteLeadScoringRule(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('crm_lead_scoring_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting lead scoring rule:', error);
      return false;
    }
  }

  static async calculateLeadScore(leadId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('calculate_lead_score_simple', {
        p_lead_id: leadId
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error calculating lead score:', error);
      return 0;
    }
  }
}
