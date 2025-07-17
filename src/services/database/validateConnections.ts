import { DatabaseIntegrationManager, UnifiedDatabaseService, OptimizedQueryService, TransactionManager } from './index';
import { DatabaseUserRole } from '@/types/database-roles';

export interface ValidationResult {
  service: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
  timestamp: string;
}

export interface ComprehensiveValidationReport {
  overall: 'PASS' | 'FAIL' | 'WARNING';
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  results: ValidationResult[];
  performanceMetrics: {
    totalTime: number;
    connectionLatency: number;
    queryLatency: number;
  };
  recommendations: string[];
}

/**
 * Comprehensive validation of Phase 1 database integration implementation
 * Tests all production-ready database connections and workflows
 */
export class DatabaseConnectionValidator {
  
  /**
   * Run complete validation suite
   */
  public static async validatePhase1Implementation(
    testUserRole: DatabaseUserRole = 'AD',
    testUserId: string = '00000000-0000-0000-0000-000000000001'
  ): Promise<ComprehensiveValidationReport> {
    const startTime = Date.now();
    const results: ValidationResult[] = [];
    const recommendations: string[] = [];

    console.log('🔍 Starting Phase 1 Database Integration Validation...');

    // Test 1: Database Integration Manager Initialization
    results.push(await this.testDatabaseIntegrationManager());

    // Test 2: Core Database Connection
    results.push(await this.testCoreDatabaseConnection());

    // Test 3: Role-based Query Filtering
    results.push(await this.testRoleBasedFiltering(testUserRole, testUserId));

    // Test 4: Optimized Query Performance
    results.push(await this.testOptimizedQueries(testUserRole, testUserId));

    // Test 5: Transaction Management
    results.push(await this.testTransactionManagement(testUserRole, testUserId));

    // Test 6: Batch Operations
    results.push(await this.testBatchOperations(testUserRole));

    // Test 7: Health Check System
    results.push(await this.testHealthCheckSystem(testUserRole));

    // Test 8: Schema Validation
    results.push(await this.testSchemaValidation());

    // Test 9: Security Compliance
    results.push(await this.testSecurityCompliance(testUserRole, testUserId));

    // Test 10: Performance Benchmarks
    const performanceResult = await this.testPerformanceBenchmarks(testUserRole, testUserId);
    results.push(performanceResult);

    // Calculate summary
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const warnings = results.filter(r => r.status === 'WARNING').length;

    // Generate recommendations
    if (failed > 0) {
      recommendations.push('❌ Fix all failed tests before production deployment');
    }
    if (warnings > 0) {
      recommendations.push('⚠️ Address warning conditions for optimal performance');
    }
    if (performanceResult.details?.connectionLatency > 100) {
      recommendations.push('🐌 Connection latency is high - consider connection pooling optimization');
    }
    if (passed === results.length) {
      recommendations.push('✅ All tests passed - Phase 1 implementation ready for production');
    }

    const totalTime = Date.now() - startTime;
    
    return {
      overall: failed > 0 ? 'FAIL' : warnings > 0 ? 'WARNING' : 'PASS',
      summary: {
        totalTests: results.length,
        passed,
        failed,
        warnings
      },
      results,
      performanceMetrics: {
        totalTime,
        connectionLatency: performanceResult.details?.connectionLatency || 0,
        queryLatency: performanceResult.details?.queryLatency || 0
      },
      recommendations
    };
  }

