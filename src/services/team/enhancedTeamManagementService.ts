
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

export class EnhancedTeamManagementService {
  // Enhanced Member Management
  async getEnhancedTeamMembers(teamId: string): Promise<EnhancedTeamMember[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profile:profiles!fk_team_members_user_id(*),
          assignments:team_member_assignments(
            *,
            location:locations(*)
          ),
          status_history:member_status_changes(*)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as EnhancedTeamMember[];
    } catch (error) {
      console.error('Error fetching enhanced team members:', error);
      throw error;
    }
  }

  async updateMemberDetails(memberId: string, updates: Partial<EnhancedTeamMember>): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          status: updates.status,
          skills: updates.skills,
          emergency_contact: updates.emergency_contact,
          notes: updates.notes,
          team_position: updates.team_position,
          permissions: updates.permissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating member details:', error);
      throw error;
    }
  }

  async updateMemberStatus(memberId: string, newStatus: string, reason?: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_team_member_status', {
        p_team_member_id: memberId,
        p_new_status: newStatus,
        p_reason: reason
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating member status:', error);
      throw error;
    }
  }

  // Location Assignment Management
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
          status: assignment.status || 'active',
          metadata: assignment.metadata || {}
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error assigning member to location:', error);
      throw error;
    }
  }

  async getMemberLocationAssignments(memberId: string): Promise<TeamMemberAssignment[]> {
    try {
      const { data, error } = await supabase.rpc('get_team_member_locations', {
        p_team_member_id: memberId
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching member location assignments:', error);
      throw error;
    }
  }

  async transferMemberLocation(request: LocationTransferRequest): Promise<void> {
    try {
      if (request.requires_approval) {
        // Create workflow for approval
        await this.createWorkflow({
          team_id: '', // Will be derived from member
          workflow_type: 'location_transfer',
          request_data: request,
          requested_by: ''
        });
      } else {
        // Direct assignment
        await this.assignMemberToLocation({
          team_member_id: request.member_id,
          location_id: request.to_location_id,
          assignment_type: request.assignment_type,
          start_date: request.start_date,
          end_date: request.end_date,
          assigned_by: '', // Current user ID
          status: 'active',
          metadata: { reason: request.reason }
        });
      }
    } catch (error) {
      console.error('Error transferring member location:', error);
      throw error;
    }
  }

  // Bulk Operations
  async performBulkMemberAction(action: BulkMemberAction): Promise<void> {
    try {
      switch (action.action) {
        case 'update_status':
          for (const memberId of action.member_ids) {
            await this.updateMemberStatus(memberId, action.data.status, action.reason);
          }
          break;
        
        case 'reassign_location':
          for (const memberId of action.member_ids) {
            await this.assignMemberToLocation({
              team_member_id: memberId,
              location_id: action.data.location_id,
              assignment_type: action.data.assignment_type || 'secondary',
              start_date: new Date().toISOString(),
              assigned_by: action.data.assigned_by,
              status: 'active',
              metadata: { reason: action.reason }
            });
          }
          break;
        
        case 'update_role':
          const { error } = await supabase
            .from('team_members')
            .update({ 
              role: action.data.role,
              updated_at: new Date().toISOString()
            })
            .in('id', action.member_ids);
          
          if (error) throw error;
          break;
        
        case 'send_notification':
          // Implementation for bulk notifications
          console.log('Bulk notification not implemented yet');
          break;
      }
    } catch (error) {
      console.error('Error performing bulk member action:', error);
      throw error;
    }
  }

  // Team Location Management
  async getTeamLocationAssignments(teamId: string): Promise<TeamLocationAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('team_location_assignments')
        .select(`
          *,
          location:locations(name)
        `)
        .eq('team_id', teamId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data?.map(item => ({
        ...item,
        location_name: item.location?.name
      })) || [];
    } catch (error) {
      console.error('Error fetching team location assignments:', error);
      throw error;
    }
  }

  async assignTeamToLocation(teamId: string, locationId: string, assignmentType: 'primary' | 'secondary' | 'temporary' = 'primary'): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_location_assignments')
        .insert({
          team_id: teamId,
          location_id: locationId,
          assignment_type: assignmentType,
          start_date: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error assigning team to location:', error);
      throw error;
    }
  }

  // Performance Metrics
  async recordTeamPerformance(metric: Omit<TeamPerformanceMetric, 'id' | 'recorded_date' | 'created_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_performance_metrics')
        .insert({
          team_id: metric.team_id,
          metric_type: metric.metric_type,
          metric_value: metric.metric_value,
          period_start: metric.period_start,
          period_end: metric.period_end,
          recorded_by: metric.recorded_by,
          metadata: metric.metadata || {}
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording team performance:', error);
      throw error;
    }
  }

  async getTeamPerformanceSummary(teamId: string, period: string = 'monthly'): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_team_performance_summary', {
        p_team_id: teamId,
        p_period: period
      });

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching team performance summary:', error);
      throw error;
    }
  }

  // Workflow Management
  async createWorkflow(workflow: Omit<TeamWorkflow, 'id' | 'created_at' | 'updated_at'>): Promise<TeamWorkflow> {
    try {
      const { data, error } = await supabase
        .from('team_workflows')
        .insert({
          team_id: workflow.team_id,
          workflow_type: workflow.workflow_type,
          requested_by: workflow.requested_by,
          request_data: workflow.request_data,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  async approveWorkflow(workflowId: string, approvedBy: string, approvalData?: Record<string, any>): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_workflows')
        .update({
          status: 'approved',
          approved_by: approvedBy,
          approval_data: approvalData,
          completed_at: new Date().toISOString()
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
      return data || [];
    } catch (error) {
      console.error('Error fetching team workflows:', error);
      throw error;
    }
  }

  // Member Status History
  async getMemberStatusHistory(memberId: string): Promise<MemberStatusChange[]> {
    try {
      const { data, error } = await supabase
        .from('member_status_changes')
        .select('*')
        .eq('team_member_id', memberId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching member status history:', error);
      throw error;
    }
  }
}

export const enhancedTeamManagementService = new EnhancedTeamManagementService();
