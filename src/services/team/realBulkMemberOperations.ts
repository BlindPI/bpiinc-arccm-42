
import { supabase } from '@/integrations/supabase/client';
import { teamBulkOperationsService } from './teamBulkOperationsService';
import { teamMemberHistoryService } from './teamMemberHistoryService';
import type { BulkMemberOperation } from '@/types/team-management';

export class RealBulkMemberOperations {
  static async addMembersToTeam(teamId: string, userEmails: string[]): Promise<{
    success: boolean;
    results: { added: number; failed: any[]; total: number };
  }> {
    try {
      const operation: BulkMemberOperation = {
        type: 'add',
        user_emails: userEmails
      };

      const result = await teamBulkOperationsService.processBulkMemberOperation(teamId, operation);
      
      return {
        success: true,
        results: {
          ...result.results,
          total: userEmails.length
        }
      };
    } catch (error) {
      console.error('Error in bulk add members:', error);
      return {
        success: false,
        results: { added: 0, failed: [{ reason: error.message }], total: userEmails.length }
      };
    }
  }

  static async removeMembersFromTeam(teamId: string, memberIds: string[]): Promise<{
    success: boolean;
    results: { removed: number; failed: any[]; total: number };
  }> {
    try {
      const operation: BulkMemberOperation = {
        type: 'remove',
        member_ids: memberIds
      };

      const result = await teamBulkOperationsService.processBulkMemberOperation(teamId, operation);
      
      return {
        success: true,
        results: {
          ...result.results,
          total: memberIds.length
        }
      };
    } catch (error) {
      console.error('Error in bulk remove members:', error);
      return {
        success: false,
        results: { removed: 0, failed: [{ reason: error.message }], total: memberIds.length }
      };
    }
  }

  static async updateMemberRoles(
    teamId: string, 
    memberIds: string[], 
    newRole: 'ADMIN' | 'MEMBER'
  ): Promise<{
    success: boolean;
    results: { updated: number; failed: any[]; total: number };
  }> {
    try {
      const operation: BulkMemberOperation = {
        type: 'update_role',
        member_ids: memberIds,
        new_role: newRole
      };

      const result = await teamBulkOperationsService.processBulkMemberOperation(teamId, operation);
      
      return {
        success: true,
        results: {
          ...result.results,
          total: memberIds.length
        }
      };
    } catch (error) {
      console.error('Error in bulk update roles:', error);
      return {
        success: false,
        results: { updated: 0, failed: [{ reason: error.message }], total: memberIds.length }
      };
    }
  }

  static async transferMembers(
    memberIds: string[], 
    targetTeamId: string
  ): Promise<{
    success: boolean;
    results: { transferred: number; failed: any[]; total: number };
  }> {
    try {
      const operation: BulkMemberOperation = {
        type: 'transfer',
        member_ids: memberIds,
        target_team_id: targetTeamId
      };

      // For transfers, we don't have a source team ID, so we'll process directly
      const operationId = await teamBulkOperationsService.createBulkOperation(
        targetTeamId, 
        'transfer', 
        operation
      );

      if (!operationId) {
        throw new Error('Failed to create transfer operation record');
      }

      await teamBulkOperationsService.updateOperationStatus(operationId, 'in_progress');

      const results = { transferred: 0, failed: [], total: memberIds.length };

      for (const memberId of memberIds) {
        try {
          // Get current member details for history
          const { data: currentMember, error: fetchError } = await supabase
            .from('team_members')
            .select('team_id, user_id, role')
            .eq('id', memberId)
            .single();

          if (fetchError) {
            results.failed.push({ memberId, reason: fetchError.message });
            continue;
          }

          // Update team assignment
          const { error: updateError } = await supabase
            .from('team_members')
            .update({ 
              team_id: targetTeamId,
              updated_at: new Date().toISOString()
            })
            .eq('id', memberId);

          if (updateError) {
            results.failed.push({ memberId, reason: updateError.message });
            continue;
          }

          // Log the transfer in history
          await teamMemberHistoryService.logStatusChange(
            memberId,
            'active',
            'active',
            currentMember.role,
            currentMember.role,
            `Transferred to team ${targetTeamId}`
          );

          results.transferred++;
        } catch (error) {
          results.failed.push({ memberId, reason: error.message });
        }
      }

      await teamBulkOperationsService.updateOperationStatus(operationId, 'completed', results);
      
      return { success: true, results };
    } catch (error) {
      console.error('Error in bulk transfer members:', error);
      return {
        success: false,
        results: { transferred: 0, failed: [{ reason: error.message }], total: memberIds.length }
      };
    }
  }

  static async getBulkOperationHistory(teamId: string) {
    return teamBulkOperationsService.getBulkOperations(teamId);
  }
}

export const realBulkMemberOperations = new RealBulkMemberOperations();
