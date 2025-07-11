import { supabase } from '@/integrations/supabase/client';
import type { 
  Enrollment, 
  ThinkificSyncResult, 
  ThinkificCourseMapping, 
  ThinkificSyncStatus,
  EnrollmentWithThinkific 
} from '@/types/enrollment';

export interface ThinkificAPIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface SyncOptions {
  forceSync?: boolean;
  courseMapping?: ThinkificCourseMapping[];
  batchSize?: number;
}

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
}

export class ThinkificSyncService {
  /**
   * Sync a single enrollment with Thinkific data
   */
  static async syncEnrollment(
    enrollmentId: string,
    options: SyncOptions = {}
  ): Promise<ThinkificSyncResult> {
    console.log('🔄 SYNC ENROLLMENT STARTING');
    console.log('Enrollment ID:', enrollmentId);
    console.log('Options:', options);
    
    try {
      console.log('📋 Fetching enrollment data from database...');
      // Get enrollment with user and course data
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          *,
          profiles!inner(email, display_name),
          course_offerings!inner(
            thinkific_course_id,
            courses!inner(name)
          )
        `)
        .eq('id', enrollmentId)
        .single();

      if (enrollmentError || !enrollment) {
        throw new Error(`Enrollment not found: ${enrollmentError?.message}`);
      }

      const userEmail = enrollment.profiles?.email;
      const thinkificCourseId = enrollment.course_offerings?.thinkific_course_id;

      if (!userEmail) {
        throw new Error('User email not found for enrollment');
      }

      if (!thinkificCourseId) {
        // Try to find mapping in course mappings
        const mapping = options.courseMapping?.find(m => 
          m.localCourseId === enrollment.course_offerings?.courses?.id
        );
        
        if (!mapping) {
          throw new Error('No Thinkific course mapping found');
        }
      }

      const courseId = thinkificCourseId || options.courseMapping?.find(m => 
        m.localCourseId === enrollment.course_offerings?.courses?.id
      )?.thinkificCourseId;

      if (!courseId) {
        throw new Error('Unable to determine Thinkific course ID');
      }

      // Call Thinkific API via edge function
      const response = await this.callThinkificAPI({
        action: 'getStudentData',
        email: userEmail,
        courseId: courseId
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch Thinkific data');
      }

      const thinkificData = response.data;
      
      // Update enrollment with Thinkific data
      const updateData: Partial<Enrollment> = {
        thinkific_enrollment_id: thinkificData.enrollment?.id?.toString(),
        thinkific_course_id: courseId,
        completion_percentage: thinkificData.enrollment?.percentage_completed || 0,
        thinkific_completed_at: thinkificData.enrollment?.completed_at,
        practical_score: thinkificData.overallScore?.practical,
        written_score: thinkificData.overallScore?.written,
        total_score: thinkificData.overallScore?.total,
        last_thinkific_sync: new Date().toISOString(),
        sync_status: 'SYNCED' as ThinkificSyncStatus,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('enrollments')
        .update(updateData)
        .eq('id', enrollmentId);

      if (updateError) {
        throw new Error(`Failed to update enrollment: ${updateError.message}`);
      }

      // Log sync operation
      await this.logSyncOperation({
        enrollment_id: enrollmentId,
        operation_type: 'INDIVIDUAL_SYNC',
        status: 'SUCCESS',
        thinkific_course_id: courseId,
        details: {
          progress: thinkificData.enrollment?.percentage_completed,
          scores: thinkificData.overallScore,
          assessments_count: thinkificData.assessments?.length || 0
        }
      });

      return {
        success: true,
        enrollment_id: enrollmentId,
        thinkific_data: {
          enrollment: thinkificData.enrollment,
          assessments: thinkificData.assessments || [],
          assessment_results: thinkificData.assessmentResults || [],
          overall_score: thinkificData.overallScore
        },
        sync_duration_ms: 0
      };

    } catch (error) {
      console.error('Error syncing enrollment:', error);

      // Update sync status to failed
      await supabase
        .from('enrollments')
        .update({
          sync_status: 'ERROR' as ThinkificSyncStatus,
          last_thinkific_sync: new Date().toISOString()
        })
        .eq('id', enrollmentId);

      // Log failed sync operation
      await this.logSyncOperation({
        enrollment_id: enrollmentId,
        operation_type: 'INDIVIDUAL_SYNC',
        status: 'FAILED',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        enrollment_id: enrollmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
        sync_duration_ms: 0
      };
    }
  }

  /**
   * Sync multiple enrollments with Thinkific data
   */
  static async syncEnrollments(
    enrollmentIds: string[],
    options: SyncOptions = {},
    onProgress?: (progress: SyncProgress) => void
  ): Promise<ThinkificSyncResult[]> {
    console.log('🔄 BATCH SYNC STARTING');
    console.log('Enrollment IDs:', enrollmentIds);
    console.log('Options:', options);
    console.log('Number of enrollments to sync:', enrollmentIds.length);
    
    const batchSize = options.batchSize || 5;
    const results: ThinkificSyncResult[] = [];
    let completed = 0;
    let failed = 0;

    // Process in batches to avoid rate limiting
    for (let i = 0; i < enrollmentIds.length; i += batchSize) {
      const batch = enrollmentIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (enrollmentId) => {
        const result = await this.syncEnrollment(enrollmentId, options);
        
        if (result.success) {
          completed++;
        } else {
          failed++;
        }

        // Report progress
        onProgress?.({
          total: enrollmentIds.length,
          completed: completed,
          failed: failed,
          current: enrollmentId
        });

        return result;
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to respect API limits
      if (i + batchSize < enrollmentIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Sync all enrollments for a specific course offering
   */
  static async syncCourseEnrollments(
    courseOfferingId: string,
    options: SyncOptions = {},
    onProgress?: (progress: SyncProgress) => void
  ): Promise<ThinkificSyncResult[]> {
    try {
      // Get all enrollments for the course offering
      const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select('id')
        .eq('course_offering_id', courseOfferingId)
        .eq('status', 'ENROLLED'); // Only sync active enrollments

      if (error) {
        throw new Error(`Failed to fetch enrollments: ${error.message}`);
      }

      if (!enrollments || enrollments.length === 0) {
        return [];
      }

      const enrollmentIds = enrollments.map(e => e.id);
      return this.syncEnrollments(enrollmentIds, options, onProgress);

    } catch (error) {
      console.error('Error syncing course enrollments:', error);
      return [];
    }
  }

  /**
   * Get course mappings between local and Thinkific courses
   */
  static async getCourseMappings(): Promise<ThinkificCourseMapping[]> {
    try {
      const { data: mappings, error } = await supabase
        .from('course_thinkific_mappings')
        .select(`
          *,
          course_offerings!inner(
            id, start_date, end_date,
            courses!inner(name)
          )
        `)
        .eq('is_active', true);

      if (error) {
        throw new Error(`Failed to fetch course mappings: ${error.message}`);
      }

      return mappings?.map(mapping => ({
        id: mapping.id,
        localCourseId: mapping.course_offering_id,
        thinkificCourseId: mapping.thinkific_course_id,
        courseName: mapping.course_offerings?.courses?.name || 'Unknown Course',
        thinkificCourseName: mapping.thinkific_course_name,
        isActive: mapping.is_active,
        createdAt: mapping.created_at,
        courseOfferings: [mapping.course_offerings] || []
      })) || [];

    } catch (error) {
      console.error('Error fetching course mappings:', error);
      return [];
    }
  }

  /**
   * Create or update course mapping
   */
  static async updateCourseMapping(mapping: Partial<ThinkificCourseMapping>): Promise<void> {
    try {
      const { error } = await supabase
        .from('course_thinkific_mappings')
        .upsert({
          course_offering_id: mapping.localCourseId,
          thinkific_course_id: mapping.thinkificCourseId,
          thinkific_course_name: mapping.thinkificCourseName,
          is_active: mapping.isActive ?? true,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(`Failed to update course mapping: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating course mapping:', error);
      throw error;
    }
  }

