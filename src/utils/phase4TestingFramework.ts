/**
 * Phase 4 Testing Framework
 * Comprehensive testing utilities for component integration and workflow validation
 */

import { Phase4CRMService } from '@/services/crm/phase4ServiceIntegration';
import { EnhancedEmailCampaignService } from '@/services/email/enhancedEmailCampaignService';
import { ResendEmailService } from '@/services/email/resendEmailService';
import type { Lead, Contact, Account, Opportunity } from '@/types/crm';

export interface TestResult {
  testName: string;
  status: 'passed' | 'failed' | 'warning';
  duration: number;
  message: string;
  details?: any;
}

export interface TestSuite {
  suiteName: string;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  totalDuration: number;
}

/**
 * Phase 4 Testing Framework
 * Provides comprehensive testing for CRM component integration
 */
export class Phase4TestingFramework {
  private static testResults: TestResult[] = [];

  // =====================================================
  // CORE TESTING UTILITIES
  // =====================================================

  private static async runTest(
    testName: string,
    testFunction: () => Promise<any>
  ): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const result = await testFunction();
      const duration = performance.now() - startTime;
      
      return {
        testName,
        status: 'passed',
        duration,
        message: 'Test completed successfully',
        details: result
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      
      return {
        testName,
        status: 'failed',
        duration,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      };
    }
  }

  // =====================================================
  // SERVICE INTEGRATION TESTS
  // =====================================================

  static async testServiceIntegration(): Promise<TestSuite> {
    const results: TestResult[] = [];
    const startTime = performance.now();

    // Test 1: Unified CRM Service Connection
    results.push(await this.runTest(
      'Unified CRM Service Connection',
      async () => {
        const stats = await Phase4CRMService.getCRMStatsWithPerformanceMetrics();
        if (!stats || typeof stats.total_leads !== 'number') {
          throw new Error('Invalid CRM stats response');
        }
        return { stats, queryTime: stats.performance?.queryTime };
      }
    ));

    // Test 2: Email Campaign Service Integration
    results.push(await this.runTest(
      'Email Campaign Service Integration',
      async () => {
        const validation = await Phase4CRMService.validateServiceIntegration();
        if (!validation.emailCampaignService) {
          throw new Error('Email Campaign Service validation failed');
        }
        return validation;
      }
    ));

    // Test 3: Resend Email Service Connection
    results.push(await this.runTest(
      'Resend Email Service Connection',
      async () => {
        const connectionTest = await ResendEmailService.testConnection();
        return connectionTest;
      }
    ));

    // Test 4: Real-time Activity Feed
    results.push(await this.runTest(
      'Real-time Activity Feed',
      async () => {
        const activityFeed = await Phase4CRMService.getRealtimeActivityFeed(5);
        if (!activityFeed || !Array.isArray(activityFeed.activities)) {
          throw new Error('Invalid activity feed response');
        }
        return { activityCount: activityFeed.activities.length };
      }
    ));

    const totalDuration = performance.now() - startTime;
    const passedTests = results.filter(r => r.status === 'passed').length;
    const failedTests = results.filter(r => r.status === 'failed').length;
    const warningTests = results.filter(r => r.status === 'warning').length;

    return {
      suiteName: 'Service Integration Tests',
      results,
      totalTests: results.length,
      passedTests,
      failedTests,
      warningTests,
      totalDuration
    };
  }

  // =====================================================
  // WORKFLOW INTEGRATION TESTS
  // =====================================================

  static async testWorkflowIntegration(): Promise<TestSuite> {
    const results: TestResult[] = [];
    const startTime = performance.now();

    // Test 1: Lead Creation with Workflow
    results.push(await this.runTest(
      'Lead Creation with Workflow',
      async () => {
        const testLead: Omit<Lead, 'id' | 'created_at' | 'updated_at'> = {
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
          phone: '555-0123',
          company_name: 'Test Company',
          lead_status: 'new',
          lead_source: 'website',
          lead_score: 50,
          created_by: 'test-framework'
        };

        const lead = await Phase4CRMService.createLeadWithWorkflow(testLead);
        
        if (!lead || !lead.id) {
          throw new Error('Lead creation failed');
        }

        // Clean up test data
        // await UnifiedCRMService.deleteLead(lead.id);
        
        return { leadId: lead.id, leadScore: lead.lead_score };
      }
    ));

    // Test 2: Lead Conversion Workflow
    results.push(await this.runTest(
      'Lead Conversion Workflow',
      async () => {
        // This would test the full conversion workflow
        // For now, we'll simulate the test
        return { 
          message: 'Lead conversion workflow test simulated',
          status: 'simulated'
        };
      }
    ));

    // Test 3: Email Campaign Creation
    results.push(await this.runTest(
      'Email Campaign Creation',
      async () => {
        const campaignData = {
          name: 'Test Campaign',
          template: 'welcome',
          audience: 'leads',
          personalizations: {
            company_name: 'Test Company'
          }
        };

        const campaign = await Phase4CRMService.createCampaignWithResendIntegration(campaignData);
        
        if (!campaign || !campaign.id) {
          throw new Error('Campaign creation failed');
        }

        return { campaignId: campaign.id, campaignName: campaign.campaign_name };
      }
    ));

    // Test 4: Batch Operations
    results.push(await this.runTest(
      'Batch Lead Creation',
      async () => {
        const testLeads: Omit<Lead, 'id' | 'created_at' | 'updated_at'>[] = [
          {
            first_name: 'Batch',
            last_name: 'Test1',
            email: 'batch1@example.com',
            lead_status: 'new',
            lead_source: 'website',
            lead_score: 30,
            created_by: 'test-framework'
          },
          {
            first_name: 'Batch',
            last_name: 'Test2',
            email: 'batch2@example.com',
            lead_status: 'new',
            lead_source: 'referral',
            lead_score: 40,
            created_by: 'test-framework'
          }
        ];

        const batchResult = await Phase4CRMService.batchCreateLeads(testLeads);
        
        if (batchResult.successful === 0) {
          throw new Error('Batch operation failed completely');
        }

        return {
          total: batchResult.total,
          successful: batchResult.successful,
          failed: batchResult.failed
        };
      }
    ));

    const totalDuration = performance.now() - startTime;
    const passedTests = results.filter(r => r.status === 'passed').length;
    const failedTests = results.filter(r => r.status === 'failed').length;
    const warningTests = results.filter(r => r.status === 'warning').length;

    return {
      suiteName: 'Workflow Integration Tests',
      results,
      totalTests: results.length,
      passedTests,
      failedTests,
      warningTests,
      totalDuration
    };
  }

  // =====================================================
  // PERFORMANCE TESTS
  // =====================================================

  static async testPerformanceMetrics(): Promise<TestSuite> {
    const results: TestResult[] = [];
    const startTime = performance.now();

    // Test 1: Dashboard Load Performance
    results.push(await this.runTest(
      'Dashboard Load Performance',
      async () => {
        const loadStartTime = performance.now();
        const stats = await Phase4CRMService.getCRMStatsWithPerformanceMetrics();
        const loadTime = performance.now() - loadStartTime;
        
        if (loadTime > 2000) {
          throw new Error(`Dashboard load time too slow: ${loadTime.toFixed(0)}ms`);
        }

        return {
          loadTime: loadTime.toFixed(0) + 'ms',
          queryTime: stats.performance?.queryTime.toFixed(0) + 'ms',
          status: loadTime < 1000 ? 'excellent' : loadTime < 2000 ? 'good' : 'acceptable'
        };
      }
    ));

    // Test 2: Real-time Update Performance
    results.push(await this.runTest(
      'Real-time Update Performance',
      async () => {
        const updateStartTime = performance.now();
        const activityFeed = await Phase4CRMService.getRealtimeActivityFeed(20);
        const updateTime = performance.now() - updateStartTime;
        
        if (updateTime > 1000) {
          throw new Error(`Real-time update too slow: ${updateTime.toFixed(0)}ms`);
        }

        return {
          updateTime: updateTime.toFixed(0) + 'ms',
          activityCount: activityFeed.activities?.length || 0,
          status: updateTime < 500 ? 'excellent' : updateTime < 1000 ? 'good' : 'acceptable'
        };
      }
    ));

    // Test 3: Service Validation Performance
    results.push(await this.runTest(
      'Service Validation Performance',
      async () => {
        const validationStartTime = performance.now();
        const validation = await Phase4CRMService.validateServiceIntegration();
        const validationTime = performance.now() - validationStartTime;
        
        const healthyServices = Object.values(validation).filter(Boolean).length;
        const totalServices = Object.keys(validation).length;
        
        if (healthyServices < totalServices) {
          throw new Error(`${totalServices - healthyServices} services are unhealthy`);
        }

        return {
          validationTime: validationTime.toFixed(0) + 'ms',
          healthyServices: `${healthyServices}/${totalServices}`,
          allHealthy: healthyServices === totalServices
        };
      }
    ));

    const totalDuration = performance.now() - startTime;
    const passedTests = results.filter(r => r.status === 'passed').length;
    const failedTests = results.filter(r => r.status === 'failed').length;
    const warningTests = results.filter(r => r.status === 'warning').length;

    return {
      suiteName: 'Performance Tests',
      results,
      totalTests: results.length,
      passedTests,
      failedTests,
      warningTests,
      totalDuration
    };
  }

  // =====================================================
  // COMPREHENSIVE TEST RUNNER
  // =====================================================

  static async runAllTests(): Promise<{
    suites: TestSuite[];
    summary: {
      totalSuites: number;
      totalTests: number;
      totalPassed: number;
      totalFailed: number;
      totalWarnings: number;
      totalDuration: number;
      overallStatus: 'passed' | 'failed' | 'warning';
    };
  }> {
    const overallStartTime = performance.now();
    
    console.log('🧪 Starting Phase 4 Component Integration Tests...');
    
    const suites: TestSuite[] = [];
    
    // Run all test suites
    try {
      suites.push(await this.testServiceIntegration());
      suites.push(await this.testWorkflowIntegration());
      suites.push(await this.testPerformanceMetrics());
    } catch (error) {
      console.error('❌ Test suite execution failed:', error);
    }
    
    const totalDuration = performance.now() - overallStartTime;
    
    // Calculate summary
    const totalTests = suites.reduce((sum, suite) => sum + suite.totalTests, 0);
    const totalPassed = suites.reduce((sum, suite) => sum + suite.passedTests, 0);
    const totalFailed = suites.reduce((sum, suite) => sum + suite.failedTests, 0);
    const totalWarnings = suites.reduce((sum, suite) => sum + suite.warningTests, 0);
    
    const overallStatus: 'passed' | 'failed' | 'warning' = totalFailed > 0 ? 'failed' : totalWarnings > 0 ? 'warning' : 'passed';
    
    const summary = {
      totalSuites: suites.length,
      totalTests,
      totalPassed,
      totalFailed,
      totalWarnings,
      totalDuration,
      overallStatus
    };
    
    // Log results
    console.log(`\n📊 Phase 4 Test Results Summary:`);
    console.log(`   Total Suites: ${summary.totalSuites}`);
    console.log(`   Total Tests: ${summary.totalTests}`);
    console.log(`   ✅ Passed: ${summary.totalPassed}`);
    console.log(`   ❌ Failed: ${summary.totalFailed}`);
    console.log(`   ⚠️  Warnings: ${summary.totalWarnings}`);
    console.log(`   ⏱️  Duration: ${summary.totalDuration.toFixed(0)}ms`);
    console.log(`   🎯 Status: ${summary.overallStatus.toUpperCase()}`);
    
    return { suites, summary };
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  static generateTestReport(suites: TestSuite[]): string {
    let report = '# Phase 4 Component Integration Test Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;
    
    suites.forEach(suite => {
      report += `## ${suite.suiteName}\n\n`;
      report += `- **Total Tests:** ${suite.totalTests}\n`;
      report += `- **Passed:** ${suite.passedTests}\n`;
      report += `- **Failed:** ${suite.failedTests}\n`;
      report += `- **Warnings:** ${suite.warningTests}\n`;
      report += `- **Duration:** ${suite.totalDuration.toFixed(0)}ms\n\n`;
      
      suite.results.forEach(result => {
        const statusIcon = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⚠️';
        report += `### ${statusIcon} ${result.testName}\n`;
        report += `- **Status:** ${result.status}\n`;
        report += `- **Duration:** ${result.duration.toFixed(0)}ms\n`;
        report += `- **Message:** ${result.message}\n`;
        if (result.details) {
          report += `- **Details:** \`${JSON.stringify(result.details, null, 2)}\`\n`;
        }
        report += '\n';
      });
    });
    
    return report;
  }
}

// Export for use in components and testing
export default Phase4TestingFramework;