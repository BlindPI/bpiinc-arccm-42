
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
  // Enhanced Member Management using real database tables
  async getEnhancedTeamMembers(teamId: string): Promise<EnhancedTeamMember[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles!inner(*)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Get status history for each member from real table
      const memberIds = data?.map(m => m.id) || [];
      const { data: statusHistory } = await supabase
        .from('team_member_status_history')
        .select('*')
        .in('team_member_id', memberIds);

      // Get assignments from real table
      const { data: assignments } = await supabase
        .from('team_location_assignments')
        .select('*')
        .eq('team_id', teamId);

      return (data || []).map(member => {
        const memberStatusHistory = statusHistory?.filter(h => h.team_member_id === member.id) || [];
        const memberAssignments = assignments?.filter(a => a.team_id === teamId) || [];

        return {
          id: member.id,
          team_id: member.team_id,
          user_id: member.user_id,
          role: member.role as 'MEMBER' | 'ADMIN',
          status: (member.status || 'active') as 'active' | 'inactive' | 'on_leave' | 'suspended',
          skills: Array.isArray(member.skills) ? member.skills : [],
          emergency_contact: member.emergency_contact || {},
          notes: member.notes || '',
          last_activity: member.last_activity || null,
          location_assignment: member.location_assignment || '',
          assignment_start_date: member.assignment_start_date || null,
          assignment_end_date: member.assignment_end_date || null,
          team_position: member.team_position || '',
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
          assignments: memberAssignments,
          status_history: memberStatusHistory
        } as EnhancedTeamMember;
      });
    } catch (error) {
      console.error('Error fetching enhanced team members:', error);
      throw error;
    }
  }

  async updateMemberDetails(memberId: string, updates: Partial<EnhancedTeamMember>): Promise<void> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Add all supported fields to update
      if (updates.team_position !== undefined) updateData.team_position = updates.team_position;
      if (updates.permissions !== undefined) updateData.permissions = updates.permissions;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.skills !== undefined) updateData.skills = updates.skills;
      if (updates.emergency_contact !== undefined) updateData.emergency_contact = updates.emergency_contact;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

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

  async updateMemberStatus(memberId: string, newStatus: string, reason?: string): Promise<void> {
    try {
      // Get current member data
      const { data: currentMember, error: fetchError } = await supabase
        .from('team_members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (fetchError) throw fetchError;

      // Update status in team_members table
      const { error } = await supabase
        .from('team_members')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;

      // Record status change in history table
      await supabase
        .from('team_member_status_history')
        .insert({
          team_member_id: memberId,
          old_status: currentMember.status,
          new_status: newStatus,
          old_role: currentMember.role,
          new_role: currentMember.role,
          reason: reason || 'Status update',
          effective_date: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error updating member status:', error);
      throw error;
    }
  }

  // Location Assignment Management using real database tables
  async assignMemberToLocation(assignment: Omit<TeamMemberAssignment, 'id' | 'created_at' | 'updated_at'>): Promise<TeamMemberAssignment> {
    try {
      // Create assignment in team_location_assignments table
      const { data, error } = await supabase
        .from('team_location_assignments')
        .insert({
          team_id: assignment.team_id,
          location_id: assignment.location_id,
          assignment_type: assignment.assignment_type,
          start_date: assignment.start_date,
          end_date: assignment.end_date
        })
        .select()
        .single();

      if (error) throw error;

      // Also update team_members table location assignment
      await supabase
        .from('team_members')
        .update({
          location_assignment: assignment.location_id,
          assignment_start_date: assignment.start_date,
          assignment_end_date: assignment.end_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignment.team_member_id);

      return {
        id: data.id,
        team_member_id: assignment.team_member_id,
        team_id: assignment.team_id,
        location_id: assignment.location_id,
        assignment_type: assignment.assignment_type,
        start_date: assignment.start_date,
        end_date: assignment.end_date,
        assigned_by: assignment.assigned_by,
        status: assignment.status,
        metadata: assignment.metadata,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error assigning member to location:', error);
      throw error;
    }
  }

  async getMemberLocationAssignments(memberId: string): Promise<TeamMemberAssignment[]> {
    try {
      // Get team_id for the member
      const { data: member } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('id', memberId)
        .single();

      if (!member) return [];

      const { data, error } = await supabase
        .from('team_location_assignments')
        .select('*')
        .eq('team_id', member.team_id);

      if (error) throw error;

      return (data || []).map(assignment => ({
        id: assignment.id,
        team_member_id: memberId,
        team_id: assignment.team_id,
        location_id: assignment.location_id,
        assignment_type: assignment.assignment_type,
        start_date: assignment.start_date,
        end_date: assignment.end_date,
        assigned_by: '', // Would need to track this in the assignment table
        status: 'active',
        metadata: {},
        created_at: assignment.created_at,
        updated_at: assignment.updated_at
      }));
    } catch (error) {
      console.error('Error fetching member location assignments:', error);
      return [];
    }
  }

  async transferMemberLocation(request: LocationTransferRequest): Promise<void> {
    try {
      if (request.requires_approval) {
        // Create workflow for approval using real database
        await supabase
          .from('team_approval_requests')
          .insert({
            team_id: request.team_id,
            request_type: 'location_transfer',
            request_data: request,
            requested_by: request.requested_by
          });
      } else {
        // Direct assignment
        await this.assignMemberToLocation({
          team_member_id: request.member_id,
          team_id: request.team_id,
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
      console.error('Error transferring member location:', error);
      throw error;
    }
  }

  // Bulk Operations using real database transactions
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
            // Get member's team_id
            const { data: member } = await supabase
              .from('team_members')
              .select('team_id')
              .eq('id', memberId)
              .single();

            if (member) {
              await this.assignMemberToLocation({
                team_member_id: memberId,
                team_id: member.team_id,
                location_id: action.data.location_id,
                assignment_type: action.data.assignment_type || 'secondary',
                start_date: new Date().toISOString(),
                assigned_by: action.data.assigned_by,
                status: 'active',
                metadata: { reason: action.reason }
              });
            }
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
          // Would integrate with notification system
          break;
      }
    } catch (error) {
      console.error('Error performing bulk member action:', error);
      throw error;
    }
  }

  // Team Location Management using real database tables
  async getTeamLocationAssignments(teamId: string): Promise<TeamLocationAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('team_location_assignments')
        .select(`
          *,
          locations!inner(name)
        `)
        .eq('team_id', teamId);

      if (error) throw error;
      
      return (data || []).map(assignment => ({
        id: assignment.id,
        team_id: assignment.team_id,
        location_id: assignment.location_id,
        assignment_type: assignment.assignment_type,
        start_date: assignment.start_date,
        end_date: assignment.end_date,
        created_at: assignment.created_at,
        updated_at: assignment.updated_at,
        location_name: assignment.locations?.name || 'Unknown Location'
      }));
    } catch (error) {
      console.error('Error fetching team location assignments:', error);
      return [];
    }
  }

  async assignTeamToLocation(teamId: string, locationId: string, assignmentType: 'primary' | 'secondary' | 'temporary' = 'primary'): Promise<void> {
    try {
      // Create location assignment
      await supabase
        .from('team_location_assignments')
        .insert({
          team_id: teamId,
          location_id: locationId,
          assignment_type: assignmentType,
          start_date: new Date().toISOString()
        });

      // Update team's primary location if primary assignment
      if (assignmentType === 'primary') {
        await supabase
          .from('teams')
          .update({
            location_id: locationId,
            updated_at: new Date().toISOString()
          })
          .eq('id', teamId);
      }
    } catch (error) {
      console.error('Error assigning team to location:', error);
      throw error;
    }
  }

  // Performance Metrics using real database tables
  async recordTeamPerformance(metric: Omit<TeamPerformanceMetric, 'id' | 'recorded_date' | 'created_at'>): Promise<void> {
    try {
      await supabase
        .from('team_performance_metrics')
        .insert({
          team_id: metric.team_id,
          metric_period_start: metric.metric_period_start,
          metric_period_end: metric.metric_period_end,
          certificates_issued: metric.certificates_issued,
          courses_conducted: metric.courses_conducted,
          average_satisfaction_score: metric.average_satisfaction_score,
          compliance_score: metric.compliance_score,
          member_retention_rate: metric.member_retention_rate,
          training_hours_delivered: metric.training_hours_delivered,
          calculated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error recording team performance:', error);
      throw error;
    }
  }

  async getTeamPerformanceSummary(teamId: string, period: string = 'monthly'): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('team_performance_metrics')
        .select('*')
        .eq('team_id', teamId)
        .order('metric_period_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      return data || {
        team_id: teamId,
        total_certificates: 0,
        total_courses: 0,
        avg_satisfaction: 0,
        compliance_score: 0,
        performance_trend: 0
      };
    } catch (error) {
      console.error('Error fetching team performance summary:', error);
      return null;
    }
  }

  // Workflow Management using real database tables
  async createWorkflow(workflow: Omit<TeamWorkflow, 'id' | 'created_at' | 'updated_at'>): Promise<TeamWorkflow> {
    try {
      const { data, error } = await supabase
        .from('team_approval_requests')
        .insert({
          team_id: workflow.team_id,
          request_type: workflow.workflow_type,
          request_data: workflow.request_data,
          requested_by: workflow.requested_by,
          status: workflow.status
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        team_id: data.team_id,
        workflow_type: data.request_type,
        status: data.status,
        requested_by: data.requested_by,
        approved_by: data.approved_by,
        request_data: data.request_data,
        approval_data: {},
        created_at: data.created_at,
        updated_at: data.updated_at,
        completed_at: data.approved_at
      };
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  async approveWorkflow(workflowId: string, approvedBy: string, approvalData?: Record<string, any>): Promise<void> {
    try {
      await supabase
        .from('team_approval_requests')
        .update({
          status: 'approved',
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
          approver_comments: JSON.stringify(approvalData || {})
        })
        .eq('id', workflowId);
    } catch (error) {
      console.error('Error approving workflow:', error);
      throw error;
    }
  }

  async getTeamWorkflows(teamId: string): Promise<TeamWorkflow[]> {
    try {
      const { data, error } = await supabase
        .from('team_approval_requests')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(request => ({
        id: request.id,
        team_id: request.team_id,
        workflow_type: request.request_type,
        status: request.status,
        requested_by: request.requested_by,
        approved_by: request.approved_by,
        request_data: request.request_data,
        approval_data: {},
        created_at: request.created_at,
        updated_at: request.updated_at,
        completed_at: request.approved_at
      }));
    } catch (error) {
      console.error('Error fetching team workflows:', error);
      return [];
    }
  }

  // Member Status History using real database table
  async getMemberStatusHistory(memberId: string): Promise<MemberStatusChange[]> {
    try {
      const { data, error } = await supabase
        .from('team_member_status_history')
        .select('*')
        .eq('team_member_id', memberId)
        .order('effective_date', { ascending: false });

      if (error) throw error;

      return (data || []).map(history => ({
        id: history.id,
        team_member_id: history.team_member_id,
        old_status: history.old_status,
        new_status: history.new_status,
        changed_by: history.changed_by,
        reason: history.reason,
        effective_date: history.effective_date,
        created_at: history.created_at
      }));
    } catch (error) {
      console.error('Error fetching member status history:', error);
      return [];
    }
  }
}

export const enhancedTeamManagementService = new EnhancedTeamManagementService();
