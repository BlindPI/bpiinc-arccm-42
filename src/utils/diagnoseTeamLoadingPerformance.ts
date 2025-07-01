/**
 * TEAM LOADING PERFORMANCE DIAGNOSTIC UTILITY
 * 
 * This utility helps identify the root causes of slow team loading
 * in the AP user dashboard by adding detailed performance logging.
 */

import { supabase } from '@/integrations/supabase/client';
import { providerRelationshipService } from '@/services/provider/providerRelationshipService';

export interface PerformanceDiagnostic {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  queryCount: number;
  dataSize: number;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface TeamLoadingDiagnosticResult {
  totalDuration: number;
  operations: PerformanceDiagnostic[];
  bottlenecks: Array<{
    operation: string;
    duration: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
    issue: string;
    recommendation: string;
  }>;
  summary: {
    totalQueries: number;
    slowestOperation: string;
    criticalIssues: number;
    recommendedFixes: string[];
  };
}

class TeamLoadingPerformanceDiagnoser {
  private diagnostics: PerformanceDiagnostic[] = [];
  private queryCounter = 0;
  private startTime = 0;

  async diagnoseTeamLoadingPerformance(primaryTeamId?: string): Promise<TeamLoadingDiagnosticResult> {
    console.log('🔍 STARTING TEAM LOADING PERFORMANCE DIAGNOSIS...');
    this.startTime = performance.now();
    this.diagnostics = [];
    this.queryCounter = 0;

    try {
      // 1. Test Dashboard Validation Performance
      await this.testDashboardValidation();

      // 2. Test Provider Fetching Performance  
      await this.testProviderFetching();

      // 3. Test Team Assignment Performance
      if (primaryTeamId) {
        await this.testTeamAssignmentPerformance(primaryTeamId);
      }

      // 4. Test KPI Calculation Performance
      await this.testKPICalculationPerformance();

      // 5. Test Database Connection Health
      await this.testDatabaseConnectionHealth();

      // 6. Test Query Optimization
      await this.testQueryOptimization();

      return this.generateDiagnosticReport();
    } catch (error) {
      console.error('❌ DIAGNOSTIC ERROR:', error);
      return this.generateErrorReport(error);
    }
  }

  private async testDashboardValidation(): Promise<void> {
    const operation = 'Dashboard Validation';
    const startTime = performance.now();
    let queryCount = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log('🔍 Testing dashboard validation performance...');
      
      // Import and run validation (this might be expensive)
      const { validateDashboardDataSources } = await import('@/utils/validateDashboardDataSources');
      const validationResults = await validateDashboardDataSources();
      
      queryCount = validationResults.length; // Estimate based on validation count
      
      if (validationResults.length > 10) {
        warnings.push(`High validation overhead: ${validationResults.length} validations run on each load`);
      }

      console.log(`✅ Dashboard validation completed: ${validationResults.length} validations`);
    } catch (error) {
      errors.push(`Dashboard validation failed: ${error}`);
      console.error('❌ Dashboard validation error:', error);
    }

    const endTime = performance.now();
    this.queryCounter += queryCount;
    
    this.diagnostics.push({
      operation,
      startTime,
      endTime,
      duration: endTime - startTime,
      queryCount,
      dataSize: 0,
      errors,
      warnings,
      suggestions: warnings.length > 0 ? ['Consider caching validation results', 'Run validations less frequently'] : []
    });
  }

  private async testProviderFetching(): Promise<void> {
    const operation = 'Provider Fetching';
    const startTime = performance.now();
    let queryCount = 1;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log('🔍 Testing provider fetching performance...');
      
      const providers = await providerRelationshipService.getProviders({});
      
      if (providers.length > 50) {
        warnings.push(`Large provider dataset: ${providers.length} providers being fetched`);
      }

      console.log(`✅ Provider fetching completed: ${providers.length} providers`);
    } catch (error) {
      errors.push(`Provider fetching failed: ${error}`);
      console.error('❌ Provider fetching error:', error);
    }

    const endTime = performance.now();
    this.queryCounter += queryCount;
    
