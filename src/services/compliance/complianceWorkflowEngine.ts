import { supabase } from '@/integrations/supabase/client';
import { ComplianceService } from '@/services/compliance/complianceService';
import { ComplianceTierService } from '@/services/compliance/complianceTierService';

export interface WorkflowTrigger {
  type: 'role_change' | 'tier_advancement' | 'deadline_warning' | 'requirement_completion';
  userId: string;
  metadata?: any;
}

export interface WorkflowResult {
  success: boolean;
  message: string;
  actions: WorkflowAction[];
}

export interface WorkflowAction {
  type: string;
  data: any;
}

export interface WorkflowMetadata {
  initiatedBy?: string;
  context?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export class ComplianceWorkflowEngine {
  
  /**
   * Process workflow trigger with real database operations
   */
  static async processWorkflowTrigger(
    trigger: WorkflowTrigger,
    userId: string,
    metadata: WorkflowMetadata = {}
  ): Promise<WorkflowResult> {
    try {
      console.log('Processing workflow trigger:', trigger.type, 'for user:', userId);
      
      switch (trigger.type) {
        case 'role_change':
          return await this.handleRoleChangeWorkflow(
            userId,
            trigger.metadata.oldRole,
            trigger.metadata.newRole,
            metadata.initiatedBy || 'system'
          );
        case 'tier_advancement':
          return await this.handleTierAdvancementWorkflow(
            userId,
            trigger.metadata.currentTier,
            trigger.metadata.targetTier
          );
        case 'deadline_warning':
          return await this.handleComplianceDeadlineWorkflow(
            userId,
            trigger.metadata.requirementId,
            trigger.metadata.daysUntilDeadline
          );
        default:
          throw new Error(`Unknown workflow trigger type: ${trigger.type}`);
      }
    } catch (error) {
      console.error('Workflow execution error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown workflow error',
        actions: []
      };
    }
  }
  
  /**
   * Handle role change workflow with real database operations
   */
  static async handleRoleChangeWorkflow(
    userId: string,
    oldRole: string,
    newRole: string,
    initiatedBy: string
  ): Promise<WorkflowResult> {
    try {
      console.log(`Processing role change: ${oldRole} -> ${newRole} for user ${userId}`);
      
      // 1. Validate role change eligibility
      const eligibility = await this.validateRoleChangeEligibility(userId, oldRole, newRole);
      if (!eligibility.allowed) {
        return {
          success: false,
          message: eligibility.reason || 'Role change not allowed',
          actions: []
        };
      }
      
      // 2. Update user profile with new role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (profileError) throw profileError;
      
      // 3. Determine appropriate tier for new role
      const newTier = this.determineDefaultTier(newRole);
      
      // 4. Switch tier if necessary using existing service
      let tierSwitchResult = null;
      if (newTier) {
        tierSwitchResult = await ComplianceTierService.assignComplianceTier(
          userId,
          newRole as 'AP' | 'IC' | 'IP' | 'IT',
          newTier
        );
      }
      
      // 5. Log the role change activity
      await this.logRoleChangeActivity(userId, oldRole, newRole, initiatedBy);
      
      const actions: WorkflowAction[] = [
        { type: 'role_updated', data: { oldRole, newRole } }
      ];
      
      if (tierSwitchResult?.success) {
        actions.push({ 
          type: 'tier_assigned', 
          data: { 
            tier: newTier, 
            requirementsAdded: tierSwitchResult.requirements_added 
          } 
        });
      }
      
      return {
        success: true,
        message: `Role changed from ${oldRole} to ${newRole} successfully`,
        actions
      };
    } catch (error) {
      console.error('Role change workflow error:', error);
      throw error;
    }
  }
  
  /**
   * Handle compliance deadline workflow with real database operations
   */
  static async handleComplianceDeadlineWorkflow(
    userId: string,
    metricId: string,
    daysUntilDeadline: number
  ): Promise<WorkflowResult> {
    try {
      // Get actual metric and user details from database
      const { data: metric, error: metricError } = await supabase
        .from('compliance_metrics')
        .select('name, category, measurement_type')
        .eq('id', metricId)
        .single();
      
      if (metricError) throw metricError;
      
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('display_name, email, role')
        .eq('id', userId)
        .single();
      
      if (userError) throw userError;
      
      if (!metric || !user) {
        throw new Error('Metric or user not found');
      }
      
      const actions: WorkflowAction[] = [];
      
      // Determine escalation level based on days until deadline
      let escalationLevel: 'warning' | 'urgent' | 'overdue';
      if (daysUntilDeadline <= 0) {
        escalationLevel = 'overdue';
      } else if (daysUntilDeadline <= 1) {
        escalationLevel = 'urgent';
      } else {
        escalationLevel = 'warning';
      }
      
      // Create deadline notification record
      await this.createDeadlineNotification(userId, metricId, escalationLevel, daysUntilDeadline);
      actions.push({ type: 'notification_sent', data: { escalationLevel } });
      
      // For overdue requirements, create action item
      if (daysUntilDeadline <= 0) {
        await ComplianceService.createComplianceAction({
          user_id: userId,
          metric_id: metricId,
          action_type: 'overdue_requirement',
          title: `Overdue: ${metric.name}`,
          description: `This requirement is now overdue and requires immediate attention.`,
          due_date: new Date().toISOString(),
          priority: 'critical'
        });
        actions.push({ type: 'action_created', data: { type: 'overdue_requirement' } });
      }
      
      // Log deadline workflow execution
      await this.logDeadlineWorkflow(userId, metricId, escalationLevel, daysUntilDeadline);
      
      return {
        success: true,
        message: `Deadline workflow executed for ${escalationLevel} requirement`,
        actions
      };
    } catch (error) {
      console.error('Deadline workflow error:', error);
      throw error;
    }
  }
  
  /**
   * Handle tier advancement workflow with real database operations
   */
  static async handleTierAdvancementWorkflow(
    userId: string,
    currentTier: string,
    targetTier: string
  ): Promise<WorkflowResult> {
    try {
      // Get current tier info using existing service
      const tierInfo = await ComplianceTierService.getUserComplianceTierInfo(userId);
      if (!tierInfo) {
        return {
          success: false,
          message: 'Unable to retrieve user tier information',
          actions: []
        };
      }
      
      // Check if user meets completion threshold for advancement
      if (tierInfo.completion_percentage < 85) {
        return {
          success: false,
          message: `Need ${85 - tierInfo.completion_percentage}% more completion for advancement`,
          actions: []
        };
      }
      
      // Create advancement request as compliance action
      const advancementAction = await ComplianceService.createComplianceAction({
        user_id: userId,
        metric_id: 'tier_advancement',
        action_type: 'tier_advancement_request',
        title: `Tier Advancement Request: ${currentTier} to ${targetTier}`,
        description: `User has completed ${tierInfo.completion_percentage}% and is eligible for tier advancement.`,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        priority: 'medium'
      });
      
      return {
        success: true,
        message: 'Tier advancement request submitted for review',
        actions: [
          {
            type: 'advancement_request_created',
            data: {
              actionId: advancementAction.id,
              completionPercentage: tierInfo.completion_percentage
            }
          }
        ]
      };
    } catch (error) {
      console.error('Tier advancement workflow error:', error);
      throw error;
    }
  }
  
  // Helper methods for real database operations
  
  private static async validateRoleChangeEligibility(
    userId: string,
    oldRole: string,
    newRole: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Get current compliance status using existing service
      const tierInfo = await ComplianceTierService.getUserComplianceTierInfo(userId);
      if (!tierInfo) {
        return { allowed: false, reason: 'Unable to retrieve compliance status' };
      }
      
      // Check role-specific advancement rules
      const roleRules: Record<string, { canAdvanceTo: string[]; minCompletion: number }> = {
        'IT': { canAdvanceTo: ['IP'], minCompletion: 90 },
        'IP': { canAdvanceTo: ['IC'], minCompletion: 95 },
        'IC': { canAdvanceTo: ['AP'], minCompletion: 100 },
        'AP': { canAdvanceTo: [], minCompletion: 100 }
      };
      
      const rules = roleRules[oldRole];
      if (!rules) {
        return { allowed: false, reason: 'Invalid current role' };
      }
      
      if (!rules.canAdvanceTo.includes(newRole)) {
        return { allowed: false, reason: `Cannot advance from ${oldRole} to ${newRole}` };
      }
      
      if (tierInfo.completion_percentage < rules.minCompletion) {
        return { 
          allowed: false, 
          reason: `Need ${rules.minCompletion}% completion for role change (currently ${tierInfo.completion_percentage}%)` 
        };
      }
      
      return { allowed: true };
    } catch (error) {
      console.error('Error validating role change eligibility:', error);
      return { allowed: false, reason: 'Error validating eligibility' };
    }
  }
  
