
import { supabase } from '@/integrations/supabase/client';
import type { 
  EnhancedTeamMember, 
  TeamMemberAssignment, 
  TeamLocationAssignment,
  TeamPerformanceMetric,
  TeamWorkflow,
  MemberStatusChange,
  BulkMemberAction,
  LocationTransferRequest
} from '@/types/enhanced-team-management';

// Helper function to safely parse JSON data
function safeParseJson<T>(value: any, defaultValue: T): T {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'object' && value !== null) return value as T;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
}

// Helper function to cast assignment type safely
function castAssignmentType(value: string): 'primary' | 'secondary' | 'temporary' {
  if (['primary', 'secondary', 'temporary'].includes(value)) {
    return value as 'primary' | 'secondary' | 'temporary';
  }
  return 'primary'; // default fallback
}

// Helper function to cast workflow status safely
function castWorkflowStatus(value: string): 'pending' | 'approved' | 'rejected' | 'cancelled' {
  if (['pending', 'approved', 'rejected', 'cancelled'].includes(value)) {
    return value as 'pending' | 'approved' | 'rejected' | 'cancelled';
  }
  return 'pending'; // default fallback
}

export class EnhancedTeamManagementService {
  async getEnhancedTeamMembers(teamId: string): Promise<EnhancedTeamMember[]> {
    try {
      const { data: members, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles!inner(id, display_name, email, role)
        `)
        .eq('team_id', teamId);

      if (error) throw error;

      return (members || []).map(member => ({
        id: member.id,
        team_id: member.team_id,
        user_id: member.user_id,
        role: member.role as 'MEMBER' | 'ADMIN',
        status: member.status as 'active' | 'inactive' | 'on_leave' | 'suspended',
        skills: Array.isArray(member.skills) ? member.skills : [],
        emergency_contact: safeParseJson(member.emergency_contact, {}),
        notes: member.notes,
        last_activity: member.last_activity,
        location_assignment: member.location_assignment,
        assignment_start_date: member.assignment_start_date,
        assignment_end_date: member.assignment_end_date,
        team_position: member.team_position,
        permissions: safeParseJson(member.permissions, {}),
        created_at: member.created_at,
        updated_at: member.updated_at,
        display_name: member.profiles?.display_name || 'Unknown',
        profile: member.profiles,
        assignments: [],
        status_history: []
      }));
    } catch (error) {
      console.error('Error fetching enhanced team members:', error);
      return [];
    }
  }

  async updateMemberSkills(memberId: string, skills: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ 
          skills,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating member skills:', error);
      throw error;
    }
  }

  async updateEmergencyContact(memberId: string, contact: Record<string, any>): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ 
          emergency_contact: contact,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating emergency contact:', error);
      throw error;
    }
  }

  async assignMemberToLocation(assignment: Omit<TeamMemberAssignment, 'id' | 'created_at' | 'updated_at'>): Promise<TeamMemberAssignment> {
    try {
      const { data, error } = await supabase
        .from('team_member_assignments')
        .insert({
          team_member_id: assignment.team_member_id,
          location_id: assignment.location_id,
          assignment_type: assignment.assignment_type,
          start_date: assignment.start_date,
          end_date: assignment.end_date,
          assigned_by: assignment.assigned_by,
          status: assignment.status,
          metadata: assignment.metadata || {}
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        team_member_id: data.team_member_id,
        location_id: data.location_id,
        assignment_type: castAssignmentType(data.assignment_type),
        start_date: data.start_date,
        end_date: data.end_date,
        assigned_by: data.assigned_by,
        status: data.status as 'active' | 'pending' | 'completed' | 'cancelled',
        metadata: safeParseJson(data.metadata, {}),
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error assigning member to location:', error);
      throw error;
    }
  }

  async getMemberAssignments(memberId: string): Promise<TeamMemberAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('team_member_assignments')
        .select(`
          *,
          locations!inner(id, name, city, state)
        `)
        .eq('team_member_id', memberId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(assignment => ({
        id: assignment.id,
        team_member_id: assignment.team_member_id,
        location_id: assignment.location_id,
        assignment_type: castAssignmentType(assignment.assignment_type),
        start_date: assignment.start_date,
        end_date: assignment.end_date,
        assigned_by: assignment.assigned_by,
        status: assignment.status as 'active' | 'pending' | 'completed' | 'cancelled',
        metadata: safeParseJson(assignment.metadata, {}),
        created_at: assignment.created_at,
        updated_at: assignment.updated_at,
        location: assignment.locations
      }));
    } catch (error) {
      console.error('Error fetching member assignments:', error);
      return [];
    }
  }

  async requestLocationTransfer(request: LocationTransferRequest): Promise<void> {
    try {
      // Create workflow request
      const { error: workflowError } = await supabase
        .from('team_workflows')
        .insert({
          team_id: request.team_id,
          workflow_type: 'location_transfer',
          status: 'pending',
          requested_by: request.requested_by,
          request_data: {
            member_id: request.member_id,
            from_location_id: request.from_location_id,
            to_location_id: request.to_location_id,
            assignment_type: request.assignment_type,
            start_date: request.start_date,
            end_date: request.end_date,
            reason: request.reason,
            requires_approval: request.requires_approval
          }
        });

      if (workflowError) throw workflowError;

      // If no approval required, create assignment directly
      if (!request.requires_approval) {
        await this.assignMemberToLocation({
          team_member_id: request.member_id,
          location_id: request.to_location_id,
          assignment_type: request.assignment_type,
          start_date: request.start_date,
          end_date: request.end_date,
          assigned_by: request.requested_by,
          status: 'active',
          metadata: { reason: request.reason }
        });
      }
    } catch (error) {
      console.error('Error requesting location transfer:', error);
      throw error;
    }
  }

  async processBulkMemberActions(
    teamId: string,
    actions: BulkMemberAction[]
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const action of actions) {
      try {
        switch (action.action) {
          case 'update_status':
            for (const memberId of action.member_ids) {
              await supabase
                .from('team_members')
                .update({ 
                  status: action.data.status,
                  updated_at: new Date().toISOString()
                })
                .eq('id', memberId);
            }
            break;

          case 'update_role':
            for (const memberId of action.member_ids) {
              await supabase
                .from('team_members')
                .update({ 
                  role: action.data.role,
                  permissions: action.data.permissions || {},
                  updated_at: new Date().toISOString()
                })
                .eq('id', memberId);
            }
            break;

          case 'reassign_location':
            for (const memberId of action.member_ids) {
              await this.assignMemberToLocation({
                team_member_id: memberId,
                location_id: action.data.location_id,
                assignment_type: action.data.assignment_type || 'primary',
                start_date: new Date().toISOString(),
                assigned_by: action.data.assigned_by,
                status: 'active',
                metadata: { reason: action.reason || 'Bulk reassignment' }
              });
            }
            break;
        }
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`${action.action}: ${error.message}`);
      }
    }

    return results;
  }

  async getTeamLocationAssignments(teamId: string): Promise<TeamLocationAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('team_location_assignments')
        .select(`
          *,
          locations(name)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(assignment => ({
        id: assignment.id,
        team_id: assignment.team_id,
        location_id: assignment.location_id,
        assignment_type: castAssignmentType(assignment.assignment_type),
        start_date: assignment.start_date,
        end_date: assignment.end_date,
        created_at: assignment.created_at,
        updated_at: assignment.updated_at,
        location_name: assignment.locations?.name
      }));
    } catch (error) {
      console.error('Error fetching team location assignments:', error);
      return [];
    }
  }

  async recordTeamPerformanceMetric(
    teamId: string,
    metric: Omit<TeamPerformanceMetric, 'id' | 'created_at'>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_performance_metrics')
        .insert({
          team_id: teamId,
          metric_type: metric.metric_type,
          metric_value: metric.metric_value,
          period_start: metric.period_start,
          period_end: metric.period_end,
          recorded_by: metric.recorded_by,
          recorded_date: metric.recorded_date,
          metadata: metric.metadata || {}
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording team performance metric:', error);
      throw error;
    }
  }

  async getTeamPerformanceMetrics(
    teamId: string,
    metricType?: string,
    startDate?: string,
    endDate?: string
  ): Promise<TeamPerformanceMetric[]> {
    try {
      let query = supabase
        .from('team_performance_metrics')
        .select('*')
        .eq('team_id', teamId)
        .order('recorded_date', { ascending: false });

      if (metricType) {
        query = query.eq('metric_type', metricType);
      }

      if (startDate) {
        query = query.gte('period_start', startDate);
      }

      if (endDate) {
        query = query.lte('period_end', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(metric => ({
        id: metric.id,
        team_id: metric.team_id,
        metric_type: metric.metric_type,
        metric_value: metric.metric_value,
        period_start: metric.period_start,
        period_end: metric.period_end,
        recorded_by: metric.recorded_by,
        recorded_date: metric.recorded_date,
        metadata: safeParseJson(metric.metadata, {}),
        created_at: metric.created_at
      }));
    } catch (error) {
      console.error('Error fetching team performance metrics:', error);
      return [];
    }
  }

  async createTeamWorkflow(
    workflow: Omit<TeamWorkflow, 'id' | 'created_at' | 'updated_at' | 'completed_at'>
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('team_workflows')
        .insert({
          team_id: workflow.team_id,
          workflow_type: workflow.workflow_type,
          status: workflow.status,
          requested_by: workflow.requested_by,
          approved_by: workflow.approved_by,
          request_data: workflow.request_data,
          approval_data: workflow.approval_data || {}
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating team workflow:', error);
      throw error;
    }
  }

  async getTeamWorkflows(
    teamId: string,
    status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
  ): Promise<TeamWorkflow[]> {
    try {
      let query = supabase
        .from('team_workflows')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(workflow => ({
        id: workflow.id,
        team_id: workflow.team_id,
        workflow_type: workflow.workflow_type,
        status: castWorkflowStatus(workflow.status),
        requested_by: workflow.requested_by,
        approved_by: workflow.approved_by,
        request_data: safeParseJson(workflow.request_data, {}),
        approval_data: safeParseJson(workflow.approval_data, {}),
        created_at: workflow.created_at,
        updated_at: workflow.updated_at,
        completed_at: workflow.completed_at
      }));
    } catch (error) {
      console.error('Error fetching team workflows:', error);
      return [];
    }
  }

  async getMemberStatusHistory(memberId: string): Promise<MemberStatusChange[]> {
    try {
      const { data, error } = await supabase
        .from('team_member_status_history')
        .select('*')
        .eq('team_member_id', memberId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(change => ({
        id: change.id,
        team_member_id: change.team_member_id,
        old_status: change.old_status,
        new_status: change.new_status,
        old_role: change.old_role,
        new_role: change.new_role,
        changed_by: change.changed_by,
        reason: change.reason,
        effective_date: change.effective_date,
        metadata: safeParseJson(change.metadata, {}),
        created_at: change.created_at
      }));
    } catch (error) {
      console.error('Error fetching member status history:', error);
      return [];
    }
  }
}

export const enhancedTeamManagementService = new EnhancedTeamManagementService();
