
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/types/supabase-schema';

interface CRMDiagnosticResult {
  table: string;
  status: 'healthy' | 'warning' | 'error';
  recordCount: number;
  issues: string[];
  recommendations: string[];
}

interface SystemConfigResult {
  crmEnabled: boolean;
  leadScoringEnabled: boolean;
  workflowAutomationEnabled: boolean;
  emailIntegrationEnabled: boolean;
}

export class CRMDiagnostics {
  static async runComprehensiveDiagnostic(): Promise<{
    overall: 'healthy' | 'warning' | 'error';
    results: CRMDiagnosticResult[];
    systemConfig: SystemConfigResult;
    recommendations: string[];
  }> {
    console.log('Running comprehensive CRM diagnostics...');
    
    const results: CRMDiagnosticResult[] = [];
    const overallRecommendations: string[] = [];
    
    // Test core CRM tables
    const tables = [
      'crm_leads',
      'crm_contacts', 
      'crm_accounts',
      'crm_opportunities',
      'crm_activities'
    ];
    
    for (const table of tables) {
      const result = await this.testTable(table);
      results.push(result);
      
      if (result.status === 'error') {
        overallRecommendations.push(`Critical issue with ${table}: ${result.issues.join(', ')}`);
      }
    }
    
    // Test system configuration
    const systemConfig = await this.checkSystemConfiguration();
    
    // Test CRM functions
    const functionResults = await this.testCRMFunctions();
    results.push(...functionResults);
    
    // Determine overall health
    const hasErrors = results.some(r => r.status === 'error');
    const hasWarnings = results.some(r => r.status === 'warning');
    const overall = hasErrors ? 'error' : hasWarnings ? 'warning' : 'healthy';
    
    return {
      overall,
      results,
      systemConfig,
      recommendations: overallRecommendations
    };
  }
  
  private static async testTable(tableName: string): Promise<CRMDiagnosticResult> {
    try {
      const { data, error, count } = await supabase
        .from(tableName as any)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        return {
          table: tableName,
          status: 'error',
          recordCount: 0,
          issues: [`Database error: ${error.message}`],
          recommendations: [`Check table ${tableName} exists and is accessible`]
        };
      }
      
      const recordCount = count || 0;
      const issues: string[] = [];
      const recommendations: string[] = [];
      
      if (recordCount === 0) {
        issues.push('No records found');
        recommendations.push(`Consider adding sample data to ${tableName}`);
      }
      
      return {
        table: tableName,
        status: issues.length > 0 ? 'warning' : 'healthy',
        recordCount,
        issues,
        recommendations
      };
      
    } catch (error) {
      return {
        table: tableName,
        status: 'error',
        recordCount: 0,
        issues: [`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        recommendations: [`Investigate ${tableName} accessibility`]
      };
    }
  }
  
  private static async checkSystemConfiguration(): Promise<SystemConfigResult> {
    try {
      const { data: configs } = await supabase
        .from('system_configurations')
        .select('category, key, value')
        .in('category', ['crm', 'email', 'automation']);
      
      const configMap = new Map<string, any>();
      configs?.forEach(config => {
        const key = `${config.category}.${config.key}`;
        try {
          // Handle Json type safely
          let value = config.value;
          if (typeof value === 'string') {
            value = JSON.parse(value);
          }
          configMap.set(key, value);
        } catch {
          // If parsing fails, use the raw value
          configMap.set(key, config.value);
        }
      });
      
      return {
        crmEnabled: this.getConfigValue(configMap, 'crm.enabled', true),
        leadScoringEnabled: this.getConfigValue(configMap, 'crm.lead_scoring_enabled', true),
        workflowAutomationEnabled: this.getConfigValue(configMap, 'automation.workflows_enabled', true),
        emailIntegrationEnabled: this.getConfigValue(configMap, 'email.integration_enabled', false)
      };
      
    } catch (error) {
      console.error('Error checking system configuration:', error);
      return {
        crmEnabled: false,
        leadScoringEnabled: false,
        workflowAutomationEnabled: false,
        emailIntegrationEnabled: false
      };
    }
  }
  
  private static getConfigValue(configMap: Map<string, any>, key: string, defaultValue: any): any {
    const value = configMap.get(key);
    return value !== undefined ? value : defaultValue;
  }
  
  private static async testCRMFunctions(): Promise<CRMDiagnosticResult[]> {
    const results: CRMDiagnosticResult[] = [];
    
    // Test lead scoring function
    try {
      const { error } = await supabase.rpc('calculate_lead_score_simple', {
        p_lead_id: '00000000-0000-0000-0000-000000000000' // Test UUID
      });
      
      results.push({
        table: 'lead_scoring_function',
        status: error ? 'error' : 'healthy',
        recordCount: 1,
        issues: error ? [`Function error: ${error.message}`] : [],
        recommendations: error ? ['Check lead scoring function implementation'] : []
      });
    } catch (error) {
      results.push({
        table: 'lead_scoring_function',
        status: 'error',
        recordCount: 0,
        issues: [`Function test failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        recommendations: ['Verify lead scoring function exists and is callable']
      });
    }
    
    return results;
  }
  
  static async quickHealthCheck(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('crm_leads')
        .select('id', { head: true, count: 'exact' });
      
      return !error;
    } catch {
      return false;
    }
  }
}
