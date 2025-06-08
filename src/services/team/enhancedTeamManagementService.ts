
import { supabase } from '@/integrations/supabase/client';
import type { 
  EnhancedTeamMember, 
  TeamMemberAssignment, 
  TeamPerformanceMetric, 
  TeamWorkflow, 
  MemberStatusChange,
  BulkMemberAction,
  LocationTransferRequest
} from '@/types/enhanced-team-management';

// Helper functions for JSON parsing and type safety
function safeParseJson<T>(value: any, defaultValue: T): T {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as T;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && parsed !== null ? parsed as T : defaultValue;
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
}

function safeParseStringArray(value: any): string[] {
  if (Array.isArray(value)) {
    return value.map(item => String(item));
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(item => String(item)) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export class EnhancedTeamManagementService {
  async getEnhancedTeamMembers(teamId: string): Promise<EnhancedTeamMember[]> {
    try {
      const { data: members, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles (
            id,
            display_name,
            email,
            role,
            created_at,
            updated_at
          )
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (members || []).map(member => ({
        id: member.id,
        team_id: member.team_id,
        user_id: member.user_id,
        role: member.role as 'MEMBER' | 'ADMIN',
        status: member.status as 'active' | 'inactive' | 'on_leave' | 'suspended',
        skills: safeParseStringArray(member.skills),
        emergency_contact: safeParseJson(member.emergency_contact, {}),
        notes: member.notes || '',
        last_activity: member.last_activity || undefined,
        location_assignment: member.location_assignment || undefined,
        assignment_start_date: member.assignment_start_date || undefined,
        assignment_end_date: member.assignment_end_date || undefined,
        team_position: member.team_position || undefined,
        permissions: safeParseJson(member.permissions, {}),
        created_at: member.created_at,
        updated_at: member.updated_at,
        display_name: member.profiles?.display_name || member.user_id || 'Unknown',
        profile: member.profiles ? {
          id: member.profiles.id,
          display_name: member.profiles.display_name,
          role: member.profiles.role,
          email: member.profiles.email
        } : undefined,
        assignments: [], // Would load separately if needed
        status_history: [] // Would load separately if needed
      }));
    } catch (error) {
      console.error('Error fetching enhanced team members:', error);
      return [];
    }
  }

  async updateMemberSkills(teamId: string, memberId: string, skills: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          skills: JSON.stringify(skills),
          updated_at: new Date().toISOString()
        })
        .eq('team_id', teamId)
        .eq('user_id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating member skills:', error);
      throw error;
    }
  }

  // Updated method signature to match component expectations
  async updateMemberDetails(
    teamId: string, 
    memberId: string, 
    details: {
      skills?: string[];
      emergency_contact?: Record<string, any>;
      notes?: string;
      team_position?: string;
    }
  ): Promise<void> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (details.skills) {
        updateData.skills = JSON.stringify(details.skills);
      }
      if (details.emergency_contact) {
        updateData.emergency_contact = JSON.stringify(details.emergency_contact);
      }
      if (details.notes !== undefined) {
        updateData.notes = details.notes;
      }
      if (details.team_position !== undefined) {
        updateData.team_position = details.team_position;
      }

      const { error } = await supabase
        .from('team_members')
        .update(updateData)
        .eq('team_id', teamId)
        .eq('user_id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating member details:', error);
      throw error;
    }
  }

  // Added missing method for workflow approval
  async approveWorkflow(workflowId: string, approverId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_workflows')
        .update({
          status: 'approved',
          approved_by: approverId,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error approving workflow:', error);
      return false;
    }
  }

  // Renamed method: Perform bulk member action
  async performBulkMemberAction(teamId: string, action: BulkMemberAction): Promise<void> {
    try {
      const { member_ids, data: actionData } = action;

      for (const memberId of member_ids) {
        switch (action.action) {
          case 'update_status':
            await supabase
              .from('team_members')
              .update({
                status: actionData.status,
                updated_at: new Date().toISOString()
              })
              .eq('team_id', teamId)
              .eq('user_id', memberId);
            break;

          case 'update_role':
            await supabase
              .from('team_members')
              .update({
                role: actionData.role,
                updated_at: new Date().toISOString()
              })
              .eq('team_id', teamId)
              .eq('user_id', memberId);
            break;

          case 'reassign_location':
            await supabase
              .from('team_members')
              .update({
                location_assignment: actionData.location_id,
                updated_at: new Date().toISOString()
              })
              .eq('team_id', teamId)
              .eq('user_id', memberId);
            break;

          case 'send_notification':
            // Would implement notification logic here
            console.log('Sending notification to:', memberId);
            break;
        }
      }
    } catch (error) {
      console.error('Error performing bulk member action:', error);
      throw error;
    }
  }

  async getMemberAssignments(teamId: string): Promise<TeamMemberAssignment[]> {
    try {
      const { data: assignments, error } = await supabase
        .from('team_member_assignments')
        .select(`
          *,
          locations(id, name, address, city, state)
        `)
        .eq('team_member_id', teamId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('team_member_assignments table access failed, returning empty array');
        return [];
      }

      return (assignments || []).map(assignment => ({
        id: assignment.id,
        team_member_id: assignment.team_member_id,
        location_id: assignment.location_id,
        assignment_type: assignment.assignment_type as 'primary' | 'secondary' | 'temporary',
        start_date: assignment.start_date,
        end_date: assignment.end_date,
        assigned_by: assignment.assigned_by,
        status: assignment.status as 'active' | 'pending' | 'completed' | 'cancelled',
        metadata: safeParseJson(assignment.metadata, {}),
        created_at: assignment.created_at,
        updated_at: assignment.updated_at,
        location: assignment.locations ? {
          id: assignment.locations.id,
          name: assignment.locations.name,
          address: assignment.locations.address,
          city: assignment.locations.city,
          state: assignment.locations.state
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching member assignments:', error);
      return [];
    }
  }

  async createLocationTransferRequest(request: LocationTransferRequest): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('team_workflows')
        .insert({
          team_id: request.team_id,
          workflow_type: 'location_transfer',
          request_data: JSON.stringify(request),
          requested_by: request.requested_by,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating location transfer request:', error);
      throw error;
    }
  }

  async getPendingLocationTransfers(teamId: string): Promise<LocationTransferRequest[]> {
    try {
      const { data: workflows, error } = await supabase
        .from('team_workflows')
        .select('*')
        .eq('team_id', teamId)
        .eq('workflow_type', 'location_transfer')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (workflows || []).map(workflow => 
        safeParseJson(workflow.request_data, {
          member_id: '',
          team_id: teamId,
          to_location_id: '',
          assignment_type: 'primary' as const,
          start_date: '',
          reason: '',
          requires_approval: true,
          requested_by: workflow.requested_by
        })
      );
    } catch (error) {
      console.error('Error fetching pending location transfers:', error);
      return [];
    }
  }

  async recordTeamPerformanceMetric(teamId: string, metric: Omit<TeamPerformanceMetric, 'id' | 'created_at'>): Promise<void> {
    try {
      // Use team_performance_metrics table (not the interface fields)
      const { error } = await supabase
        .from('team_performance_metrics')
        .insert({
          team_id: teamId,
          metric_period_start: metric.period_start,
          metric_period_end: metric.period_end,
          certificates_issued: Math.floor(metric.metric_value),
          courses_conducted: 0, // Would need separate metrics for this
          average_satisfaction_score: 85.0, // Default value
          compliance_score: 90.0, // Default value
          member_retention_rate: 95.0, // Default value
          training_hours_delivered: 0, // Default value
          calculated_by: metric.recorded_by,
          calculated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording team performance metric:', error);
      throw error;
    }
  }

  async getTeamPerformanceMetrics(teamId: string, limit: number = 10): Promise<TeamPerformanceMetric[]> {
    try {
      // Get from team_performance_metrics table and map to interface
      const { data: metrics, error } = await supabase
        .from('team_performance_metrics')
        .select('*')
        .eq('team_id', teamId)
        .order('calculated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (metrics || []).map(metric => ({
        id: metric.id,
        team_id: metric.team_id,
        metric_type: 'performance', // Default type
        metric_value: metric.certificates_issued || 0,
        period_start: metric.metric_period_start,
        period_end: metric.metric_period_end,
        recorded_by: metric.calculated_by,
        recorded_date: metric.calculated_at,
        metadata: safeParseJson({}, {}),
        created_at: metric.calculated_at
      }));
    } catch (error) {
      console.error('Error fetching team performance metrics:', error);
      return [];
    }
  }

  async createTeamWorkflow(workflow: Omit<TeamWorkflow, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('team_workflows')
        .insert({
          team_id: workflow.team_id,
          workflow_type: workflow.workflow_type,
          request_data: workflow.request_data,
          requested_by: workflow.requested_by,
          status: workflow.status
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating team workflow:', error);
      throw error;
    }
  }

  async getTeamWorkflows(teamId: string): Promise<TeamWorkflow[]> {
    try {
      const { data: workflows, error } = await supabase
        .from('team_workflows')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (workflows || []).map(workflow => ({
        id: workflow.id,
        team_id: workflow.team_id,
        workflow_type: workflow.workflow_type,
        status: workflow.status as 'pending' | 'approved' | 'rejected' | 'cancelled',
        requested_by: workflow.requested_by,
        approved_by: workflow.approved_by || undefined,
        request_data: safeParseJson(workflow.request_data, {}),
        approval_data: safeParseJson(workflow.approval_data, {}),
        created_at: workflow.created_at,
        updated_at: workflow.updated_at,
        completed_at: workflow.completed_at || undefined
      }));
    } catch (error) {
      console.error('Error fetching team workflows:', error);
      return [];
    }
  }

  async getMemberStatusHistory(teamId: string, memberId?: string): Promise<MemberStatusChange[]> {
    try {
      let query = supabase
        .from('team_member_status_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (memberId) {
        query = query.eq('team_member_id', memberId);
      }

      const { data: history, error } = await query;

      if (error) {
        console.warn('team_member_status_history table not found, returning empty array');
        return [];
      }

      return (history || []).map(item => ({
        id: item.id,
        team_member_id: item.team_member_id,
        old_status: item.old_status || undefined,
        new_status: item.new_status,
        old_role: item.old_role || undefined,
        new_role: item.new_role || undefined,
        changed_by: item.changed_by,
        reason: item.reason || undefined,
        effective_date: item.effective_date,
        metadata: safeParseJson(item.metadata, {}),
        created_at: item.created_at
      }));
    } catch (error) {
      console.error('Error fetching member status history:', error);
      return [];
    }
  }
}

export const enhancedTeamManagementService = new EnhancedTeamManagementService();