  /**
   * Get enrollments with Thinkific sync status
   */
  static async getEnrollmentsWithSyncStatus(filters: {
    courseOfferingId?: string;
    syncStatus?: ThinkificSyncStatus;
    limit?: number;
  } = {}): Promise<EnrollmentWithThinkific[]> {
    try {
      let query = supabase
        .from('enrollments')
        .select(`
          *,
          profiles!inner(display_name, email),
          course_offerings!inner(
            start_date,
            end_date,
            thinkific_course_id,
            courses!inner(name)
          )
        `)
        .order('last_thinkific_sync', { ascending: false });

      if (filters.courseOfferingId) {
        query = query.eq('course_offering_id', filters.courseOfferingId);
      }

      if (filters.syncStatus) {
        query = query.eq('sync_status', filters.syncStatus);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data: enrollments, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch enrollments: ${error.message}`);
      }

      return enrollments?.map(enrollment => ({
        ...enrollment,
        thinkific: {
          enrollmentId: enrollment.thinkific_enrollment_id,
          courseId: enrollment.thinkific_course_id,
          progressPercentage: enrollment.completion_percentage,
          completionDate: enrollment.thinkific_completion_date,
          practicalScore: enrollment.practical_score,
          writtenScore: enrollment.written_score,
          overallScore: enrollment.total_score,
          passed: enrollment.thinkific_passed,
          lastSync: enrollment.last_thinkific_sync,
          syncStatus: enrollment.sync_status
        }
      })) || [];

    } catch (error) {
      console.error('Error fetching enrollments with sync status:', error);
      return [];
    }
  }

  /**
   * Call Thinkific API via edge function
   */
  private static async callThinkificAPI(request: any): Promise<ThinkificAPIResponse> {
    console.log('🚀 THINKIFIC API CALL STARTING');
    console.log('Request:', request);
    
    try {
      console.log('📡 Invoking edge function: thinkific-api');
      const { data, error } = await supabase.functions.invoke('thinkific-api', {
        body: request
      });

      console.log('📥 Edge function response:');
      console.log('Data:', data);
      console.log('Error:', error);

      if (error) {
        console.error('❌ Edge function returned error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Edge function call successful');
      return data;
    } catch (error) {
      console.error('💥 Error calling Thinkific API:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        cause: error instanceof Error ? error.cause : undefined
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Log sync operation for audit trail
   */
  private static async logSyncOperation(logData: {
    enrollment_id: string;
    operation_type: 'INDIVIDUAL_SYNC' | 'BATCH_SYNC' | 'COURSE_SYNC';
    status: 'SUCCESS' | 'FAILED';
    thinkific_course_id?: string;
    error_message?: string;
    details?: any;
  }): Promise<void> {
    try {
      await supabase
        .from('enrollment_sync_logs')
        .insert({
          enrollment_id: logData.enrollment_id,
          sync_type: logData.operation_type === 'INDIVIDUAL_SYNC' ? 'MANUAL' :
                    logData.operation_type === 'BATCH_SYNC' ? 'BULK' : 'AUTOMATIC',
          sync_status: logData.status,
          thinkific_data: logData.details || null,
          error_message: logData.error_message || null,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging sync operation:', error);
      // Don't throw here as this is just logging
    }
  }

  /**
   * Get sync statistics for dashboard
   */
  static async getSyncStatistics(): Promise<{
    totalEnrollments: number;
    syncedEnrollments: number;
    failedSyncs: number;
    pendingSyncs: number;
    lastSyncDate?: string;
  }> {
    try {
      const { data: stats, error } = await supabase
        .from('enrollments')
        .select('sync_status, last_thinkific_sync');

      if (error) {
        throw new Error(`Failed to fetch sync statistics: ${error.message}`);
      }

      const totalEnrollments = stats?.length || 0;
      const syncedEnrollments = stats?.filter(s => s.sync_status === 'SYNCED').length || 0;
      const failedSyncs = stats?.filter(s => s.sync_status === 'ERROR').length || 0;
      const pendingSyncs = stats?.filter(s => s.sync_status === 'PENDING').length || 0;
      
      const lastSyncDate = stats
        ?.filter(s => s.last_thinkific_sync)
        ?.sort((a, b) => new Date(b.last_thinkific_sync).getTime() - new Date(a.last_thinkific_sync).getTime())
        ?.[0]?.last_thinkific_sync;

      return {
        totalEnrollments,
        syncedEnrollments,
        failedSyncs,
        pendingSyncs,
        lastSyncDate
      };

    } catch (error) {
      console.error('Error fetching sync statistics:', error);
      return {
        totalEnrollments: 0,
        syncedEnrollments: 0,
        failedSyncs: 0,
        pendingSyncs: 0
      };
    }
  }
}