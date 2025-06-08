
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

// Helper function to safely parse JSON arrays to string arrays
function parseSkillsArray(value: any): string[] {
  if (Array.isArray(value)) {
    return value.filter(item => typeof item === 'string' || typeof item === 'number').map(String);
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Helper function to safely parse emergency contact
function parseEmergencyContact(value: any): Record<string, any> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, any>;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Record<string, any>;
    } catch {
      return {};
    }
  }
  return {};
}

// Helper function to safely cast assignment type
function safeAssignmentType(value: string): 'primary' | 'secondary' | 'temporary' {
  if (['primary', 'secondary', 'temporary'].includes(value)) {
    return value as 'primary' | 'secondary' | 'temporary';
  }
  return 'primary';
}

// Helper function to safely cast workflow status
function safeWorkflowStatus(value: string): 'pending' | 'approved' | 'rejected' | 'cancelled' {
  if (['pending', 'approved', 'rejected', 'cancelled'].includes(value)) {
    return value as 'pending' | 'approved' | 'rejected' | 'cancelled';
  }
  return 'pending';
}

export class EnhancedTeamManagementService {
  async getEnhancedTeamMembers(teamId: string): Promise<EnhancedTeamMember[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles!inner(id, display_name, email, role)
        `)
        .eq('team_id', teamId);

      if (error) throw error;

      const enhancedMembers: EnhancedTeamMember[] = (data || []).map(member => ({
        id: member.id,
        team_id: member.team_id,
        user_id: member.user_id,
        role: member.role as 'MEMBER' | 'ADMIN',
        status: member.status as 'active' | 'inactive' | 'on_leave' | 'suspended',
        skills: parseSkillsArray(member.skills),
        emergency_contact: parseEmergencyContact(member.emergency_contact),
        notes: member.notes || '',
        last_activity: member.last_activity,
        location_assignment: member.location_assignment,
        assignment_start_date: member.assignment_start_date,
        assignment_end_date: member.assignment_end_date,
        team_position: member.team_position,
        permissions: member.permissions || {},
        created_at: member.created_at,
        updated_at: member.updated_at,
        display_name: member.profiles?.display_name || 'Unknown User',
        profile: member.profiles ? {
          id: member.profiles.id,
          display_name: member.profiles.display_name,
          role: member.profiles.role,
          email: member.profiles.email
        } : undefined,
        assignments: [], // Will be populated separately if needed
        status_history: [] // Will be populated separately if needed
      }));

      return enhancedMembers;
    } catch (error) {
      console.error('Error fetching enhanced team members:', error);
      throw error;
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

  async updateMemberDetails(memberId: string, updates: Partial<EnhancedTeamMember>): Promise<void> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.status) updateData.status = updates.status;
      if (updates.skills) updateData.skills = updates.skills;
      if (updates.emergency_contact) updateData.emergency_contact = updates.emergency_contact;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.team_position) updateData.team_position = updates.team_position;
      if (updates.permissions) updateData.permissions = updates.permissions;

      const { error } = await supabase
        .from('team_members')
        .update(updateData)
        .eq('id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating member details:', error);
      throw error;
    }
  }

  async updateMemberEmergencyContact(memberId: string, emergencyContact: Record<string, any>): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          emergency_contact: emergencyContact,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating member emergency contact:', error);
      throw error;
    }
  }

  async updateMemberStatus(memberId: string, status: EnhancedTeamMember['status'], reason?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;

      // Log status change
      await this.logMemberStatusChange(memberId, status, reason);
    } catch (error) {
      console.error('Error updating member status:', error);
      throw error;
    }
  }

  async performBulkMemberAction(action: BulkMemberAction): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const memberId of action.member_ids) {
      try {
        switch (action.action) {
          case 'update_status':
            await this.updateMemberStatus(memberId, action.data.status, action.reason);
            break;
          case 'reassign_location':
            await this.assignMemberToLocation(memberId, action.data.location_id);
            break;
          case 'update_role':
            await this.updateMemberRole(memberId, action.data.role);
            break;
          case 'send_notification':
            // Would implement notification sending here
            break;
        }
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Member ${memberId}: ${error.message}`);
      }
    }

    return results;
  }

  async processBulkMemberActions(actions: BulkMemberAction[]): Promise<void> {
    for (const action of actions) {
      await this.performBulkMemberAction(action);
    }
  }

  async assignMemberToLocation(memberId: string, locationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          location_assignment: locationId,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error assigning member to location:', error);
      throw error;
    }
  }

  async updateMemberRole(memberId: string, role: 'MEMBER' | 'ADMIN'): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          role,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }

  private async logMemberStatusChange(memberId: string, newStatus: string, reason?: string): Promise<void> {
    try {
      await supabase
        .from('team_member_status_history')
        .insert({
          team_member_id: memberId,
          new_status: newStatus,
          changed_by: (await supabase.auth.getUser()).data.user?.id,
          reason: reason || 'Status updated',
          effective_date: new Date().toISOString(),
          metadata: {}
        });
    } catch (error) {
      console.error('Error logging status change:', error);
    }
  }

  async requestLocationTransfer(request: LocationTransferRequest): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('team_workflows')
        .insert({
          team_id: request.team_id,
          workflow_type: 'location_transfer',
          status: 'pending',
          requested_by: request.requested_by,
          request_data: request
        })
        .select()
        .single();

      if (error) throw error;

      return data.id;
    } catch (error) {
      console.error('Error requesting location transfer:', error);
      throw error;
    }
  }

  async approveLocationTransfer(requestId: string, approverId: string): Promise<void> {
    try {
      // Get the request details
      const { data: workflow, error: fetchError } = await supabase
        .from('team_workflows')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      const requestData = workflow.request_data as LocationTransferRequest;

      // Update the workflow status
      const { error: updateError } = await supabase
        .from('team_workflows')
        .update({
          status: 'approved',
          approved_by: approverId,
          completed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Actually perform the transfer - update the member's location assignment
      await this.assignMemberToLocation(requestData.member_id, requestData.to_location_id);
    } catch (error) {
      console.error('Error approving location transfer:', error);
      throw error;
    }
  }

  async getTeamLocationAssignments(teamId: string): Promise<TeamLocationAssignment[]> {
    try {
      // Fix the query to avoid the relationship error
      const { data, error } = await supabase
        .from('team_location_assignments')
        .select(`
          id,
          team_id,
          location_id,
          assignment_type,
          start_date,
          end_date,
          created_at
        `)
        .eq('team_id', teamId);

      if (error) throw error;

      // Get location names separately
      const assignments: TeamLocationAssignment[] = [];
      for (const assignment of data || []) {
        const { data: locationData } = await supabase
          .from('locations')
          .select('name')
          .eq('id', assignment.location_id)
          .single();

        assignments.push({
          id: assignment.id,
          team_id: assignment.team_id,
          location_id: assignment.location_id,
          assignment_type: safeAssignmentType(assignment.assignment_type),
          start_date: assignment.start_date,
          end_date: assignment.end_date,
          created_at: assignment.created_at,
          updated_at: assignment.created_at, // Use created_at as fallback
          location_name: locationData?.name
        });
      }

      return assignments;
    } catch (error) {
      console.error('Error fetching team location assignments:', error);
      return [];
    }
  }

  async recordTeamPerformanceMetric(metric: Omit<TeamPerformanceMetric, 'id' | 'created_at'>): Promise<void> {
    try {
      // Use the correct table name for team performance metrics
      const { error } = await supabase
        .from('team_performance_metrics')
        .insert({
          team_id: metric.team_id,
          metric_type: metric.metric_type,
          metric_value: metric.metric_value,
          period_start: metric.period_start,
          period_end: metric.period_end,
          recorded_by: metric.recorded_by,
          recorded_date: metric.recorded_date,
          metadata: metric.metadata
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording team performance metric:', error);
      throw error;
    }
  }

  async getTeamPerformanceMetrics(teamId: string, startDate?: string, endDate?: string): Promise<TeamPerformanceMetric[]> {
    try {
      let query = supabase
        .from('team_performance_metrics')
        .select('*')
        .eq('team_id', teamId);

      if (startDate) {
        query = query.gte('period_start', startDate);
      }
      if (endDate) {
        query = query.lte('period_end', endDate);
      }

      const { data, error } = await query.order('recorded_date', { ascending: false });

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
        metadata: metric.metadata,
        created_at: metric.created_at
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
          status: workflow.status,
          requested_by: workflow.requested_by,
          request_data: workflow.request_data
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

  async approveWorkflow(workflowId: string, approvedBy: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_workflows')
        .update({
          status: 'approved',
          approved_by: approvedBy,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      if (error) throw error;
    } catch (error) {
      console.error('Error approving workflow:', error);
      throw error;
    }
  }

  async getTeamWorkflows(teamId: string): Promise<TeamWorkflow[]> {
    try {
      const { data, error } = await supabase
        .from('team_workflows')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(workflow => ({
        id: workflow.id,
        team_id: workflow.team_id,
        workflow_type: workflow.workflow_type,
        status: safeWorkflowStatus(workflow.status),
        requested_by: workflow.requested_by,
        approved_by: workflow.approved_by,
        request_data: workflow.request_data || {},
        approval_data: workflow.approval_data || {},
        created_at: workflow.created_at,
        updated_at: workflow.updated_at || workflow.created_at,
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
        .order('effective_date', { ascending: false });

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
        metadata: change.metadata || {},
        created_at: change.created_at
      }));
    } catch (error) {
      console.error('Error fetching member status history:', error);
      return [];
    }
  }
}

export const enhancedTeamManagementService = new EnhancedTeamManagementService();
