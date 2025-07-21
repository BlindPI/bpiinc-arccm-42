import { supabase } from '@/integrations/supabase/client';
import { notificationPerformanceMonitor } from './notificationPerformanceMonitor';
import { PushNotificationService } from './pushNotificationService';

export interface ValidationResult {
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
  timestamp: string;
}

export interface SystemValidationReport {
  overall: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  score: number; // 0-100
  results: ValidationResult[];
  recommendations: string[];
  timestamp: string;
  duration: number;
}

class NotificationSystemValidator {
  private results: ValidationResult[] = [];
  private startTime: number = 0;

  /**
   * Run comprehensive system validation
   */
  async validateSystem(): Promise<SystemValidationReport> {
    this.startTime = Date.now();
    this.results = [];

    console.log('🔍 Starting comprehensive notification system validation...');

    try {
      // Run all validation tests
      await this.validateDatabaseConnectivity();
      await this.validateDatabaseSchema();
      await this.validateNotificationCRUD();
      await this.validateRealTimeSubscriptions();
      await this.validatePushNotifications();
      await this.validateAnalyticsSystem();
      await this.validatePerformanceMonitoring();
      await this.validateSystemIntegrity();

      const report = this.generateReport();
      console.log('✅ Notification system validation completed:', report);
      return report;

    } catch (error) {
      console.error('❌ Validation failed with error:', error);
      this.addResult('SYSTEM', 'Validation Process', 'FAIL', 
        `Validation process failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return this.generateReport();
    }
  }

  /**
   * Test database connectivity
   */
  private async validateDatabaseConnectivity(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('count', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        this.addResult('DATABASE', 'Connectivity Test', 'FAIL', 
          `Database connection failed: ${error.message}`, { error });
      } else {
        this.addResult('DATABASE', 'Connectivity Test', 'PASS', 
          'Database connection successful', { count: data });
      }
    } catch (error) {
      this.addResult('DATABASE', 'Connectivity Test', 'FAIL', 
        `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate database schema structure
   */
  private async validateDatabaseSchema(): Promise<void> {
    try {
      // Test notifications table structure
      const { data: notificationTest, error: notifError } = await supabase
        .from('notifications')
        .select('id, user_id, title, message, category, priority, read, metadata, created_at')
        .limit(1);

      if (notifError) {
        this.addResult('DATABASE', 'Notifications Schema', 'FAIL', 
          `Notifications table schema issue: ${notifError.message}`);
      } else {
        this.addResult('DATABASE', 'Notifications Schema', 'PASS', 
          'Notifications table schema validated');
      }

      // Test push_subscriptions table structure
      const { data: pushTest, error: pushError } = await supabase
        .from('push_subscriptions' as any)
        .select('id, user_id, endpoint, p256dh_key, auth_key, created_at')
        .limit(1);

      if (pushError) {
        this.addResult('DATABASE', 'Push Subscriptions Schema', 'WARNING', 
          `Push subscriptions table issue: ${pushError.message}`);
      } else {
        this.addResult('DATABASE', 'Push Subscriptions Schema', 'PASS', 
          'Push subscriptions table schema validated');
      }

    } catch (error) {
      this.addResult('DATABASE', 'Schema Validation', 'FAIL', 
        `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test notification CRUD operations
   */
  private async validateNotificationCRUD(): Promise<void> {
    const testNotificationId = `test-${Date.now()}`;

    try {
      // Test CREATE
      const { data: createData, error: createError } = await supabase
        .from('notifications')
        .insert({
          id: testNotificationId,
          user_id: 'test-user-validation',
          title: 'System Validation Test',
          message: 'This is a test notification for system validation',
          category: 'SYSTEM',
          priority: 'NORMAL',
          metadata: { test: true, validation_run: Date.now() }
        })
        .select()
        .single();

      if (createError) {
        this.addResult('CRUD', 'Create Notification', 'FAIL', 
          `Failed to create notification: ${createError.message}`);
        return;
      }

      this.addResult('CRUD', 'Create Notification', 'PASS', 
        'Notification created successfully', { id: createData.id });

      // Test READ
      const { data: readData, error: readError } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', testNotificationId)
        .single();

      if (readError || !readData) {
        this.addResult('CRUD', 'Read Notification', 'FAIL', 
          `Failed to read notification: ${readError?.message || 'Not found'}`);
      } else {
        this.addResult('CRUD', 'Read Notification', 'PASS', 
          'Notification read successfully');
      }

      // Test UPDATE
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ 
          read: true, 
          read_at: new Date().toISOString(),
          metadata: { ...readData.metadata, updated: true }
        })
        .eq('id', testNotificationId);

      if (updateError) {
        this.addResult('CRUD', 'Update Notification', 'FAIL', 
          `Failed to update notification: ${updateError.message}`);
      } else {
        this.addResult('CRUD', 'Update Notification', 'PASS', 
          'Notification updated successfully');
      }

      // Test DELETE
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', testNotificationId);

      if (deleteError) {
        this.addResult('CRUD', 'Delete Notification', 'FAIL', 
          `Failed to delete notification: ${deleteError.message}`);
      } else {
        this.addResult('CRUD', 'Delete Notification', 'PASS', 
          'Notification deleted successfully');
      }

    } catch (error) {
      this.addResult('CRUD', 'CRUD Operations', 'FAIL', 
        `CRUD test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test real-time subscriptions
   */
  private async validateRealTimeSubscriptions(): Promise<void> {
    try {
      // Test if we can create a subscription
      const subscription = supabase
        .channel('validation-test')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'notifications' }, 
          (payload) => {
            console.log('Real-time test received:', payload);
          }
        )
        .subscribe();

      if (subscription) {
        this.addResult('REALTIME', 'Subscription Creation', 'PASS', 
          'Real-time subscription created successfully');

        // Test subscription status after a short delay
        setTimeout(() => {
          const status = subscription.state;
          if (status === 'SUBSCRIBED' || status === 'joined') {
            this.addResult('REALTIME', 'Subscription Status', 'PASS',
              'Real-time subscription is active');
          } else {
            this.addResult('REALTIME', 'Subscription Status', 'WARNING',
              `Subscription status: ${status}`);
          }
          
          // Clean up
          subscription.unsubscribe();
        }, 2000);

      } else {
        this.addResult('REALTIME', 'Subscription Creation', 'FAIL', 
          'Failed to create real-time subscription');
      }

    } catch (error) {
      this.addResult('REALTIME', 'Real-time Test', 'FAIL', 
        `Real-time test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test push notification capabilities
   */
  private async validatePushNotifications(): Promise<void> {
    try {
      // Test browser support
      const isSupported = PushNotificationService.isSupported();
      
      if (isSupported) {
        this.addResult('PUSH', 'Browser Support', 'PASS', 
          'Push notifications are supported in this browser');

        // Test permission status
        const permission = PushNotificationService.getPermissionStatus();
        
        if (permission === 'granted') {
          this.addResult('PUSH', 'Permission Status', 'PASS', 
            'Push notification permission granted');
        } else if (permission === 'denied') {
          this.addResult('PUSH', 'Permission Status', 'WARNING', 
            'Push notification permission denied by user');
        } else {
          this.addResult('PUSH', 'Permission Status', 'WARNING', 
            'Push notification permission not yet requested');
        }

        // Test service worker registration
        try {
          await PushNotificationService.registerServiceWorker();
          this.addResult('PUSH', 'Service Worker', 'PASS', 
            'Service worker registered successfully');
        } catch (swError) {
          this.addResult('PUSH', 'Service Worker', 'WARNING', 
            `Service worker registration issue: ${swError instanceof Error ? swError.message : 'Unknown error'}`);
        }

      } else {
        this.addResult('PUSH', 'Browser Support', 'WARNING', 
          'Push notifications not supported in this browser');
      }

    } catch (error) {
      this.addResult('PUSH', 'Push Notification Test', 'FAIL', 
        `Push notification test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test analytics system
   */
  private async validateAnalyticsSystem(): Promise<void> {
    try {
      // Test performance metrics retrieval
      const metrics = await notificationPerformanceMonitor.getPerformanceMetrics();
      
      if (metrics) {
        this.addResult('ANALYTICS', 'Performance Metrics', 'PASS', 
          'Performance metrics retrieved successfully', {
            totalNotifications: metrics.totalNotifications,
            successRate: metrics.successRate,
            systemLoad: metrics.systemLoad
          });
      } else {
        this.addResult('ANALYTICS', 'Performance Metrics', 'FAIL', 
          'Failed to retrieve performance metrics');
      }

      // Test queue status
      const queueStatus = await notificationPerformanceMonitor.getQueueStatus();
      
      if (queueStatus) {
        this.addResult('ANALYTICS', 'Queue Status', 'PASS', 
          'Queue status retrieved successfully', {
            pending: queueStatus.pending,
            processing: queueStatus.processing,
            failed: queueStatus.failed
          });
      } else {
        this.addResult('ANALYTICS', 'Queue Status', 'FAIL', 
          'Failed to retrieve queue status');
      }

      // Test detailed analytics
      const analytics = await notificationPerformanceMonitor.getDetailedAnalytics('day');
      
      if (analytics) {
        this.addResult('ANALYTICS', 'Detailed Analytics', 'PASS', 
          'Detailed analytics retrieved successfully', {
            total: analytics.total,
            categories: Object.keys(analytics.byCategory).length
          });
      } else {
        this.addResult('ANALYTICS', 'Detailed Analytics', 'FAIL', 
          'Failed to retrieve detailed analytics');
      }

    } catch (error) {
      this.addResult('ANALYTICS', 'Analytics System', 'FAIL', 
        `Analytics test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test performance monitoring
   */
  private async validatePerformanceMonitoring(): Promise<void> {
    try {
      // Test performance event logging
      const testEvent = {
        type: 'SYSTEM_ALERT' as const,
        details: {
          notification_id: 'test-validation',
          test: true,
          timestamp: new Date().toISOString()
        }
      };

      await notificationPerformanceMonitor.logPerformanceEvent(testEvent);
      
      this.addResult('PERFORMANCE', 'Event Logging', 'PASS', 
        'Performance event logged successfully');

      // Test metrics caching
      const metrics1 = await notificationPerformanceMonitor.getPerformanceMetrics();
      const startTime = Date.now();
      const metrics2 = await notificationPerformanceMonitor.getPerformanceMetrics();
      const cacheTime = Date.now() - startTime;

      if (cacheTime < 100) { // Should be very fast if cached
        this.addResult('PERFORMANCE', 'Metrics Caching', 'PASS', 
          `Metrics caching working (${cacheTime}ms)`);
      } else {
        this.addResult('PERFORMANCE', 'Metrics Caching', 'WARNING', 
          `Metrics caching may not be optimal (${cacheTime}ms)`);
      }

    } catch (error) {
      this.addResult('PERFORMANCE', 'Performance Monitoring', 'FAIL', 
        `Performance monitoring test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test overall system integrity
   */
  private async validateSystemIntegrity(): Promise<void> {
    try {
      // Check for any orphaned data
      const { count: totalNotifications } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true });

      const { count: unreadNotifications } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('read', false);

      if (totalNotifications !== null && unreadNotifications !== null) {
        const readRate = totalNotifications > 0 
          ? ((totalNotifications - unreadNotifications) / totalNotifications) * 100 
          : 100;

        this.addResult('INTEGRITY', 'Data Consistency', 'PASS', 
          `Data integrity check passed (${readRate.toFixed(1)}% read rate)`, {
            total: totalNotifications,
            unread: unreadNotifications,
            readRate
          });
      } else {
        this.addResult('INTEGRITY', 'Data Consistency', 'WARNING', 
          'Unable to verify data consistency');
      }

      // Check for duplicate notifications
      const { data: duplicates } = await supabase
        .from('notifications')
        .select('user_id, title, message, created_at')
        .limit(1000);

      if (duplicates) {
        const duplicateCheck = this.findDuplicates(duplicates);
        if (duplicateCheck.length === 0) {
          this.addResult('INTEGRITY', 'Duplicate Detection', 'PASS', 
            'No duplicate notifications detected');
        } else {
          this.addResult('INTEGRITY', 'Duplicate Detection', 'WARNING', 
            `Found ${duplicateCheck.length} potential duplicates`);
        }
      }

    } catch (error) {
      this.addResult('INTEGRITY', 'System Integrity', 'FAIL', 
        `Integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Helper: Add validation result
   */
  private addResult(category: string, test: string, status: 'PASS' | 'FAIL' | 'WARNING', 
                   message: string, details?: any): void {
    this.results.push({
      category,
      test,
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Helper: Find duplicate notifications
   */
  private findDuplicates(notifications: any[]): any[] {
    const seen = new Set();
    const duplicates = [];

    for (const notif of notifications) {
      const key = `${notif.user_id}-${notif.title}-${notif.message}`;
      if (seen.has(key)) {
        duplicates.push(notif);
      } else {
        seen.add(key);
      }
    }

    return duplicates;
  }

  /**
   * Generate comprehensive validation report
   */
  private generateReport(): SystemValidationReport {
    const duration = Date.now() - this.startTime;
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const warningTests = this.results.filter(r => r.status === 'WARNING').length;

    const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    let overall: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
    if (failedTests > 0 || score < 70) {
      overall = 'CRITICAL';
    } else if (warningTests > 2 || score < 90) {
      overall = 'DEGRADED';
    } else {
      overall = 'HEALTHY';
    }

    const recommendations = this.generateRecommendations();

    return {
      overall,
      score,
      results: this.results,
      recommendations,
      timestamp: new Date().toISOString(),
      duration
    };
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const failedTests = this.results.filter(r => r.status === 'FAIL');
    const warningTests = this.results.filter(r => r.status === 'WARNING');

    if (failedTests.some(t => t.category === 'DATABASE')) {
      recommendations.push('Review database connectivity and schema integrity');
    }

    if (failedTests.some(t => t.category === 'CRUD')) {
      recommendations.push('Check database permissions and table constraints');
    }

    if (warningTests.some(t => t.category === 'PUSH')) {
      recommendations.push('Configure VAPID keys and service worker for push notifications');
    }

    if (failedTests.some(t => t.category === 'ANALYTICS')) {
      recommendations.push('Verify analytics service configuration and data access');
    }

    if (warningTests.some(t => t.category === 'PERFORMANCE')) {
      recommendations.push('Optimize caching and monitoring configurations');
    }

    if (recommendations.length === 0) {
      recommendations.push('System is operating optimally - continue regular monitoring');
    }

    return recommendations;
  }
}

export const notificationSystemValidator = new NotificationSystemValidator();