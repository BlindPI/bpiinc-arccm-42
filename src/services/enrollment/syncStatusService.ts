import { supabase } from '@/integrations/supabase/client';
import {
  type EnrollmentSyncStatus,
  type EnrollmentSyncLog,
  type EnrollmentWithThinkific
} from '@/types/enrollment';

export interface SyncStatusUpdate {
  enrollmentId: string;
  status: EnrollmentSyncStatus;
  progress?: number;
  errorMessage?: string;
  thinkificData?: {
    studentId?: number;
    progress?: number;
    completionPercentage?: number;
    finalScore?: number;
    enrollmentStatus?: string;
  };
}

export interface SyncErrorDetails {
  enrollmentId: string;
  errorType: 'API_ERROR' | 'MAPPING_ERROR' | 'VALIDATION_ERROR' | 'NETWORK_ERROR';
  errorMessage: string;
  thinkificResponse?: any;
  attemptCount: number;
  lastAttempt: Date;
}

export interface SyncRetryConfig {
  maxRetries: number;
  retryDelay: number; // in milliseconds
  exponentialBackoff: boolean;
}

class SyncStatusService {
  private readonly defaultRetryConfig: SyncRetryConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true
  };

  /**
   * Update sync status for an enrollment
   */
  async updateSyncStatus(update: SyncStatusUpdate): Promise<void> {
    const { enrollmentId, status, progress, errorMessage, thinkificData } = update;

    try {
      // Update enrollment record
      const enrollmentUpdate: any = {
        sync_status: status,
        last_thinkific_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add Thinkific data if provided
      if (thinkificData) {
        if (thinkificData.studentId) enrollmentUpdate.thinkific_student_id = thinkificData.studentId;
        if (thinkificData.progress !== undefined) enrollmentUpdate.completion_percentage = thinkificData.progress;
        if (thinkificData.completionPercentage !== undefined) {
          enrollmentUpdate.completion_percentage = thinkificData.completionPercentage;
        }
        if (thinkificData.finalScore !== undefined) enrollmentUpdate.total_score = thinkificData.finalScore;
        if (thinkificData.enrollmentStatus) enrollmentUpdate.thinkific_enrollment_status = thinkificData.enrollmentStatus;
      }

      // Add error message if failed
      if (status === 'ERROR' || status === 'NOT_FOUND') {
        enrollmentUpdate.sync_error = errorMessage;
      } else {
        enrollmentUpdate.sync_error = null;
      }

      const { error: updateError } = await supabase
        .from('enrollments')
        .update(enrollmentUpdate)
        .eq('id', enrollmentId);

      if (updateError) {
        throw new Error(`Failed to update enrollment sync status: ${updateError.message}`);
      }

      // Log the sync event
      await this.logSyncEvent({
        enrollment_id: enrollmentId,
        sync_status: status === 'SYNCED' ? 'SUCCESS' : 'ERROR',
        sync_type: 'AUTOMATIC',
        error_message: status === 'ERROR' || status === 'NOT_FOUND' ? errorMessage : undefined,
        thinkific_data: thinkificData ? JSON.stringify(thinkificData) : undefined
      });

    } catch (error) {
      console.error('Error updating sync status:', error);
      throw error;
    }
  }

  /**
   * Log sync event for audit trail
   */
  async logSyncEvent(log: Omit<EnrollmentSyncLog, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('enrollment_sync_logs')
        .insert({
          enrollment_id: log.enrollment_id,
          sync_status: log.sync_status,
          sync_type: log.sync_type,
          error_message: log.error_message,
          thinkific_data: log.thinkific_data,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to log sync event:', error);
        // Don't throw here to prevent cascading failures
      }
    } catch (error) {
      console.error('Error logging sync event:', error);
    }
  }

  /**
   * Get sync status for multiple enrollments
   */
  async getSyncStatuses(enrollmentIds: string[]): Promise<Record<string, EnrollmentSyncStatus>> {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('id, sync_status')
        .in('id', enrollmentIds);

      if (error) {
        throw new Error(`Failed to get sync statuses: ${error.message}`);
      }

      return data.reduce((acc, item) => {
        acc[item.id] = item.sync_status || 'PENDING';
        return acc;
      }, {} as Record<string, EnrollmentSyncStatus>);
    } catch (error) {
      console.error('Error getting sync statuses:', error);
      return {};
    }
  }

  /**
   * Get failed enrollments that need retry
   */
  async getFailedEnrollments(): Promise<EnrollmentWithThinkific[]> {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          profiles (
            id, email, display_name
          ),
          course_offerings (
            id, name,
            courses (
              id, name, code
            )
          )
        `)
        .in('sync_status', ['ERROR', 'NOT_FOUND'])
        .order('last_thinkific_sync', { ascending: true });

      if (error) {
        throw new Error(`Failed to get failed enrollments: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting failed enrollments:', error);
      return [];
    }
  }

  /**
   * Reset sync status for retry
   */
  async resetSyncStatus(enrollmentIds: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('enrollments')
        .update({
          sync_status: 'PENDING',
          sync_error: null,
          updated_at: new Date().toISOString()
        })
        .in('id', enrollmentIds);

      if (error) {
        throw new Error(`Failed to reset sync status: ${error.message}`);
      }

      // Log reset events
      for (const enrollmentId of enrollmentIds) {
        await this.logSyncEvent({
          enrollment_id: enrollmentId,
          sync_status: 'SUCCESS',
          sync_type: 'MANUAL',
          error_message: undefined
        });
      }
    } catch (error) {
      console.error('Error resetting sync status:', error);
      throw error;
    }
  }

  /**
   * Get sync logs for an enrollment
   */
  async getSyncLogs(enrollmentId: string, limit: number = 50): Promise<EnrollmentSyncLog[]> {
    try {
      const { data, error } = await supabase
        .from('enrollment_sync_logs')
        .select('*')
        .eq('enrollment_id', enrollmentId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to get sync logs: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting sync logs:', error);
      return [];
    }
  }

  /**
   * Handle sync errors with retry logic
   */
  async handleSyncError(
    enrollmentId: string, 
    error: Error, 
    retryConfig: Partial<SyncRetryConfig> = {}
  ): Promise<boolean> {
    const config = { ...this.defaultRetryConfig, ...retryConfig };
    
    try {
      // Get current retry count
      const { data: logs } = await supabase
        .from('enrollment_sync_logs')
        .select('*')
        .eq('enrollment_id', enrollmentId)
        .eq('sync_status', 'ERROR')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('created_at', { ascending: false });

      const recentFailures = logs?.length || 0;

      if (recentFailures >= config.maxRetries) {
        // Mark as ERROR (no more retries)
        await this.updateSyncStatus({
          enrollmentId,
          status: 'ERROR',
          errorMessage: `Max retries exceeded: ${error.message}`
        });
        return false;
      }

      // Mark as ERROR (will be retried)
      await this.updateSyncStatus({
        enrollmentId,
        status: 'ERROR',
        errorMessage: error.message
      });

      return true;
    } catch (logError) {
      console.error('Error handling sync error:', logError);
      return false;
    }
  }

  /**
   * Get sync health metrics
   */
  async getSyncHealthMetrics(): Promise<{
    totalEnrollments: number;
    syncedCount: number;
    pendingCount: number;
    failedCount: number;
    errorCount: number;
    syncedPercentage: number;
    lastSyncDate?: string;
    syncHealth: 'healthy' | 'warning' | 'critical';
  }> {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('sync_status, last_thinkific_sync')
        .not('sync_status', 'is', null);

      if (error) {
        throw new Error(`Failed to get sync health metrics: ${error.message}`);
      }

      const enrollments = data || [];
      const totalEnrollments = enrollments.length;
      
      const syncedCount = enrollments.filter(e => e.sync_status === 'SYNCED').length;
      const pendingCount = enrollments.filter(e => e.sync_status === 'PENDING').length;
      const errorCount = enrollments.filter(e => e.sync_status === 'ERROR').length;
      const notFoundCount = enrollments.filter(e => e.sync_status === 'NOT_FOUND').length;
      const reviewCount = enrollments.filter(e => e.sync_status === 'MANUAL_REVIEW').length;
      
      const syncedPercentage = totalEnrollments > 0 ? (syncedCount / totalEnrollments) * 100 : 0;
      
      // Get most recent sync date
      const lastSyncDate = enrollments
        .map(e => e.last_thinkific_sync)
        .filter(Boolean)
        .sort()
        .pop();

      // Determine sync health
      let syncHealth: 'healthy' | 'warning' | 'critical';
      if (syncedPercentage >= 90) {
        syncHealth = 'healthy';
      } else if (syncedPercentage >= 70) {
        syncHealth = 'warning';
      } else {
        syncHealth = 'critical';
      }

      return {
        totalEnrollments,
        syncedCount,
        pendingCount,
        failedCount: errorCount,
        errorCount: notFoundCount + reviewCount,
        syncedPercentage,
        lastSyncDate,
        syncHealth
      };
    } catch (error) {
      console.error('Error getting sync health metrics:', error);
      return {
        totalEnrollments: 0,
        syncedCount: 0,
        pendingCount: 0,
        failedCount: 0,
        errorCount: 0,
        syncedPercentage: 0,
        syncHealth: 'critical'
      };
    }
  }
}

export const syncStatusService = new SyncStatusService();
export default syncStatusService;