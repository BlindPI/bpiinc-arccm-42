
import { supabase } from '@/integrations/supabase/client';

export interface AssignmentRule {
  id: string;
  rule_name: string;
  rule_description?: string;
  assignment_type: 'round_robin' | 'criteria_based' | 'load_balanced';
  criteria: Record<string, any>;
  assigned_user_id?: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserWorkload {
  user_id: string;
  user_name: string;
  current_leads: number;
  max_capacity?: number;
  availability_score: number;
}

export class LeadAssignmentService {
  static async getAssignmentRules(): Promise<AssignmentRule[]> {
    try {
      const { data, error } = await supabase
        .from('crm_assignment_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching assignment rules:', error);
      return [];
    }
  }

  static async createAssignmentRule(rule: Omit<AssignmentRule, 'id' | 'created_at' | 'updated_at'>): Promise<AssignmentRule | null> {
    try {
      const { data, error } = await supabase
        .from('crm_assignment_rules')
        .insert({
          rule_name: rule.rule_name,
          rule_description: rule.rule_description,
          assignment_type: rule.assignment_type,
          criteria: rule.criteria,
          assigned_user_id: rule.assigned_user_id,
          priority: rule.priority,
          is_active: rule.is_active
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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
      return data;
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

  static async autoAssignLead(leadId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('auto_assign_lead', {
        lead_id: leadId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error auto-assigning lead:', error);
      return null;
    }
  }

  static async getUserWorkloads(): Promise<UserWorkload[]> {
    try {
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, display_name, role')
        .in('role', ['SA', 'AD']);

      if (usersError) throw usersError;

      const workloads: UserWorkload[] = [];

      for (const user of users || []) {
        const { data: leads, error: leadsError } = await supabase
          .from('crm_leads')
          .select('id')
          .eq('assigned_to', user.id)
          .in('lead_status', ['new', 'contacted', 'qualified']);

        if (leadsError) {
          console.error(`Error getting leads for user ${user.id}:`, leadsError);
          continue;
        }

        const currentLeads = leads?.length || 0;
        const maxCapacity = 50;
        const availabilityScore = Math.max(0, (maxCapacity - currentLeads) / maxCapacity * 100);

        workloads.push({
          user_id: user.id,
          user_name: user.display_name || 'Unknown',
          current_leads: currentLeads,
          max_capacity: maxCapacity,
          availability_score: availabilityScore
        });
      }

      return workloads;
    } catch (error) {
      console.error('Error getting user workloads:', error);
      return [];
    }
  }
}
