/**
 * Thinkific API Service
 * 
 * Main service for interacting with Thinkific LMS API through Supabase Edge Functions.
 * This service provides a secure way to access Thinkific data without exposing API keys
 * in the client-side code.
 */

import { supabase } from '@/integrations/supabase/client';

export interface ThinkificEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  started_at: string | null;
  completed_at: string | null;
  completion_percentage: number;
  status: 'enrolled' | 'active' | 'completed' | 'expired';
  certificate_url?: string;
}

export interface ThinkificAssessment {
  id: string;
  name: string;
  course_id: string;
  lesson_id: string;
  assessment_type: 'quiz' | 'assignment' | 'exam';
  max_score: number;
  passing_score: number;
  weight_percentage?: number;
}

export interface ThinkificAssessmentResult {
  id: string;
  assessment_id: string;
  user_id: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  completed_at: string;
  attempt_number: number;
  answers?: ThinkificAssessmentAnswer[];
}

export interface ThinkificAssessmentAnswer {
  question_id: string;
  question_text: string;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  points_earned: number;
  points_possible: number;
}

export interface ThinkificCourse {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  course_card_image_url?: string;
  slug: string;
}

export interface EnrollmentSearchParams {
  userEmail?: string;
  courseId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  page?: number;
}

export interface AssessmentSearchParams {
  courseId?: string;
  userId?: string;
  assessmentId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  passed?: boolean;
  limit?: number;
  page?: number;
}

export interface BatchSyncResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: Array<{
    userEmail: string;
    courseId: string;
    error: string;
  }>;
  enrollments: ThinkificEnrollment[];
  assessmentResults: ThinkificAssessmentResult[];
}

