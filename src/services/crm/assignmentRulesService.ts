
import { supabase } from '@/integrations/supabase/client';
import type { AssignmentRule } from '@/types/crm';

export class AssignmentRulesService {
  static async getAssignmentRules(): Promise<AssignmentRule[]> {
    try {
      const { data, error } = await supabase
        .from('crm_assignment_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(rule => ({
        ...rule,
        criteria: typeof rule.criteria === 'string' ? JSON.parse(rule.criteria) : rule.criteria || {},
        working_hours: typeof rule.working_hours === 'string' ? JSON.parse(rule.working_hours) : rule.working_hours || {},
        escalation_rules: typeof rule.escalation_rules === 'string' ? JSON.parse(rule.escalation_rules) : rule.escalation_rules || {},
        assignment_type: (rule.assignment_type as AssignmentRule['assignment_type']) || 'round_robin'
      }));
    } catch (error) {
      console.error('Error fetching assignment rules:', error);
      return [];
    }
  }

  static async createAssignmentRule(rule: Omit<AssignmentRule, 'id' | 'created_at' | 'updated_at'>): Promise<AssignmentRule | null> {
    try {
      const { data, error } = await supabase
        .from('crm_assignment_rules')
        .insert(rule)
        .select()
        .single();

      if (error) throw error;
      
      return data ? {
        ...data,
        criteria: typeof data.criteria === 'string' ? JSON.parse(data.criteria) : data.criteria || {},
        working_hours: typeof data.working_hours === 'string' ? JSON.parse(data.working_hours) : data.working_hours || {},
        escalation_rules: typeof data.escalation_rules === 'string' ? JSON.parse(data.escalation_rules) : data.escalation_rules || {},
        assignment_type: (data.assignment_type as AssignmentRule['assignment_type']) || 'round_robin'
      } : null;
    } catch (error) {
      console.error('Error creating assignment rule:', error);
      return null;
    }
  }

  static async updateAssignmentRule(id: string, updates: Partial<AssignmentRule>): Promise<AssignmentRule | null> {
    try {
      const { data, error } = await supabase
        .from('crm_assignment_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      return data ? {
        ...data,
        criteria: typeof data.criteria === 'string' ? JSON.parse(data.criteria) : data.criteria || {},
        working_hours: typeof data.working_hours === 'string' ? JSON.parse(data.working_hours) : data.working_hours || {},
        escalation_rules: typeof data.escalation_rules === 'string' ? JSON.parse(data.escalation_rules) : data.escalation_rules || {},
        assignment_type: (data.assignment_type as AssignmentRule['assignment_type']) || 'round_robin'
      } : null;
    } catch (error) {
      console.error('Error updating assignment rule:', error);
      return null;
    }
  }

  static async deleteAssignmentRule(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('crm_assignment_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting assignment rule:', error);
      return false;
    }
  }
}
