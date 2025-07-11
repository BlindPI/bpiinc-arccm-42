/**
 * Score Synchronization Service
 * 
 * This service handles the synchronization of score data between Thinkific LMS
 * and our certificate request database. It provides methods for:
 * - Importing scores from Thinkific
 * - Updating certificate request records
 * - Real-time validation and status calculation
 * - Batch processing for roster uploads
 * - Error handling and retry logic
 */

// Note: Import supabase client from your existing app configuration
// import { createClient } from '@supabase/supabase-js';
import {
  thinkificApiService,
  type ThinkificCourse,
  type ThinkificEnrollment,
  type ThinkificAssessmentResult
} from '../../thinkific/thinkificApiService';
import { 
  CertificateRequest, 
  EnhancedCertificateRequest,
  determinePassFailStatus,
  calculateWeightedScore 
} from '@/types/supabase-schema';

export interface ScoreSyncConfig {
  thinkificService?: typeof thinkificApiService;
  supabaseUrl: string;
  supabaseKey: string;
  defaultPassThreshold?: number;
  defaultPracticalWeight?: number;
  defaultWrittenWeight?: number;
}

export interface ScoreSyncResult {
  certificateRequestId: string;
  email: string;
  success: boolean;
  error?: string;
  syncedData?: {
    practical_score?: number;
    written_score?: number;
    total_score?: number;
    completion_date?: string;
    online_completion_date?: string;
    calculated_status?: string;
  };
}

export interface BatchSyncResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  results: ScoreSyncResult[];
  errors: string[];
}

export interface ScoreMappingConfig {
  // Configuration for how to map Thinkific scores to our system
  practicalAssignmentIds?: string[];  // Assignment IDs that count as practical scores
  writtenQuizIds?: string[];          // Quiz IDs that count as written scores
  combinedScoreMethod?: 'average' | 'weighted' | 'highest';
  includeAllQuizzes?: boolean;        // Include all quizzes in written score calculation
  includeAllAssignments?: boolean;    // Include all assignments in practical score calculation
}

/**
 * Service for synchronizing scores from Thinkific to certificate requests
 */
export class ScoreSyncService {
  private thinkific: typeof thinkificApiService;
  private supabase: any;
  private config: Required<Omit<ScoreSyncConfig, 'thinkificService' | 'supabaseUrl' | 'supabaseKey'>>;

  constructor(config: ScoreSyncConfig) {
    this.thinkific = config.thinkificService || thinkificApiService;
    // Note: In a real implementation, you would use createClient(config.supabaseUrl, config.supabaseKey)
    // For now, we'll assume the supabase client is passed or available from app context
    this.supabase = null; // TODO: Initialize with actual supabase client
    this.config = {
      defaultPassThreshold: config.defaultPassThreshold || 80,
      defaultPracticalWeight: config.defaultPracticalWeight || 0.5,
      defaultWrittenWeight: config.defaultWrittenWeight || 0.5
    };
  }

