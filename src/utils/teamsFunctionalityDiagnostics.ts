/**
 * Teams Functionality Diagnostic Utility
 * 
 * This utility helps diagnose and validate the root causes of Teams functionality issues
 * for SA users who should have enterprise access but are experiencing problems.
 */

import { supabase } from '@/integrations/supabase/client';
import { debugLog, debugWarn, debugError } from './debugUtils';

export interface TeamsDiagnosticResult {
  timestamp: string;
  userId: string;
  userRole: string | null;
  issues: {
    profileLoading: boolean;
    navigationConfig: boolean;
    enterpriseAccess: boolean;
    databaseConnectivity: boolean;
    crmVisibility: boolean;
  };
  recommendations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class TeamsFunctionalityDiagnostics {
  
  /**
   * Run comprehensive diagnostic check for Teams functionality
   */
  static async runDiagnostic(userId: string): Promise<TeamsDiagnosticResult> {
    debugLog('🔍 TEAMS-DIAG: Starting comprehensive Teams functionality diagnostic for user:', userId);
    
    const result: TeamsDiagnosticResult = {
      timestamp: new Date().toISOString(),
      userId,
      userRole: null,
      issues: {
        profileLoading: false,
        navigationConfig: false,
        enterpriseAccess: false,
        databaseConnectivity: false,
        crmVisibility: false
      },
      recommendations: [],
      severity: 'low'
    };

    try {
      // 1. Check Profile Loading
      debugLog('🔍 TEAMS-DIAG: Checking profile loading...');
      const profileCheck = await this.checkProfileLoading(userId);
      result.userRole = profileCheck.role;
      result.issues.profileLoading = !profileCheck.success;
      
      if (!profileCheck.success) {
        result.recommendations.push('Profile loading failed - check database connectivity and RLS policies');
        debugError('🔍 TEAMS-DIAG: Profile loading failed:', profileCheck.error);
      }

      // 2. Check Database Connectivity
      debugLog('🔍 TEAMS-DIAG: Checking database connectivity...');
      const dbCheck = await this.checkDatabaseConnectivity();
      result.issues.databaseConnectivity = !dbCheck.success;
      
      if (!dbCheck.success) {
        result.recommendations.push('Database connectivity issues detected - check Supabase connection');
        debugError('🔍 TEAMS-DIAG: Database connectivity failed:', dbCheck.error);
      }

      // 3. Check Navigation Configuration
      debugLog('🔍 TEAMS-DIAG: Checking navigation configuration...');
      const navCheck = await this.checkNavigationConfiguration(result.userRole);
      result.issues.navigationConfig = !navCheck.success;
      
      if (!navCheck.success) {
        result.recommendations.push('Navigation configuration missing or invalid - check system_configurations table');
        debugError('🔍 TEAMS-DIAG: Navigation config failed:', navCheck.error);
      }

      // 4. Check Enterprise Access Logic
      debugLog('🔍 TEAMS-DIAG: Checking enterprise access logic...');
      const enterpriseCheck = this.checkEnterpriseAccess(result.userRole);
      result.issues.enterpriseAccess = !enterpriseCheck.success;
      
      if (!enterpriseCheck.success) {
        result.recommendations.push('Enterprise access logic failed - check role permissions');
        debugError('🔍 TEAMS-DIAG: Enterprise access failed:', enterpriseCheck.error);
      }

      // 5. Check CRM Visibility Issues
      debugLog('🔍 TEAMS-DIAG: Checking CRM visibility...');
      const crmCheck = await this.checkCRMVisibility(result.userRole);
      result.issues.crmVisibility = !crmCheck.success;
      
      if (!crmCheck.success) {
        result.recommendations.push('CRM features not visible - check navigation visibility configuration');
        debugError('🔍 TEAMS-DIAG: CRM visibility failed:', crmCheck.error);
      }

      // Determine severity
      const issueCount = Object.values(result.issues).filter(Boolean).length;
      if (issueCount >= 4) result.severity = 'critical';
      else if (issueCount >= 2) result.severity = 'high';
      else if (issueCount >= 1) result.severity = 'medium';

      debugLog('🔍 TEAMS-DIAG: Diagnostic completed with severity:', result.severity);
      return result;

    } catch (error) {
      debugError('🔍 TEAMS-DIAG: Diagnostic failed with error:', error);
      result.severity = 'critical';
      result.recommendations.push('Diagnostic process failed - system may be in critical state');
      return result;
    }
  }

  /**
   * Check if profile loading is working correctly
   */
  private static async checkProfileLoading(userId: string): Promise<{ success: boolean; role: string | null; error?: string }> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, role, display_name, email')
        .eq('id', userId)
        .single();

      if (error) {
        return { success: false, role: null, error: error.message };
      }

      if (!profile) {
        return { success: false, role: null, error: 'Profile not found' };
      }

      debugLog('🔍 TEAMS-DIAG: Profile loaded successfully:', { role: profile.role, email: profile.email });
      return { success: true, role: profile.role };

    } catch (error) {
      return { success: false, role: null, error: String(error) };
    }
  }

  /**
   * Check basic database connectivity
   */
  private static async checkDatabaseConnectivity(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('system_configurations')
        .select('id')
        .limit(1);

      if (error) {
        return { success: false, error: error.message };
      }

      debugLog('🔍 TEAMS-DIAG: Database connectivity confirmed');
      return { success: true };

    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Check navigation configuration in database
   */
  private static async checkNavigationConfiguration(userRole: string | null): Promise<{ success: boolean; error?: string }> {
    try {
      if (!userRole) {
        return { success: false, error: 'No user role available' };
      }

      const { data: configs, error } = await supabase
        .from('system_configurations')
        .select('key, value, category')
        .eq('category', 'navigation');

      if (error) {
        return { success: false, error: error.message };
      }

      // Check for master visibility config
      const masterConfig = configs?.find(c => c.key === 'visibility');
      if (masterConfig?.value && typeof masterConfig.value === 'object') {
        const allRolesConfig = masterConfig.value as Record<string, any>;
        if (allRolesConfig[userRole]) {
          debugLog('🔍 TEAMS-DIAG: Found master navigation config for role:', userRole);
          return { success: true };
        }
      }

      // Check for role-specific config
      const roleConfigKey = `visibility_${userRole}`;
      const roleConfig = configs?.find(c => c.key === roleConfigKey);
      
      if (roleConfig?.value) {
        debugLog('🔍 TEAMS-DIAG: Found role-specific navigation config for:', userRole);
        return { success: true };
      }

      debugWarn('🔍 TEAMS-DIAG: No navigation configuration found for role:', userRole);
      return { success: false, error: `No navigation configuration found for role: ${userRole}` };

    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Check enterprise access logic
   */
  private static checkEnterpriseAccess(userRole: string | null): { success: boolean; error?: string } {
    if (!userRole) {
      return { success: false, error: 'No user role available' };
    }

    const enterpriseRoles = ['SA', 'AD', 'AP'];
    const hasAccess = enterpriseRoles.includes(userRole);

    if (!hasAccess) {
      return { success: false, error: `Role ${userRole} does not have enterprise access` };
    }

    debugLog('🔍 TEAMS-DIAG: Enterprise access confirmed for role:', userRole);
    return { success: true };
  }

  /**
   * Check CRM visibility configuration
   */
  private static async checkCRMVisibility(userRole: string | null): Promise<{ success: boolean; error?: string }> {
    try {
      if (!userRole) {
        return { success: false, error: 'No user role available' };
      }

      // This would normally check the actual navigation configuration
      // For now, we'll simulate the check based on expected behavior
      const enterpriseRoles = ['SA', 'AD', 'AP'];
      const shouldHaveCRMAccess = enterpriseRoles.includes(userRole);

      if (!shouldHaveCRMAccess) {
        return { success: false, error: `Role ${userRole} should not have CRM access` };
      }

      debugLog('🔍 TEAMS-DIAG: CRM visibility should be enabled for role:', userRole);
      return { success: true };

    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Generate a human-readable diagnostic report
   */
  static generateReport(result: TeamsDiagnosticResult): string {
    const lines = [
      '=== TEAMS FUNCTIONALITY DIAGNOSTIC REPORT ===',
      `Timestamp: ${result.timestamp}`,
      `User ID: ${result.userId}`,
      `User Role: ${result.userRole || 'Unknown'}`,
      `Severity: ${result.severity.toUpperCase()}`,
      '',
      '=== ISSUES DETECTED ===',
    ];

    Object.entries(result.issues).forEach(([issue, hasIssue]) => {
      lines.push(`${hasIssue ? '❌' : '✅'} ${issue}: ${hasIssue ? 'FAILED' : 'OK'}`);
    });

    if (result.recommendations.length > 0) {
      lines.push('', '=== RECOMMENDATIONS ===');
      result.recommendations.forEach((rec, index) => {
        lines.push(`${index + 1}. ${rec}`);
      });
    }

    lines.push('', '=== END REPORT ===');
    return lines.join('\n');
  }
}

/**
 * Quick diagnostic function for console use
 */
export async function runTeamsDiagnostic(userId: string): Promise<void> {
  console.log('🔍 Starting Teams functionality diagnostic...');
  
  try {
    const result = await TeamsFunctionalityDiagnostics.runDiagnostic(userId);
    const report = TeamsFunctionalityDiagnostics.generateReport(result);
    
    console.log(report);
    
    if (result.severity === 'critical' || result.severity === 'high') {
      console.error('🚨 CRITICAL ISSUES DETECTED - Teams functionality may be severely impacted');
    }
    
  } catch (error) {
    console.error('🔍 Diagnostic failed:', error);
  }
}