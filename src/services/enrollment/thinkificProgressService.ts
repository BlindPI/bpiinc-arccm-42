import { supabase } from '@/integrations/supabase/client';

export interface ThinkificAssessment {
  id: number;
  name: string;
  course_id: number;
  lesson_id: number;
  assessment_type: string;
  passing_score: number;
  max_attempts: number;
}

export interface ThinkificAssessmentResult {
  id: number;
  assessment_id: number;
  user_id: number;
  score: number;
  passed: boolean;
  completed_at: string;
  attempt_number: number;
}

export interface ThinkificCourseProgress {
  thinkific_course_id: string;
  thinkific_enrollment_id: string;
  course_name: string;
  progress_percentage: number;
  completion_status: 'COMPLETED' | 'IN_PROGRESS';
  started_at?: string;
  completed_at?: string;
  practical_score?: number;
  written_score?: number;
  total_score?: number;
  passed?: boolean;
  last_synced: string;
  
  // Enhanced assessment data
  assessments?: ThinkificAssessment[];
  assessment_results?: ThinkificAssessmentResult[];
  course_details?: any;
  overall_score_breakdown?: {
    practical: number;
    written: number;
    total: number;
    passed: boolean;
  };
  
  // Activity and progress tracking
  activity_feed?: any[];
  section_progress?: any[];
  
  // Metadata
  enhanced_data_available?: boolean;
  data_pull_timestamp?: string;
  raw_enrollment_data?: any;
  raw_assessment_data?: any;
}

export interface StudentWithProgress {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  thinkific_user_id: string;
  sync_status: string;
  last_sync_date: string;
  thinkific_courses: ThinkificCourseProgress[];
  total_thinkific_courses: number;
  
  // Enhanced metadata
  completed_thinkific_courses?: number;
  average_score?: number;
  enhanced_sync_enabled?: boolean;
  total_assessments?: number;
  total_assessment_results?: number;
}

export class ThinkificProgressService {
  /**
   * Get all students with their Thinkific course progress data
   */
  static async getStudentsWithProgress(): Promise<StudentWithProgress[]> {
    try {
      const { data: students, error } = await supabase
        .from('student_enrollment_profiles')
        .select('*')
        .eq('imported_from', 'THINKIFIC')
        .eq('is_active', true)
        .order('last_sync_date', { ascending: false });

      if (error) {
        console.error('Error fetching students with progress:', error);
        return [];
      }

      return students?.map(student => ({
        id: student.id,
        email: student.email,
        first_name: student.first_name,
        last_name: student.last_name,
        display_name: student.display_name,
        thinkific_user_id: student.thinkific_user_id,
        sync_status: student.sync_status,
        last_sync_date: student.last_sync_date,
        thinkific_courses: student.student_metadata?.thinkific_courses || [],
        total_thinkific_courses: student.student_metadata?.total_thinkific_courses || 0,
        
        // Enhanced metadata
        completed_thinkific_courses: student.student_metadata?.completed_thinkific_courses || 0,
        average_score: student.student_metadata?.average_score || 0,
        enhanced_sync_enabled: student.student_metadata?.enhanced_sync_enabled || false,
        total_assessments: student.student_metadata?.total_assessments || 0,
        total_assessment_results: student.student_metadata?.total_assessment_results || 0
      })) || [];

    } catch (error) {
      console.error('Error in getStudentsWithProgress:', error);
      return [];
    }
  }

  /**
   * Get unique Thinkific courses across all students
   */
  static async getAvailableThinkificCourses(): Promise<{
    course_id: string;
    course_name: string;
    total_students: number;
    completed_students: number;
    in_progress_students: number;
  }[]> {
    try {
      const students = await this.getStudentsWithProgress();
      const courseMap = new Map();

      students.forEach(student => {
        student.thinkific_courses.forEach(course => {
          const courseId = course.thinkific_course_id;
          
          if (!courseMap.has(courseId)) {
            courseMap.set(courseId, {
              course_id: courseId,
              course_name: course.course_name,
              total_students: 0,
              completed_students: 0,
              in_progress_students: 0
            });
          }

          const courseData = courseMap.get(courseId);
          courseData.total_students++;
          
          if (course.completion_status === 'COMPLETED') {
            courseData.completed_students++;
          } else {
            courseData.in_progress_students++;
          }
        });
      });

      return Array.from(courseMap.values())
        .sort((a, b) => b.total_students - a.total_students);

    } catch (error) {
      console.error('Error getting available Thinkific courses:', error);
      return [];
    }
  }

  /**
   * Get students enrolled in a specific Thinkific course
   */
  static async getStudentsInThinkificCourse(thinkificCourseId: string): Promise<StudentWithProgress[]> {
    try {
      const allStudents = await this.getStudentsWithProgress();
      
      return allStudents.filter(student =>
        student.thinkific_courses.some(course => 
          course.thinkific_course_id === thinkificCourseId
        )
      );

    } catch (error) {
      console.error('Error getting students in Thinkific course:', error);
      return [];
    }
  }

