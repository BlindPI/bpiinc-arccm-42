import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type TeamAvailabilityPermission = Database['public']['Tables']['team_availability_permissions']['Row'];
type BulkOperation = Database['public']['Tables']['bulk_operation_queue']['Row'];
type AvailabilityChangeApproval = Database['public']['Tables']['availability_change_approvals']['Row'];
type TeamUtilizationMetric = Database['public']['Tables']['team_utilization_metrics']['Row'];

export interface TeamMemberAvailability {
  userId: string;
  userName: string;
  userRole: string;
  availabilitySlots: Array<{
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    bookingType: string;
    status: string;
    title: string;
  }>;
  totalHours: number;
  scheduledHours: number;
  availableHours: number;
}

export interface BulkSchedulingData {
  operationType: 'bulk_schedule' | 'bulk_update' | 'bulk_delete';
  targetUsers: string[];
  scheduleData: {
    date: string;
    startTime: string;
    endTime: string;
    bookingType: string;
    title: string;
    description?: string;
    requiresApproval?: boolean;
  };
}

class TeamManagementService {
  // Get team-wide availability for a specific date range
  async getTeamAvailability(teamId: string, startDate: string, endDate: string): Promise<TeamMemberAvailability[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        user_id,
        role,
        profiles!inner(display_name, role),
        availability_bookings!inner(
          id,
          booking_date,
          start_time,
          end_time,
          booking_type,
          status,
          title,
          description
        )
      `)
      .eq('team_id', teamId)
      .eq('status', 'active')
      .gte('availability_bookings.booking_date', startDate)
      .lte('availability_bookings.booking_date', endDate)
      .order('availability_bookings.booking_date', { ascending: true });

    if (error) throw error;

    return data.map((member: any) => {
      const availabilitySlots = member.availability_bookings.map((booking: any) => ({
        id: booking.id,
        date: booking.booking_date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        bookingType: booking.booking_type,
        status: booking.status,
        title: booking.title || 'Available'
      }));

      const totalHours = availabilitySlots.reduce((total, slot) => {
        const start = new Date(`2000-01-01T${slot.startTime}`);
        const end = new Date(`2000-01-01T${slot.endTime}`);
        return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0);

      const scheduledHours = availabilitySlots
        .filter(slot => slot.bookingType !== 'available')
        .reduce((total, slot) => {
          const start = new Date(`2000-01-01T${slot.startTime}`);
          const end = new Date(`2000-01-01T${slot.endTime}`);
          return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }, 0);

      return {
        userId: member.user_id,
        userName: member.profiles.display_name,
        userRole: member.profiles.role,
        availabilitySlots,
        totalHours,
        scheduledHours,
        availableHours: totalHours - scheduledHours
      };
    });
  }

  // Grant team availability permissions to AP users
  async grantTeamPermission(teamId: string, managerId: string, permissionLevel: 'view' | 'edit' | 'full', expiresAt?: string) {
    const { data, error } = await supabase
      .from('team_availability_permissions')
      .insert({
        team_id: teamId,
        manager_id: managerId,
        permission_level: permissionLevel,
        expires_at: expiresAt,
        granted_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Check if user has permission to manage team availability
  async hasTeamPermission(teamId: string, userId: string): Promise<{ hasPermission: boolean; level: string }> {
    const { data, error } = await supabase
      .from('team_availability_permissions')
      .select('permission_level, expires_at')
      .eq('team_id', teamId)
      .eq('manager_id', userId)
      .single();

    if (error) {
      // Check if user is SA/AD/AP or team admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile?.role && ['SA', 'AD', 'AP'].includes(profile.role)) {
        return { hasPermission: true, level: 'full' };
      }

      // Check if user is team admin
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .eq('role', 'ADMIN')
        .single();

      return { hasPermission: !!teamMember, level: teamMember ? 'full' : 'none' };
    }

    // Check if permission is expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { hasPermission: false, level: 'none' };
    }

    return { hasPermission: true, level: data.permission_level };
  }

  // Create bulk scheduling operation
  async createBulkOperation(operationData: BulkSchedulingData): Promise<BulkOperation> {
    const operationId = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { data, error } = await supabase
      .from('bulk_operation_queue')
      .insert({
        operation_id: operationId,
        operation_type: operationData.operationType,
        target_users: operationData.targetUsers,
        scheduled_data: operationData.scheduleData,
        total_count: operationData.targetUsers.length,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Process bulk scheduling operation
  async processBulkOperation(operationId: string): Promise<void> {
    const { data: operation, error: fetchError } = await supabase
      .from('bulk_operation_queue')
      .select('*')
      .eq('id', operationId)
      .single();

    if (fetchError) throw fetchError;

    // Update operation status to processing
    await supabase
      .from('bulk_operation_queue')
      .update({ 
        status: 'processing', 
        started_at: new Date().toISOString() 
      })
      .eq('id', operationId);

    const errors: string[] = [];
    let processedCount = 0;

    for (const userId of operation.target_users) {
      try {
        const scheduleData = operation.scheduled_data as any;
        
        await supabase
          .from('availability_bookings')
          .insert({
            user_id: userId,
            booking_date: scheduleData.date,
            start_time: scheduleData.startTime,
            end_time: scheduleData.endTime,
            booking_type: scheduleData.bookingType,
            title: scheduleData.title,
            description: scheduleData.description,
            requires_approval: scheduleData.requiresApproval || false,
            bulk_operation_id: operationId
          });

        processedCount++;
      } catch (error) {
        errors.push(`User ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Update operation with results
    await supabase
      .from('bulk_operation_queue')
      .update({
        status: errors.length === 0 ? 'completed' : 'failed',
        processed_count: processedCount,
        error_log: errors,
        completed_at: new Date().toISOString()
      })
      .eq('id', operationId);
  }

