import { supabase } from '@/integrations/supabase/client';

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
  last_synced: string;
  raw_enrollment_data?: any;
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
        total_thinkific_courses: student.student_metadata?.total_thinkific_courses || 0
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
}