
import { supabase } from '@/integrations/supabase/client';

export interface BulkOperation {
  id: string;
  operation_type: string;
  operation_name: string;
  initiated_by: string;
  total_items: number;
  processed_items: number;
  failed_items: number;
  operation_data: Record<string, any>;
  progress_percentage: number;
  error_log: any[];
  rollback_data?: Record<string, any>;
  can_rollback: boolean;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}

// Type guard for valid bulk operation status
function isValidBulkOperationStatus(status: string): status is BulkOperation['status'] {
  return ['pending', 'in_progress', 'completed', 'failed', 'cancelled'].includes(status);
}

// Safe status conversion
function safeBulkOperationStatus(status: string): BulkOperation['status'] {
  return isValidBulkOperationStatus(status) ? status : 'pending';
}

export class BulkOperationsService {
  static async getBulkOperations(): Promise<BulkOperation[]> {
    const { data, error } = await supabase
      .from('bulk_operations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => ({
      ...item,
      status: safeBulkOperationStatus(item.status),
      operation_data: typeof item.operation_data === 'object' ? item.operation_data as Record<string, any> : {},
      error_log: Array.isArray(item.error_log) ? item.error_log : [],
      rollback_data: typeof item.rollback_data === 'object' ? item.rollback_data as Record<string, any> : undefined
    }));
  }

  static async getBulkOperation(id: string): Promise<BulkOperation | null> {
    const { data, error } = await supabase
      .from('bulk_operations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching bulk operation:', error);
      return null;
    }

    return {
      ...data,
      status: safeBulkOperationStatus(data.status),
      operation_data: typeof data.operation_data === 'object' ? data.operation_data as Record<string, any> : {},
      error_log: Array.isArray(data.error_log) ? data.error_log : [],
      rollback_data: typeof data.rollback_data === 'object' ? data.rollback_data as Record<string, any> : undefined
    };
  }

  static async createBulkOperation(operation: Omit<BulkOperation, 'id' | 'created_at' | 'updated_at'>): Promise<BulkOperation> {
    const { data, error } = await supabase
      .from('bulk_operations')
      .insert({
        ...operation,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      status: safeBulkOperationStatus(data.status),
      operation_data: typeof data.operation_data === 'object' ? data.operation_data as Record<string, any> : {},
      error_log: Array.isArray(data.error_log) ? data.error_log : [],
      rollback_data: typeof data.rollback_data === 'object' ? data.rollback_data as Record<string, any> : undefined
    };
  }

  static async updateBulkOperation(id: string, updates: Partial<BulkOperation>): Promise<BulkOperation> {
    const { data, error } = await supabase
      .from('bulk_operations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      status: safeBulkOperationStatus(data.status),
      operation_data: typeof data.operation_data === 'object' ? data.operation_data as Record<string, any> : {},
      error_log: Array.isArray(data.error_log) ? data.error_log : [],
      rollback_data: typeof data.rollback_data === 'object' ? data.rollback_data as Record<string, any> : undefined
    };
  }

  static async cancelBulkOperation(operationId: string): Promise<void> {
    const { error } = await supabase
      .from('bulk_operations')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', operationId);

    if (error) throw error;
  }

  static async rollbackBulkOperation(operationId: string): Promise<void> {
    // Get the operation details
    const operation = await this.getBulkOperation(operationId);
    if (!operation || !operation.can_rollback || !operation.rollback_data) {
      throw new Error('Operation cannot be rolled back');
    }

    // Create a new rollback operation
    await this.createBulkOperation({
      operation_type: 'rollback',
      operation_name: `Rollback: ${operation.operation_name}`,
      initiated_by: operation.initiated_by,
      total_items: operation.processed_items,
      processed_items: 0,
      failed_items: 0,
      operation_data: operation.rollback_data,
      progress_percentage: 0,
      error_log: [],
      can_rollback: false,
      status: 'pending'
    });

    // Mark original operation as rolled back
    await this.updateBulkOperation(operationId, {
      status: 'cancelled',
      updated_at: new Date().toISOString()
    });
  }

  static async processBulkTeamMemberAddition(
    teamId: string, 
    memberEmails: string[], 
    initiatedBy: string
  ): Promise<BulkOperation> {
    // Create the bulk operation record
    const operation = await this.createBulkOperation({
      operation_type: 'team_member_addition',
      operation_name: `Add ${memberEmails.length} members to team`,
      initiated_by: initiatedBy,
      total_items: memberEmails.length,
      processed_items: 0,
      failed_items: 0,
      operation_data: { teamId, memberEmails },
      progress_percentage: 0,
      error_log: [],
      can_rollback: true,
      status: 'pending'
    });

    // Start processing in the background
    this.processTeamMemberAddition(operation.id, teamId, memberEmails);

    return operation;
  }

  private static async processTeamMemberAddition(
    operationId: string,
    teamId: string,
    memberEmails: string[]
  ): Promise<void> {
    try {
      await this.updateBulkOperation(operationId, {
        status: 'in_progress',
        started_at: new Date().toISOString()
      });

      let processed = 0;
      let failed = 0;
      const errors: string[] = [];
      const rollbackData: string[] = [];

      for (const email of memberEmails) {
        try {
          // Find user by email
          const { data: user, error: userError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

          if (userError || !user) {
            errors.push(`User not found: ${email}`);
            failed++;
            continue;
          }

          // Check if already a team member
          const { data: existingMember } = await supabase
            .from('team_members')
            .select('id')
            .eq('team_id', teamId)
            .eq('user_id', user.id)
            .single();

          if (existingMember) {
            errors.push(`User already in team: ${email}`);
            failed++;
            continue;
          }

          // Add to team
          const { data: newMember, error: addError } = await supabase
            .from('team_members')
            .insert({
              team_id: teamId,
              user_id: user.id,
              role: 'MEMBER',
              status: 'active',
              joined_at: new Date().toISOString()
            })
            .select()
            .single();

          if (addError) {
            errors.push(`Failed to add ${email}: ${addError.message}`);
            failed++;
          } else {
            processed++;
            rollbackData.push(newMember.id);
          }
        } catch (error) {
          errors.push(`Error processing ${email}: ${error}`);
          failed++;
        }

        // Update progress
        const progress = Math.round(((processed + failed) / memberEmails.length) * 100);
        await this.updateBulkOperation(operationId, {
          processed_items: processed,
          failed_items: failed,
          progress_percentage: progress,
          error_log: errors
        });
      }

      // Mark as completed
      await this.updateBulkOperation(operationId, {
        status: processed === memberEmails.length ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
        rollback_data: { memberIds: rollbackData }
      });

    } catch (error) {
      console.error('Bulk operation failed:', error);
      await this.updateBulkOperation(operationId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_log: [`Operation failed: ${error}`]
      });
    }
  }
}
