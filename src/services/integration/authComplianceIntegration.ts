import { supabase } from '@/integrations/supabase/client';
import { ComplianceIntegrationService } from './complianceIntegrationService';
import { ComplianceTierService } from '@/services/compliance/complianceTierService';
import { ComplianceService } from '@/services/compliance/complianceService';
import { ComplianceRequirementsService } from '@/services/compliance/complianceRequirementsService';

export interface UserInitializationResult {
  success: boolean;
  userId: string;
  role: string;
  tier?: any;
  requirementCount?: number;
  stats?: any;
  error?: string;
}

export interface RoleChangeResult {
  success: boolean;
  userId: string;
  newRole: string;
  oldRole: string;
  tierChanged?: boolean;
  newTier?: string;
  oldTier?: string;
  error?: string;
}

export interface DeactivationResult {
  success: boolean;
  userId: string;
  deactivatedAt?: string;
  reason?: string;
  error?: string;
}

/**
 * AuthComplianceIntegration
 * 
 * Integrates user authentication with compliance operations.
 * Handles user provisioning, role assignments, and compliance tier initialization.
 */
export class AuthComplianceIntegration {
  /**
   * Initialize compliance for a new user
   */
  static async initializeUserCompliance(
    userId: string,
    role: 'AP' | 'IC' | 'IP' | 'IT',
    metadata: any = {}
  ): Promise<UserInitializationResult> {
    try {
      // 1. Determine initial tier based on role
      const initialTier = await this.determineInitialTier(role);
      
      // 2. Assign compliance tier to user using existing service
      const tierAssignResult = await ComplianceTierService.assignComplianceTier(
        userId,
        role,
        initialTier
      );
      
      if (!tierAssignResult.success) {
        throw new Error(tierAssignResult.message);
      }
      
      // 3. Get user compliance summary after initialization
      const complianceStats = await ComplianceService.getUserComplianceSummary(userId);
      
      // 4. Log initialization to audit trail
      await this.logUserInitialization({
        userId,
        role,
        initialTier,
        requirementCount: tierAssignResult.requirements_added,
        metadata
      });
      
      return {
        success: true,
        userId,
        role,
        tier: { tier: initialTier },
        requirementCount: tierAssignResult.requirements_added,
        stats: complianceStats
      };
    } catch (error) {
      console.error('Failed to initialize user compliance:', error);
      
      return {
        success: false,
        userId,
        role,
        error: `Failed to initialize user compliance: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Handle user role changes and update compliance accordingly
   */
  static async handleUserRoleChange(
    userId: string,
    newRole: 'AP' | 'IC' | 'IP' | 'IT',
    oldRole: 'AP' | 'IC' | 'IP' | 'IT',
    metadata: any = {}
  ): Promise<RoleChangeResult> {
    try {
      // 1. Update role in user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (updateError) throw updateError;
      
      // 2. Determine if tier change is needed based on role change
      const shouldChangeTier = await this.shouldChangeTierOnRoleChange(oldRole, newRole);
      
      let result: RoleChangeResult = {
        success: true,
        userId,
        newRole,
        oldRole,
        tierChanged: false
      };
      
      // 3. Change tier if needed
      if (shouldChangeTier) {
        const newTier = await this.determineInitialTier(newRole);
        const currentTierInfo = await ComplianceTierService.getUserComplianceTierInfo(userId);
        const oldTier = currentTierInfo?.tier || 'basic';
        
        const tierChangeResult = await ComplianceIntegrationService.switchUserTier(
          userId,
          newTier,
          {
            reason: 'role_change',
            previousRole: oldRole,
            newRole,
            ...metadata
          }
        );
        
        result.tierChanged = tierChangeResult.success;
        result.newTier = newTier;
        result.oldTier = oldTier;
      } else {
        // Even if tier doesn't change, we might need to update requirements for the new role
        await this.updateRequirementsForRoleChange(userId, oldRole, newRole);
      }
      
      // 4. Log role change to audit trail
      await this.logRoleChange({
        userId,
        oldRole,
        newRole,
        tierChanged: result.tierChanged,
        newTier: result.newTier,
        metadata
      });
      
      return result;
    } catch (error) {
      console.error('Failed to handle user role change:', error);
      
      return {
        success: false,
        userId,
        newRole,
        oldRole,
        error: `Failed to handle user role change: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Handle user deactivation
   */
  static async handleUserDeactivation(
    userId: string,
    reason: string,
    metadata: any = {}
  ): Promise<DeactivationResult> {
    try {
      const deactivatedAt = new Date().toISOString();
      
      // 1. Mark user compliance records as inactive
      const { error: updateError } = await supabase
        .from('user_compliance_records')
        .update({
          compliance_status: 'not_applicable',
          updated_at: deactivatedAt,
          notes: `User deactivated: ${reason}`
        })
        .eq('user_id', userId);
      
      if (updateError) throw updateError;
      
      // 2. Update user profile status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          updated_at: deactivatedAt
          // Note: We don't have an explicit status field in profiles, so we just update timestamp
        })
        .eq('id', userId);
      
      if (profileError) throw profileError;
      
      // 3. Log deactivation to audit trail
      await this.logUserDeactivation({
        userId,
        reason,
        deactivatedAt,
        metadata
      });
      
      return {
        success: true,
        userId,
        deactivatedAt,
        reason
      };
    } catch (error) {
      console.error('Failed to handle user deactivation:', error);
      
      return {
        success: false,
        userId,
        error: `Failed to handle user deactivation: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Determine initial tier based on role
   */
  private static async determineInitialTier(role: string): Promise<'basic' | 'robust'> {
    // For now, we'll use basic logic - could be enhanced with database configuration
    switch (role) {
      case 'AP': // Advanced Practitioner - might default to robust
        return 'robust';
      case 'IC': // Independent Contractor
      case 'IP': // Independent Practitioner  
      case 'IT': // In Training
      default:
        return 'basic';
    }
  }
  
  /**
   * Determine if tier should change based on role change
   */
  private static async shouldChangeTierOnRoleChange(
    oldRole: string,
    newRole: string
  ): Promise<boolean> {
    // Get initial tiers for both roles
    const oldRoleTier = await this.determineInitialTier(oldRole);
    const newRoleTier = await this.determineInitialTier(newRole);
    
    // If initial tiers are different, tier should change
    return oldRoleTier !== newRoleTier;
  }
  
  /**
   * Update requirements when role changes but tier stays the same
   */
  private static async updateRequirementsForRoleChange(
    userId: string,
    oldRole: 'AP' | 'IC' | 'IP' | 'IT',
    newRole: 'AP' | 'IC' | 'IP' | 'IT'
  ): Promise<void> {
    try {
      // Get current tier
      const tierInfo = await ComplianceTierService.getUserComplianceTierInfo(userId);
      const currentTier = tierInfo?.tier || 'basic';
      
      // Use the existing ComplianceRequirementsService to update requirements
      await ComplianceRequirementsService.updateUserRoleRequirements(
        userId,
        oldRole,
        newRole,
        currentTier,
        currentTier
      );
    } catch (error) {
      console.error('Failed to update requirements for role change:', error);
      throw new Error(`Failed to update requirements for role change: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Log user initialization to audit trail
   */
  private static async logUserInitialization(params: {
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
   * Log role change to audit trail
   */
  private static async logRoleChange(params: {
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
   * Log user deactivation to audit trail
   */
  private static async logUserDeactivation(params: {
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
}