  private static determineDefaultTier(role: string): 'basic' | 'robust' | null {
    // Default tier assignment based on role
    const defaultTiers: Record<string, 'basic' | 'robust'> = {
      'IT': 'basic',    // Instructor Trainee starts with basic
      'IP': 'basic',    // Instructor Provisional starts with basic  
      'IC': 'robust',   // Instructor Certified requires robust
      'AP': 'basic'     // Authorized Provider can start with basic
    };
    
    return defaultTiers[role] || null;
  }
  
  private static async logRoleChangeActivity(
    userId: string,
    oldRole: string,
    newRole: string,
    initiatedBy: string
  ): Promise<void> {
    try {
      await supabase
        .from('compliance_audit_log')
        .insert({
          user_id: userId,
          audit_type: 'role_change',
          notes: `Role changed from ${oldRole} to ${newRole}`,
          performed_by: initiatedBy,
          old_value: { role: oldRole },
          new_value: { role: newRole },
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging role change activity:', error);
    }
  }
  
  private static async createDeadlineNotification(
    userId: string,
    metricId: string,
    escalationLevel: string,
    daysUntilDeadline: number
  ): Promise<void> {
    try {
      // Create deadline notification as compliance action
      await ComplianceService.createComplianceAction({
        user_id: userId,
        metric_id: metricId,
        action_type: 'deadline_reminder',
        title: `Compliance Deadline ${escalationLevel.toUpperCase()}`,
        description: `Your compliance requirement is ${daysUntilDeadline <= 0 ? 'overdue' : `due in ${daysUntilDeadline} day(s)`}`,
        due_date: new Date().toISOString(),
        priority: escalationLevel === 'overdue' ? 'critical' : escalationLevel === 'urgent' ? 'high' : 'medium'
      });
    } catch (error) {
      console.error('Error creating deadline notification:', error);
    }
  }
  
  private static async logDeadlineWorkflow(
    userId: string,
    metricId: string,
    escalationLevel: string,
    daysUntilDeadline: number
  ): Promise<void> {
    try {
      await supabase
        .from('compliance_audit_log')
        .insert({
          user_id: userId,
          metric_id: metricId,
          audit_type: 'deadline_workflow',
          notes: `Deadline workflow executed: ${escalationLevel} (${daysUntilDeadline} days)`,
          performed_by: 'system',
          old_value: { escalationLevel, daysUntilDeadline },
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging deadline workflow:', error);
    }
  }
}