
import { supabase } from '@/integrations/supabase/client';
import type { TeamBulkOperation, BulkMemberOperation } from '@/types/team-management';

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
          operation_data: operationData as any,
          performed_by: performedBy,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        status: data.status as 'pending' | 'in_progress' | 'completed' | 'failed',
        operation_data: this.safeJsonParse(data.operation_data, {}),
        results: this.safeJsonParse(data.results, {})
      };
    } catch (error) {
      console.error('Error creating bulk operation:', error);
      throw error;
    }
  }

  static async executeBulkOperation(
    teamId: string,
    operation: BulkMemberOperation,
    performedBy: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      let results = { success: 0, failed: 0, errors: [] as string[] };

      switch (operation.type) {
        case 'add':
          results = await this.executeBulkAddMembers(teamId, operation);
          break;
        case 'remove':
          results = await this.executeBulkRemoveMembers(teamId, operation);
          break;
        case 'update_role':
          results = await this.executeBulkUpdateRoles(teamId, operation);
          break;
        case 'transfer':
          results = await this.executeBulkTransferMembers(teamId, operation);
          break;
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      return results;
    } catch (error) {
      console.error('Error executing bulk operation:', error);
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
        status: item.status as 'pending' | 'in_progress' | 'completed' | 'failed',
        operation_data: this.safeJsonParse(item.operation_data, {}),
        results: this.safeJsonParse(item.results, {})
      }));
    } catch (error) {
      console.error('Error fetching bulk operations:', error);
      return [];
    }
  }

  // Helper method implementations
  private static async executeBulkAddMembers(teamId: string, operationData: BulkMemberOperation) {
    let success = 0, failed = 0;
    const errors: string[] = [];

    for (const email of operationData.user_emails || []) {
      try {
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

        await supabase
          .from('team_members')
          .insert({
            team_id: teamId,
            user_id: user.id,
            role: operationData.new_role || 'MEMBER',
            status: 'active'
          });

        success++;
      } catch (error: any) {
        errors.push(`Failed to add ${email}: ${error.message}`);
        failed++;
      }
    }

    return { success, failed, errors };
  }

  private static async executeBulkRemoveMembers(teamId: string, operationData: BulkMemberOperation) {
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
      } catch (error: any) {
        errors.push(`Failed to remove member ${memberId}: ${error.message}`);
        failed++;
      }
    }

    return { success, failed, errors };
  }

  private static async executeBulkUpdateRoles(teamId: string, operationData: BulkMemberOperation) {
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
      } catch (error: any) {
        errors.push(`Failed to update role for member ${memberId}: ${error.message}`);
        failed++;
      }
    }

    return { success, failed, errors };
  }

  private static async executeBulkTransferMembers(teamId: string, operationData: BulkMemberOperation) {
    let success = 0, failed = 0;
    const errors: string[] = [];

    for (const memberId of operationData.member_ids || []) {
      try {
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

        await supabase
          .from('team_members')
          .insert({
            team_id: operationData.target_team_id,
            user_id: member.user_id,
            role: member.role,
            status: 'active'
          });

        await supabase
          .from('team_members')
          .delete()
          .eq('id', memberId);

        success++;
      } catch (error: any) {
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

// Export as singleton instance
export const bulkOperationsService = new BulkOperationsService();
