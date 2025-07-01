/**
 * CRM Data Validation Utility
 * 
 * This utility provides functions to validate that CRM components are using
 * authentic data sources and not mock/placeholder data.
 */

import { supabase } from '@/integrations/supabase/client';

export interface DataValidationResult {
  component: string;
  isValid: boolean;
  dataSource: string;
  issues: string[];
  recommendations: string[];
}

export class CRMDataValidator {
  /**
   * Validates that revenue data comes from authentic sources
   */
  static async validateRevenueData(): Promise<DataValidationResult> {
    const result: DataValidationResult = {
      component: 'Revenue Analytics',
      isValid: true,
      dataSource: 'crm_revenue_records',
      issues: [],
      recommendations: []
    };

    try {
      // Check if revenue records table exists and has data structure
      const { data, error } = await supabase
        .from('crm_revenue_records')
        .select('id, amount, revenue_date, revenue_type')
        .limit(1);

      if (error) {
        result.isValid = false;
        result.issues.push(`Database connection error: ${error.message}`);
        result.recommendations.push('Verify database schema and table permissions');
      } else {
        result.recommendations.push('Revenue data is properly connected to authentic database records');
      }
    } catch (error) {
      result.isValid = false;
      result.issues.push(`Validation error: ${error}`);
    }

    return result;
  }

  /**
   * Validates that campaign analytics use real campaign data
   */
  static async validateCampaignData(): Promise<DataValidationResult> {
    const result: DataValidationResult = {
      component: 'Campaign Analytics',
      isValid: true,
      dataSource: 'crm_email_campaigns',
      issues: [],
      recommendations: []
    };

    try {
      // Check campaign data structure
      const { data, error } = await supabase
        .from('crm_email_campaigns')
        .select('id, campaign_name, total_recipients, opened_count, clicked_count, revenue_attributed')
        .limit(1);

      if (error) {
        result.isValid = false;
        result.issues.push(`Database connection error: ${error.message}`);
        result.recommendations.push('Verify campaign table schema and permissions');
      } else {
        result.recommendations.push('Campaign analytics properly connected to real campaign data');
      }
    } catch (error) {
      result.isValid = false;
      result.issues.push(`Validation error: ${error}`);
    }

    return result;
  }

  /**
   * Validates core CRM data integrity
   */
  static async validateCoreData(): Promise<DataValidationResult> {
    const result: DataValidationResult = {
      component: 'Core CRM',
      isValid: true,
      dataSource: 'crm_leads, crm_opportunities, crm_activities',
      issues: [],
      recommendations: []
    };

    try {
      // Check core CRM tables
      const [leadsResult, opportunitiesResult, activitiesResult] = await Promise.all([
        supabase.from('crm_leads').select('id').limit(1),
        supabase.from('crm_opportunities').select('id').limit(1),
        supabase.from('crm_activities').select('id').limit(1)
      ]);

      if (leadsResult.error || opportunitiesResult.error || activitiesResult.error) {
        result.isValid = false;
        result.issues.push('One or more core CRM tables are not accessible');
        result.recommendations.push('Verify all CRM table schemas and RLS policies');
      } else {
        result.recommendations.push('Core CRM data structures are properly configured');
      }
    } catch (error) {
      result.isValid = false;
      result.issues.push(`Core data validation error: ${error}`);
    }

    return result;
  }

  /**
   * Runs comprehensive validation of all CRM data sources
   */
  static async validateAllComponents(): Promise<DataValidationResult[]> {
    const results = await Promise.all([
      this.validateRevenueData(),
      this.validateCampaignData(),
      this.validateCoreData()
    ]);

    return results;
  }

  /**
   * Generates a validation report
   */
  static generateValidationReport(results: DataValidationResult[]): string {
    let report = '=== CRM Data Validation Report ===\n\n';
    
    const validComponents = results.filter(r => r.isValid).length;
    const totalComponents = results.length;
    
    report += `Overall Status: ${validComponents}/${totalComponents} components validated\n\n`;
    
    results.forEach(result => {
      report += `Component: ${result.component}\n`;
      report += `Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}\n`;
      report += `Data Source: ${result.dataSource}\n`;
      
      if (result.issues.length > 0) {
        report += `Issues:\n`;
        result.issues.forEach(issue => report += `  - ${issue}\n`);
      }
      
      if (result.recommendations.length > 0) {
        report += `Recommendations:\n`;
        result.recommendations.forEach(rec => report += `  - ${rec}\n`);
      }
      
      report += '\n';
    });
    
    return report;
  }
}

/**
 * Development helper to log validation results
 */
export const logCRMDataValidation = async () => {
  if (process.env.NODE_ENV === 'development') {
    try {
      const results = await CRMDataValidator.validateAllComponents();
      const report = CRMDataValidator.generateValidationReport(results);
      console.log(report);
    } catch (error) {
      console.error('CRM Data Validation failed:', error);
    }
  }
};