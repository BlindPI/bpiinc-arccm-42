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
  created_by?: string;
}

export interface AssignmentCriteria {
  field_name: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_list';
  field_value: string | string[];
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
        assignment_type: rule.assignment_type,
        criteria: rule.criteria || {},
        assigned_users: rule.assigned_users || [],
        priority: rule.priority,
        is_active: rule.is_active,
        created_at: rule.created_at,
        updated_at: rule.updated_at,
        created_by: rule.created_by
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
          assigned_users: rule.assigned_users,
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
        assignment_type: data.assignment_type,
        criteria: data.criteria || {},
        assigned_users: data.assigned_users || [],
        priority: data.priority,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by
      };
    } catch (error) {
      console.error('Error creating assignment rule:', error);
      return null;
    }
  }

  // Update assignment rule
  static async updateAssignmentRule(id: string, updates: Partial<AssignmentRule>): Promise<AssignmentRule | null> {
    try {
      const { data, error } = await supabase
        .from('crm_assignment_rules')
        .update({
          ...(updates.rule_name && { rule_name: updates.rule_name }),
          ...(updates.rule_description !== undefined && { rule_description: updates.rule_description }),
          ...(updates.assignment_type && { assignment_type: updates.assignment_type }),
          ...(updates.criteria && { criteria: updates.criteria }),
          ...(updates.assigned_users && { assigned_users: updates.assigned_users }),
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
        assignment_type: data.assignment_type,
        criteria: data.criteria || {},
        assigned_users: data.assigned_users || [],
        priority: data.priority,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
        created_by: data.created_by
      };
    } catch (error) {
      console.error('Error updating assignment rule:', error);
      return null;
    }
  }

  // Delete assignment rule
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

  // Manual assignment logic (for preview/testing)
  static async assignLeadManual(leadId: string): Promise<string | null> {
    try {
      // Get the lead data
      const { data: lead, error: leadError } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError) throw leadError;

      // Get active assignment rules
      const rules = await this.getAssignmentRules();
      const activeRules = rules.filter(rule => rule.is_active);

      // Find matching rule
      for (const rule of activeRules) {
        if (this.evaluateAssignmentCriteria(lead, rule.criteria)) {
          const assignedUser = await this.selectUserForAssignment(rule);
          if (assignedUser) {
            // Update the lead with assignment
            await supabase
              .from('crm_leads')
              .update({ assigned_to: assignedUser })
              .eq('id', leadId);

            return assignedUser;
          }
        }
      }

      // If no rule matches, use default round-robin
      const defaultAssignedUser = await this.getNextRoundRobinUser();
      if (defaultAssignedUser) {
        await supabase
          .from('crm_leads')
          .update({ assigned_to: defaultAssignedUser })
          .eq('id', leadId);
      }

      return defaultAssignedUser;
    } catch (error) {
      console.error('Error manually assigning lead:', error);
      return null;
    }
  }

  // Evaluate assignment criteria
  private static evaluateAssignmentCriteria(lead: any, criteria: Record<string, any>): boolean {
    if (!criteria || Object.keys(criteria).length === 0) {
      return true; // No criteria means always match
    }

    for (const [field, condition] of Object.entries(criteria)) {
      const leadValue = this.getLeadFieldValue(lead, field);
      
      if (!this.evaluateCondition(leadValue, condition)) {
        return false;
      }
    }

    return true;
  }

  // Get lead field value
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
      'lead_score': lead.lead_score?.toString() || '0',
      'province': lead.province || '',
      'city': lead.city || ''
    };

    return fieldMap[fieldName] || '';
  }

  // Evaluate single condition
  private static evaluateCondition(fieldValue: string, condition: any): boolean {
    const { operator, value } = condition;
    const fieldValueLower = fieldValue.toLowerCase();

    switch (operator) {
      case 'equals':
        return fieldValueLower === value.toLowerCase();
      
      case 'contains':
        return fieldValueLower.includes(value.toLowerCase());
      
      case 'greater_than':
        const fieldNum = parseFloat(fieldValue);
        const conditionNum = parseFloat(value);
        return !isNaN(fieldNum) && !isNaN(conditionNum) && fieldNum > conditionNum;
      
      case 'less_than':
        const fieldNum2 = parseFloat(fieldValue);
        const conditionNum2 = parseFloat(value);
        return !isNaN(fieldNum2) && !isNaN(conditionNum2) && fieldNum2 < conditionNum2;
      
      case 'in_list':
        const valueList = Array.isArray(value) ? value : [value];
        return valueList.some(v => fieldValueLower === v.toLowerCase());
      
      default:
        return false;
    }
  }

  // Select user for assignment based on rule type
  private static async selectUserForAssignment(rule: AssignmentRule): Promise<string | null> {
    const { assignment_type, assigned_users } = rule;

    if (!assigned_users || assigned_users.length === 0) {
      return null;
    }

    switch (assignment_type) {
      case 'round_robin':
        return this.getNextRoundRobinUser(assigned_users);
      
      case 'load_balanced':
        return this.getLeastLoadedUser(assigned_users);
      
      case 'criteria_based':
        // For criteria-based, we can add more sophisticated logic
        // For now, use round-robin among eligible users
        return this.getNextRoundRobinUser(assigned_users);
      
      default:
        return assigned_users[0];
    }
  }

  // Get next user in round-robin sequence
  private static async getNextRoundRobinUser(userList?: string[]): Promise<string | null> {
    try {
      // Get eligible users (either from provided list or all sales users)
      let eligibleUsers = userList;
      
      if (!eligibleUsers || eligibleUsers.length === 0) {
        const { data: salesUsers, error } = await supabase
          .from('profiles')
          .select('id')
          .in('role', ['sales_rep', 'sales_manager', 'admin']);

        if (error) throw error;
        eligibleUsers = (salesUsers || []).map(user => user.id);
      }

      if (eligibleUsers.length === 0) {
        return null;
      }

      // Simple round-robin: get user with least recent assignment
      const { data: recentAssignments, error } = await supabase
        .from('crm_leads')
        .select('assigned_to, created_at')
        .in('assigned_to', eligibleUsers)
        .not('assigned_to', 'is', null)
        .order('created_at', { ascending: false })
        .limit(eligibleUsers.length);

      if (error) throw error;

      // Find user with least recent assignment or no assignments
      const assignmentCounts = new Map();
      eligibleUsers.forEach(userId => assignmentCounts.set(userId, 0));

      (recentAssignments || []).forEach(assignment => {
        const count = assignmentCounts.get(assignment.assigned_to) || 0;
        assignmentCounts.set(assignment.assigned_to, count + 1);
      });

      // Return user with minimum assignments
      let minAssignments = Infinity;
      let selectedUser = null;

      for (const [userId, count] of assignmentCounts.entries()) {
        if (count < minAssignments) {
          minAssignments = count;
          selectedUser = userId;
        }
      }

      return selectedUser;
    } catch (error) {
      console.error('Error getting round-robin user:', error);
      return null;
    }
  }

  // Get user with least current workload
  private static async getLeastLoadedUser(userList: string[]): Promise<string | null> {
    try {
      const workloads = await this.getUserWorkloads(userList);
      
      if (workloads.length === 0) {
        return null;
      }

      // Sort by availability score (higher is better) and current leads (lower is better)
      workloads.sort((a, b) => {
        if (a.availability_score !== b.availability_score) {
          return b.availability_score - a.availability_score;
        }
        return a.current_leads - b.current_leads;
      });

      return workloads[0].user_id;
    } catch (error) {
      console.error('Error getting least loaded user:', error);
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
        
        // Calculate availability score (simplified)
        // In a real implementation, this could consider:
        // - User's working hours
        // - Current workload vs capacity
        // - Performance metrics
        // - Availability status
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

  // Get max capacity based on role
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

      // Process assignments
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      (assignments || []).forEach(assignment => {
        // Count by user
        const userCount = stats.assignments_by_user.get(assignment.assigned_to) || 0;
        stats.assignments_by_user.set(assignment.assigned_to, userCount + 1);

        // Count by status
        const statusCount = stats.assignments_by_status.get(assignment.lead_status) || 0;
        stats.assignments_by_status.set(assignment.lead_status, statusCount + 1);

        // Count recent assignments
        if (new Date(assignment.created_at) > oneDayAgo) {
          stats.recent_assignments++;
        }
      });

      return {
        total_assigned: stats.total_assigned,
        unassigned_leads: stats.unassigned_leads,
        assignments_by_user: Object.fromEntries(stats.assignments_by_user),
        assignments_by_status: Object.fromEntries(stats.assignments_by_status),
        recent_assignments: stats.recent_assignments
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

  // Get default assignment rules
  static getDefaultAssignmentRules(): Omit<AssignmentRule, 'id' | 'created_at' | 'updated_at'>[] {
    return [
      {
        rule_name: 'High Score Leads',
        rule_description: 'Assign high-scoring leads to senior sales reps',
        assignment_type: 'criteria_based',
        criteria: {
          lead_score: { operator: 'greater_than', value: '80' }
        },
        assigned_users: [], // To be filled with actual user IDs
        priority: 1,
        is_active: true
      },
      {
        rule_name: 'Enterprise Leads',
        rule_description: 'Route enterprise leads to experienced reps',
        assignment_type: 'load_balanced',
        criteria: {
          company_size: { operator: 'equals', value: 'enterprise' }
        },
        assigned_users: [],
        priority: 2,
        is_active: true
      },
      {
        rule_name: 'Geographic Assignment',
        rule_description: 'Assign leads based on location',
        assignment_type: 'criteria_based',
        criteria: {
          province: { operator: 'in_list', value: ['ON', 'QC'] }
        },
        assigned_users: [],
        priority: 3,
        is_active: true
      },
      {
        rule_name: 'Default Round Robin',
        rule_description: 'Default assignment for all other leads',
        assignment_type: 'round_robin',
        criteria: {},
        assigned_users: [],
        priority: 99,
        is_active: true
      }
    ];
  }
}