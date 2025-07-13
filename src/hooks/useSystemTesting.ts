import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'warning' | 'running';
  message: string;
  duration?: number;
  timestamp: string;
}

interface ActivityTrackingTest {
  userId: string;
  activityType: string;
  category: string;
  metadata?: Record<string, any>;
}

export const useSystemTesting = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Activity tracking test
  const testActivityTracking = useCallback(async (): Promise<TestResult> => {
    const testId = 'activity-tracking-test';
    const startTime = performance.now();
    
    try {
      // Test writing activity log
      const testActivity: ActivityTrackingTest = {
        userId: crypto.randomUUID(),
        activityType: 'test_activity',
        category: 'system_test',
        metadata: { testRun: true, timestamp: Date.now() }
      };

      const { error: insertError } = await supabase
        .from('user_activity_logs')
        .insert({
          user_id: testActivity.userId,
          activity_type: testActivity.activityType,
          activity_category: testActivity.category,
          metadata: testActivity.metadata,
          session_id: crypto.randomUUID()
        });

      if (insertError) {
        return {
          id: testId,
          name: 'Activity Tracking - Write Test',
          status: 'failed',
          message: `Failed to write activity log: ${insertError.message}`,
          duration: performance.now() - startTime,
          timestamp: new Date().toISOString()
        };
      }

      // Test reading activity logs
      const { data: activityData, error: readError } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', testActivity.userId)
        .limit(1);

      if (readError) {
        return {
          id: testId,
          name: 'Activity Tracking - Read Test',
          status: 'failed',
          message: `Failed to read activity log: ${readError.message}`,
          duration: performance.now() - startTime,
          timestamp: new Date().toISOString()
        };
      }

      // Cleanup test data
      await supabase
        .from('user_activity_logs')
        .delete()
        .eq('user_id', testActivity.userId);

      return {
        id: testId,
        name: 'Activity Tracking Test',
        status: 'passed',
        message: `Activity tracking working correctly. Found ${activityData?.length || 0} test records.`,
        duration: performance.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        id: testId,
        name: 'Activity Tracking Test',
        status: 'failed',
        message: `Activity tracking test failed: ${error}`,
        duration: performance.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }, []);

  // Real-time subscription test
  const testRealTimeConnection = useCallback(async (): Promise<TestResult> => {
    const testId = 'realtime-test';
    const startTime = performance.now();
    
    return new Promise((resolve) => {
      try {
        let connectionEstablished = false;
        let messageReceived = false;
        
        const channel = supabase.channel('test-channel');
        
        const timeout = setTimeout(() => {
          supabase.removeChannel(channel);
          resolve({
            id: testId,
            name: 'Real-time Connection Test',
            status: connectionEstablished ? 'warning' : 'failed',
            message: connectionEstablished 
              ? 'Connection established but no test message received' 
              : 'Failed to establish real-time connection within timeout',
            duration: performance.now() - startTime,
            timestamp: new Date().toISOString()
          });
        }, 10000); // 10 second timeout

        channel
          .on('broadcast', { event: 'test' }, () => {
            messageReceived = true;
            clearTimeout(timeout);
            supabase.removeChannel(channel);
            resolve({
              id: testId,
              name: 'Real-time Connection Test',
              status: 'passed',
              message: 'Real-time connection and messaging working correctly',
              duration: performance.now() - startTime,
              timestamp: new Date().toISOString()
            });
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              connectionEstablished = true;
              // Send test message
              channel.send({
                type: 'broadcast',
                event: 'test',
                payload: { test: true }
              });
            }
          });
      } catch (error) {
        resolve({
          id: testId,
          name: 'Real-time Connection Test',
          status: 'failed',
          message: `Real-time test failed: ${error}`,
          duration: performance.now() - startTime,
          timestamp: new Date().toISOString()
        });
      }
    });
  }, []);

  // Team management test
  const testTeamManagement = useCallback(async (): Promise<TestResult> => {
    const testId = 'team-management-test';
    const startTime = performance.now();
    
    try {
      // Test reading teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, status, created_at')
        .limit(5);

      if (teamsError) {
        return {
          id: testId,
          name: 'Team Management Test',
          status: 'failed',
          message: `Failed to read teams: ${teamsError.message}`,
          duration: performance.now() - startTime,
          timestamp: new Date().toISOString()
        };
      }

      // Test reading team members
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('id, team_id, user_id, role, status')
        .limit(5);

      if (membersError) {
        return {
          id: testId,
          name: 'Team Management Test',
          status: 'warning',
          message: `Teams readable but members query failed: ${membersError.message}`,
          duration: performance.now() - startTime,
          timestamp: new Date().toISOString()
        };
      }

      return {
        id: testId,
        name: 'Team Management Test',
        status: 'passed',
        message: `Team management working. Found ${teamsData?.length || 0} teams and ${membersData?.length || 0} members.`,
        duration: performance.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        id: testId,
        name: 'Team Management Test',
        status: 'failed',
        message: `Team management test failed: ${error}`,
        duration: performance.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }, []);

  // Cache system test
  const testCacheSystem = useCallback(async (): Promise<TestResult> => {
    const testId = 'cache-system-test';
    const startTime = performance.now();
    
    try {
      // Test reading cache entries
      const { data: cacheData, error: cacheError } = await supabase
        .from('cache_entries')
        .select('id, cache_key, cache_namespace, created_at')
        .limit(5);

      if (cacheError) {
        return {
          id: testId,
          name: 'Cache System Test',
          status: 'warning',
          message: `Cache system not accessible: ${cacheError.message}`,
          duration: performance.now() - startTime,
          timestamp: new Date().toISOString()
        };
      }

      // Test cache performance
      const cacheTestStart = performance.now();
      const { data: perfTestData } = await supabase
        .from('cache_entries')
        .select('id')
        .limit(1);
      const cacheResponseTime = performance.now() - cacheTestStart;

      return {
        id: testId,
        name: 'Cache System Test',
        status: cacheResponseTime < 100 ? 'passed' : 'warning',
        message: `Cache system accessible. Response time: ${Math.round(cacheResponseTime)}ms. ${cacheData?.length || 0} entries found.`,
        duration: performance.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        id: testId,
        name: 'Cache System Test',
        status: 'failed',
        message: `Cache system test failed: ${error}`,
        duration: performance.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }, []);

  // Analytics system test
  const testAnalyticsSystem = useCallback(async (): Promise<TestResult> => {
    const testId = 'analytics-system-test';
    const startTime = performance.now();
    
    try {
      // Test analytics warehouse
      const { data: warehouseData, error: warehouseError } = await supabase
        .from('analytics_warehouse')
        .select('id, metric_name, metric_value, created_at')
        .limit(5);

      if (warehouseError) {
        return {
          id: testId,
          name: 'Analytics System Test',
          status: 'warning',
          message: `Analytics warehouse not accessible: ${warehouseError.message}`,
          duration: performance.now() - startTime,
          timestamp: new Date().toISOString()
        };
      }

      // Test analytics cache
      const { data: analyticsCacheData, error: analyticsCacheError } = await supabase
        .from('analytics_cache')
        .select('id, cache_key, created_at')
        .limit(5);

      return {
        id: testId,
        name: 'Analytics System Test',
        status: 'passed',
        message: `Analytics system operational. Warehouse: ${warehouseData?.length || 0} metrics, Cache: ${analyticsCacheData?.length || 0} entries.`,
        duration: performance.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        id: testId,
        name: 'Analytics System Test',
        status: 'failed',
        message: `Analytics system test failed: ${error}`,
        duration: performance.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }, []);

  // Run comprehensive test suite
  const runAllTests = useCallback(async () => {
    setIsRunningTests(true);
    setTestResults([]);
    
    const tests = [
      testActivityTracking,
      testTeamManagement,
      testCacheSystem,
      testAnalyticsSystem,
      testRealTimeConnection
    ];

    const results: TestResult[] = [];
    
    for (const test of tests) {
      const result = await test();
      results.push(result);
      setTestResults([...results]); // Update UI progressively
    }
    
    setIsRunningTests(false);
    return results;
  }, [testActivityTracking, testTeamManagement, testCacheSystem, testAnalyticsSystem, testRealTimeConnection]);

  // Run individual test
  const runTest = useCallback(async (testName: string) => {
    setIsRunningTests(true);
    
    let result: TestResult;
    switch (testName) {
      case 'activity-tracking':
        result = await testActivityTracking();
        break;
      case 'team-management':
        result = await testTeamManagement();
        break;
      case 'cache-system':
        result = await testCacheSystem();
        break;
      case 'analytics-system':
        result = await testAnalyticsSystem();
        break;
      case 'realtime':
        result = await testRealTimeConnection();
        break;
      default:
        result = {
          id: 'unknown-test',
          name: 'Unknown Test',
          status: 'failed',
          message: `Unknown test: ${testName}`,
          timestamp: new Date().toISOString()
        };
    }
    
    setTestResults(prev => {
      const filtered = prev.filter(r => r.id !== result.id);
      return [...filtered, result];
    });
    
    setIsRunningTests(false);
    return result;
  }, [testActivityTracking, testTeamManagement, testCacheSystem, testAnalyticsSystem, testRealTimeConnection]);

  // Clear test results
  const clearResults = useCallback(() => {
    setTestResults([]);
  }, []);

  // Get test summary
  const getTestSummary = useCallback(() => {
    const total = testResults.length;
    const passed = testResults.filter(r => r.status === 'passed').length;
    const failed = testResults.filter(r => r.status === 'failed').length;
    const warnings = testResults.filter(r => r.status === 'warning').length;
    const running = testResults.filter(r => r.status === 'running').length;
    
    return {
      total,
      passed,
      failed,
      warnings,
      running,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0
    };
  }, [testResults]);

  return {
    testResults,
    isRunningTests,
    runAllTests,
    runTest,
    clearResults,
    getTestSummary,
    
    // Individual test functions for direct use
    testActivityTracking,
    testTeamManagement,
    testCacheSystem,
    testAnalyticsSystem,
    testRealTimeConnection
  };
};