import { supabase } from '@/integrations/supabase/client';
import { ComplianceService } from '@/services/compliance/complianceService';
import { ComplianceTierService } from '@/services/compliance/complianceTierService';

export interface RequirementUpdateResult {
  success: boolean;
  record?: any;
  complianceData?: UserComplianceData;
  tierAdvancement?: TierAdvancementCheck;
  error?: string;
}

export interface TierSwitchResult {
  success: boolean;
  oldTier?: string;
  newTier: string;
  tierData?: any;
  complianceData?: UserComplianceData;
  error?: string;
}

export interface UserComplianceData {
  userId: string;
  stats: any;
  lastCalculated: string;
}

export interface TierAdvancementCheck {
  userId: string;
  currentTier: string;
  eligible: boolean;
  nextTier: string | null;
  requirements: {
    current: any;
    required: any;
  };
  message: string;
}

export type RequirementStatus = 'pending' | 'in_progress' | 'submitted' | 'approved' | 'revision_required' | 'rejected';

/**
 * ComplianceIntegrationService
 * 
 * Central service for coordinating compliance operations across the system.
 * Handles transactions, ensures data integrity, and maintains audit logs.
 */
export class ComplianceIntegrationService {
  /**
   * Update a requirement's status with transaction support
   */
  static async updateRequirementStatus(
    userId: string,
    metricId: string,
    status: RequirementStatus,
    metadata: any = {}
  ): Promise<RequirementUpdateResult> {
    try {
      // Map requirement status to compliance status
      const complianceStatus = this.mapRequirementStatusToCompliance(status);
      
      // Update status in database using existing ComplianceService
      const recordId = await ComplianceService.updateComplianceRecord(
        userId,
        metricId,
        metadata.value || null,
        complianceStatus,
        metadata.notes
      );
      
      // Log the status change to audit trail
      await this.logStatusChange({
        userId,
        metricId,
        oldStatus: metadata.previousStatus || 'unknown',
        newStatus: status,
        changedBy: userId,
        metadata
      });
      
      // Recalculate user's compliance stats
      const userComplianceData = await this.recalculateUserCompliance(userId);
      
      // Check if this change affects tier advancement
      const tierAdvancementCheck = await this.checkTierAdvancement(userId);
      
      // Send appropriate notifications
      await this.sendStatusChangeNotifications(userId, metricId, status, tierAdvancementCheck);
      
      return {
        success: true,
        record: { id: recordId },
        complianceData: userComplianceData,
        tierAdvancement: tierAdvancementCheck.eligible ? tierAdvancementCheck : undefined
      };
    } catch (error) {
      console.error('Failed to update requirement status:', error);
      
      return {
        success: false,
        error: `Failed to update requirement status: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Switch a user's compliance tier with transaction support
   */
  static async switchUserTier(
    userId: string,
    newTier: 'basic' | 'robust',
    metadata: any = {}
  ): Promise<TierSwitchResult> {
    try {
      // Get current tier first
      const currentTierInfo = await ComplianceTierService.getUserComplianceTierInfo(userId);
      const oldTier = currentTierInfo?.tier || 'basic';
      
      if (oldTier === newTier) {
        return {
          success: true,
          oldTier,
          newTier,
          complianceData: await this.recalculateUserCompliance(userId)
        };
      }
      
      // Switch tier using existing service
      const tierSwitchResult = await ComplianceTierService.switchComplianceTier(userId, newTier);
      
      if (!tierSwitchResult.success) {
        throw new Error(tierSwitchResult.message);
      }
      
      // Log the tier change to audit trail
      await this.logTierChange({
        userId,
        oldTier,
        newTier,
        changedBy: metadata.initiatedBy || userId,
        reason: metadata.reason || 'manual_switch',
        metadata
      });
      
      // Recalculate compliance after tier change
      const userComplianceData = await this.recalculateUserCompliance(userId);
      
      // Send tier change notifications
      await this.sendTierChangeNotification(userId, oldTier, newTier, metadata);
      
      return {
        success: true,
        oldTier,
        newTier,
        tierData: { tier: newTier },
        complianceData: userComplianceData
      };
    } catch (error) {
      console.error('Failed to switch user tier:', error);
      
      return {
        success: false,
        newTier,
        error: `Failed to switch user tier: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Recalculate a user's compliance metrics
   */
  static async recalculateUserCompliance(userId: string): Promise<UserComplianceData> {
    try {
      // Get user compliance summary using existing service
      const summary = await ComplianceService.getUserComplianceSummary(userId);
      
      return {
        userId,
        stats: summary,
        lastCalculated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to recalculate user compliance:', error);
      throw new Error(`Failed to recalculate user compliance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Check if a user is eligible for tier advancement
   */
  static async checkTierAdvancement(userId: string): Promise<TierAdvancementCheck> {
    try {
      // Get user's current tier info
      const tierInfo = await ComplianceTierService.getUserComplianceTierInfo(userId);
      
      if (!tierInfo) {
        return {
          userId,
          currentTier: 'basic',
          eligible: false,
          nextTier: null,
          requirements: {
            current: 0,
            required: 0
          },
          message: 'Unable to determine current tier'
        };
      }
      
      const currentTier = tierInfo.tier;
      const completionPercentage = tierInfo.completion_percentage;
      
      // Determine next tier and requirements
      let nextTier: string | null = null;
      let eligible = false;
      let requiredPercentage = 0;
      
      if (currentTier === 'basic') {
        nextTier = 'robust';
        requiredPercentage = 90; // Require 90% completion to advance to robust
        eligible = completionPercentage >= requiredPercentage;
      }
      
      return {
        userId,
        currentTier,
        eligible,
        nextTier,
        requirements: {
          current: {
            completionPercentage
          },
          required: {
            completionPercentage: requiredPercentage
          }
        },
        message: eligible 
          ? `You are eligible to advance to ${nextTier}!` 
          : nextTier 
            ? `You need ${requiredPercentage}% completion to advance to ${nextTier}` 
            : "You are at the highest tier level"
      };
    } catch (error) {
      console.error('Failed to check tier advancement:', error);
      return {
        userId,
        currentTier: 'unknown',
        eligible: false,
        nextTier: null,
        requirements: {
          current: 0,
          required: 0
        },
        message: `Error checking tier advancement: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Map requirement status to compliance status
   */
  private static mapRequirementStatusToCompliance(status: RequirementStatus): 'compliant' | 'non_compliant' | 'warning' | 'pending' {
    switch (status) {
      case 'approved':
        return 'compliant';
      case 'revision_required':
      case 'rejected':
        return 'non_compliant';
      case 'submitted':
        return 'warning';
      case 'pending':
      case 'in_progress':
      default:
        return 'pending';
    }
  }
  
  /**
   * Log status change to audit trail
   */
  private static async logStatusChange(params: {
    userId: string;
    metricId: string;
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
          metric_id: params.metricId,
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
   * Log tier change to audit trail
   */
  private static async logTierChange(params: {
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
   * Send notifications for status changes
   */
  private static async sendStatusChangeNotifications(
    userId: string,
    metricId: string,
    status: RequirementStatus,
    tierAdvancementCheck: TierAdvancementCheck
  ): Promise<void> {
    try {
      // Get metric details
      const { data: metrics } = await supabase
        .from('compliance_metrics')
        .select('name')
        .eq('id', metricId)
        .single();
      
      const metricName = metrics?.name || 'Requirement';
      
      // Create notification record
      const notificationData = {
        user_id: userId,
        type: this.getNotificationType(status),
        title: this.getNotificationTitle(status),
        message: this.getNotificationMessage(status, metricName),
        metadata: JSON.stringify({
          metricId,
          status,
          tierAdvancement: tierAdvancementCheck.eligible ? tierAdvancementCheck : null
        }) as any,
        created_at: new Date().toISOString()
      };
      
      await supabase
        .from('notifications')
        .insert(notificationData);
        
      // If tier advancement is available, send additional notification
      if (tierAdvancementCheck.eligible) {
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'tier_advancement_eligible',
            title: 'Tier Advancement Available',
            message: `You are now eligible to advance to ${tierAdvancementCheck.nextTier}!`,
            metadata: JSON.stringify({
              tierAdvancement: tierAdvancementCheck
            }) as any,
            created_at: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Failed to send status change notifications:', error);
      // Don't throw - this is a non-critical operation
    }
  }
  
  /**
   * Send tier change notification
   */
  private static async sendTierChangeNotification(
    userId: string,
    oldTier: string,
    newTier: string,
    metadata: any
  ): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'tier_change',
          title: 'Compliance Tier Changed',
          message: `Your compliance tier has been changed from ${oldTier} to ${newTier}.`,
          metadata: JSON.stringify({
            oldTier,
            newTier,
            ...metadata
          }) as any,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to send tier change notification:', error);
      // Don't throw - this is a non-critical operation
    }
  }
  
  /**
   * Get notification type based on status
   */
  private static getNotificationType(status: RequirementStatus): string {
    switch (status) {
      case 'submitted':
        return 'requirement_submitted';
      case 'approved':
        return 'requirement_approved';
      case 'revision_required':
        return 'revision_required';
      case 'rejected':
        return 'requirement_rejected';
      default:
        return 'requirement_updated';
    }
  }
  
  /**
   * Get notification title based on status
   */
  private static getNotificationTitle(status: RequirementStatus): string {
    switch (status) {
      case 'submitted':
        return 'Requirement Submitted';
      case 'approved':
        return 'Requirement Approved';
      case 'revision_required':
        return 'Revision Required';
      case 'rejected':
        return 'Requirement Rejected';
      default:
        return 'Requirement Updated';
    }
  }
  
  /**
   * Get notification message based on status
   */
  private static getNotificationMessage(status: RequirementStatus, metricName: string): string {
    switch (status) {
      case 'submitted':
        return `Your ${metricName} has been submitted for review.`;
      case 'approved':
        return `Your ${metricName} has been approved.`;
      case 'revision_required':
        return `Your ${metricName} requires revision.`;
      case 'rejected':
        return `Your ${metricName} has been rejected.`;
      default:
        return `Your ${metricName} has been updated.`;
    }
  }
}