  /**
   * Sync scores for a single certificate request
   */
  async syncScoresForRequest(
    certificateRequestId: string,
    thinkificCourseId: string,
    mappingConfig?: ScoreMappingConfig
  ): Promise<ScoreSyncResult> {
    try {
      // Get the certificate request
      const { data: certRequest, error: fetchError } = await this.supabase
        .from('certificate_requests')
        .select('*')
        .eq('id', certificateRequestId)
        .single();

      if (fetchError || !certRequest) {
        return {
          certificateRequestId,
          email: 'unknown',
          success: false,
          error: `Certificate request not found: ${fetchError?.message || 'Not found'}`
        };
      }

      // Get user email for Thinkific lookup
      const userEmail = certRequest.email || certRequest.recipient_email;
      if (!userEmail) {
        return {
          certificateRequestId,
          email: 'no-email',
          success: false,
          error: 'No email address found for certificate request'
        };
      }

      // Fetch comprehensive course data from Thinkific
      const thinkificData = await this.thinkific.getStudentCertificateData(
        userEmail,
        thinkificCourseId
      );

      if (!thinkificData || !thinkificData.enrollment) {
        return {
          certificateRequestId,
          email: userEmail,
          success: false,
          error: 'No enrollment found in Thinkific for this user and course'
        };
      }

      // Get detailed score breakdown if mapping config is provided
      let practicalScore: number | undefined;
      let writtenScore: number | undefined;
      let totalScore: number | undefined;

      if (mappingConfig) {
        const detailedScores = await this.getDetailedScores(
          userEmail,
          thinkificCourseId,
          mappingConfig
        );
        practicalScore = detailedScores.practicalScore;
        writtenScore = detailedScores.writtenScore;
        totalScore = detailedScores.totalScore;
      } else {
        // Use the overall course score from Thinkific
        totalScore = thinkificData.overallScore?.total;
      }

      // Calculate status using our business logic
      const passThreshold = certRequest.pass_threshold || this.config.defaultPassThreshold;
      const calculatedStatus = determinePassFailStatus(
        practicalScore,
        writtenScore,
        passThreshold,
        certRequest.requires_both_scores || true
      );

      // Prepare update data
      const updateData: Partial<CertificateRequest> = {
        practical_score: practicalScore,
        written_score: writtenScore,
        total_score: totalScore,
        completion_date: thinkificData.enrollment.completed_at,
        online_completion_date: thinkificData.enrollment.completed_at,
        calculated_status: calculatedStatus,
        thinkific_course_id: thinkificCourseId,
        thinkific_enrollment_id: thinkificData.enrollment.id,
        last_score_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Update the certificate request
      const { error: updateError } = await this.supabase
        .from('certificate_requests')
        .update(updateData)
        .eq('id', certificateRequestId);

      if (updateError) {
        return {
          certificateRequestId,
          email: userEmail,
          success: false,
          error: `Failed to update certificate request: ${updateError.message}`
        };
      }

      return {
        certificateRequestId,
        email: userEmail,
        success: true,
        syncedData: {
          practical_score: practicalScore,
          written_score: writtenScore,
          total_score: totalScore,
          completion_date: thinkificData.enrollment.completed_at,
          online_completion_date: thinkificData.enrollment.completed_at,
          calculated_status: calculatedStatus
        }
      };

    } catch (error) {
      console.error('Error syncing scores for request:', error);
      return {
        certificateRequestId,
        email: 'unknown',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Batch sync scores for multiple certificate requests
   */
  async batchSyncScores(
    certificateRequestIds: string[],
    thinkificCourseId: string,
    mappingConfig?: ScoreMappingConfig,
    onProgress?: (completed: number, total: number) => void
  ): Promise<BatchSyncResult> {
    const results: ScoreSyncResult[] = [];
    const errors: string[] = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < certificateRequestIds.length; i++) {
      const requestId = certificateRequestIds[i];
      
      try {
        const result = await this.syncScoresForRequest(
          requestId,
          thinkificCourseId,
          mappingConfig
        );
        
        results.push(result);
        
        if (result.success) {
          successful++;
        } else {
          failed++;
          if (result.error) {
            errors.push(`${result.email}: ${result.error}`);
          }
        }
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Request ${requestId}: ${errorMessage}`);
        results.push({
          certificateRequestId: requestId,
          email: 'unknown',
          success: false,
          error: errorMessage
        });
      }

      if (onProgress) {
        onProgress(i + 1, certificateRequestIds.length);
      }

      // Small delay to avoid overwhelming the APIs
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      totalProcessed: certificateRequestIds.length,
      successful,
      failed,
      results,
      errors
    };
  }

  /**
   * Get detailed score breakdown from Thinkific
   */
  private async getDetailedScores(
    userEmail: string,
    courseId: string,
    config: ScoreMappingConfig
  ): Promise<{
    practicalScore?: number;
    writtenScore?: number;
    totalScore?: number;
  }> {
    try {
      // Get enrollment to find user ID
      const enrollments = await this.thinkific.getEnrollments({
        userEmail,
        courseId,
        limit: 1
      });

      if (enrollments.length === 0) {
        return {};
      }

      const enrollment = enrollments[0];

      // Get assessment results
      const assessmentResults = await this.thinkific.getUserAssessmentResults(enrollment.user_id, {
        courseId
      });

      // Get course assessments for mapping
      const assessments = await this.thinkific.getCourseAssessments(courseId);

      let practicalScore: number | undefined;
      let writtenScore: number | undefined;

      // Calculate practical score from assignments/exams
      const practicalAssessments = assessments.filter(a =>
        a.assessment_type === 'assignment' || a.assessment_type === 'exam'
      );
      
      if (config.practicalAssignmentIds?.length) {
        const filteredPractical = practicalAssessments.filter(a =>
          config.practicalAssignmentIds!.includes(a.id)
        );
        const practicalResults = assessmentResults.filter(r =>
          filteredPractical.some(a => a.id === r.assessment_id)
        );
        
        if (practicalResults.length > 0) {
          practicalScore = this.calculateAverageScore(
            practicalResults.map(r => ({
              score: r.percentage,
              maxScore: 100
            }))
          );
        }
      } else if (config.includeAllAssignments) {
        const practicalResults = assessmentResults.filter(r =>
          practicalAssessments.some(a => a.id === r.assessment_id)
        );
        
        if (practicalResults.length > 0) {
          practicalScore = this.calculateAverageScore(
            practicalResults.map(r => ({
              score: r.percentage,
              maxScore: 100
            }))
          );
        }
      }

      // Calculate written score from quizzes
      const writtenAssessments = assessments.filter(a => a.assessment_type === 'quiz');
      
      if (config.writtenQuizIds?.length) {
        const filteredWritten = writtenAssessments.filter(a =>
          config.writtenQuizIds!.includes(a.id)
        );
        const writtenResults = assessmentResults.filter(r =>
          filteredWritten.some(a => a.id === r.assessment_id)
        );
        
        if (writtenResults.length > 0) {
          writtenScore = this.calculateAverageScore(
            writtenResults.map(r => ({
              score: r.percentage,
              maxScore: 100
            }))
          );
        }
      } else if (config.includeAllQuizzes) {
        const writtenResults = assessmentResults.filter(r =>
          writtenAssessments.some(a => a.id === r.assessment_id)
        );
        
        if (writtenResults.length > 0) {
          writtenScore = this.calculateAverageScore(
            writtenResults.map(r => ({
              score: r.percentage,
              maxScore: 100
            }))
          );
        }
      }

      // Calculate total score
      let totalScore: number | undefined;
      if (practicalScore !== undefined && writtenScore !== undefined) {
        totalScore = calculateWeightedScore(
          practicalScore,
          writtenScore,
          this.config.defaultPracticalWeight
        );
      } else if (practicalScore !== undefined) {
        totalScore = practicalScore;
      } else if (writtenScore !== undefined) {
        totalScore = writtenScore;
      }

      return {
        practicalScore,
        writtenScore,
        totalScore
      };

    } catch (error) {
      console.error('Error getting detailed scores:', error);
      return {};
    }
  }

  /**
   * Calculate average score from multiple assessments
   */
  private calculateAverageScore(scores: { score: number; maxScore: number }[]): number {
    if (scores.length === 0) return 0;
    
    const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
    const totalMaxScore = scores.reduce((sum, s) => sum + s.maxScore, 0);
    
    return totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
  }

  /**
   * Sync scores for all certificate requests in a batch/roster
   */
  async syncScoresForBatch(
    batchId: string,
    thinkificCourseId: string,
    mappingConfig?: ScoreMappingConfig,
    onProgress?: (completed: number, total: number) => void
  ): Promise<BatchSyncResult> {
    try {
      // Get all certificate requests for the batch
      const { data: requests, error } = await this.supabase
        .from('certificate_requests')
        .select('id')
        .eq('batch_id', batchId);

      if (error) {
        throw new Error(`Failed to fetch certificate requests for batch: ${error.message}`);
      }

      if (!requests || requests.length === 0) {
        return {
          totalProcessed: 0,
          successful: 0,
          failed: 0,
          results: [],
          errors: ['No certificate requests found for this batch']
        };
      }

      const requestIds = requests.map(r => r.id);
      return await this.batchSyncScores(
        requestIds,
        thinkificCourseId,
        mappingConfig,
        onProgress
      );

    } catch (error) {
      return {
        totalProcessed: 0,
        successful: 0,
        failed: 1,
        results: [],
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  /**
   * Test connection to both Thinkific and Supabase
   */
  async testConnections(): Promise<{
    thinkific: boolean;
    supabase: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let thinkificOk = false;
    let supabaseOk = false;

    // Test Thinkific connection
    try {
      const connectionTest = await this.thinkific.testConnection();
      thinkificOk = connectionTest.success;
      if (!thinkificOk) {
        errors.push(`Thinkific authentication failed: ${connectionTest.message}`);
      }
    } catch (error) {
      errors.push(`Thinkific error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test Supabase connection
    try {
      const { error } = await this.supabase
        .from('certificate_requests')
        .select('id')
        .limit(1);
      
      if (error) {
        errors.push(`Supabase error: ${error.message}`);
      } else {
        supabaseOk = true;
      }
    } catch (error) {
      errors.push(`Supabase connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      thinkific: thinkificOk,
      supabase: supabaseOk,
      errors
    };
  }
}

/**
 * Factory function to create a configured score sync service
 */
export function createScoreSyncService(config: ScoreSyncConfig): ScoreSyncService {
  return new ScoreSyncService(config);
}