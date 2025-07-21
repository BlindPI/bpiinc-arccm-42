import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  notificationSystemValidator, 
  SystemValidationReport, 
  ValidationResult 
} from '@/services/notifications/notificationSystemValidator';

export function useNotificationValidation() {
  const [isRunning, setIsRunning] = useState(false);
  const [lastReport, setLastReport] = useState<SystemValidationReport | null>(null);

  // Auto-validation query (runs every 30 minutes)
  const {
    data: autoReport,
    isLoading: autoLoading,
    error: autoError,
    refetch: runAutoValidation
  } = useQuery({
    queryKey: ['notificationValidation', 'auto'],
    queryFn: () => notificationSystemValidator.validateSystem(),
    refetchInterval: 30 * 60 * 1000, // 30 minutes
    staleTime: 20 * 60 * 1000, // 20 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    enabled: false // Disabled by default, enable manually
  });

  // Manual validation runner
  const runValidation = useCallback(async (): Promise<SystemValidationReport | null> => {
    if (isRunning) {
      console.warn('Validation already running');
      return null;
    }

    setIsRunning(true);
    
    try {
      const report = await notificationSystemValidator.validateSystem();
      setLastReport(report);
      return report;
    } catch (error) {
      console.error('Validation failed:', error);
      throw error;
    } finally {
      setIsRunning(false);
    }
  }, [isRunning]);

  // Get current system status
  const getSystemStatus = useCallback(() => {
    const report = lastReport || autoReport;
    if (!report) return 'UNKNOWN';
    return report.overall;
  }, [lastReport, autoReport]);

  // Get critical issues
  const getCriticalIssues = useCallback(() => {
    const report = lastReport || autoReport;
    if (!report) return [];
    
    return report.results.filter(result => result.status === 'FAIL');
  }, [lastReport, autoReport]);

  // Get warnings
  const getWarnings = useCallback(() => {
    const report = lastReport || autoReport;
    if (!report) return [];
    
    return report.results.filter(result => result.status === 'WARNING');
  }, [lastReport, autoReport]);

  // Get success results
  const getSuccesses = useCallback(() => {
    const report = lastReport || autoReport;
    if (!report) return [];
    
    return report.results.filter(result => result.status === 'PASS');
  }, [lastReport, autoReport]);

  // Group results by category
  const getResultsByCategory = useCallback(() => {
    const report = lastReport || autoReport;
    if (!report) return {};
    
    return report.results.reduce((acc, result) => {
      if (!acc[result.category]) {
        acc[result.category] = [];
      }
      acc[result.category].push(result);
      return acc;
    }, {} as Record<string, ValidationResult[]>);
  }, [lastReport, autoReport]);

  // Enable auto-validation
  const enableAutoValidation = useCallback(() => {
    runAutoValidation();
  }, [runAutoValidation]);

  // Get summary statistics
  const getSummaryStats = useCallback(() => {
    const report = lastReport || autoReport;
    if (!report) {
      return {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        score: 0,
        lastRun: null
      };
    }

    const passed = report.results.filter(r => r.status === 'PASS').length;
    const failed = report.results.filter(r => r.status === 'FAIL').length;
    const warnings = report.results.filter(r => r.status === 'WARNING').length;

    return {
      total: report.results.length,
      passed,
      failed,
      warnings,
      score: report.score,
      lastRun: report.timestamp
    };
  }, [lastReport, autoReport]);

  // Check if system is healthy
  const isSystemHealthy = useCallback(() => {
    const status = getSystemStatus();
    return status === 'HEALTHY';
  }, [getSystemStatus]);

  // Get next recommended action
  const getNextAction = useCallback(() => {
    const report = lastReport || autoReport;
    if (!report || report.recommendations.length === 0) {
      return 'Run system validation to check health';
    }
    
    return report.recommendations[0];
  }, [lastReport, autoReport]);

  return {
    // States
    isRunning,
    isAutoValidating: autoLoading,
    
    // Reports
    currentReport: lastReport || autoReport,
    lastManualReport: lastReport,
    autoReport,
    
    // Errors
    error: autoError,
    
    // Actions
    runValidation,
    enableAutoValidation,
    
    // Analysis functions
    getSystemStatus,
    getCriticalIssues,
    getWarnings,
    getSuccesses,
    getResultsByCategory,
    getSummaryStats,
    isSystemHealthy,
    getNextAction,
    
    // Quick access properties
    systemStatus: getSystemStatus(),
    criticalIssues: getCriticalIssues(),
    warnings: getWarnings(),
    summaryStats: getSummaryStats(),
    isHealthy: isSystemHealthy(),
    nextAction: getNextAction()
  };
}

