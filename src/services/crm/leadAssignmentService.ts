
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

export interface AssignmentStatistics {
  total_assigned: number;
  unassigned_leads: number;
  recent_assignments: Array<{
    lead_id: string;
    assigned_to: string;
    assigned_at: string;
  }>;
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

  static async getDefaultAssignmentRules(): Promise<AssignmentRule[]> {
    return [
      {
        id: 'default-1',
        rule_name: 'Round Robin Assignment',
        rule_description: 'Assign leads in round robin fashion',
        assignment_type: 'round_robin' as const,
        criteria: {},
        priority: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  static async getAssignmentStatistics(): Promise<AssignmentStatistics> {
    try {
      const { data: leads, error } = await supabase
        .from('crm_leads')
        .select('id, assigned_to, created_at');

      if (error) throw error;

      const total_assigned = (leads || []).filter(l => l.assigned_to).length;
      const unassigned_leads = (leads || []).filter(l => !l.assigned_to).length;
      const recent_assignments = (leads || [])
        .filter(l => l.assigned_to)
        .slice(0, 10)
        .map(l => ({
          lead_id: l.id,
          assigned_to: l.assigned_to!,
          assigned_at: l.created_at
        }));

      return {
        total_assigned,
        unassigned_leads,
        recent_assignments
      };
    } catch (error) {
      console.error('Error fetching assignment statistics:', error);
      return {
        total_assigned: 0,
        unassigned_leads: 0,
        recent_assignments: []
      };
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
