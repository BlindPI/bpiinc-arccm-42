import { supabase } from '@/integrations/supabase/client';

export class CampaignDiagnostics {
  static async runDatabaseDiagnostics() {
    console.log('🔍 Starting Campaign Database Diagnostics...');
    
    try {
      // Check if tables exist
      const tableChecks = await Promise.allSettled([
        supabase.from('email_campaigns').select('count', { count: 'exact', head: true }),
        supabase.from('email_templates').select('count', { count: 'exact', head: true }),
        supabase.from('campaign_metrics').select('count', { count: 'exact', head: true })
      ]);

      console.log('📊 Table existence check:', {
        email_campaigns: tableChecks[0].status === 'fulfilled' ? 'EXISTS' : 'MISSING',
        email_templates: tableChecks[1].status === 'fulfilled' ? 'EXISTS' : 'MISSING',
        campaign_metrics: tableChecks[2].status === 'fulfilled' ? 'EXISTS' : 'MISSING'
      });

      // Check table accessibility directly
      const tableTests = [
        { name: 'email_campaigns', table: 'email_campaigns' as const },
        { name: 'email_templates', table: 'email_templates' as const },
        { name: 'campaign_metrics', table: 'campaign_metrics' as const }
      ];

      for (const test of tableTests) {
        try {
          const { data: testData, error } = await supabase.from(test.table).select('*').limit(1);
          if (error) {
            console.error(`❌ ${test.name} query failed:`, error);
          } else {
            console.log(`📋 ${test.name} accessible:`, testData !== null);
          }
        } catch (accessErr) {
          console.error(`❌ ${test.name} not accessible:`, accessErr);
        }
      }

      // Check data counts
      const dataCounts = await Promise.allSettled([
        supabase.from('email_campaigns').select('*', { count: 'exact', head: true }),
        supabase.from('email_templates').select('*', { count: 'exact', head: true }),
        supabase.from('campaign_metrics').select('*', { count: 'exact', head: true })
      ]);

      console.log('📈 Data counts:', {
        email_campaigns: tableChecks[0].status === 'fulfilled' ? (dataCounts[0] as any).count : 0,
        email_templates: tableChecks[1].status === 'fulfilled' ? (dataCounts[1] as any).count : 0,
        campaign_metrics: tableChecks[2].status === 'fulfilled' ? (dataCounts[2] as any).count : 0
      });

      // Test actual data retrieval
      const { data: campaigns, error: campaignsError } = await supabase
        .from('email_campaigns')
        .select('*')
        .limit(5);

      console.log('📧 Sample campaigns:', { campaigns, error: campaignsError });

      const { data: templates, error: templatesError } = await supabase
        .from('email_templates')
        .select('*')
        .limit(5);

      console.log('📝 Sample templates:', { templates, error: templatesError });

      return {
        tablesExist: {
          email_campaigns: tableChecks[0].status === 'fulfilled',
          email_templates: tableChecks[1].status === 'fulfilled',
          campaign_metrics: tableChecks[2].status === 'fulfilled'
        },
        dataCounts: {
          email_campaigns: tableChecks[0].status === 'fulfilled' ? (dataCounts[0] as any).count : 0,
          email_templates: tableChecks[1].status === 'fulfilled' ? (dataCounts[1] as any).count : 0,
          campaign_metrics: tableChecks[2].status === 'fulfilled' ? (dataCounts[2] as any).count : 0
        },
        sampleData: {
          campaigns,
          templates,
          campaignsError,
          templatesError
        }
      };

    } catch (error) {
      console.error('❌ Campaign diagnostics failed:', error);
      return { error };
    }
  }

  static async testServiceLayer() {
    console.log('🔍 Testing Campaign Service Layer...');
    
    try {
      const { EmailCampaignService } = await import('@/services/crm/emailCampaignService');
      
      // Test each service method
      const campaigns = await EmailCampaignService.getEmailCampaigns();
      console.log('📧 Service campaigns:', campaigns);

      const templates = await EmailCampaignService.getDefaultEmailTemplates();
      console.log('📝 Service templates:', templates);

      const dbTemplates = await EmailCampaignService.getCampaignTemplates();
      console.log('🗄️ Database templates:', dbTemplates);

      const performance = await EmailCampaignService.getCampaignPerformanceSummary();
      console.log('📊 Performance summary:', performance);

      return {
        campaigns,
        templates,
        dbTemplates,
        performance
      };

    } catch (error) {
      console.error('❌ Service layer test failed:', error);
      return { error };
    }
  }

  static async runFullDiagnostics() {
    console.log('🚀 Running Full Campaign Diagnostics...');
    
    const dbResults = await this.runDatabaseDiagnostics();
    const serviceResults = await this.testServiceLayer();
    
    const summary = {
      timestamp: new Date().toISOString(),
      database: dbResults,
      services: serviceResults,
      recommendations: this.generateRecommendations(dbResults, serviceResults)
    };

    console.log('📋 Full Diagnostics Summary:', summary);
    return summary;
  }

  private static generateRecommendations(dbResults: any, serviceResults: any) {
    const recommendations = [];

    if (dbResults.error) {
      recommendations.push('❌ Database connection failed - check Supabase configuration');
    }

    if (!dbResults.tablesExist?.email_campaigns) {
      recommendations.push('❌ email_campaigns table missing - run database migrations');
    }

    if (!dbResults.tablesExist?.email_templates) {
      recommendations.push('❌ email_templates table missing - run database migrations');
    }

    if (!dbResults.tablesExist?.campaign_metrics) {
      recommendations.push('❌ campaign_metrics table missing - run database migrations');
    }

    if (dbResults.dataCounts?.email_campaigns === 0) {
      recommendations.push('⚠️ No campaigns in database - create sample data');
    }

    if (dbResults.dataCounts?.email_templates === 0) {
      recommendations.push('⚠️ No templates in database - seed default templates');
    }

    if (serviceResults.error) {
      recommendations.push('❌ Service layer failed - check EmailCampaignService implementation');
    }

    if (serviceResults.campaigns?.length === 0) {
      recommendations.push('⚠️ Service returning empty campaigns - check RLS policies');
    }

    return recommendations;
  }
}