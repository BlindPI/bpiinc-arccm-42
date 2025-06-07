
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
        ...rule,
        operator: rule.operator as 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_list'
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
        ...data,
        operator: data.operator as 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_list'
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
        ...data,
        operator: data.operator as 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_list'
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
}