  /**
   * Get course progress statistics
   */
  static async getCourseProgressStats(thinkificCourseId: string): Promise<{
    total_students: number;
    completed: number;
    in_progress: number;
    average_progress: number;
    completion_rate: number;
  }> {
    try {
      const students = await this.getStudentsInThinkificCourse(thinkificCourseId);
      
      if (students.length === 0) {
        return {
          total_students: 0,
          completed: 0,
          in_progress: 0,
          average_progress: 0,
          completion_rate: 0
        };
      }

      let totalProgress = 0;
      let completed = 0;
      let inProgress = 0;

      students.forEach(student => {
        const course = student.thinkific_courses.find(c => 
          c.thinkific_course_id === thinkificCourseId
        );
        
        if (course) {
          totalProgress += course.progress_percentage;
          
          if (course.completion_status === 'COMPLETED') {
            completed++;
          } else {
            inProgress++;
          }
        }
      });

      const averageProgress = totalProgress / students.length;
      const completionRate = (completed / students.length) * 100;

      return {
        total_students: students.length,
        completed,
        in_progress: inProgress,
        average_progress: averageProgress,
        completion_rate: completionRate
      };

    } catch (error) {
      console.error('Error getting course progress stats:', error);
      return {
        total_students: 0,
        completed: 0,
        in_progress: 0,
        average_progress: 0,
        completion_rate: 0
      };
    }
  }

  /**
   * Get detailed assessment data for a student in a specific course
   */
  static async getStudentAssessmentData(studentId: string, thinkificCourseId: string): Promise<{
    course: ThinkificCourseProgress | null;
    assessments: ThinkificAssessment[];
    assessment_results: ThinkificAssessmentResult[];
    overall_score?: {
      practical: number;
      written: number;
      total: number;
      passed: boolean;
    };
  }> {
    try {
      const students = await this.getStudentsWithProgress();
      const student = students.find(s => s.id === studentId);
      
      if (!student) {
        return {
          course: null,
          assessments: [],
          assessment_results: [],
        };
      }

      const course = student.thinkific_courses.find(c =>
        c.thinkific_course_id === thinkificCourseId
      );

      if (!course) {
        return {
          course: null,
          assessments: [],
          assessment_results: [],
        };
      }

      return {
        course: course,
        assessments: course.assessments || [],
        assessment_results: course.assessment_results || [],
        overall_score: course.overall_score_breakdown
      };

    } catch (error) {
      console.error('Error getting student assessment data:', error);
      return {
        course: null,
        assessments: [],
        assessment_results: [],
      };
    }
  }

  /**
   * Get enhanced sync statistics
   */
  static async getEnhancedSyncStatistics(): Promise<{
    total_students: number;
    enhanced_sync_students: number;
    basic_sync_students: number;
    total_courses: number;
    total_assessments: number;
    total_assessment_results: number;
    average_course_completion_rate: number;
    students_with_scores: number;
  }> {
    try {
      const students = await this.getStudentsWithProgress();
      
      const enhancedStudents = students.filter(s => s.enhanced_sync_enabled);
      const basicStudents = students.filter(s => !s.enhanced_sync_enabled);
      
      const totalCourses = students.reduce((sum, student) => sum + student.total_thinkific_courses, 0);
      const totalAssessments = students.reduce((sum, student) => sum + (student.total_assessments || 0), 0);
      const totalAssessmentResults = students.reduce((sum, student) => sum + (student.total_assessment_results || 0), 0);
      
      const completedCourses = students.reduce((sum, student) => sum + (student.completed_thinkific_courses || 0), 0);
      const averageCompletionRate = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0;
      
      const studentsWithScores = students.filter(s => s.average_score && s.average_score > 0).length;

      return {
        total_students: students.length,
        enhanced_sync_students: enhancedStudents.length,
        basic_sync_students: basicStudents.length,
        total_courses: totalCourses,
        total_assessments: totalAssessments,
        total_assessment_results: totalAssessmentResults,
        average_course_completion_rate: averageCompletionRate,
        students_with_scores: studentsWithScores
      };

    } catch (error) {
      console.error('Error getting enhanced sync statistics:', error);
      return {
        total_students: 0,
        enhanced_sync_students: 0,
        basic_sync_students: 0,
        total_courses: 0,
        total_assessments: 0,
        total_assessment_results: 0,
        average_course_completion_rate: 0,
        students_with_scores: 0
      };
    }
  }

  /**
   * Get students who need enhanced sync (those with basic data only)
   */
  static async getStudentsNeedingEnhancedSync(): Promise<StudentWithProgress[]> {
    try {
      const students = await this.getStudentsWithProgress();
      return students.filter(student => !student.enhanced_sync_enabled);
    } catch (error) {
      console.error('Error getting students needing enhanced sync:', error);
      return [];
    }
  }
}