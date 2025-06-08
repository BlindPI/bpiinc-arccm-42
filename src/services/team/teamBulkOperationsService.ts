
import { supabase } from '@/integrations/supabase/client';
import type { BulkMemberOperation } from '@/types/team-management';

export interface TeamBulkOperation {
  id: string;
  team_id: string;
  operation_type: string;
  operation_data: Record<string, any>;
  performed_by?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  results?: Record<string, any>;
  error_details?: string;
  created_at: string;
  completed_at?: string;
}

export class TeamBulkOperationsService {
  static async createBulkOperation(
    teamId: string,
    operationType: string,
    operationData: Record<string, any>
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('team_bulk_operations')
        .insert({
          team_id: teamId,
          operation_type: operationType,
          operation_data: operationData,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating bulk operation:', error);
      return null;
    }
  }

  static async updateOperationStatus(
    operationId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'failed',
    results?: Record<string, any>,
    errorDetails?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (results) updateData.results = results;
      if (errorDetails) updateData.error_details = errorDetails;
      if (status === 'completed' || status === 'failed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('team_bulk_operations')
        .update(updateData)
        .eq('id', operationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating operation status:', error);
      throw error;
    }
  }

  static async getBulkOperations(teamId: string): Promise<TeamBulkOperation[]> {
    try {
      const { data, error } = await supabase
        .from('team_bulk_operations')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      return (data || []).map(item => ({
        id: item.id,
        team_id: item.team_id,
        operation_type: item.operation_type,
        operation_data: (item.operation_data as any) || {},
        performed_by: item.performed_by,
        status: item.status as 'pending' | 'in_progress' | 'completed' | 'failed',
        results: (item.results as any) || undefined,
        error_details: item.error_details || undefined,
        created_at: item.created_at,
        completed_at: item.completed_at || undefined
      }));
    } catch (error) {
      console.error('Error fetching bulk operations:', error);
      return [];
    }
  }

  static async processBulkMemberOperation(
    teamId: string,
    operation: BulkMemberOperation
  ): Promise<{ success: boolean; results: any }> {
    const operationId = await this.createBulkOperation(teamId, operation.type, operation);
    
    if (!operationId) {
      throw new Error('Failed to create bulk operation record');
    }

    try {
      await this.updateOperationStatus(operationId, 'in_progress');

      const results = await this.executeBulkOperation(teamId, operation);

      await this.updateOperationStatus(operationId, 'completed', results);
      
      return { success: true, results };
    } catch (error) {
      await this.updateOperationStatus(operationId, 'failed', undefined, error.message);
      throw error;
    }
  }

  private static async executeBulkOperation(
    teamId: string,
    operation: BulkMemberOperation
  ): Promise<any> {
    switch (operation.type) {
      case 'add':
        return this.bulkAddMembers(teamId, operation.user_emails || []);
      case 'remove':
        return this.bulkRemoveMembers(teamId, operation.member_ids || []);
      case 'update_role':
        return this.bulkUpdateRoles(teamId, operation.member_ids || [], operation.new_role || 'MEMBER');
      case 'transfer':
        return this.bulkTransferMembers(operation.member_ids || [], operation.target_team_id || '');
      default:
        throw new Error(`Unsupported operation type: ${operation.type}`);
    }
  }

  private static async bulkAddMembers(teamId: string, emails: string[]): Promise<any> {
    const results = { added: 0, failed: [], emails: emails };
    
    for (const email of emails) {
      try {
        // Get user by email
        const { data: user, error: userError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();

        if (userError) {
          results.failed.push({ email, reason: 'User not found' });
          continue;
        }

        // Add team member
        const { error: memberError } = await supabase
          .from('team_members')
          .insert({
            team_id: teamId,
            user_id: user.id,
            role: 'MEMBER',
            status: 'active',
            permissions: {},
            assignment_start_date: new Date().toISOString()
          });

        if (memberError) {
          results.failed.push({ email, reason: memberError.message });
          continue;
        }

        results.added++;
      } catch (error) {
        results.failed.push({ email, reason: error.message });
      }
    }

    return results;
  }

  private static async bulkRemoveMembers(teamId: string, memberIds: string[]): Promise<any> {
    const results = { removed: 0, failed: [] };

    for (const memberId of memberIds) {
      try {
        const { error } = await supabase
          .from('team_members')
          .delete()
          .eq('id', memberId)
          .eq('team_id', teamId);

        if (error) {
          results.failed.push({ memberId, reason: error.message });
          continue;
        }

        results.removed++;
      } catch (error) {
        results.failed.push({ memberId, reason: error.message });
      }
    }

    return results;
  }

  private static async bulkUpdateRoles(
    teamId: string, 
    memberIds: string[], 
    newRole: 'ADMIN' | 'MEMBER'
  ): Promise<any> {
    const results = { updated: 0, failed: [] };

    for (const memberId of memberIds) {
      try {
        const { error } = await supabase
          .from('team_members')
          .update({ role: newRole })
          .eq('id', memberId)
          .eq('team_id', teamId);

        if (error) {
          results.failed.push({ memberId, reason: error.message });
          continue;
        }

        results.updated++;
      } catch (error) {
        results.failed.push({ memberId, reason: error.message });
      }
    }

    return results;
  }

  private static async bulkTransferMembers(memberIds: string[], targetTeamId: string): Promise<any> {
    const results = { transferred: 0, failed: [] };

    for (const memberId of memberIds) {
      try {
        const { error } = await supabase
          .from('team_members')
          .update({ team_id: targetTeamId })
          .eq('id', memberId);

        if (error) {
          results.failed.push({ memberId, reason: error.message });
          continue;
        }

        results.transferred++;
      } catch (error) {
        results.failed.push({ memberId, reason: error.message });
      }
    }

    return results;
  }
}

export const teamBulkOperationsService = new TeamBulkOperationsService();
