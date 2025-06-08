
import { supabase } from '@/integrations/supabase/client';
import type { TeamBulkOperation, BulkMemberOperation } from '@/types/team-lifecycle';

export class BulkOperationsService {
  // Execute Bulk Member Operation
  async executeBulkOperation(
    teamId: string,
    operation: BulkMemberOperation,
    userId: string
  ): Promise<string> {
    // Create operation record
    const { data: operationRecord, error: opError } = await supabase
      .from('team_bulk_operations')
      .insert({
        team_id: teamId,
        operation_type: operation.type,
        operation_data: operation,
        performed_by: userId,
        status: 'in_progress'
      })
      .select()
      .single();

    if (opError) throw opError;

    try {
      let results: Record<string, any> = {};

      switch (operation.type) {
        case 'add':
          results = await this.bulkAddMembers(teamId, operation.user_emails || []);
          break;
        case 'remove':
          results = await this.bulkRemoveMembers(operation.member_ids || []);
          break;
        case 'update_role':
          results = await this.bulkUpdateRoles(operation.member_ids || [], operation.new_role || 'MEMBER');
          break;
        case 'transfer':
          results = await this.bulkTransferMembers(operation.member_ids || [], operation.target_team_id || '');
          break;
      }

      // Update operation as completed
      await supabase
        .from('team_bulk_operations')
        .update({
          status: 'completed',
          results: results,
          completed_at: new Date().toISOString()
        })
        .eq('id', operationRecord.id);

      return operationRecord.id;
    } catch (error) {
      // Update operation as failed
      await supabase
        .from('team_bulk_operations')
        .update({
          status: 'failed',
          error_details: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('id', operationRecord.id);

      throw error;
    }
  }

  private async bulkAddMembers(teamId: string, userEmails: string[]): Promise<Record<string, any>> {
    const results = { added: 0, failed: 0, errors: [] as string[] };

    for (const email of userEmails) {
      try {
        // Find user by email
        const { data: user, error: userError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();

        if (userError || !user) {
          results.failed++;
          results.errors.push(`User not found: ${email}`);
          continue;
        }

        // Add to team
        const { error: memberError } = await supabase
          .from('team_members')
          .insert({
            team_id: teamId,
            user_id: user.id,
            role: 'MEMBER'
          });

        if (memberError) {
          results.failed++;
          results.errors.push(`Failed to add ${email}: ${memberError.message}`);
        } else {
          results.added++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Error processing ${email}: ${error}`);
      }
    }

    return results;
  }

  private async bulkRemoveMembers(memberIds: string[]): Promise<Record<string, any>> {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .in('id', memberIds);

    if (error) throw error;

    return { removed: memberIds.length };
  }

  private async bulkUpdateRoles(memberIds: string[], newRole: 'MEMBER' | 'ADMIN'): Promise<Record<string, any>> {
    const { error } = await supabase
      .from('team_members')
      .update({ role: newRole })
      .in('id', memberIds);

    if (error) throw error;

    return { updated: memberIds.length, new_role: newRole };
  }

  private async bulkTransferMembers(memberIds: string[], targetTeamId: string): Promise<Record<string, any>> {
    const { error } = await supabase
      .from('team_members')
      .update({ team_id: targetTeamId })
      .in('id', memberIds);

    if (error) throw error;

    return { transferred: memberIds.length, target_team: targetTeamId };
  }

  // Get Bulk Operations
  async getBulkOperations(teamId: string): Promise<TeamBulkOperation[]> {
    const { data, error } = await supabase
      .from('team_bulk_operations')
      .select(`
        *,
        profiles:performed_by(display_name)
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const bulkOperationsService = new BulkOperationsService();
