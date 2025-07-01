import { supabase } from '@/integrations/supabase/client';

/**
 * ComplianceAuditService
 * 
 * Provides comprehensive audit logging for all compliance operations.
 * Maintains a detailed history of changes, user actions, and system events.
 */
export class ComplianceAuditService {
  /**
   * Log a requirement status change
   */
  static async logStatusChange(params: {
    userId: string;
    requirementId: string;
    oldStatus: string;
    newStatus: string;
    changedBy: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await supabase
        .from('compliance_audit_log')
        .insert({
          audit_type: 'requirement_status_change',
          user_id: params.userId,
          performed_by: params.changedBy,
          metric_id: params.requirementId,
          old_value: params.oldStatus,
          new_value: params.newStatus,
          notes: JSON.stringify(params.metadata || {}),
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log status change:', error);
      // Don't throw - audit logging should not stop the main operation
    }
  }
  
  /**
   * Log a tier change
   */
  static async logTierChange(params: {
    userId: string;
    oldTier: string;
    newTier: string;
    changedBy: string;
    reason: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await supabase
        .from('compliance_audit_log')
        .insert({
          audit_type: 'tier_change',
          user_id: params.userId,
          performed_by: params.changedBy,
          old_value: params.oldTier,
          new_value: params.newTier,
          notes: `Reason: ${params.reason}. ${JSON.stringify(params.metadata || {})}`,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log tier change:', error);
      // Don't throw - audit logging should not stop the main operation
    }
  }
  
  /**
   * Log requirement submission
   */
  static async logRequirementSubmission(params: {
    userId: string;
    requirementId: string;
    submissionData: any;
    metadata?: any;
  }): Promise<void> {
    try {
      await supabase
        .from('compliance_audit_log')
        .insert({
          audit_type: 'requirement_submission',
          user_id: params.userId,
          performed_by: params.userId,
          metric_id: params.requirementId,
          new_value: JSON.stringify(params.submissionData),
          notes: JSON.stringify(params.metadata || {}),
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log requirement submission:', error);
      // Don't throw - audit logging should not stop the main operation
    }
  }
  
  /**
   * Log requirement review
   */
  static async logRequirementReview(params: {
    userId: string;
    requirementId: string;
    reviewerId: string;
    decision: 'approved' | 'revision_required' | 'rejected';
    comments?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await supabase
        .from('compliance_audit_log')
        .insert({
          audit_type: 'requirement_review',
          user_id: params.userId,
          performed_by: params.reviewerId,
          metric_id: params.requirementId,
          new_value: params.decision,
          notes: `Decision: ${params.decision}. Comments: ${params.comments || 'None'}. ${JSON.stringify(params.metadata || {})}`,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log requirement review:', error);
      // Don't throw - audit logging should not stop the main operation
    }
  }
  
  /**
   * Log user initialization
   */
  static async logUserInitialization(params: {
    userId: string;
    role: string;
    initialTier: string;
    requirementCount: number;
    metadata?: any;
  }): Promise<void> {
    try {
      await supabase
        .from('compliance_audit_log')
        .insert({
          audit_type: 'user_initialization',
          user_id: params.userId,
          performed_by: 'system',
          new_value: JSON.stringify({
            role: params.role,
            initialTier: params.initialTier,
            requirementCount: params.requirementCount
          }),
          notes: JSON.stringify(params.metadata || {}),
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log user initialization:', error);
      // Don't throw - audit logging should not stop the main operation
    }
  }
  
  /**
   * Log role change
   */
  static async logRoleChange(params: {
    userId: string;
    oldRole: string;
    newRole: string;
    tierChanged: boolean;
    newTier?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await supabase
        .from('compliance_audit_log')
        .insert({
          audit_type: 'role_change',
          user_id: params.userId,
          performed_by: 'system',
          old_value: params.oldRole,
          new_value: params.newRole,
          notes: JSON.stringify({
            tierChanged: params.tierChanged,
            newTier: params.newTier,
            ...params.metadata
          }),
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log role change:', error);
      // Don't throw - audit logging should not stop the main operation
    }
  }
  
  /**
   * Log user deactivation
   */
  static async logUserDeactivation(params: {
    userId: string;
    reason: string;
    deactivatedAt: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await supabase
        .from('compliance_audit_log')
        .insert({
          audit_type: 'user_deactivation',
          user_id: params.userId,
          performed_by: 'system',
          new_value: 'deactivated',
          notes: `Reason: ${params.reason}. Deactivated at: ${params.deactivatedAt}. ${JSON.stringify(params.metadata || {})}`,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log user deactivation:', error);
      // Don't throw - audit logging should not stop the main operation
    }
  }
  
  /**
   * Log document verification
   */
  static async logDocumentVerification(params: {
    userId: string;
    documentId: string;
    verifierId: string;
    decision: 'approved' | 'rejected';
    comments?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await supabase
        .from('compliance_audit_log')
        .insert({
          audit_type: 'document_verification',
          user_id: params.userId,
          performed_by: params.verifierId,
          new_value: params.decision,
          notes: `Document ID: ${params.documentId}. Decision: ${params.decision}. Comments: ${params.comments || 'None'}. ${JSON.stringify(params.metadata || {})}`,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log document verification:', error);
      // Don't throw - audit logging should not stop the main operation
    }
  }
  
  /**
   * Get audit logs for a user
   */
  static async getUserAuditLogs(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      auditTypes?: string[];
      startDate?: string;
      endDate?: string;
    } = {}
  ) {
    try {
      let query = supabase
        .from('compliance_audit_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (options.auditTypes && options.auditTypes.length > 0) {
        query = query.in('audit_type', options.auditTypes);
      }
      
      if (options.startDate) {
        query = query.gte('created_at', options.startDate);
      }
      
      if (options.endDate) {
        query = query.lte('created_at', options.endDate);
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        logs: data || [],
        count
      };
    } catch (error) {
      console.error('Failed to get user audit logs:', error);
      throw new Error(`Failed to get user audit logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get audit logs for a requirement
   */
  static async getRequirementAuditLogs(
    requirementId: string,
    options: {
      limit?: number;
      offset?: number;
      auditTypes?: string[];
      startDate?: string;
      endDate?: string;
    } = {}
  ) {
    try {
      let query = supabase
        .from('compliance_audit_log')
        .select('*')
        .eq('metric_id', requirementId)
        .order('created_at', { ascending: false });
      
      if (options.auditTypes && options.auditTypes.length > 0) {
        query = query.in('audit_type', options.auditTypes);
      }
      
      if (options.startDate) {
        query = query.gte('created_at', options.startDate);
      }
      
      if (options.endDate) {
        query = query.lte('created_at', options.endDate);
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        logs: data || [],
        count
      };
    } catch (error) {
      console.error('Failed to get requirement audit logs:', error);
      throw new Error(`Failed to get requirement audit logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get all audit logs (admin only)
   */
  static async getAllAuditLogs(
    options: {
      limit?: number;
      offset?: number;
      auditTypes?: string[];
      startDate?: string;
      endDate?: string;
      userId?: string;
    } = {}
  ) {
    try {
      let query = supabase
        .from('compliance_audit_log')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }
      
      if (options.auditTypes && options.auditTypes.length > 0) {
        query = query.in('audit_type', options.auditTypes);
      }
      
      if (options.startDate) {
        query = query.gte('created_at', options.startDate);
      }
      
      if (options.endDate) {
        query = query.lte('created_at', options.endDate);
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        logs: data || [],
        count
      };
    } catch (error) {
      console.error('Failed to get all audit logs:', error);
      throw new Error(`Failed to get all audit logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get audit statistics
   */
  static async getAuditStatistics(
    options: {
      startDate?: string;
      endDate?: string;
      userId?: string;
    } = {}
  ) {
    try {
      let query = supabase
        .from('compliance_audit_log')
        .select('audit_type, created_at');
      
      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }
      
      if (options.startDate) {
        query = query.gte('created_at', options.startDate);
      }
      
      if (options.endDate) {
        query = query.lte('created_at', options.endDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Process data to get statistics
      const stats = {
        totalEvents: data?.length || 0,
        eventsByType: {} as Record<string, number>,
        eventsByDate: {} as Record<string, number>
      };
      
      data?.forEach(log => {
        // Count by type
        stats.eventsByType[log.audit_type] = (stats.eventsByType[log.audit_type] || 0) + 1;
        
        // Count by date
        const date = new Date(log.created_at).toISOString().split('T')[0];
        stats.eventsByDate[date] = (stats.eventsByDate[date] || 0) + 1;
      });
      
      return stats;
    } catch (error) {
      console.error('Failed to get audit statistics:', error);
      throw new Error(`Failed to get audit statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Export audit logs to JSON
   */
  static async exportAuditLogs(
    options: {
      startDate?: string;
      endDate?: string;
      userId?: string;
      auditTypes?: string[];
    } = {}
  ): Promise<string> {
    try {
      const { logs } = await this.getAllAuditLogs({
        ...options,
        limit: 10000 // Export limit
      });
      
      const exportData = {
        exportedAt: new Date().toISOString(),
        filters: options,
        totalRecords: logs.length,
        logs
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export audit logs:', error);
      throw new Error(`Failed to export audit logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}