
import { supabase } from '@/integrations/supabase/client';
import type { BulkOperation } from '@/types/enhanced-team-management';

export class BulkOperationsService {
  static async createBulkOperation(
    operationName: string,
    operationType: string,
    operationData: Record<string, any>,
    totalItems: number,
    initiatedBy: string
  ): Promise<BulkOperation | null> {
    try {
      const { data, error } = await supabase
        .from('bulk_operations')
        .insert({
          operation_name: operationName,
          operation_type: operationType,
          operation_data: operationData,
          total_items: totalItems,
          initiated_by: initiatedBy
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating bulk operation:', error);
      return null;
    }
  }

  static async updateOperationProgress(
    operationId: string,
    processed: number,
    failed: number = 0
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_bulk_operation_progress', {
        p_operation_id: operationId,
        p_processed: processed,
        p_failed: failed
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating operation progress:', error);
    }
  }

  static async getBulkOperations(
    limit: number = 50,
    status?: string
  ): Promise<BulkOperation[]> {
    try {
      let query = supabase
        .from('bulk_operations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching bulk operations:', error);
      return [];
    }
  }

  static async getBulkOperation(operationId: string): Promise<BulkOperation | null> {
    try {
      const { data, error } = await supabase
        .from('bulk_operations')
        .select('*')
        .eq('id', operationId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching bulk operation:', error);
      return null;
    }
  }

  static async cancelBulkOperation(operationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('bulk_operations')
        .update({ 
          status: 'cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('id', operationId)
        .in('status', ['pending', 'in_progress']);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error cancelling bulk operation:', error);
      return false;
    }
  }

  static async rollbackBulkOperation(operationId: string): Promise<boolean> {
    try {
      const operation = await this.getBulkOperation(operationId);
      if (!operation || !operation.can_rollback || !operation.rollback_data) {
        throw new Error('Operation cannot be rolled back');
      }

      // Create a rollback operation
      const rollbackOperation = await this.createBulkOperation(
        `Rollback: ${operation.operation_name}`,
        'rollback',
        {
          original_operation_id: operationId,
          rollback_data: operation.rollback_data
        },
        operation.processed_items,
        operation.initiated_by
      );

      if (!rollbackOperation) {
        throw new Error('Failed to create rollback operation');
      }

      // Process rollback based on operation type
      await this.processRollback(rollbackOperation);

      return true;
    } catch (error) {
      console.error('Error rolling back bulk operation:', error);
      return false;
    }
  }

  static async processBulkTeamMemberAddition(
    teamId: string,
    userEmails: string[],
    initiatedBy: string
  ): Promise<BulkOperation | null> {
    const operation = await this.createBulkOperation(
      'Bulk Add Team Members',
      'add_team_members',
      { team_id: teamId, user_emails: userEmails },
      userEmails.length,
      initiatedBy
    );

    if (!operation) return null;

    try {
      await this.updateOperationProgress(operation.id, 0);
      
      const results = [];
      const rollbackData = [];
      let processed = 0;
      let failed = 0;

      for (const email of userEmails) {
        try {
          // Get user by email
          const { data: user, error: userError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

          if (userError) {
            results.push({ email, status: 'failed', reason: 'User not found' });
            failed++;
            continue;
          }

          // Add team member
          const { data: teamMember, error: memberError } = await supabase
            .from('team_members')
            .insert({
              team_id: teamId,
              user_id: user.id,
              role: 'MEMBER',
              status: 'active',
              permissions: {},
              assignment_start_date: new Date().toISOString()
            })
            .select()
            .single();

          if (memberError) {
            results.push({ email, status: 'failed', reason: memberError.message });
            failed++;
            continue;
          }

          results.push({ email, status: 'success', team_member_id: teamMember.id });
          rollbackData.push({ team_member_id: teamMember.id });
          processed++;

          // Update progress
          await this.updateOperationProgress(operation.id, processed, failed);
        } catch (error) {
          results.push({ email, status: 'failed', reason: error.message });
          failed++;
        }
      }

      // Update final status
      await supabase
        .from('bulk_operations')
        .update({
          status: failed === 0 ? 'completed' : 'completed',
          completed_at: new Date().toISOString(),
          rollback_data: rollbackData,
          can_rollback: rollbackData.length > 0
        })
        .eq('id', operation.id);

      return operation;
    } catch (error) {
      console.error('Error processing bulk team member addition:', error);
      await supabase
        .from('bulk_operations')
        .update({ 
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_log: [{ error: error.message, timestamp: new Date().toISOString() }]
        })
        .eq('id', operation.id);
      
      return operation;
    }
  }

  private static async processRollback(rollbackOperation: BulkOperation): Promise<void> {
    const { rollback_data } = rollbackOperation.operation_data;
    
    if (rollbackOperation.operation_data.original_operation_id) {
      const originalOp = await this.getBulkOperation(rollbackOperation.operation_data.original_operation_id);
      
      if (originalOp?.operation_type === 'add_team_members') {
        // Remove team members that were added
        for (const item of rollback_data) {
          try {
            await supabase
              .from('team_members')
              .delete()
              .eq('id', item.team_member_id);
          } catch (error) {
            console.error('Error in rollback:', error);
          }
        }
      }
    }

    await supabase
      .from('bulk_operations')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', rollbackOperation.id);
  }
}

export const bulkOperationsService = new BulkOperationsService();