  // Get bulk operations for current user
  async getBulkOperations(limit = 20): Promise<BulkOperation[]> {
    const { data, error } = await supabase
      .from('bulk_operation_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  // Request availability change approval
  async requestApproval(changeData: {
    changeId: string;
    requestedChanges: any;
  }): Promise<AvailabilityChangeApproval> {
    const { data, error } = await supabase
      .from('availability_change_approvals')
      .insert({
        change_id: changeData.changeId,
        user_id: (await supabase.auth.getUser()).data.user?.id!,
        requested_changes: changeData.requestedChanges
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Process approval request
  async processApproval(approvalId: string, status: 'approved' | 'rejected', reason?: string): Promise<void> {
    const { error } = await supabase
      .from('availability_change_approvals')
      .update({
        approval_status: status,
        approved_by: (await supabase.auth.getUser()).data.user?.id,
        approval_reason: reason,
        processed_at: new Date().toISOString()
      })
      .eq('id', approvalId);

    if (error) throw error;
  }

  // Get pending approvals for managers
  async getPendingApprovals(): Promise<AvailabilityChangeApproval[]> {
    const { data, error } = await supabase
      .from('availability_change_approvals')
      .select(`
        *,
        profiles!availability_change_approvals_user_id_fkey(display_name, role)
      `)
      .eq('approval_status', 'pending')
      .order('requested_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Get team utilization metrics
  async getTeamUtilizationMetrics(teamId: string, startDate: string, endDate: string): Promise<TeamUtilizationMetric[]> {
    const { data, error } = await supabase
      .from('team_utilization_metrics')
      .select('*')
      .eq('team_id', teamId)
      .gte('metric_date', startDate)
      .lte('metric_date', endDate)
      .order('metric_date', { ascending: true });

    if (error) throw error;
    return data;
  }

  // Calculate and update team utilization for a specific date
  async calculateTeamUtilization(teamId: string, date: string): Promise<any> {
    const { data, error } = await supabase.rpc('calculate_team_utilization_metrics', {
      p_team_id: teamId,
      p_date: date
    });

    if (error) throw error;
    return data;
  }

  // Legacy methods to maintain compatibility with existing codebase
  async getEnhancedTeams(): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_enhanced_teams_data');
    if (error) throw error;
    return data || [];
  }

  async getAllEnhancedTeams(): Promise<any[]> {
    return this.getEnhancedTeams();
  }

  async getSystemWideAnalytics(): Promise<any> {
    const { data, error } = await supabase.rpc('get_admin_team_statistics');
    if (error) throw error;
    return data;
  }

  async createTeamWithLocation(teamData: any): Promise<any> {
    const { data, error } = await supabase.rpc('create_team_bypass_rls', {
      p_name: teamData.name,
      p_description: teamData.description,
      p_team_type: teamData.team_type || 'operational',
      p_location_id: teamData.location_id,
      p_provider_id: teamData.provider_id
    });
    if (error) throw error;
    return data;
  }

  async createTeam(teamData: any): Promise<any> {
    return this.createTeamWithLocation(teamData);
  }

  async getTeamsByLocation(locationId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('location_id', locationId);
    if (error) throw error;
    return data || [];
  }

  async getTeamLocationAssignments(teamId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, location_id, locations(name, address)')
      .eq('id', teamId);
    if (error) throw error;
    return data || [];
  }

  async assignTeamToLocation(teamId: string, locationId: string, type: string): Promise<void> {
    const { error } = await supabase
      .from('teams')
      .update({ location_id: locationId })
      .eq('id', teamId);
    if (error) throw error;
  }

  async getTeamPerformanceMetrics(teamId: string): Promise<any> {
    const { data, error } = await supabase.rpc('calculate_enhanced_team_performance_metrics', {
      p_team_id: teamId,
      p_start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      p_end_date: new Date().toISOString().split('T')[0]
    });
    if (error) throw error;
    return data;
  }

  async getAllTeams(): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_admin_teams_overview');
    if (error) throw error;
    return (data || []).map((item: any) => item.team_data);
  }
}

export const teamManagementService = new TeamManagementService();