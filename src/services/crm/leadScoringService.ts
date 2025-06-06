import { supabase } from '@/integrations/supabase/client';

export interface LeadScoringRule {
  id: string;
  rule_name: string;
  rule_description?: string;
  field_name: string;
  operator: string;
  field_value: string;
  score_points: number;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface LeadScore {
  lead_id: string;
  total_score: number;
  scoring_breakdown: {
    rule_id: string;
    rule_name: string;
    points_awarded: number;
    field_matched: string;
  }[];
  calculated_at: string;
}

export interface ScoringCriteria {
  field_name: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range' | 'not_empty';
  field_value: string;
  score_points: number;
}

export class LeadScoringService {
  // Get all active scoring rules
  static async getScoringRules(): Promise<LeadScoringRule[]> {
    try {
      const { data, error } = await supabase
        .from('crm_lead_scoring_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (error) throw error;

      return (data || []).map(rule => ({
        id: rule.id,
        rule_name: rule.rule_name,
        rule_description: rule.rule_description,
        field_name: rule.field_name,
        operator: rule.operator,
        field_value: rule.field_value,
        score_points: rule.score_points,
        priority: rule.priority,
        is_active: rule.is_active,
        created_at: rule.created_at,
        updated_at: rule.updated_at,
        created_by: rule.created_by
      }));
    } catch (error) {
      console.error('Error fetching scoring rules:', error);
      return [];
    }
  }

  // Create a new scoring rule
  static async createScoringRule(rule: Omit<LeadScoringRule, 'id' | 'created_at' | 'updated_at'>): Promise<LeadScoringRule | null> {
    try {
      const { data, error } = await supabase
        .from('crm_lead_scoring_rules')
        .insert({
          rule_name: rule.rule_name,
          rule_description: rule.rule_description,
          field_name: rule.field_name,
          operator: rule.operator,
          field_value: rule.field_value,
          score_points: rule.score_points,
          priority: rule.priority,
          is_active: rule.is_active,
          created_by: rule.created_by
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        rule_name: data.rule_name,
        rule_description: data.rule_description,
        field_name: data.field_name,
        operator: data.operator,
        field_value: data.field_value,
        score_points: data.score_points,
        priority: data.priority,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by
      };
    } catch (error) {
      console.error('Error creating scoring rule:', error);
      return null;
    }
  }

  // Update a scoring rule
  static async updateScoringRule(id: string, updates: Partial<LeadScoringRule>): Promise<LeadScoringRule | null> {
    try {
      const { data, error } = await supabase
        .from('crm_lead_scoring_rules')
        .update({
          ...(updates.rule_name && { rule_name: updates.rule_name }),
          ...(updates.rule_description !== undefined && { rule_description: updates.rule_description }),
          ...(updates.field_name && { field_name: updates.field_name }),
          ...(updates.operator && { operator: updates.operator }),
          ...(updates.field_value && { field_value: updates.field_value }),
          ...(updates.score_points !== undefined && { score_points: updates.score_points }),
          ...(updates.priority !== undefined && { priority: updates.priority }),
          ...(updates.is_active !== undefined && { is_active: updates.is_active }),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        rule_name: data.rule_name,
        rule_description: data.rule_description,
        field_name: data.field_name,
        operator: data.operator,
        field_value: data.field_value,
        score_points: data.score_points,
        priority: data.priority,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by
      };
    } catch (error) {
      console.error('Error updating scoring rule:', error);
      return null;
    }
  }

  // Delete a scoring rule
  static async deleteScoringRule(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('crm_lead_scoring_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting scoring rule:', error);
      return false;
    }
  }

  // Calculate lead score using database function
  static async calculateLeadScore(leadId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('calculate_lead_score', {
        lead_id: leadId
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error calculating lead score:', error);
      return 0;
    }
  }

  // Manual lead scoring calculation (for preview/testing)
  static async calculateLeadScoreManual(leadId: string): Promise<LeadScore | null> {
    try {
      // Get the lead data
      const { data: lead, error: leadError } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError) throw leadError;

      // Get active scoring rules
      const rules = await this.getScoringRules();

      let totalScore = 0;
      const scoringBreakdown: LeadScore['scoring_breakdown'] = [];

      // Apply each rule
      for (const rule of rules) {
        const fieldValue = this.getLeadFieldValue(lead, rule.field_name);
        const matches = this.evaluateRule(fieldValue, rule.operator, rule.field_value);

        if (matches) {
          totalScore += rule.score_points;
          scoringBreakdown.push({
            rule_id: rule.id,
            rule_name: rule.rule_name,
            points_awarded: rule.score_points,
            field_matched: `${rule.field_name}: ${fieldValue}`
          });
        }
      }

      return {
        lead_id: leadId,
        total_score: totalScore,
        scoring_breakdown: scoringBreakdown,
        calculated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error calculating lead score manually:', error);
      return null;
    }
  }

  // Get lead field value by field name
  private static getLeadFieldValue(lead: any, fieldName: string): string {
    const fieldMap: Record<string, string> = {
      'company_size': lead.company_size || '',
      'industry': lead.industry || '',
      'job_title': lead.job_title || '',
      'lead_source': lead.lead_source || '',
      'annual_revenue_range': lead.annual_revenue_range || '',
      'budget_range': lead.budget_range || '',
      'training_urgency': lead.training_urgency || '',
      'estimated_participant_count': lead.estimated_participant_count?.toString() || '0',
      'email': lead.email || '',
      'phone': lead.phone || '',
      'company_name': lead.company_name || '',
      'first_name': lead.first_name || '',
      'last_name': lead.last_name || ''
    };

    return fieldMap[fieldName] || '';
  }

  // Evaluate scoring rule
  private static evaluateRule(fieldValue: string, operator: string, ruleValue: string): boolean {
    const fieldValueLower = fieldValue.toLowerCase();
    const ruleValueLower = ruleValue.toLowerCase();

    switch (operator) {
      case 'equals':
        return fieldValueLower === ruleValueLower;
      
      case 'contains':
        return fieldValueLower.includes(ruleValueLower);
      
      case 'greater_than':
        const fieldNum = parseFloat(fieldValue);
        const ruleNum = parseFloat(ruleValue);
        return !isNaN(fieldNum) && !isNaN(ruleNum) && fieldNum > ruleNum;
      
      case 'less_than':
        const fieldNum2 = parseFloat(fieldValue);
        const ruleNum2 = parseFloat(ruleValue);
        return !isNaN(fieldNum2) && !isNaN(ruleNum2) && fieldNum2 < ruleNum2;
      
      case 'in_range':
        const [min, max] = ruleValue.split('-').map(v => parseFloat(v.trim()));
        const fieldNum3 = parseFloat(fieldValue);
        return !isNaN(fieldNum3) && !isNaN(min) && !isNaN(max) && fieldNum3 >= min && fieldNum3 <= max;
      
      case 'not_empty':
        return fieldValue.trim().length > 0;
      
      default:
        return false;
    }
  }

  // Bulk score multiple leads
  static async bulkScoreLeads(leadIds: string[]): Promise<{ lead_id: string; score: number }[]> {
    const results: { lead_id: string; score: number }[] = [];

    for (const leadId of leadIds) {
      try {
        const score = await this.calculateLeadScore(leadId);
        results.push({ lead_id: leadId, score });

        // Update the lead with the new score
        await supabase
          .from('crm_leads')
          .update({ lead_score: score })
          .eq('id', leadId);
      } catch (error) {
        console.error(`Error scoring lead ${leadId}:`, error);
        results.push({ lead_id: leadId, score: 0 });
      }
    }

    return results;
  }

  // Get scoring statistics
  static async getScoringStatistics() {
    try {
      const { data: leads, error } = await supabase
        .from('crm_leads')
        .select('lead_score')
        .not('lead_score', 'is', null);

      if (error) throw error;

      const scores = (leads || []).map(lead => lead.lead_score || 0);
      
      if (scores.length === 0) {
        return {
          total_scored_leads: 0,
          average_score: 0,
          highest_score: 0,
          lowest_score: 0,
          score_distribution: {
            high: 0,    // 80+
            medium: 0,  // 40-79
            low: 0      // 0-39
          }
        };
      }

      const total = scores.length;
      const average = scores.reduce((sum, score) => sum + score, 0) / total;
      const highest = Math.max(...scores);
      const lowest = Math.min(...scores);

      const distribution = scores.reduce((dist, score) => {
        if (score >= 80) dist.high++;
        else if (score >= 40) dist.medium++;
        else dist.low++;
        return dist;
      }, { high: 0, medium: 0, low: 0 });

      return {
        total_scored_leads: total,
        average_score: Math.round(average * 100) / 100,
        highest_score: highest,
        lowest_score: lowest,
        score_distribution: distribution
      };
    } catch (error) {
      console.error('Error getting scoring statistics:', error);
      return {
        total_scored_leads: 0,
        average_score: 0,
        highest_score: 0,
        lowest_score: 0,
        score_distribution: { high: 0, medium: 0, low: 0 }
      };
    }
  }

  // Get default scoring rules templates
  static getDefaultScoringRules(): Omit<LeadScoringRule, 'id' | 'created_at' | 'updated_at'>[] {
    return [
      {
        rule_name: 'Enterprise Company Size',
        rule_description: 'Large companies with 500+ employees',
        field_name: 'company_size',
        operator: 'equals',
        field_value: 'enterprise',
        score_points: 25,
        priority: 1,
        is_active: true
      },
      {
        rule_name: 'High Budget Range',
        rule_description: 'Budget over $50,000',
        field_name: 'budget_range',
        operator: 'contains',
        field_value: '50000+',
        score_points: 20,
        priority: 2,
        is_active: true
      },
      {
        rule_name: 'Decision Maker Title',
        rule_description: 'C-level or VP titles',
        field_name: 'job_title',
        operator: 'contains',
        field_value: 'ceo|cto|cfo|vp|director',
        score_points: 15,
        priority: 3,
        is_active: true
      },
      {
        rule_name: 'Urgent Training Need',
        rule_description: 'Immediate or urgent training requirements',
        field_name: 'training_urgency',
        operator: 'equals',
        field_value: 'urgent',
        score_points: 15,
        priority: 4,
        is_active: true
      },
      {
        rule_name: 'Large Participant Count',
        rule_description: 'More than 50 participants',
        field_name: 'estimated_participant_count',
        operator: 'greater_than',
        field_value: '50',
        score_points: 10,
        priority: 5,
        is_active: true
      },
      {
        rule_name: 'Referral Source',
        rule_description: 'Leads from referrals',
        field_name: 'lead_source',
        operator: 'equals',
        field_value: 'referral',
        score_points: 10,
        priority: 6,
        is_active: true
      },
      {
        rule_name: 'Healthcare Industry',
        rule_description: 'Healthcare and medical industry',
        field_name: 'industry',
        operator: 'contains',
        field_value: 'healthcare|medical|hospital',
        score_points: 8,
        priority: 7,
        is_active: true
      },
      {
        rule_name: 'Complete Contact Info',
        rule_description: 'Has both email and phone',
        field_name: 'phone',
        operator: 'not_empty',
        field_value: '',
        score_points: 5,
        priority: 8,
        is_active: true
      }
    ];
  }
}