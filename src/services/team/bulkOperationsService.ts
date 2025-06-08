
import { supabase } from '@/integrations/supabase/client';
import type { BulkOperation } from '@/types/enhanced-team-management';

export class BulkOperationsService {
  static async getBulkOperations(limit: number = 50): Promise<BulkOperation[]> {
    const { data, error } = await supabase
      .from('bulk_operations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async getBulkOperation(operationId: string): Promise<BulkOperation> {
    const { data, error } = await supabase
      .from('bulk_operations')
      .select('*')
      .eq('id', operationId)
      .single();

    if (error) throw error;
    return data;
  }

  static async processBulkTeamMemberAddition(
    teamId: string,
    emails: string[],
    initiatedBy: string
  ): Promise<BulkOperation> {
    const { data, error } = await supabase
      .from('bulk_operations')
      .insert({
        operation_name: `Bulk add ${emails.length} members to team`,
        operation_type: 'team_member_addition',
        initiated_by: initiatedBy,
        total_items: emails.length,
        processed_items: 0,
        failed_items: 0,
        status: 'pending',
        operation_data: { teamId, emails },
        progress_percentage: 0,
        error_log: [],
        can_rollback: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async cancelBulkOperation(operationId: string): Promise<void> {
    const { error } = await supabase
      .from('bulk_operations')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', operationId);

    if (error) throw error;
  }

  static async rollbackBulkOperation(operationId: string): Promise<void> {
    const { error } = await supabase
      .from('bulk_operations')
      .update({ 
        status: 'rollback_initiated',
        updated_at: new Date().toISOString()
      })
      .eq('id', operationId);

    if (error) throw error;
  }
}

export const bulkOperationsService = new BulkOperationsService();
