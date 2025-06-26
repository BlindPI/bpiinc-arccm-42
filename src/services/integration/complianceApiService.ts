import { supabase } from '@/integrations/supabase/client';
import { ComplianceIntegrationService } from './complianceIntegrationService';
import { AuthComplianceIntegration } from './authComplianceIntegration';
import { ComplianceAuditService } from '@/services/audit/complianceAuditService';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * ComplianceApiService
 * 
 * Provides a centralized API layer for compliance operations.
 * Handles authentication, authorization, and service coordination.
 */
export class ComplianceApiService {
  
  /**
   * Update requirement status
   */
  static async updateRequirementStatus(
    userId: string,
    metricId: string,
    status: any,
    metadata: any = {}
  ): Promise<ApiResponse> {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check authorization
      if (user.id !== userId) {
        // Get user role to check if they're admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (!profile || !['SA', 'AD'].includes(profile.role)) {
          return { success: false, error: 'Insufficient permissions' };
        }
      }

      const result = await ComplianceIntegrationService.updateRequirementStatus(
        userId,
        metricId,
        status,
        metadata
      );

      return {
        success: result.success,
        data: result,
        error: result.error
      };
    } catch (error) {
      console.error('Error updating requirement status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Switch user tier
   */
  static async switchUserTier(
    userId: string,
    newTier: 'basic' | 'robust',
    metadata: any = {}
  ): Promise<ApiResponse> {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check authorization
      if (user.id !== userId) {
        // Get user role to check if they're admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (!profile || !['SA', 'AD'].includes(profile.role)) {
          return { success: false, error: 'Insufficient permissions' };
        }
      }

      const result = await ComplianceIntegrationService.switchUserTier(
        userId,
        newTier,
        metadata
      );

      return {
        success: result.success,
        data: result,
        error: result.error
      };
    } catch (error) {
      console.error('Error switching user tier:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check tier advancement
   */
  static async checkTierAdvancement(userId: string): Promise<ApiResponse> {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check authorization
      if (user.id !== userId) {
        // Get user role to check if they're admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (!profile || !['SA', 'AD'].includes(profile.role)) {
          return { success: false, error: 'Insufficient permissions' };
        }
      }

      const result = await ComplianceIntegrationService.checkTierAdvancement(userId);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error checking tier advancement:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Initialize user compliance
   */
  static async initializeUserCompliance(
    userId: string,
    role: 'AP' | 'IC' | 'IP' | 'IT',
    metadata: any = {}
  ): Promise<ApiResponse> {
    try {
      // Check if user is authenticated and has admin role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!profile || !['SA', 'AD'].includes(profile.role)) {
        return { success: false, error: 'Insufficient permissions' };
      }

      const result = await AuthComplianceIntegration.initializeUserCompliance(
        userId,
        role,
        metadata
      );

      return {
        success: result.success,
        data: result,
        error: result.error
      };
    } catch (error) {
      console.error('Error initializing user compliance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle user role change
   */
  static async handleUserRoleChange(
    userId: string,
    newRole: 'AP' | 'IC' | 'IP' | 'IT',
    oldRole: 'AP' | 'IC' | 'IP' | 'IT',
    metadata: any = {}
  ): Promise<ApiResponse> {
    try {
      // Check if user is authenticated and has admin role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!profile || !['SA', 'AD'].includes(profile.role)) {
        return { success: false, error: 'Insufficient permissions' };
      }

      const result = await AuthComplianceIntegration.handleUserRoleChange(
        userId,
        newRole,
        oldRole,
        metadata
      );

      return {
        success: result.success,
        data: result,
        error: result.error
      };
    } catch (error) {
      console.error('Error handling user role change:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Recalculate user compliance
   */
  static async recalculateUserCompliance(userId: string): Promise<ApiResponse> {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check authorization
      if (user.id !== userId) {
        // Get user role to check if they're admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (!profile || !['SA', 'AD'].includes(profile.role)) {
          return { success: false, error: 'Insufficient permissions' };
        }
      }

      const result = await ComplianceIntegrationService.recalculateUserCompliance(userId);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error recalculating user compliance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get audit logs
   */
  static async getAuditLogs(options: {
    userId?: string;
    requirementId?: string;
    limit?: number;
    offset?: number;
    auditTypes?: string[];
    startDate?: string;
    endDate?: string;
  } = {}): Promise<ApiResponse> {
    try {
      // Check if user is authenticated and has admin role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!profile || !['SA', 'AD'].includes(profile.role)) {
        return { success: false, error: 'Insufficient permissions' };
      }

      let result;
      if (options.userId) {
        result = await ComplianceAuditService.getUserAuditLogs(options.userId, options);
      } else if (options.requirementId) {
        result = await ComplianceAuditService.getRequirementAuditLogs(options.requirementId, options);
      } else {
        result = await ComplianceAuditService.getAllAuditLogs(options);
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get audit statistics
   */
  static async getAuditStatistics(options: {
    userId?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<ApiResponse> {
    try {
      // Check if user is authenticated and has admin role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!profile || !['SA', 'AD'].includes(profile.role)) {
        return { success: false, error: 'Insufficient permissions' };
      }

      const result = await ComplianceAuditService.getAuditStatistics(options);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error getting audit statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Export audit logs
   */
  static async exportAuditLogs(options: {
    userId?: string;
    startDate?: string;
    endDate?: string;
    auditTypes?: string[];
  } = {}): Promise<ApiResponse<string>> {
    try {
      // Check if user is authenticated and has admin role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!profile || !['SA', 'AD'].includes(profile.role)) {
        return { success: false, error: 'Insufficient permissions' };
      }

      const result = await ComplianceAuditService.exportAuditLogs(options);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}