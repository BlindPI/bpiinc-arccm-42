
import { supabase } from '@/integrations/supabase/client';
import type { TeamBulkOperation, BulkMemberOperation } from '@/types/team-lifecycle';

export class BulkOperationsService {
  static async createBulkOperation(
    teamId: string,
    operationType: string,
    operationData: BulkMemberOperation,
    performedBy: string
  ): Promise<TeamBulkOperation> {
    try {
      const { data, error } = await supabase
        .from('team_bulk_operations')
        .insert({
          team_id: teamId,
          operation_type: operationType,
          operation_data: operationData as any, // Cast to satisfy JSONB
          performed_by: performedBy,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        operation_data: this.safeJsonParse(data.operation_data, {}),
        results: this.safeJsonParse(data.results, {})
      };
    } catch (error) {
      console.error('Error creating bulk operation:', error);
      throw error;
    }
  }

  static async executeBulkOperation(operationId: string): Promise<void> {
    try {
      // Update status to in_progress
      await supabase
        .from('team_bulk_operations')
        .update({ status: 'in_progress' })
        .eq('id', operationId);

      // Get operation details
      const { data: operation, error } = await supabase
        .from('team_bulk_operations')
        .select('*')
        .eq('id', operationId)
        .single();

      if (error) throw error;

      const operationData = this.safeJsonParse(operation.operation_data, {});
      let results = { success: 0, failed: 0, errors: [] as string[] };

      // Execute based on operation type
      switch (operation.operation_type) {
        case 'bulk_add_members':
          results = await this.executeBulkAddMembers(operation.team_id, operationData);
          break;
        case 'bulk_remove_members':
          results = await this.executeBulkRemoveMembers(operation.team_id, operationData);
          break;
        case 'bulk_update_roles':
          results = await this.executeBulkUpdateRoles(operation.team_id, operationData);
          break;
        case 'bulk_transfer_members':
          results = await this.executeBulkTransferMembers(operation.team_id, operationData);
          break;
        default:
          throw new Error(`Unknown operation type: ${operation.operation_type}`);
      }

      // Update operation with results
      await supabase
        .from('team_bulk_operations')
        .update({
          status: results.failed > 0 ? 'completed' : 'completed',
          results: results as any,
          completed_at: new Date().toISOString()
        })
        .eq('id', operationId);

    } catch (error) {
      console.error('Error executing bulk operation:', error);
      
      // Update operation with error
      await supabase
        .from('team_bulk_operations')
        .update({
          status: 'failed',
          error_details: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('id', operationId);

      throw error;
    }
  }

  static async getBulkOperations(teamId: string): Promise<TeamBulkOperation[]> {
    try {
      const { data, error } = await supabase
        .from('team_bulk_operations')
        .select(`
          *,
          profiles(display_name)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        operation_data: this.safeJsonParse(item.operation_data, {}),
        results: this.safeJsonParse(item.results, {})
      }));
    } catch (error) {
      console.error('Error fetching bulk operations:', error);
      return [];
    }
  }

  // Helper method implementations
  private static async executeBulkAddMembers(teamId: string, operationData: any) {
    let success = 0, failed = 0;
    const errors: string[] = [];

    for (const email of operationData.user_emails || []) {
      try {
        // Find user by email
        const { data: user } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();

        if (!user) {
          errors.push(`User not found: ${email}`);
          failed++;
          continue;
        }

        // Add to team
        await supabase
          .from('team_members')
          .insert({
            team_id: teamId,
            user_id: user.id,
            role: operationData.new_role || 'MEMBER',
            status: 'active'
          });

        success++;
      } catch (error) {
        errors.push(`Failed to add ${email}: ${error.message}`);
        failed++;
      }
    }

    return { success, failed, errors };
  }

  private static async executeBulkRemoveMembers(teamId: string, operationData: any) {
    let success = 0, failed = 0;
    const errors: string[] = [];

    for (const memberId of operationData.member_ids || []) {
      try {
        await supabase
          .from('team_members')
          .delete()
          .eq('id', memberId)
          .eq('team_id', teamId);

        success++;
      } catch (error) {
        errors.push(`Failed to remove member ${memberId}: ${error.message}`);
        failed++;
      }
    }

    return { success, failed, errors };
  }

  private static async executeBulkUpdateRoles(teamId: string, operationData: any) {
    let success = 0, failed = 0;
    const errors: string[] = [];

    for (const memberId of operationData.member_ids || []) {
      try {
        await supabase
          .from('team_members')
          .update({
            role: operationData.new_role,
            updated_at: new Date().toISOString()
          })
          .eq('id', memberId)
          .eq('team_id', teamId);

        success++;
      } catch (error) {
        errors.push(`Failed to update role for member ${memberId}: ${error.message}`);
        failed++;
      }
    }

    return { success, failed, errors };
  }

  private static async executeBulkTransferMembers(teamId: string, operationData: any) {
    let success = 0, failed = 0;
    const errors: string[] = [];

    for (const memberId of operationData.member_ids || []) {
      try {
        // Get member details
        const { data: member } = await supabase
          .from('team_members')
          .select('*')
          .eq('id', memberId)
          .single();

        if (!member) {
          errors.push(`Member not found: ${memberId}`);
          failed++;
          continue;
        }

        // Add to target team
        await supabase
          .from('team_members')
          .insert({
            team_id: operationData.target_team_id,
            user_id: member.user_id,
            role: member.role,
            status: 'active'
          });

        // Remove from current team
        await supabase
          .from('team_members')
          .delete()
          .eq('id', memberId);

        success++;
      } catch (error) {
        errors.push(`Failed to transfer member ${memberId}: ${error.message}`);
        failed++;
      }
    }

    return { success, failed, errors };
  }

  private static safeJsonParse<T>(value: any, defaultValue: T): T {
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
}