    this.diagnostics.push({
      operation,
      startTime,
      endTime,
      duration: endTime - startTime,
      queryCount,
      dataSize: 0,
      errors,
      warnings,
      suggestions: warnings.length > 0 ? ['Implement pagination', 'Add result caching', 'Filter by relevant providers only'] : []
    });
  }

  private async testTeamAssignmentPerformance(teamId: string): Promise<void> {
    const operation = 'Team Assignment Processing';
    const startTime = performance.now();
    let queryCount = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log('🔍 Testing team assignment performance...');
      
      // Simulate the dashboard's approach
      const allProviders = await providerRelationshipService.getProviders({});
      queryCount += 1;
      
      const teamProviders = [];
      
      // This is the N+1 problem - one query per provider
      for (const provider of allProviders) {
        const assignments = await providerRelationshipService.getProviderTeamAssignments(provider.id);
        queryCount += 1; // Each getProviderTeamAssignments makes multiple queries internally
        
        const teamAssignment = assignments.find(a => a.team_id === teamId && a.status === 'active');
        if (teamAssignment) {
          teamProviders.push({ provider, assignment: teamAssignment });
          
          // Each KPI calculation makes multiple queries
          const kpis = await providerRelationshipService.getProviderLocationKPIs(provider.id);
          queryCount += 3; // Estimated queries per KPI calculation
        }
      }

      if (queryCount > 20) {
        errors.push(`N+1 Query Problem Detected: ${queryCount} queries for ${allProviders.length} providers`);
      } else if (queryCount > 10) {
        warnings.push(`Potential N+1 issue: ${queryCount} queries for ${allProviders.length} providers`);
      }

      console.log(`✅ Team assignment processing completed: ${teamProviders.length} assignments found with ${queryCount} queries`);
    } catch (error) {
      errors.push(`Team assignment processing failed: ${error}`);
      console.error('❌ Team assignment processing error:', error);
    }

    const endTime = performance.now();
    this.queryCounter += queryCount;
    
    this.diagnostics.push({
      operation,
      startTime,
      endTime,
      duration: endTime - startTime,
      queryCount,
      dataSize: 0,
      errors,
      warnings,
      suggestions: [
        'Use bulk queries instead of individual provider queries',
        'Implement database views for provider-team relationships',
        'Cache KPI calculations',
        'Consider using database functions for complex calculations'
      ]
    });
  }

  private async testKPICalculationPerformance(): Promise<void> {
    const operation = 'KPI Calculation';
    const startTime = performance.now();
    let queryCount = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log('🔍 Testing KPI calculation performance...');
      
      // Get a sample provider to test KPI calculation
      const { data: sampleProvider, error } = await supabase
        .from('authorized_providers')
        .select('id')
        .limit(1)
        .single();

      if (error || !sampleProvider) {
        warnings.push('No providers found for KPI testing');
        return;
      }

      const kpiStartTime = performance.now();
      const kpis = await providerRelationshipService.getProviderLocationKPIs(sampleProvider.id);
      const kpiDuration = performance.now() - kpiStartTime;
      
      queryCount = 6; // Estimated queries in KPI calculation based on code analysis
      
      if (kpiDuration > 2000) {
        errors.push(`Slow KPI calculation: ${kpiDuration.toFixed(2)}ms for single provider`);
      } else if (kpiDuration > 1000) {
        warnings.push(`Moderate KPI calculation time: ${kpiDuration.toFixed(2)}ms for single provider`);
      }

      console.log(`✅ KPI calculation completed in ${kpiDuration.toFixed(2)}ms`);
    } catch (error) {
      errors.push(`KPI calculation failed: ${error}`);
      console.error('❌ KPI calculation error:', error);
    }

    const endTime = performance.now();
    this.queryCounter += queryCount;
    
    this.diagnostics.push({
      operation,
      startTime,
      endTime,
      duration: endTime - startTime,
      queryCount,
      dataSize: 0,
      errors,
      warnings,
      suggestions: [
        'Pre-calculate KPIs in background job',
        'Use materialized views for performance metrics',
        'Cache KPI results with appropriate TTL',
        'Optimize certificate and course counting queries'
      ]
    });
  }

  private async testDatabaseConnectionHealth(): Promise<void> {
    const operation = 'Database Connection Health';
    const startTime = performance.now();
    let queryCount = 3;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log('🔍 Testing database connection health...');
      
      // Test basic connectivity
      const { data: healthCheck, error: healthError } = await supabase
        .from('authorized_providers')
        .select('count(*)')
        .limit(1);

      if (healthError) {
        errors.push(`Database connection issue: ${healthError.message}`);
      }

      // Test RLS performance
      const rlsStartTime = performance.now();
      const { data: rlsTest, error: rlsError } = await supabase
        .from('team_members')
        .select('id')
        .limit(1);
      const rlsDuration = performance.now() - rlsStartTime;

      if (rlsError) {
        warnings.push(`RLS policy issue detected: ${rlsError.message}`);
      }

      if (rlsDuration > 500) {
        warnings.push(`Slow RLS evaluation: ${rlsDuration.toFixed(2)}ms`);
      }

      // Test query plan efficiency
      const planStartTime = performance.now();
      const { data: planTest, error: planError } = await supabase
        .from('provider_team_assignments')
        .select('id, provider_id, team_id')
        .limit(10);
      const planDuration = performance.now() - planStartTime;

      if (planDuration > 1000) {
        warnings.push(`Slow query execution: ${planDuration.toFixed(2)}ms for simple query`);
      }

      console.log(`✅ Database health check completed`);
    } catch (error) {
      errors.push(`Database health check failed: ${error}`);
      console.error('❌ Database health check error:', error);
    }

    const endTime = performance.now();
    this.queryCounter += queryCount;
    
    this.diagnostics.push({
      operation,
      startTime,
      endTime,
      duration: endTime - startTime,
      queryCount,
      dataSize: 0,
      errors,
      warnings,
      suggestions: errors.length > 0 ? [
        'Check database connection stability',
        'Review RLS policies for performance impact',
        'Consider database indexing optimization'
      ] : []
    });
  }

  private async testQueryOptimization(): Promise<void> {
    const operation = 'Query Optimization Analysis';
    const startTime = performance.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log('🔍 Analyzing query optimization opportunities...');
      
      // Test join efficiency
      const joinStartTime = performance.now();
      const { data: joinTest, error: joinError } = await supabase
        .from('provider_team_assignments')
        .select(`
          id,
          teams!inner(
            id,
            name,
            location_id
          )
        `)
        .limit(5);
      const joinDuration = performance.now() - joinStartTime;

      if (joinDuration > 1000) {
        warnings.push(`Slow join query: ${joinDuration.toFixed(2)}ms`);
      }

      // Test count query efficiency  
      const countStartTime = performance.now();
      const { count, error: countError } = await supabase
        .from('team_members')
        .select('id', { count: 'exact' })
        .limit(1);
      const countDuration = performance.now() - countStartTime;

      if (countDuration > 500) {
        warnings.push(`Slow count query: ${countDuration.toFixed(2)}ms`);
      }

      console.log(`✅ Query optimization analysis completed`);
    } catch (error) {
      errors.push(`Query optimization analysis failed: ${error}`);
      console.error('❌ Query optimization error:', error);
    }

    const endTime = performance.now();
    
    this.diagnostics.push({
      operation,
      startTime,
      endTime,
      duration: endTime - startTime,
      queryCount: 2,
      dataSize: 0,
      errors,
      warnings,
      suggestions: [
        'Add database indexes for frequently joined columns',
        'Optimize count queries with approximate counts where possible',
        'Use database functions for complex aggregations'
      ]
    });
  }

  private generateDiagnosticReport(): TeamLoadingDiagnosticResult {
    const totalDuration = performance.now() - this.startTime;
    const bottlenecks = this.identifyBottlenecks();
    
    console.log('📊 TEAM LOADING PERFORMANCE DIAGNOSTIC COMPLETE');
    console.log(`📊 Total Duration: ${totalDuration.toFixed(2)}ms`);
    console.log(`📊 Total Queries: ${this.queryCounter}`);
    console.log(`📊 Operations Analyzed: ${this.diagnostics.length}`);
    
    return {
      totalDuration,
      operations: this.diagnostics,
      bottlenecks,
      summary: {
        totalQueries: this.queryCounter,
        slowestOperation: this.diagnostics.reduce((prev, current) => 
          prev.duration > current.duration ? prev : current
        ).operation,
        criticalIssues: bottlenecks.filter(b => b.severity === 'critical').length,
        recommendedFixes: this.generateRecommendedFixes(bottlenecks)
      }
    };
  }

  private identifyBottlenecks() {
    const bottlenecks = [];
    
    for (const diagnostic of this.diagnostics) {
      // Critical: > 3000ms or > 20 queries
      if (diagnostic.duration > 3000 || diagnostic.queryCount > 20) {
        bottlenecks.push({
          operation: diagnostic.operation,
          duration: diagnostic.duration,
          severity: 'critical' as const,
          issue: diagnostic.duration > 3000 
            ? `Extremely slow operation: ${diagnostic.duration.toFixed(2)}ms`
            : `Too many queries: ${diagnostic.queryCount}`,
          recommendation: diagnostic.suggestions[0] || 'Optimize this operation'
        });
      }
      // High: > 1500ms or > 10 queries
      else if (diagnostic.duration > 1500 || diagnostic.queryCount > 10) {
        bottlenecks.push({
          operation: diagnostic.operation,
          duration: diagnostic.duration,
          severity: 'high' as const,
          issue: diagnostic.duration > 1500 
            ? `Slow operation: ${diagnostic.duration.toFixed(2)}ms`
            : `Many queries: ${diagnostic.queryCount}`,
          recommendation: diagnostic.suggestions[0] || 'Consider optimization'
        });
      }
      // Medium: > 500ms or errors
      else if (diagnostic.duration > 500 || diagnostic.errors.length > 0) {
        bottlenecks.push({
          operation: diagnostic.operation,
          duration: diagnostic.duration,
          severity: 'medium' as const,
          issue: diagnostic.errors.length > 0 
            ? `Errors detected: ${diagnostic.errors.length}`
            : `Moderate slowness: ${diagnostic.duration.toFixed(2)}ms`,
          recommendation: diagnostic.suggestions[0] || 'Monitor this operation'
        });
      }
    }
    
    return bottlenecks;
  }

  private generateRecommendedFixes(bottlenecks: any[]): string[] {
    const fixes = new Set<string>();
    
    // Add fixes based on bottleneck patterns
    bottlenecks.forEach(bottleneck => {
      if (bottleneck.issue.includes('queries')) {
        fixes.add('Implement bulk database operations');
        fixes.add('Cache frequently accessed data');
      }
      if (bottleneck.operation.includes('Team Assignment')) {
        fixes.add('Optimize provider-team relationship queries');
        fixes.add('Use database views for complex joins');
      }
      if (bottleneck.operation.includes('KPI')) {
        fixes.add('Pre-calculate KPIs in background job');
        fixes.add('Add database indexes for performance queries');
      }
    });

    // Add general fixes based on query count
    if (this.queryCounter > 50) {
      fixes.add('Reduce total number of database queries');
      fixes.add('Implement query batching');
    }

    return Array.from(fixes);
  }

  private generateErrorReport(error: any): TeamLoadingDiagnosticResult {
    return {
      totalDuration: performance.now() - this.startTime,
      operations: this.diagnostics,
      bottlenecks: [{
        operation: 'Diagnostic Process',
        duration: performance.now() - this.startTime,
        severity: 'critical',
        issue: `Diagnostic failed: ${error.message}`,
        recommendation: 'Check console for detailed error information'
      }],
      summary: {
        totalQueries: this.queryCounter,
        slowestOperation: 'Unknown',
        criticalIssues: 1,
        recommendedFixes: ['Fix diagnostic utility errors', 'Check database connectivity']
      }
    };
  }
}

// Export singleton instance
export const teamLoadingPerformanceDiagnoser = new TeamLoadingPerformanceDiagnoser();

// Helper function to run diagnosis
export async function diagnoseTeamLoadingPerformance(primaryTeamId?: string) {
  return await teamLoadingPerformanceDiagnoser.diagnoseTeamLoadingPerformance(primaryTeamId);
}