// Specialized hook for admin dashboard
export function useNotificationSystemHealth() {
  const {
    currentReport,
    isRunning,
    runValidation,
    systemStatus,
    criticalIssues,
    warnings,
    summaryStats,
    isHealthy
  } = useNotificationValidation();

  // Get health score with color coding
  const getHealthScore = useCallback(() => {
    const score = summaryStats.score;
    
    let color: 'green' | 'yellow' | 'red';
    if (score >= 90) color = 'green';
    else if (score >= 70) color = 'yellow';
    else color = 'red';

    return { score, color };
  }, [summaryStats.score]);

  // Get priority actions
  const getPriorityActions = useCallback(() => {
    const actions = [];
    
    if (criticalIssues.length > 0) {
      actions.push({
        priority: 'HIGH',
        action: `Fix ${criticalIssues.length} critical issue(s)`,
        category: 'CRITICAL'
      });
    }
    
    if (warnings.length > 3) {
      actions.push({
        priority: 'MEDIUM',
        action: `Address ${warnings.length} warning(s)`,
        category: 'WARNING'
      });
    }
    
    if (currentReport && currentReport.recommendations.length > 0) {
      currentReport.recommendations.slice(0, 2).forEach(rec => {
        actions.push({
          priority: 'LOW',
          action: rec,
          category: 'RECOMMENDATION'
        });
      });
    }
    
    return actions;
  }, [criticalIssues, warnings, currentReport]);

  // Get system overview for dashboard
  const getSystemOverview = useCallback(() => {
    return {
      status: systemStatus,
      score: summaryStats.score,
      lastValidation: currentReport?.timestamp || null,
      criticalCount: criticalIssues.length,
      warningCount: warnings.length,
      totalTests: summaryStats.total,
      passedTests: summaryStats.passed,
      isHealthy,
      needsAttention: criticalIssues.length > 0 || warnings.length > 5
    };
  }, [systemStatus, summaryStats, currentReport, criticalIssues, warnings, isHealthy]);

  return {
    // Core data
    overview: getSystemOverview(),
    healthScore: getHealthScore(),
    priorityActions: getPriorityActions(),
    
    // States
    isRunning,
    isHealthy,
    
    // Actions
    runValidation,
    
    // Detailed access
    currentReport,
    criticalIssues,
    warnings
  };
}

// Hook for real-time system monitoring
export function useNotificationSystemMonitor(options: {
  autoValidate?: boolean;
  interval?: number;
} = {}) {
  const { autoValidate = false, interval = 5 * 60 * 1000 } = options; // 5 minutes default
  
  const validation = useNotificationValidation();
  
  // Auto-run validation at intervals if enabled
  const {
    data: monitoringReport,
    isLoading: isMonitoring
  } = useQuery({
    queryKey: ['notificationMonitoring'],
    queryFn: () => notificationSystemValidator.validateSystem(),
    refetchInterval: interval,
    enabled: autoValidate,
    retry: 1
  });

  // Get real-time status
  const getRealTimeStatus = useCallback(() => {
    const report = monitoringReport || validation.currentReport;
    if (!report) return 'UNKNOWN';
    
    // Real-time status based on recent validation
    const reportAge = Date.now() - new Date(report.timestamp).getTime();
    const isRecent = reportAge < interval * 2; // Within 2 intervals
    
    return {
      status: report.overall,
      isRecent,
      age: reportAge,
      score: report.score
    };
  }, [monitoringReport, validation.currentReport, interval]);

  return {
    ...validation,
    monitoringReport,
    isMonitoring,
    realTimeStatus: getRealTimeStatus(),
    autoValidate,
    interval
  };
}