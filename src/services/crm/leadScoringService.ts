
import { supabase } from '@/integrations/supabase/client';

export interface LeadScoringRule {
  id: string;
  rule_name: string;
  rule_description?: string;
  field_name: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_list';
  field_value: string;
  score_points: number;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ScoringStatistics {
  total_scored_leads: number;
  average_score: number;
  score_distribution: Record<string, number>;
  highest_score: number;
}

export class LeadScoringService {
  static async getLeadScoringRules(): Promise<LeadScoringRule[]> {
    try {
      const { data, error } = await supabase
        .from('crm_lead_scoring_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching lead scoring rules:', error);
      return [];
    }
  }

  static async getScoringRules(): Promise<LeadScoringRule[]> {
    return this.getLeadScoringRules();
  }

  static async getScoringStatistics(): Promise<ScoringStatistics> {
    try {
      // Get basic statistics
      const { data: leads, error } = await supabase
        .from('crm_leads')
        .select('lead_score');

      if (error) throw error;

      const scores = (leads || []).map(l => l.lead_score || 0);
      const total_scored_leads = scores.filter(s => s > 0).length;
      const average_score = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const highest_score = scores.length > 0 ? Math.max(...scores) : 0;

      // Create score distribution
      const score_distribution: Record<string, number> = {
        '0-25': scores.filter(s => s >= 0 && s <= 25).length,
        '26-50': scores.filter(s => s >= 26 && s <= 50).length,
        '51-75': scores.filter(s => s >= 51 && s <= 75).length,
        '76-100': scores.filter(s => s >= 76 && s <= 100).length,
      };

      return {
        total_scored_leads,
        average_score: Math.round(average_score),
        score_distribution,
        highest_score
      };
    } catch (error) {
      console.error('Error fetching scoring statistics:', error);
      return {
        total_scored_leads: 0,
        average_score: 0,
        score_distribution: {},
        highest_score: 0
      };
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
      return data;
    } catch (error) {
      console.error('Error creating lead scoring rule:', error);
      return null;
    }
  }

  static async createScoringRule(rule: Omit<LeadScoringRule, 'id' | 'created_at' | 'updated_at'>): Promise<LeadScoringRule | null> {
    return this.createLeadScoringRule(rule);
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
      return data;
    } catch (error) {
      console.error('Error updating lead scoring rule:', error);
      return null;
    }
  }

  static async updateScoringRule(id: string, updates: Partial<LeadScoringRule>): Promise<LeadScoringRule | null> {
    return this.updateLeadScoringRule(id, updates);
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

  static async deleteScoringRule(id: string): Promise<boolean> {
    return this.deleteLeadScoringRule(id);
  }

  static async getDefaultScoringRules(): Promise<LeadScoringRule[]> {
    return [
      {
        id: 'default-1',
        rule_name: 'Email Provided',
        rule_description: 'Lead has provided email address',
        field_name: 'email',
        operator: 'contains' as const,
        field_value: '@',
        score_points: 10,
        priority: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'default-2',
        rule_name: 'Phone Provided',
        rule_description: 'Lead has provided phone number',
        field_name: 'phone',
        operator: 'contains' as const,
        field_value: '',
        score_points: 15,
        priority: 2,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
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
