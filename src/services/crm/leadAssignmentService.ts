
import { supabase } from '@/integrations/supabase/client';

export interface AssignmentRule {
  id: string;
  rule_name: string;
  rule_description?: string;
  assignment_type: 'round_robin' | 'criteria_based' | 'load_balanced';
  criteria: Record<string, any>;
  assigned_users: string[];
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
  // Get all assignment rules
  static async getAssignmentRules(): Promise<AssignmentRule[]> {
    try {
      const { data, error } = await supabase
        .from('crm_assignment_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;

      return (data || []).map(rule => ({
        id: rule.id,
        rule_name: rule.rule_name,
        rule_description: rule.rule_description,
        assignment_type: rule.assignment_type as AssignmentRule['assignment_type'],
        criteria: rule.criteria || {},
        assigned_users: rule.assigned_user_id ? [rule.assigned_user_id] : [],
        priority: rule.priority,
        is_active: rule.is_active,
        created_at: rule.created_at,
        updated_at: rule.updated_at
      }));
    } catch (error) {
      console.error('Error fetching assignment rules:', error);
      return [];
    }
  }

  // Create assignment rule
  static async createAssignmentRule(rule: Omit<AssignmentRule, 'id' | 'created_at' | 'updated_at'>): Promise<AssignmentRule | null> {
    try {
      const { data, error } = await supabase
        .from('crm_assignment_rules')
        .insert({
          rule_name: rule.rule_name,
          rule_description: rule.rule_description,
          assignment_type: rule.assignment_type,
          criteria: rule.criteria,
          assigned_user_id: rule.assigned_users[0] || null,
          priority: rule.priority,
          is_active: rule.is_active
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        rule_name: data.rule_name,
        rule_description: data.rule_description,
        assignment_type: data.assignment_type as AssignmentRule['assignment_type'],
        criteria: data.criteria || {},
        assigned_users: data.assigned_user_id ? [data.assigned_user_id] : [],
        priority: data.priority,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error creating assignment rule:', error);
      return null;
    }
  }

  // Auto assign lead using database function
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

  // Get user workloads
  static async getUserWorkloads(userIds?: string[]): Promise<UserWorkload[]> {
    try {
      let query = supabase
        .from('profiles')
        .select('id, display_name, role');

      if (userIds && userIds.length > 0) {
        query = query.in('id', userIds);
      } else {
        query = query.in('role', ['sales_rep', 'sales_manager', 'admin']);
      }

      const { data: users, error: usersError } = await query;
      if (usersError) throw usersError;

      const workloads: UserWorkload[] = [];

      for (const user of users || []) {
        // Get current lead count
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
        const maxCapacity = this.getMaxCapacityForRole(user.role);
        const availabilityScore = maxCapacity > 0 ? 
          Math.max(0, (maxCapacity - currentLeads) / maxCapacity * 100) : 50;

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

  private static getMaxCapacityForRole(role: string): number {
    const capacityMap: Record<string, number> = {
      'sales_rep': 50,
      'sales_manager': 30,
      'admin': 20,
      'system_admin': 10
    };

    return capacityMap[role] || 25;
  }

  // Get assignment statistics
  static async getAssignmentStatistics() {
    try {
      const { data: assignments, error } = await supabase
        .from('crm_leads')
        .select('assigned_to, lead_status, created_at')
        .not('assigned_to', 'is', null);

      if (error) throw error;

      const stats = {
        total_assigned: assignments?.length || 0,
        unassigned_leads: 0,
        assignments_by_user: new Map(),
        assignments_by_status: new Map(),
        recent_assignments: 0
      };

      // Get unassigned leads count
      const { data: unassigned, error: unassignedError } = await supabase
        .from('crm_leads')
        .select('id', { count: 'exact' })
        .is('assigned_to', null);

      if (!unassignedError) {
        stats.unassigned_leads = unassigned?.length || 0;
      }

      return {
        total_assigned: stats.total_assigned,
        unassigned_leads: stats.unassigned_leads,
        assignments_by_user: {},
        assignments_by_status: {},
        recent_assignments: 0
      };
    } catch (error) {
      console.error('Error getting assignment statistics:', error);
      return {
        total_assigned: 0,
        unassigned_leads: 0,
        assignments_by_user: {},
        assignments_by_status: {},
        recent_assignments: 0
      };
    }
  }
}
