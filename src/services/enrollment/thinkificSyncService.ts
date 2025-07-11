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
   * Enhanced import: Pull comprehensive progress data for all students including assessments and quiz scores
   */
  static async importStudentsFromThinkific(
    options: SyncOptions = {},
    onProgress?: (progress: SyncProgress) => void
  ): Promise<{
    success: number;
    failed: number;
    total: number;
    errors: string[];
    importedStudents: any[];
  }> {
    console.log('🚀 STARTING ENHANCED THINKIFIC STUDENT IMPORT');
    console.log('Options:', options);
    
    try {
      // Call Thinkific API to get all students with enrollments and assessments using BULK method
      console.log('🚀 Calling BULK getAllStudentsWithEnrollments method...');
      const response = await this.callThinkificAPI({
        action: 'getAllStudentsWithEnrollments' // Use the correct bulk method name
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch students from Thinkific');
      }

      const thinkificData = response.data;
      const students = thinkificData.students || [];
      const assessments = thinkificData.assessments || [];
      
      console.log(`📊 BULK FETCH SUCCESS: ${students.length} students with ${thinkificData.totalEnrollments} enrollments`);
      console.log(`🎯 Assessment data included: ${assessments.length} assessment records`);
      console.log(`🎯 Starting BULK processing to store all data...`);

      let success = 0;
      let failed = 0;
      const errors: string[] = [];
      const importedStudents: any[] = [];

      // Process each student using the BULK data (no additional API calls needed)
      for (let i = 0; i < students.length; i++) {
        const student = students[i];
        
        onProgress?.({
          total: students.length,
          completed: i,
          failed: failed,
          current: `Processing ${student.first_name} ${student.last_name} (${student.email}) - BULK Processing`
        });

        try {
          // Import this student's enrollments using BULK data (no additional API calls)
          const studentResult = await this.importStudentEnrollmentsBulk(student, assessments);
          
          if (studentResult.success) {
            success += studentResult.enrollmentsCreated;
            importedStudents.push({
              student: student,
              progressRecordsStored: studentResult.enrollmentsCreated,
              details: studentResult.details
            });
          } else {
            failed++;
            errors.push(`Failed to import progress data for ${student.email}: ${studentResult.error}`);
          }
        } catch (error) {
          failed++;
          errors.push(`Error importing ${student.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      onProgress?.({
        total: students.length,
        completed: success,
        failed: failed,
        current: 'BULK import completed'
      });

      console.log(`✅ BULK IMPORT COMPLETED: ${success} progress records stored, ${failed} failed`);

      return {
        success,
        failed,
        total: students.length,
        errors,
        importedStudents
      };

    } catch (error) {
      console.error('💥 Error importing students from Thinkific:', error);
      return {
        success: 0,
        failed: 0,
        total: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        importedStudents: []
      };
    }
  }

  /**
   * BULK: Import comprehensive Thinkific progress data using pre-fetched bulk assessment data (NO additional API calls)
   */
  static async importStudentEnrollmentsBulk(student: any, allAssessments: any[] = []): Promise<{
    success: boolean;
    enrollmentsCreated: number;
    error?: string;
    details?: any[];
  }> {
    console.log(`👤 BULK: Importing comprehensive Thinkific data for ${student.email} using pre-fetched bulk data`);
    
    try {
      const enrollments = student.enrollments || [];
      let progressRecordsStored = 0;
      const details: any[] = [];

      // Check if student profile exists in our system
      let studentProfileId = await this.findOrCreateUser(student);
      
      if (!studentProfileId) {
        return {
          success: false,
          enrollmentsCreated: 0,
          error: 'Failed to find or create student profile in local system'
        };
      }

      // For each enrollment, use the bulk assessment data (NO API calls)
      for (const enrollment of enrollments) {
        try {
          console.log(`📊 BULK: Processing course ${enrollment.course_id} using bulk assessment data...`);
          
          // Find assessment data from bulk assessments array
          const courseAssessments = allAssessments.filter(
            (assessment: any) => assessment.course_id === enrollment.course_id
          );
          
          let assessmentData = null;
          let overallScore = null;

          if (courseAssessments.length > 0) {
            // Build assessment data from bulk fetch
            assessmentData = {
              assessments: courseAssessments,
              assessmentResults: [], // This would need to be populated if available in bulk data
              course: enrollment.course || null
            };
            
            // Calculate overall score if assessment data is available
            if (courseAssessments.length > 0) {
              const totalPossible = courseAssessments.reduce((sum: number, assessment: any) => sum + (assessment.points_possible || 0), 0);
              const totalScore = enrollment.total_score || 0;
              overallScore = {
                total: totalScore,
                possible: totalPossible,
                percentage: totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0,
                practical: enrollment.practical_score,
                written: enrollment.written_score,
                passed: enrollment.passed || false
              };
            }
            
            console.log(`✅ BULK: Found ${courseAssessments.length} assessments for course ${enrollment.course_id}`);
          } else {
            console.log(`ℹ️ BULK: No assessments found for course ${enrollment.course_id} in bulk data`);
          }
          
          // Store the enhanced Thinkific enrollment and assessment data
          await this.storeEnhancedThinkificProgressData(
            studentProfileId,
            enrollment,
            student,
            assessmentData,
            overallScore
          );
          
          progressRecordsStored++;
          details.push({
            action: 'bulk_enhanced_progress_stored',
            thinkificCourseId: enrollment.course_id,
            thinkificEnrollmentId: enrollment.id,
            courseName: enrollment.course?.name || `Course ${enrollment.course_id}`,
            progress: enrollment.percentage_completed || 0,
            completionStatus: enrollment.completed_at ? 'COMPLETED' : 'IN_PROGRESS',
            assessmentsCount: courseAssessments.length,
            resultsCount: 0, // Would need to be calculated from bulk data
            overallScore: overallScore,
            dataSource: 'BULK_FETCH'
          });
          
        } catch (error) {
          console.error(`Error storing bulk progress data for enrollment ${enrollment.id}:`, error);
          // Fallback to basic storage
          await this.storeThinkificProgressData(studentProfileId, enrollment, student);
          progressRecordsStored++;
        }
      }

      return {
        success: true,
        enrollmentsCreated: progressRecordsStored,
        details
      };

    } catch (error) {
      console.error(`Error importing bulk student data for ${student.email}:`, error);
      return {
        success: false,
        enrollmentsCreated: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * ENHANCED: Import comprehensive Thinkific progress data including assessments, quiz scores, and detailed progress
   */
  static async importStudentEnrollmentsEnhanced(student: any): Promise<{
    success: boolean;
    enrollmentsCreated: number;
    error?: string;
    details?: any[];
  }> {
    console.log(`👤 ENHANCED: Importing comprehensive Thinkific data for ${student.email}`);
    
    try {
      const enrollments = student.enrollments || [];
      let progressRecordsStored = 0;
      const details: any[] = [];

      // Check if student profile exists in our system
      let studentProfileId = await this.findOrCreateUser(student);
      
      if (!studentProfileId) {
        return {
          success: false,
          enrollmentsCreated: 0,
          error: 'Failed to find or create student profile in local system'
        };
      }

      // For each enrollment, pull comprehensive data including assessments and quiz scores
      for (const enrollment of enrollments) {
        try {
          console.log(`📊 ENHANCED: Pulling detailed data for course ${enrollment.course_id}...`);
          
          // Get comprehensive student certificate data including assessments and scores
          const detailedDataResponse = await this.callThinkificAPI({
            action: 'getStudentData',
            email: student.email,
            courseId: enrollment.course_id.toString()
          });

          let enhancedEnrollmentData = enrollment;
          let assessmentData = null;
          let overallScore = null;

          if (detailedDataResponse.success && detailedDataResponse.data) {
            const detailedData = detailedDataResponse.data;
            enhancedEnrollmentData = detailedData.enrollment || enrollment;
            assessmentData = {
              assessments: detailedData.assessments || [],
              assessmentResults: detailedData.assessmentResults || [],
              course: detailedData.course || null
            };
            overallScore = detailedData.overallScore;
            
            console.log(`✅ Enhanced data retrieved: ${assessmentData.assessments.length} assessments, ${assessmentData.assessmentResults.length} results`);
          } else {
            console.log(`⚠️ Could not retrieve enhanced data for ${student.email} in course ${enrollment.course_id}, using basic enrollment data`);
          }
          
          // Store the enhanced Thinkific enrollment and assessment data
          await this.storeEnhancedThinkificProgressData(
            studentProfileId,
            enhancedEnrollmentData,
            student,
            assessmentData,
            overallScore
          );
          
          progressRecordsStored++;
          details.push({
            action: 'enhanced_progress_stored',
            thinkificCourseId: enrollment.course_id,
            thinkificEnrollmentId: enrollment.id,
            courseName: enhancedEnrollmentData.course?.name || enrollment.course?.name || `Course ${enrollment.course_id}`,
            progress: enhancedEnrollmentData.percentage_completed || 0,
            completionStatus: enhancedEnrollmentData.completed_at ? 'COMPLETED' : 'IN_PROGRESS',
            assessmentsCount: assessmentData?.assessments?.length || 0,
            resultsCount: assessmentData?.assessmentResults?.length || 0,
            overallScore: overallScore
          });
          
        } catch (error) {
          console.error(`Error storing enhanced progress data for enrollment ${enrollment.id}:`, error);
          // Fallback to basic storage
          await this.storeThinkificProgressData(studentProfileId, enrollment, student);
          progressRecordsStored++;
        }
      }

      return {
        success: true,
        enrollmentsCreated: progressRecordsStored,
        details
      };

    } catch (error) {
      console.error(`Error importing enhanced student data for ${student.email}:`, error);
      return {
        success: false,
        enrollmentsCreated: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Legacy method: Import basic Thinkific course progress data for a single student (no local enrollment creation)
   */
  static async importStudentEnrollments(student: any): Promise<{
    success: boolean;
    enrollmentsCreated: number;
    error?: string;
    details?: any[];
  }> {
    console.log(`👤 Importing basic Thinkific progress data for ${student.email}`);
    
    try {
      const enrollments = student.enrollments || [];
      let progressRecordsStored = 0;
      const details: any[] = [];

      // Check if student profile exists in our system
      let studentProfileId = await this.findOrCreateUser(student);
      
      if (!studentProfileId) {
        return {
          success: false,
          enrollmentsCreated: 0,
          error: 'Failed to find or create student profile in local system'
        };
      }

      // Store Thinkific course progress data in student metadata
      for (const enrollment of enrollments) {
        try {
          console.log(`📊 Storing basic progress data for Thinkific course ${enrollment.course_id}`);
          
          // Store the Thinkific enrollment data for viewing and manual assignment
          await this.storeThinkificProgressData(studentProfileId, enrollment, student);
          
          progressRecordsStored++;
          details.push({
            action: 'progress_stored',
            thinkificCourseId: enrollment.course_id,
            thinkificEnrollmentId: enrollment.id,
            courseName: enrollment.course?.name || `Course ${enrollment.course_id}`,
            progress: enrollment.percentage_completed || 0,
            completionStatus: enrollment.completed_at ? 'COMPLETED' : 'IN_PROGRESS'
          });
          
        } catch (error) {
          console.error(`Error storing progress data for enrollment ${enrollment.id}:`, error);
        }
      }

      return {
        success: true,
        enrollmentsCreated: progressRecordsStored, // Rename this to be more accurate
        details
      };

    } catch (error) {
      console.error(`Error importing student ${student.email}:`, error);
      return {
        success: false,
        enrollmentsCreated: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * ENHANCED: Store comprehensive Thinkific progress data including assessments, quiz scores, and detailed metrics
   */
  private static async storeEnhancedThinkificProgressData(
    studentProfileId: string,
    enrollment: any,
    student: any,
    assessmentData: any = null,
    overallScore: any = null
  ): Promise<void> {
    try {
      // Get existing student profile
      const { data: profile, error: fetchError } = await supabase
        .from('student_enrollment_profiles')
        .select('student_metadata')
        .eq('id', studentProfileId)
        .single();

      if (fetchError) {
        console.error('Error fetching student profile:', fetchError);
        return;
      }

      // Extract existing metadata
      const existingMetadata = profile?.student_metadata || {};
      const thinkificCourses = existingMetadata.thinkific_courses || [];

      // Create comprehensive course progress record with rich data
      const courseProgress = {
        thinkific_course_id: enrollment.course_id,
        thinkific_enrollment_id: enrollment.id,
        course_name: enrollment.course?.name || `Course ${enrollment.course_id}`,
        progress_percentage: enrollment.percentage_completed || 0,
        completion_status: enrollment.completed_at ? 'COMPLETED' : 'IN_PROGRESS',
        started_at: enrollment.started_at,
        completed_at: enrollment.completed_at,
        practical_score: overallScore?.practical || enrollment.practical_score,
        written_score: overallScore?.written || enrollment.written_score,
        total_score: overallScore?.total || enrollment.total_score,
        passed: overallScore?.passed || false,
        last_synced: new Date().toISOString(),
        
        // Enhanced assessment data
        assessments: assessmentData?.assessments || [],
        assessment_results: assessmentData?.assessmentResults || [],
        course_details: assessmentData?.course || null,
        overall_score_breakdown: overallScore || null,
        
        // Activity and progress tracking
        activity_feed: [], // Placeholder for future activity feed data
        section_progress: [], // Placeholder for section-by-section progress
        
        // Metadata
        enhanced_data_available: !!assessmentData,
        data_pull_timestamp: new Date().toISOString(),
        raw_enrollment_data: enrollment,
        raw_assessment_data: assessmentData
      };

      // Update or add course progress
      const existingCourseIndex = thinkificCourses.findIndex(
        (course: any) => course.thinkific_course_id === enrollment.course_id
      );

      if (existingCourseIndex >= 0) {
        thinkificCourses[existingCourseIndex] = courseProgress;
      } else {
        thinkificCourses.push(courseProgress);
      }

      // Calculate enhanced metadata
      const completedCourses = thinkificCourses.filter((course: any) => course.completion_status === 'COMPLETED').length;
      const averageScore = thinkificCourses
        .filter((course: any) => course.total_score > 0)
        .reduce((sum: number, course: any, _, arr: any[]) => sum + course.total_score / arr.length, 0);

      // Update student metadata with enhanced tracking
      const updatedMetadata = {
        ...existingMetadata,
        thinkific_courses: thinkificCourses,
        last_thinkific_sync: new Date().toISOString(),
        total_thinkific_courses: thinkificCourses.length,
        completed_thinkific_courses: completedCourses,
        average_score: Math.round(averageScore * 100) / 100,
        enhanced_sync_enabled: true,
        total_assessments: thinkificCourses.reduce((sum: number, course: any) => sum + (course.assessments?.length || 0), 0),
        total_assessment_results: thinkificCourses.reduce((sum: number, course: any) => sum + (course.assessment_results?.length || 0), 0)
      };

      // Save updated metadata
      const { error: updateError } = await supabase
        .from('student_enrollment_profiles')
        .update({
          student_metadata: updatedMetadata,
          last_sync_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', studentProfileId);

      if (updateError) {
        console.error('Error updating enhanced student progress data:', updateError);
        return;
      }

      console.log(`✅ ENHANCED: Stored comprehensive data for ${student.email} in course ${enrollment.course_id} with ${assessmentData?.assessments?.length || 0} assessments`);

    } catch (error) {
      console.error('Error storing enhanced Thinkific progress data:', error);
    }
  }

  /**
   * Store basic Thinkific progress data in student profile for viewing and manual assignment
   */
  private static async storeThinkificProgressData(
    studentProfileId: string,
    enrollment: any,
    student: any
  ): Promise<void> {
    try {
      // Get existing student profile
      const { data: profile, error: fetchError } = await supabase
        .from('student_enrollment_profiles')
        .select('student_metadata')
        .eq('id', studentProfileId)
        .single();

      if (fetchError) {
        console.error('Error fetching student profile:', fetchError);
        return;
      }

      // Extract existing metadata
      const existingMetadata = profile?.student_metadata || {};
      const thinkificCourses = existingMetadata.thinkific_courses || [];

      // Create course progress record
      const courseProgress = {
        thinkific_course_id: enrollment.course_id,
        thinkific_enrollment_id: enrollment.id,
        course_name: enrollment.course?.name || `Course ${enrollment.course_id}`,
        progress_percentage: enrollment.percentage_completed || 0,
        completion_status: enrollment.completed_at ? 'COMPLETED' : 'IN_PROGRESS',
        started_at: enrollment.started_at,
        completed_at: enrollment.completed_at,
        practical_score: enrollment.practical_score,
        written_score: enrollment.written_score,
        total_score: enrollment.total_score,
        last_synced: new Date().toISOString(),
        raw_enrollment_data: enrollment
      };

      // Update or add course progress
      const existingCourseIndex = thinkificCourses.findIndex(
        (course: any) => course.thinkific_course_id === enrollment.course_id
      );

      if (existingCourseIndex >= 0) {
        thinkificCourses[existingCourseIndex] = courseProgress;
      } else {
        thinkificCourses.push(courseProgress);
      }

      // Update student metadata
      const updatedMetadata = {
        ...existingMetadata,
        thinkific_courses: thinkificCourses,
        last_thinkific_sync: new Date().toISOString(),
        total_thinkific_courses: thinkificCourses.length
      };

      // Save updated metadata
      const { error: updateError } = await supabase
        .from('student_enrollment_profiles')
        .update({
          student_metadata: updatedMetadata,
          last_sync_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', studentProfileId);

      if (updateError) {
        console.error('Error updating student progress data:', updateError);
        return;
      }

      console.log(`✅ Stored progress data for ${student.email} in course ${enrollment.course_id}`);

    } catch (error) {
      console.error('Error storing Thinkific progress data:', error);
    }
  }

  /**
   * Find existing student profile by email or create new one using dedicated student profiles table
   */
  private static async findOrCreateUser(student: any): Promise<string | null> {
    try {
      console.log(`👤 Finding or creating student profile for: ${student.email}`);
      
      // Use the database function to find or create student profile
      const { data: result, error } = await supabase
        .rpc('find_or_create_student_profile', {
          p_email: student.email,
          p_first_name: student.first_name || null,
          p_last_name: student.last_name || null,
          p_thinkific_user_id: student.id?.toString() || null,
          p_student_metadata: {
            thinkific_import: true,
            import_date: new Date().toISOString(),
            original_student_data: {
              id: student.id,
              email: student.email,
              first_name: student.first_name,
              last_name: student.last_name
            }
          }
        });

      if (error) {
        console.error('Error finding or creating student profile:', error);
        return null;
      }

      console.log(`✅ Student profile resolved: ${result}`);
      return result;

    } catch (error) {
      console.error('Error in findOrCreateUser:', error);
      return null;
    }
  }

  /**
   * Find course offering by Thinkific course ID or create one from Thinkific data
   */
  private static async findOrCreateCourseOffering(thinkificCourseId: number, thinkificCourseData?: any): Promise<string | null> {
    try {
      // First, try to find existing mapping
      const { data: mapping, error: mappingError } = await supabase
        .from('course_thinkific_mappings')
        .select('course_offering_id')
        .eq('thinkific_course_id', thinkificCourseId.toString())
        .eq('is_active', true)
        .single();

      if (mapping) {
        console.log(`🗺️ Found course mapping for Thinkific course ${thinkificCourseId}`);
        return mapping.course_offering_id;
      }

      if (mappingError && mappingError.code !== 'PGRST116') {
        console.error('Error finding course mapping:', mappingError);
      }

      // Try to find course offering by thinkific_course_id field
      const { data: courseOffering, error: courseError } = await supabase
        .from('course_offerings')
        .select('id')
        .eq('thinkific_course_id', thinkificCourseId.toString())
        .single();

      if (courseOffering) {
        console.log(`📚 Found course offering with Thinkific ID ${thinkificCourseId}`);
        return courseOffering.id;
      }

      if (courseError && courseError.code !== 'PGRST116') {
        console.error('Error finding course offering:', courseError);
      }

      // If no course offering exists, create one from Thinkific course data
      console.log(`🏗️ Creating course offering for Thinkific course ${thinkificCourseId}`);
      return await this.createCourseOfferingFromThinkific(thinkificCourseId, thinkificCourseData);

    } catch (error) {
      console.error('Error in findOrCreateCourseOffering:', error);
      return null;
    }
  }

  /**
   * Create course offering from Thinkific course data
   */
  private static async createCourseOfferingFromThinkific(thinkificCourseId: number, thinkificCourseData?: any): Promise<string | null> {
    try {
      // First, we need to get or create a course record
      const courseId = await this.findOrCreateCourse(thinkificCourseId, thinkificCourseData);
      
      if (!courseId) {
        console.error(`Failed to find or create course for Thinkific course ${thinkificCourseId}`);
        return null;
      }

      // Create course offering
      const offeringData = {
        course_id: courseId,
        start_date: new Date().toISOString().split('T')[0], // Today's date
        end_date: null, // Open-ended
        max_enrollment: null, // No limit
        thinkific_course_id: thinkificCourseId.toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newOffering, error } = await supabase
        .from('course_offerings')
        .insert(offeringData)
        .select('id')
        .single();

      if (error) {
        console.error('Error creating course offering:', error);
        return null;
      }

      console.log(`✅ Created course offering ${newOffering.id} for Thinkific course ${thinkificCourseId}`);
      return newOffering.id;

    } catch (error) {
      console.error('Error creating course offering from Thinkific:', error);
      return null;
    }
  }

  /**
   * Find or create a course record for Thinkific course
   */
  private static async findOrCreateCourse(thinkificCourseId: number, thinkificCourseData?: any): Promise<string | null> {
    try {
      // Try to find existing course by name or create a new one
      const courseName = thinkificCourseData?.name || `Thinkific Course ${thinkificCourseId}`;
      
      // Check if course already exists by name
      const { data: existingCourse, error: findError } = await supabase
        .from('courses')
        .select('id')
        .eq('name', courseName)
        .single();

      if (existingCourse) {
        console.log(`📚 Found existing course: ${courseName}`);
        return existingCourse.id;
      }

      if (findError && findError.code !== 'PGRST116') {
        console.error('Error finding course:', findError);
      }

      // Create new course
      const courseData = {
        name: courseName,
        description: `Course imported from Thinkific (ID: ${thinkificCourseId})`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newCourse, error: createError } = await supabase
        .from('courses')
        .insert(courseData)
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating course:', createError);
        return null;
      }

      console.log(`✅ Created course ${newCourse.id}: ${courseName}`);
      return newCourse.id;

    } catch (error) {
      console.error('Error finding or creating course:', error);
      return null;
    }
  }

  /**
   * Find existing enrollment
   */
  private static async findExistingEnrollment(studentProfileId: string, courseOfferingId: string): Promise<any> {
    try {
      const { data: enrollment, error } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_profile_id', studentProfileId)
        .eq('course_offering_id', courseOfferingId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error finding existing enrollment:', error);
        return null;
      }

      return enrollment;
    } catch (error) {
      console.error('Error in findExistingEnrollment:', error);
      return null;
    }
  }

  /**
   * Create new enrollment from Thinkific data
   */
  private static async createEnrollmentFromThinkific(
    studentProfileId: string,
    courseOfferingId: string,
    thinkificEnrollment: any,
    student: any
  ): Promise<string | null> {
    try {
      const enrollmentData = {
        student_profile_id: studentProfileId, // Link to student profile instead of user_id
        course_offering_id: courseOfferingId,
        status: 'ENROLLED',
        enrollment_date: thinkificEnrollment.started_at || new Date().toISOString(),
        thinkific_enrollment_id: thinkificEnrollment.id.toString(),
        thinkific_course_id: thinkificEnrollment.course_id.toString(),
        completion_percentage: thinkificEnrollment.percentage_completed || 0,
        thinkific_completed_at: thinkificEnrollment.completed_at,
        last_thinkific_sync: new Date().toISOString(),
        sync_status: 'SYNCED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log(`📋 Creating enrollment with data:`, enrollmentData);

      const { data: newEnrollment, error } = await supabase
        .from('enrollments')
        .insert(enrollmentData)
        .select('id')
        .single();

      if (error) {
        console.error('Error creating enrollment:', error);
        return null;
      }

      console.log(`✅ Created enrollment: ${newEnrollment.id}`);

      // Log the import operation
      await this.logSyncOperation({
        enrollment_id: newEnrollment.id,
        operation_type: 'INDIVIDUAL_SYNC',
        status: 'SUCCESS',
        thinkific_course_id: thinkificEnrollment.course_id.toString(),
        details: {
          action: 'imported_from_thinkific',
          student_email: student.email,
          thinkific_enrollment_id: thinkificEnrollment.id,
          progress: thinkificEnrollment.percentage_completed
        }
      });

      return newEnrollment.id;

    } catch (error) {
      console.error('Error creating enrollment from Thinkific:', error);
      return null;
    }
  }

  /**
   * Update existing enrollment with Thinkific data
   */
  private static async updateEnrollmentWithThinkificData(
    enrollmentId: string,
    thinkificEnrollment: any,
    student: any
  ): Promise<void> {
    try {
      const updateData = {
        thinkific_enrollment_id: thinkificEnrollment.id.toString(),
        thinkific_course_id: thinkificEnrollment.course_id.toString(),
        completion_percentage: thinkificEnrollment.percentage_completed || 0,
        thinkific_completed_at: thinkificEnrollment.completed_at,
        last_thinkific_sync: new Date().toISOString(),
        sync_status: 'SYNCED',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('enrollments')
        .update(updateData)
        .eq('id', enrollmentId);

      if (error) {
        console.error('Error updating enrollment:', error);
        return;
      }

      // Log the sync operation
      await this.logSyncOperation({
        enrollment_id: enrollmentId,
        operation_type: 'INDIVIDUAL_SYNC',
        status: 'SUCCESS',
        thinkific_course_id: thinkificEnrollment.course_id.toString(),
        details: {
          action: 'updated_from_thinkific',
          student_email: student.email,
          thinkific_enrollment_id: thinkificEnrollment.id,
          progress: thinkificEnrollment.percentage_completed
        }
      });

    } catch (error) {
      console.error('Error updating enrollment with Thinkific data:', error);
    }
  }

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
   * Test function to directly call Thinkific API
   */
  static async testThinkificAPICall(): Promise<ThinkificAPIResponse> {
    console.log('🧪 TESTING THINKIFIC API CALL DIRECTLY');
    
    const testRequest = {
      action: 'getStudentData',
      email: 'test@example.com',
      courseId: '123'  // Test course ID
    };
    
    return this.callThinkificAPI(testRequest);
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