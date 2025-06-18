import { supabase } from '@/integrations/supabase/client';

interface DatabaseCheckResult {
  tablesExist: Record<string, boolean>;
  tableStructures: Record<string, any>;
  sampleData: Record<string, any>;
}

interface ServiceCheckResult {
  emailCampaigns: { source: string; count: number; sample?: any };
  campaignPerformance: { source: string; data: any };
  automationRules: { source: string; count: number; sample?: any };
  emailWorkflowMetrics: { source: string; data: any };
}

interface FunctionalityCheckResult {
  campaignSettings: { canSave: boolean; persistsToDatabase: boolean };
  automationEdit: { hasEditUI: boolean; canUpdate: boolean };
  campaignManagement: { hasRealWorkflows: boolean; buttonsConnected: boolean };
  emailWorkflows: { hasRealData: boolean; automationWorks: boolean };
}

export class CRMDiagnostics {
  static async checkDatabaseTables(): Promise<DatabaseCheckResult> {
    const requiredTables = [
      'email_campaigns',
      'email_templates', 
      'campaign_metrics',
      'automation_rules',
      'automation_executions'
    ];

    const results: DatabaseCheckResult = {
      tablesExist: {},
      tableStructures: {},
      sampleData: {}
    };

    for (const table of requiredTables) {
      try {
        // Use any to bypass strict typing for dynamic table names
        const { data, error } = await (supabase as any)
          .from(table)
          .select('*')
          .limit(1);

        results.tablesExist[table] = !error;
        
        if (!error && data) {
          results.sampleData[table] = data.length > 0 ? data[0] : 'empty_table';
          
          if (data.length > 0) {
            results.tableStructures[table] = Object.keys(data[0]);
          }
        } else {
          results.sampleData[table] = `error: ${error?.message}`;
        }
      } catch (err) {
        results.tablesExist[table] = false;
        results.sampleData[table] = `exception: ${err}`;
      }
    }

    return results;
  }

  static async checkServiceDataSources(): Promise<ServiceCheckResult> {
    const results: ServiceCheckResult = {
      emailCampaigns: { source: 'unknown', count: 0 },
      campaignPerformance: { source: 'unknown', data: null },
      automationRules: { source: 'unknown', count: 0 },
      emailWorkflowMetrics: { source: 'unknown', data: null }
    };

    try {
      // Check email campaigns
      const { data: campaigns, error: campaignsError } = await (supabase as any)
        .from('email_campaigns')
        .select('*');
      
      if (!campaignsError && campaigns) {
        results.emailCampaigns = {
          source: 'database',
          count: campaigns.length,
          sample: campaigns[0] || null
        };
      } else {
        results.emailCampaigns = {
          source: 'error_or_mock',
          count: 0,
          sample: campaignsError?.message
        };
      }

      // Check automation rules
      const { data: rules, error: rulesError } = await (supabase as any)
        .from('automation_rules')
        .select('*');
      
      if (!rulesError && rules) {
        results.automationRules = {
          source: 'database',
          count: rules.length,
          sample: rules[0] || null
        };
      } else {
        results.automationRules = {
          source: 'error_or_mock',
          count: 0,
          sample: rulesError?.message
        };
      }

      // Campaign performance is hardcoded in the service
      results.campaignPerformance = {
        source: 'hardcoded_mock',
        data: {
          totalCampaigns: 24,
          activeCampaigns: 3,
          totalRecipients: 15420,
          averageOpenRate: 22.5,
          averageClickRate: 3.8,
          totalRevenue: 45600
        }
      };

      // Email workflow metrics are also hardcoded
      results.emailWorkflowMetrics = {
        source: 'hardcoded_mock',
        data: {
          emailsSentToday: 24,
          openRate: 68,
          automationSuccess: 95
        }
      };

    } catch (error) {
      console.error('Error in checkServiceDataSources:', error);
    }

    return results;
  }

  static async checkFunctionalityStatus(): Promise<FunctionalityCheckResult> {
    return {
      campaignSettings: {
        canSave: false, // Only console.logs, doesn't save to database
        persistsToDatabase: false
      },
      automationEdit: {
        hasEditUI: false, // No edit dialog in AutomationRulesManager
        canUpdate: true // Backend service has update method
      },
      campaignManagement: {
        hasRealWorkflows: false, // Tabs show placeholder content
        buttonsConnected: false // Many buttons are non-functional
      },
      emailWorkflows: {
        hasRealData: false, // Analytics show hardcoded values
        automationWorks: false // Automation rules are static displays
      }
    };
  }

  static async runFullDiagnostic(): Promise<{
    timestamp: string;
    databaseCheck: DatabaseCheckResult;
    serviceCheck: ServiceCheckResult;
    functionalityCheck: FunctionalityCheckResult;
    recommendations: string[];
  }> {
    console.log('🔍 Running CRM Diagnostic Check...');
    
    const [databaseCheck, serviceCheck, functionalityCheck] = await Promise.all([
      this.checkDatabaseTables(),
      this.checkServiceDataSources(),
      this.checkFunctionalityStatus()
    ]);

    const recommendations = [
      'Replace hardcoded data in EmailCampaignService.getCampaignPerformanceSummary() with real database queries',
      'Implement database persistence in CampaignSettingsDialog.handleSave()',
      'Add edit dialog/form to AutomationRulesManager for updating existing rules',
      'Connect campaign management tab buttons to real backend operations',
      'Replace static analytics in ProfessionalEmailWorkflows with real metrics',
      'Implement functional automation rules with real trigger/action logic',
      'Add real CRUD operations for email templates and campaign workflows'
    ];

    const result = {
      timestamp: new Date().toISOString(),
      databaseCheck,
      serviceCheck,
      functionalityCheck,
      recommendations
    };

    console.log('📊 CRM Diagnostic Results:', result);
    return result;
  }
}
