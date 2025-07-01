
import { supabase } from '@/integrations/supabase/client';
import { AuditLogService } from './auditLogService';

export interface AuditTrailEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId?: string;
  userName?: string;
  timestamp: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changeDescription: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface RollbackOperation {
  id: string;
  auditEntryId: string;
  performedBy: string;
  performedAt: string;
  success: boolean;
  errorMessage?: string;
}

export class AdvancedAuditService extends AuditLogService {
  static async getEntityAuditTrail(
    entityType: string, 
    entityId: string, 
    limit = 50
  ): Promise<AuditTrailEntry[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(entry => ({
      id: entry.id,
      entityType: entry.entity_type,
      entityId: entry.entity_id,
      action: entry.action,
      userId: entry.user_id,
      userName: 'System User', // Simplified for now
      timestamp: entry.created_at,
      oldValues: typeof entry.details === 'object' && entry.details !== null 
        ? (entry.details as any).old_values 
        : undefined,
      newValues: typeof entry.details === 'object' && entry.details !== null 
        ? (entry.details as any).new_values 
        : undefined,
      changeDescription: this.generateChangeDescription(entry),
      ipAddress: entry.ip_address,
      userAgent: entry.user_agent,
      metadata: typeof entry.details === 'object' && entry.details !== null 
        ? entry.details as Record<string, any> 
        : {}
    }));
  }

  static async rollbackChanges(
    auditEntryId: string, 
    performedBy: string
  ): Promise<RollbackOperation> {
    try {
      // Get the audit entry to rollback
      const { data: auditEntry, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('id', auditEntryId)
        .single();

      if (error || !auditEntry) {
        throw new Error('Audit entry not found');
      }

      const oldValues = typeof auditEntry.details === 'object' && auditEntry.details !== null
        ? (auditEntry.details as any).old_values
        : null;
        
      if (!oldValues) {
        throw new Error('No rollback data available');
      }

      // Perform the rollback based on entity type
      let rollbackSuccess = false;
      let errorMessage: string | undefined;

      try {
        switch (auditEntry.entity_type) {
          case 'team':
            await this.rollbackTeamChanges(auditEntry.entity_id, oldValues);
            break;
          case 'provider':
            await this.rollbackProviderChanges(auditEntry.entity_id, oldValues);
            break;
          case 'user':
            await this.rollbackUserChanges(auditEntry.entity_id, oldValues);
            break;
          default:
            throw new Error(`Rollback not supported for entity type: ${auditEntry.entity_type}`);
        }
        rollbackSuccess = true;
      } catch (rollbackError) {
        errorMessage = rollbackError instanceof Error ? rollbackError.message : 'Unknown error';
      }

      // Log the rollback operation
      const rollbackOp: RollbackOperation = {
        id: crypto.randomUUID(),
        auditEntryId,
        performedBy,
        performedAt: new Date().toISOString(),
        success: rollbackSuccess,
        errorMessage
      };

      // Record the rollback in audit logs
      await this.logAction({
        action: 'rollback',
        entity_type: 'audit_entry',
        entity_id: auditEntryId,
        details: rollbackOp
      });

      return rollbackOp;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown rollback error';
      
      return {
        id: crypto.randomUUID(),
        auditEntryId,
        performedBy,
        performedAt: new Date().toISOString(),
        success: false,
        errorMessage
      };
    }
  }

  private static async rollbackTeamChanges(teamId: string, oldValues: Record<string, any>): Promise<void> {
    const { error } = await supabase
      .from('teams')
      .update(oldValues)
      .eq('id', teamId);

    if (error) throw error;
  }

  private static async rollbackProviderChanges(providerId: string, oldValues: Record<string, any>): Promise<void> {
    const { error } = await supabase
      .from('authorized_providers')
      .update(oldValues)
      .eq('id', parseInt(providerId));

    if (error) throw error;
  }

  private static async rollbackUserChanges(userId: string, oldValues: Record<string, any>): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update(oldValues)
      .eq('id', userId);

    if (error) throw error;
  }

  private static generateChangeDescription(entry: any): string {
    const action = entry.action.toLowerCase();
    const entityType = entry.entity_type;
    
    if (entry.details?.old_values && entry.details?.new_values) {
      const changes = Object.keys(entry.details.new_values).map(key => {
        const oldVal = entry.details.old_values[key];
        const newVal = entry.details.new_values[key];
        return `${key}: "${oldVal}" → "${newVal}"`;
      }).join(', ');
      
      return `${action} ${entityType}: ${changes}`;
    }
    
    return `${action} ${entityType}`;
  }

  static async getComplianceReport(
    startDate: string, 
    endDate: string
  ): Promise<any> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Generate compliance metrics
    const totalActions = data?.length || 0;
    const userActions = data?.filter(log => log.user_id).length || 0;
    const systemActions = totalActions - userActions;
    
    const actionsByType = data?.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const entitiesByType = data?.reduce((acc, log) => {
      acc[log.entity_type] = (acc[log.entity_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return {
      period: { startDate, endDate },
      summary: {
        totalActions,
        userActions,
        systemActions,
        complianceScore: userActions > 0 ? (userActions / totalActions * 100) : 100
      },
      actionBreakdown: actionsByType,
      entityBreakdown: entitiesByType,
      detailedLogs: data?.slice(0, 100) // Latest 100 entries
    };
  }
}
