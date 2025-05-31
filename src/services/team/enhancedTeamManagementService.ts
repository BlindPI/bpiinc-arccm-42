
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
          profiles!inner(*)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Transform the data to match our enhanced interface
      return (data || []).map(member => ({
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
        assignments: [],
        status_history: []
      })) as EnhancedTeamMember[];
    } catch (error) {
      console.error('Error fetching enhanced team members:', error);
      throw error;
    }
  }

  async updateMemberDetails(memberId: string, updates: Partial<EnhancedTeamMember>): Promise<void> {
    try {
      // Only update fields that exist in the current schema
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Add fields that exist in current schema
      if (updates.team_position !== undefined) updateData.team_position = updates.team_position;
      if (updates.permissions !== undefined) updateData.permissions = updates.permissions;
      
      // Add fields from new schema if they exist
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
      // Try using the function first, fall back to direct update
      try {
        const { error: rpcError } = await supabase.rpc('update_team_member_status', {
          p_team_member_id: memberId,
          p_new_status: newStatus,
          p_reason: reason
        });
        
        if (!rpcError) return;
      } catch (rpcError) {
        console.warn('RPC function not available, using direct update');
      }

      // Direct update fallback
      const { error } = await supabase
        .from('team_members')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating member status:', error);
      throw error;
    }
  }

  // Location Assignment Management (using existing team_members table)
  async assignMemberToLocation(assignment: Omit<TeamMemberAssignment, 'id' | 'created_at' | 'updated_at'>): Promise<TeamMemberAssignment> {
    try {
      // For now, we'll update the existing team_members table
      const { data, error } = await supabase
        .from('team_members')
        .update({
          location_assignment: assignment.location_id,
          assignment_start_date: assignment.start_date,
          assignment_end_date: assignment.end_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignment.team_member_id)
        .select()
        .single();

      if (error) throw error;
      
      // Return a mock assignment object
      return {
        id: data.id,
        team_member_id: assignment.team_member_id,
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
      // For now, return empty array since we're using the basic team_members table
      console.log('Getting location assignments for member:', memberId);
      return [];
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
          status: 'pending',
          request_data: request,
          requested_by: '',
          approval_data: {}
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

  // Team Location Management (using existing teams table)
  async getTeamLocationAssignments(teamId: string): Promise<TeamLocationAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          id,
          location_id,
          created_at,
          updated_at,
          locations!inner(name)
        `)
        .eq('id', teamId);

      if (error) throw error;
      
      // Transform to match our interface
      return (data || []).map((team, index) => ({
        id: `${team.id}-${index}`,
        team_id: team.id,
        location_id: team.location_id || '',
        assignment_type: 'primary' as const,
        start_date: team.created_at || '',
        end_date: undefined,
        created_at: team.created_at || '',
        updated_at: team.updated_at || '',
        location_name: (team.locations as any)?.name || 'Unknown Location'
      }));
    } catch (error) {
      console.error('Error fetching team location assignments:', error);
      return [];
    }
  }

  async assignTeamToLocation(teamId: string, locationId: string, assignmentType: 'primary' | 'secondary' | 'temporary' = 'primary'): Promise<void> {
    try {
      // For now, update the team's location_id
      const { error } = await supabase
        .from('teams')
        .update({
          location_id: locationId,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId);

      if (error) throw error;
    } catch (error) {
      console.error('Error assigning team to location:', error);
      throw error;
    }
  }

  // Performance Metrics (simplified for existing schema)
  async recordTeamPerformance(metric: Omit<TeamPerformanceMetric, 'id' | 'recorded_date' | 'created_at'>): Promise<void> {
    try {
      // For now, we'll log this action since the table doesn't exist yet
      console.log('Recording team performance metric:', metric);
      // When the team_performance_metrics table is available, we'll implement this
    } catch (error) {
      console.error('Error recording team performance:', error);
      throw error;
    }
  }

  async getTeamPerformanceSummary(teamId: string, period: string = 'monthly'): Promise<any> {
    try {
      // For now, return a mock summary
      return {
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

  // Workflow Management (simplified)
  async createWorkflow(workflow: Omit<TeamWorkflow, 'id' | 'created_at' | 'updated_at'>): Promise<TeamWorkflow> {
    try {
      // For now, return a mock workflow since the table doesn't exist yet
      const mockWorkflow: TeamWorkflow = {
        id: `workflow-${Date.now()}`,
        team_id: workflow.team_id,
        workflow_type: workflow.workflow_type,
        status: workflow.status,
        requested_by: workflow.requested_by,
        approved_by: workflow.approved_by,
        request_data: workflow.request_data,
        approval_data: workflow.approval_data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: workflow.completed_at
      };
      
      console.log('Creating workflow:', mockWorkflow);
      return mockWorkflow;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  async approveWorkflow(workflowId: string, approvedBy: string, approvalData?: Record<string, any>): Promise<void> {
    try {
      console.log('Approving workflow:', workflowId, 'by:', approvedBy);
      // Implementation will be added when the table exists
    } catch (error) {
      console.error('Error approving workflow:', error);
      throw error;
    }
  }

  async getTeamWorkflows(teamId: string): Promise<TeamWorkflow[]> {
    try {
      console.log('Getting workflows for team:', teamId);
      // Return empty array for now
      return [];
    } catch (error) {
      console.error('Error fetching team workflows:', error);
      throw error;
    }
  }

  // Member Status History
  async getMemberStatusHistory(memberId: string): Promise<MemberStatusChange[]> {
    try {
      console.log('Getting status history for member:', memberId);
      // Return empty array for now
      return [];
    } catch (error) {
      console.error('Error fetching member status history:', error);
      throw error;
    }
  }
}

export const enhancedTeamManagementService = new EnhancedTeamManagementService();
