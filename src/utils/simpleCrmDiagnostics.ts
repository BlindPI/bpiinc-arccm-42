import { supabase } from '@/integrations/supabase/client';

export interface CRMIssue {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  component: string;
  issue: string;
  impact: string;
  recommendation: string;
}

export class SimpleCRMDiagnostics {
  static async runQuickDiagnostic(): Promise<{
    issues: CRMIssue[];
    summary: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      total: number;
    };
  }> {
    const issues: CRMIssue[] = [];
    
    console.log('🔍 Running Quick CRM Diagnostic...');
    
    // Test 1: Check core CRM tables
    await this.checkCoreTables(issues);
    
    // Test 2: Check email campaign system
    await this.checkEmailCampaignSystem(issues);
    
    // Test 3: Check service alignment
    await this.checkServiceAlignment(issues);
    
    // Test 4: Check for placeholder implementations
    this.checkPlaceholderImplementations(issues);
    
    const summary = {
      critical: issues.filter(i => i.severity === 'CRITICAL').length,
      high: issues.filter(i => i.severity === 'HIGH').length,
      medium: issues.filter(i => i.severity === 'MEDIUM').length,
      low: issues.filter(i => i.severity === 'LOW').length,
      total: issues.length
    };
    
    return { issues, summary };
  }
  
  private static async checkCoreTables(issues: CRMIssue[]): Promise<void> {
    const coreTables = [
      { name: 'crm_leads', critical: true },
      { name: 'crm_opportunities', critical: true },
      { name: 'crm_activities', critical: false },
      { name: 'crm_contacts', critical: true },
      { name: 'crm_accounts', critical: true }
    ];
    
    for (const table of coreTables) {
      try {
        // Try to query the table
        const { error } = await supabase
          .from(table.name as any)
          .select('id')
          .limit(1);
        
        if (error) {
          issues.push({
            severity: table.critical ? 'CRITICAL' : 'HIGH',
            component: `Database Table: ${table.name}`,
            issue: `Table ${table.name} is missing or inaccessible`,
            impact: table.critical 
              ? 'Core CRM functionality completely broken'
              : 'Some CRM features may not work',
            recommendation: `Create missing table ${table.name} or fix access permissions`
          });
        }
      } catch (err) {
        issues.push({
          severity: table.critical ? 'CRITICAL' : 'HIGH',
          component: `Database Table: ${table.name}`,
          issue: `Failed to access table ${table.name}`,
          impact: 'CRM functionality may be impaired',
          recommendation: `Investigate database connectivity and table structure`
        });
      }
    }
  }
  
  private static async checkEmailCampaignSystem(issues: CRMIssue[]): Promise<void> {
    // Check for email campaign table mismatch
    try {
      // Try crm_email_campaigns (what exists)
      const { error: crmError } = await supabase
        .from('crm_email_campaigns' as any)
        .select('id')
        .limit(1);
      
      // Try email_campaigns (what service expects)
      const { error: emailError } = await supabase
        .from('email_campaigns' as any)
        .select('id')
        .limit(1);
      
      if (!crmError && emailError) {
        issues.push({
          severity: 'CRITICAL',
          component: 'Email Campaign System',
          issue: 'Table name mismatch: database has crm_email_campaigns but EmailCampaignService expects email_campaigns',
          impact: 'Email marketing campaigns completely non-functional',
          recommendation: 'Either rename crm_email_campaigns to email_campaigns or update EmailCampaignService to use crm_email_campaigns'
        });
      }
      
      // Check for missing email templates table
      const { error: templatesError } = await supabase
        .from('email_templates' as any)
        .select('id')
        .limit(1);
      
      if (templatesError) {
        issues.push({
          severity: 'HIGH',
          component: 'Email Templates',
          issue: 'email_templates table is missing',
          impact: 'Email campaign templates cannot be managed',
          recommendation: 'Create email_templates table with proper schema'
        });
      }
      
      // Check for missing campaign metrics table
      const { error: metricsError } = await supabase
        .from('campaign_metrics' as any)
        .select('id')
        .limit(1);
      
      if (metricsError) {
        issues.push({
          severity: 'HIGH',
          component: 'Campaign Analytics',
          issue: 'campaign_metrics table is missing',
          impact: 'Email campaign performance tracking not available',
          recommendation: 'Create campaign_metrics table for analytics'
        });
      }
      
    } catch (err) {
      issues.push({
        severity: 'MEDIUM',
        component: 'Email Campaign System',
        issue: 'Unable to validate email campaign system',
        impact: 'Email campaign functionality status unknown',
        recommendation: 'Investigate email campaign database structure'
      });
    }
  }
  
  private static async checkServiceAlignment(issues: CRMIssue[]): Promise<void> {
    // Check if services can load basic data
    const serviceTests = [
      {
        name: 'CRM Stats Loading',
        test: async () => {
          const { error } = await supabase
            .from('crm_leads' as any)
            .select('id', { count: 'exact', head: true });
          return !error;
        }
      },
      {
        name: 'Lead Management',
        test: async () => {
          const { error } = await supabase
            .from('crm_leads' as any)
            .select('*')
            .limit(1);
          return !error;
        }
      },
      {
        name: 'Contact Management',
        test: async () => {
          const { error } = await supabase
            .from('crm_contacts' as any)
            .select('*')
            .limit(1);
          return !error;
        }
      }
    ];
    
    for (const test of serviceTests) {
      try {
        const success = await test.test();
        if (!success) {
          issues.push({
            severity: 'HIGH',
            component: test.name,
            issue: `${test.name} service cannot load data from database`,
            impact: `${test.name} features not functional`,
            recommendation: 'Fix database table structure or service implementation'
          });
        }
      } catch (err) {
        issues.push({
          severity: 'MEDIUM',
          component: test.name,
          issue: `Failed to test ${test.name} service`,
          impact: 'Service functionality unknown',
          recommendation: 'Investigate service-database integration'
        });
      }
    }
  }
  
  private static checkPlaceholderImplementations(issues: CRMIssue[]): void {
    // These are known placeholder implementations based on code analysis
    const placeholders = [
      {
        component: 'Campaign Performance Summary',
        issue: 'getCampaignPerformanceSummary() returns hardcoded mock data',
        impact: 'Dashboard shows fake metrics instead of real data',
        severity: 'MEDIUM' as const
      },
      {
        component: 'Email Campaign Sending',
        issue: 'sendCampaign() only updates status, does not actually send emails',
        impact: 'Email campaigns cannot be sent to recipients',
        severity: 'HIGH' as const
      },
      {
        component: 'Default Email Templates',
        issue: 'getDefaultEmailTemplates() returns static mock templates',
        impact: 'Template system not connected to database',
        severity: 'MEDIUM' as const
      }
    ];
    
    placeholders.forEach(placeholder => {
      issues.push({
        severity: placeholder.severity,
        component: placeholder.component,
        issue: placeholder.issue,
        impact: placeholder.impact,
        recommendation: 'Replace placeholder implementation with real functionality'
      });
    });
  }
  
  static async generateQuickReport(): Promise<string> {
    const { issues, summary } = await this.runQuickDiagnostic();
    
    let report = `
# CRM SYSTEM QUICK DIAGNOSTIC REPORT
Generated: ${new Date().toISOString()}

## 🚨 EXECUTIVE SUMMARY
- 🔴 CRITICAL Issues: ${summary.critical}
- 🟠 HIGH Priority: ${summary.high}
- 🟡 MEDIUM Priority: ${summary.medium}
- 🟢 LOW Priority: ${summary.low}
- 📊 TOTAL Issues: ${summary.total}

`;

    if (summary.critical > 0) {
      report += `## 🔴 CRITICAL ISSUES (${summary.critical})\n\n`;
      issues.filter(i => i.severity === 'CRITICAL').forEach(issue => {
        report += `### ${issue.component}\n`;
        report += `**Issue:** ${issue.issue}\n\n`;
        report += `**Impact:** ${issue.impact}\n\n`;
        report += `**Recommendation:** ${issue.recommendation}\n\n`;
        report += `---\n\n`;
      });
    }

    if (summary.high > 0) {
      report += `## 🟠 HIGH PRIORITY ISSUES (${summary.high})\n\n`;
      issues.filter(i => i.severity === 'HIGH').forEach(issue => {
        report += `### ${issue.component}\n`;
        report += `**Issue:** ${issue.issue}\n\n`;
        report += `**Impact:** ${issue.impact}\n\n`;
        report += `**Recommendation:** ${issue.recommendation}\n\n`;
        report += `---\n\n`;
      });
    }

    if (summary.medium > 0) {
      report += `## 🟡 MEDIUM PRIORITY ISSUES (${summary.medium})\n\n`;
      issues.filter(i => i.severity === 'MEDIUM').forEach(issue => {
        report += `- **${issue.component}:** ${issue.issue}\n`;
      });
      report += `\n`;
    }

    report += `
## 🎯 IMMEDIATE ACTION PLAN

### Phase 1: Fix Critical Issues (Immediate)
1. **Database Schema Alignment** - Fix table name mismatches
2. **Create Missing Core Tables** - Add crm_contacts, crm_accounts if missing
3. **Email Campaign System** - Resolve email_campaigns vs crm_email_campaigns

### Phase 2: High Priority Fixes (This Week)
1. **Service Integration** - Ensure all services can access their required tables
2. **Email Campaign Functionality** - Implement real email sending
3. **Data Loading Issues** - Fix any service-database connectivity problems

### Phase 3: Medium Priority Improvements (Next Sprint)
1. **Replace Placeholder Code** - Implement real functionality for mock services
2. **Template System** - Connect email templates to database
3. **Analytics Integration** - Ensure metrics are calculated from real data

## 🔧 NEXT STEPS
1. Run this diagnostic: \`console.log(await SimpleCRMDiagnostics.generateQuickReport())\`
2. Address critical issues first
3. Test each fix by re-running diagnostic
4. Move to high priority issues once critical ones are resolved

## 📋 VALIDATION CHECKLIST
- [ ] All core CRM tables accessible
- [ ] Email campaign system functional
- [ ] Services can load data successfully
- [ ] No placeholder implementations in production features
- [ ] Dashboard shows real data, not mock data
`;

    return report;
  }
}

// Export for console testing
if (typeof window !== 'undefined') {
  (window as any).SimpleCRMDiagnostics = SimpleCRMDiagnostics;
}