class ThinkificApiService {
  /**
   * Call Supabase Edge Function for Thinkific API operations
   */
  private async callEdgeFunction(action: string, payload: any = {}): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('thinkific-api', {
        body: { action, ...payload }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Edge function error: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Unknown error from Thinkific API');
      }

      return data.data;
    } catch (error) {
      console.error(`Thinkific API call failed for action ${action}:`, error);
      throw error;
    }
  }

  /**
   * Test API connection through Edge Function
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      // Test with a simple course query
      await this.callEdgeFunction('getAssessments', { courseId: '1' });
      return {
        success: true,
        message: 'Connection successful'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  /**
   * Get enrollments for specific parameters
   */
  async getEnrollments(params: EnrollmentSearchParams = {}): Promise<ThinkificEnrollment[]> {
    try {
      return await this.callEdgeFunction('getEnrollments', params);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      return [];
    }
  }

  /**
   * Get specific enrollment by ID
   */
  async getEnrollment(enrollmentId: string): Promise<ThinkificEnrollment | null> {
    try {
      return await this.callEdgeFunction('getEnrollment', { enrollmentId });
    } catch (error) {
      console.error(`Failed to get enrollment ${enrollmentId}:`, error);
      return null;
    }
  }

  /**
   * Get course information
   */
  async getCourse(courseId: string): Promise<ThinkificCourse | null> {
    try {
      return await this.callEdgeFunction('getCourse', { courseId });
    } catch (error) {
      console.error(`Failed to get course ${courseId}:`, error);
      return null;
    }
  }

  /**
   * Get assessments for a course
   */
  async getCourseAssessments(courseId: string): Promise<ThinkificAssessment[]> {
    try {
      return await this.callEdgeFunction('getAssessments', { courseId });
    } catch (error) {
      console.error(`Failed to get assessments for course ${courseId}:`, error);
      return [];
    }
  }

  /**
   * Get assessment results for a user
   */
  async getUserAssessmentResults(
    userId: string,
    params: AssessmentSearchParams = {}
  ): Promise<ThinkificAssessmentResult[]> {
    try {
      return await this.callEdgeFunction('getAssessmentResults', { 
        userId,
        ...params
      });
    } catch (error) {
      console.error(`Failed to get assessment results for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get detailed assessment result with answers
   */
  async getAssessmentResultDetails(resultId: string): Promise<ThinkificAssessmentResult | null> {
    try {
      return await this.callEdgeFunction('getAssessmentResultDetails', { resultId });
    } catch (error) {
      console.error(`Failed to get assessment result details ${resultId}:`, error);
      return null;
    }
  }

  /**
   * Get comprehensive student data for certificate processing
   */
  async getStudentCertificateData(
    userEmail: string,
    courseId: string
  ): Promise<{
    enrollment: ThinkificEnrollment | null;
    assessments: ThinkificAssessment[];
    assessmentResults: ThinkificAssessmentResult[];
    course: ThinkificCourse | null;
    overallScore?: {
      practical: number;
      written: number;
      total: number;
      passed: boolean;
    };
  }> {
    try {
      return await this.callEdgeFunction('getStudentData', { 
        email: userEmail, 
        courseId 
      });
    } catch (error) {
      console.error(`Failed to get student certificate data for ${userEmail}:`, error);
      throw error;
    }
  }

  /**
   * Batch sync scores for multiple certificate requests
   */
  async batchSyncScores(
    certificateRequests: Array<{
      userEmail: string;
      courseId: string;
      certificateRequestId: string;
    }>,
    onProgress?: (processed: number, total: number) => void
  ): Promise<BatchSyncResult> {
    const result: BatchSyncResult = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      errors: [],
      enrollments: [],
      assessmentResults: []
    };

    // Process in batches to avoid overwhelming the Edge Function
    const batchSize = 5;
    
    for (let i = 0; i < certificateRequests.length; i += batchSize) {
      const batch = certificateRequests.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (request) => {
        try {
          const studentData = await this.getStudentCertificateData(
            request.userEmail, 
            request.courseId
          );

          if (studentData.enrollment) {
            result.enrollments.push(studentData.enrollment);
            result.assessmentResults.push(...studentData.assessmentResults);
            result.successful++;
          } else {
            result.errors.push({
              userEmail: request.userEmail,
              courseId: request.courseId,
              error: 'No enrollment found for user in this course'
            });
            result.failed++;
          }
        } catch (error) {
          result.errors.push({
            userEmail: request.userEmail,
            courseId: request.courseId,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          });
          result.failed++;
        }

        result.totalProcessed++;
        
        // Call progress callback
        if (onProgress) {
          onProgress(result.totalProcessed, certificateRequests.length);
        }
      });

      await Promise.all(batchPromises);
      
      // Small delay between batches
      if (i + batchSize < certificateRequests.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return result;
  }

  /**
   * Sync scores through Edge Function
   */
  async syncScores(userIds: string[]): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      return await this.callEdgeFunction('syncScores', { userIds });
    } catch (error) {
      console.error('Error syncing scores:', error);
      throw error;
    }
  }

  /**
   * Calculate overall score from assessment results (client-side helper)
   */
  calculateOverallScore(
    assessments: ThinkificAssessment[],
    results: ThinkificAssessmentResult[]
  ): {
    practical: number;
    written: number;
    total: number;
    passed: boolean;
  } {
    let practicalScore = 0;
    let writtenScore = 0;
    let practicalWeight = 0;
    let writtenWeight = 0;

    for (const result of results) {
      const assessment = assessments.find(a => a.id === result.assessment_id);
      if (!assessment) continue;

      const weight = assessment.weight_percentage || 100;
      
      if (assessment.assessment_type === 'assignment' || assessment.assessment_type === 'exam') {
        // Treat assignments and exams as practical
        practicalScore += result.percentage * weight;
        practicalWeight += weight;
      } else {
        // Treat quizzes as written
        writtenScore += result.percentage * weight;
        writtenWeight += weight;
      }
    }

    const finalPractical = practicalWeight > 0 ? practicalScore / practicalWeight : 0;
    const finalWritten = writtenWeight > 0 ? writtenScore / writtenWeight : 0;
    
    // Calculate weighted total (assuming 60% practical, 40% written)
    const total = (finalPractical * 0.6) + (finalWritten * 0.4);
    const passed = total >= 70; // 70% passing threshold

    return {
      practical: Math.round(finalPractical * 100) / 100,
      written: Math.round(finalWritten * 100) / 100,
      total: Math.round(total * 100) / 100,
      passed
    };
  }

  /**
   * Get service status
   */
  getServiceStatus(): {
    isInitialized: boolean;
    isAuthenticated: boolean;
    message: string;
  } {
    return {
      isInitialized: true, // Edge Functions handle initialization
      isAuthenticated: true, // Authentication is handled server-side
      message: 'Service ready - using Supabase Edge Functions'
    };
  }

  /**
   * Initialize service (no-op for Edge Function approach)
   */
  async initialize(): Promise<void> {
    // No initialization needed since Edge Functions handle authentication
    return Promise.resolve();
  }
}

// Export singleton instance
export const thinkificApiService = new ThinkificApiService();