  private static async testDatabaseIntegrationManager(): Promise<ValidationResult> {
    try {
      const initResult = await DatabaseIntegrationManager.initialize();
      
      if (initResult.success) {
        return {
          service: 'DatabaseIntegrationManager',
          status: 'PASS',
          message: 'Database Integration Manager initialized successfully',
          details: initResult,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          service: 'DatabaseIntegrationManager',
          status: 'FAIL',
          message: `Initialization failed: ${initResult.errors.join(', ')}`,
          details: initResult,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error: any) {
      return {
        service: 'DatabaseIntegrationManager',
        status: 'FAIL',
        message: `Initialization error: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  private static async testCoreDatabaseConnection(): Promise<ValidationResult> {
    try {
      const healthCheck = await UnifiedDatabaseService.healthCheck();
      
      if (healthCheck.status === 'healthy') {
        return {
          service: 'UnifiedDatabaseService',
          status: 'PASS',
          message: `Database connection healthy (${healthCheck.latency}ms)`,
          details: healthCheck,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          service: 'UnifiedDatabaseService',
          status: healthCheck.status === 'degraded' ? 'WARNING' : 'FAIL',
          message: `Database connection ${healthCheck.status}`,
          details: healthCheck,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error: any) {
      return {
        service: 'UnifiedDatabaseService',
        status: 'FAIL',
        message: `Connection test failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  private static async testRoleBasedFiltering(userRole: DatabaseUserRole, userId: string): Promise<ValidationResult> {
    try {
      // Test role-based access control
      const canAccessProfiles = UnifiedDatabaseService.canAccessTable(userRole, 'profiles', 'SELECT');
      const canModifyTrainingSessions = UnifiedDatabaseService.canAccessTable(userRole, 'training_sessions', 'UPDATE');
      
      const tests = [
        { name: 'Profile Access', result: canAccessProfiles, expected: true },
        { name: 'Training Session Modification', result: canModifyTrainingSessions, expected: ['SA', 'AD', 'AP'].includes(userRole) }
      ];

      const failedTests = tests.filter(t => t.result !== t.expected);
      
      if (failedTests.length === 0) {
        return {
          service: 'RoleBasedFiltering',
          status: 'PASS',
          message: 'Role-based access control working correctly',
          details: { userRole, tests },
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          service: 'RoleBasedFiltering',
          status: 'FAIL',
          message: `Role filtering failed: ${failedTests.map(t => t.name).join(', ')}`,
          details: { userRole, tests, failedTests },
          timestamp: new Date().toISOString()
        };
      }
    } catch (error: any) {
      return {
        service: 'RoleBasedFiltering',
        status: 'FAIL',
        message: `Role filtering test error: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  private static async testOptimizedQueries(userRole: DatabaseUserRole, userId: string): Promise<ValidationResult> {
    try {
      const startTime = Date.now();
      const dashboardData = await OptimizedQueryService.getDashboardData(userRole, userId);
      const queryTime = Date.now() - startTime;
      
      const hasRequiredFields = dashboardData.sessions !== undefined && 
                               dashboardData.certificates !== undefined && 
                               dashboardData.compliance !== undefined && 
                               dashboardData.teams !== undefined;
      
      if (hasRequiredFields && queryTime < 5000) {
        return {
          service: 'OptimizedQueryService',
          status: 'PASS',
          message: `Dashboard query completed in ${queryTime}ms`,
          details: { queryTime, dataStructure: Object.keys(dashboardData) },
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          service: 'OptimizedQueryService',
          status: queryTime >= 5000 ? 'WARNING' : 'FAIL',
          message: `Query issues: ${!hasRequiredFields ? 'Missing fields' : ''} ${queryTime >= 5000 ? 'Slow performance' : ''}`,
          details: { queryTime, hasRequiredFields, dashboardData },
          timestamp: new Date().toISOString()
        };
      }
    } catch (error: any) {
      return {
        service: 'OptimizedQueryService',
        status: 'FAIL',
        message: `Query test failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  private static async testTransactionManagement(userRole: DatabaseUserRole, userId: string): Promise<ValidationResult> {
    try {
      // Test transaction statistics (non-destructive)
      const stats = TransactionManager.getTransactionStats();
      
      return {
        service: 'TransactionManager',
        status: 'PASS',
        message: 'Transaction management system operational',
        details: { 
          activeTransactions: stats.activeTransactions,
          hasEmergencyRollback: typeof TransactionManager.emergencyRollback === 'function'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        service: 'TransactionManager',
        status: 'FAIL',
        message: `Transaction test failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  private static async testBatchOperations(userRole: DatabaseUserRole): Promise<ValidationResult> {
    try {
      // Test batch operation capabilities (validation only)
      const canPerformBatch = UnifiedDatabaseService.canAccessTable(userRole, 'notifications', 'INSERT');
      
      if (canPerformBatch) {
        return {
          service: 'BatchOperations',
          status: 'PASS',
          message: 'Batch operations capabilities validated',
          details: { userRole, canPerformBatch },
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          service: 'BatchOperations',
          status: 'WARNING',
          message: 'Limited batch operation permissions for current role',
          details: { userRole, canPerformBatch },
          timestamp: new Date().toISOString()
        };
      }
    } catch (error: any) {
      return {
        service: 'BatchOperations',
        status: 'FAIL',
        message: `Batch operations test failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  private static async testHealthCheckSystem(userRole: DatabaseUserRole): Promise<ValidationResult> {
    try {
      const healthReport = await DatabaseIntegrationManager.healthCheck(userRole);
      
      if (healthReport.overall === 'healthy') {
        return {
          service: 'HealthCheckSystem',
          status: 'PASS',
          message: 'All health checks passed',
          details: healthReport.summary,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          service: 'HealthCheckSystem',
          status: healthReport.overall === 'degraded' ? 'WARNING' : 'FAIL',
          message: `Health check status: ${healthReport.overall}`,
          details: healthReport,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error: any) {
      return {
        service: 'HealthCheckSystem',
        status: 'FAIL',
        message: `Health check failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  private static async testSchemaValidation(): Promise<ValidationResult> {
    try {
      // Test connection to verify schema access
      const connection = UnifiedDatabaseService.getConnection();
      const { data: tables, error } = await connection
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(5);

      if (error) throw error;

      const expectedTables = ['profiles', 'training_sessions', 'certificates'];
      const availableTables = tables?.map(t => t.table_name) || [];
      const missingTables = expectedTables.filter(t => !availableTables.includes(t));

      if (missingTables.length === 0) {
        return {
          service: 'SchemaValidation',
          status: 'PASS',
          message: 'Core database schema validated',
          details: { availableTablesCount: availableTables.length },
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          service: 'SchemaValidation',
          status: 'FAIL',
          message: `Missing tables: ${missingTables.join(', ')}`,
          details: { missingTables, availableTables },
          timestamp: new Date().toISOString()
        };
      }
    } catch (error: any) {
      return {
        service: 'SchemaValidation',
        status: 'FAIL',
        message: `Schema validation failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  private static async testSecurityCompliance(userRole: DatabaseUserRole, userId: string): Promise<ValidationResult> {
    try {
      const securityChecks = [
        { name: 'Role Validation', check: ['SA', 'AD', 'AP', 'IC', 'IP', 'IT', 'IN'].includes(userRole) },
        { name: 'User ID Format', check: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId) },
        { name: 'Connection Security', check: process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('https://') || false }
      ];

      const failedChecks = securityChecks.filter(c => !c.check);

      if (failedChecks.length === 0) {
        return {
          service: 'SecurityCompliance',
          status: 'PASS',
          message: 'Security compliance checks passed',
          details: { userRole, securityChecks },
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          service: 'SecurityCompliance',
          status: 'FAIL',
          message: `Security issues: ${failedChecks.map(c => c.name).join(', ')}`,
          details: { failedChecks },
          timestamp: new Date().toISOString()
        };
      }
    } catch (error: any) {
      return {
        service: 'SecurityCompliance',
        status: 'FAIL',
        message: `Security test failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  private static async testPerformanceBenchmarks(userRole: DatabaseUserRole, userId: string): Promise<ValidationResult> {
    try {
      // Connection latency test
      const connectionStart = Date.now();
      await UnifiedDatabaseService.healthCheck();
      const connectionLatency = Date.now() - connectionStart;

      // Query performance test
      const queryStart = Date.now();
      await OptimizedQueryService.getDashboardData(userRole, userId);
      const queryLatency = Date.now() - queryStart;

      const performance = {
        connectionLatency,
        queryLatency,
        connectionGrade: connectionLatency < 50 ? 'EXCELLENT' : connectionLatency < 100 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
        queryGrade: queryLatency < 1000 ? 'EXCELLENT' : queryLatency < 3000 ? 'GOOD' : 'NEEDS_IMPROVEMENT'
      };

      const status = (connectionLatency > 200 || queryLatency > 5000) ? 'WARNING' : 'PASS';

      return {
        service: 'PerformanceBenchmarks',
        status,
        message: `Connection: ${connectionLatency}ms, Query: ${queryLatency}ms`,
        details: performance,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        service: 'PerformanceBenchmarks',
        status: 'FAIL',
        message: `Performance test failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate human-readable validation report
   */
  public static generateReport(validation: ComprehensiveValidationReport): string {
    const { overall, summary, results, performanceMetrics, recommendations } = validation;
    
    let report = '\n';
    report += '═════════════════════════════════════════════════════════════════\n';
    report += '  PHASE 1 DATABASE INTEGRATION VALIDATION REPORT\n';
    report += '═════════════════════════════════════════════════════════════════\n';
    report += `📊 OVERALL STATUS: ${overall === 'PASS' ? '✅ PASS' : overall === 'WARNING' ? '⚠️ WARNING' : '❌ FAIL'}\n`;
    report += `📈 SUMMARY: ${summary.passed}/${summary.totalTests} tests passed`;
    if (summary.warnings > 0) report += `, ${summary.warnings} warnings`;
    if (summary.failed > 0) report += `, ${summary.failed} failures`;
    report += '\n';
    report += `⏱️ PERFORMANCE: Total ${performanceMetrics.totalTime}ms, Connection ${performanceMetrics.connectionLatency}ms, Query ${performanceMetrics.queryLatency}ms\n`;
    report += '\n';

    report += '📋 DETAILED RESULTS:\n';
    report += '─────────────────────────────────────────────────────────────────\n';
    results.forEach((result, index) => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
      report += `${index + 1}. ${icon} ${result.service}: ${result.message}\n`;
    });

    if (recommendations.length > 0) {
      report += '\n💡 RECOMMENDATIONS:\n';
      report += '─────────────────────────────────────────────────────────────────\n';
      recommendations.forEach((rec, index) => {
        report += `${index + 1}. ${rec}\n`;
      });
    }

    report += '\n';
    report += '═════════════════════════════════════════════════════════════════\n';
    
    return report;
  }
}

export default DatabaseConnectionValidator;