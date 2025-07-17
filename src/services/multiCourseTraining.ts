import { supabase } from '@/integrations/supabase/client';

// Database table interfaces matching our migrations
export interface SessionTemplate {
  id: string;
  name: string;
  code: string;
  description?: string;
  template_type: 'SINGLE_COURSE' | 'MULTI_COURSE' | 'WORKSHOP_SERIES' | 'CERTIFICATION_TRACK';
  total_duration_minutes: number;
  estimated_break_minutes: number;
  max_participants?: number;
  is_active: boolean;
  is_public: boolean;
  requires_approval: boolean;
  required_instructors: number;
  required_rooms: number;
  required_equipment: string[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  provider_id?: string;
}

export interface SessionTemplateComponent {
  id: string;
  session_template_id: string;
  course_id?: string;
  component_type: 'COURSE' | 'BREAK' | 'ASSESSMENT' | 'ACTIVITY' | 'DISCUSSION' | 'PRACTICAL' | 'LUNCH';
  sequence_order: number;
  duration_minutes: number;
  component_name?: string;
  component_description?: string;
  is_break: boolean;
  break_type?: 'SHORT' | 'LUNCH' | 'EXTENDED' | 'TRANSITION';
  is_mandatory: boolean;
  allows_parallel: boolean;
  instructor_required: boolean;
  room_required: boolean;
  equipment_required: string[];
  max_participants?: number;
  has_assessment: boolean;
  assessment_type?: 'WRITTEN' | 'PRACTICAL' | 'BOTH' | 'OBSERVATION';
  min_score_required?: number;
  notes?: string;
  special_requirements: string[];
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface SessionComponentProgress {
  id: string;
  session_enrollment_id: string;
  session_template_component_id: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PASSED' | 'FAILED' | 'SKIPPED' | 'EXCUSED';
  start_time?: string;
  end_time?: string;
  duration_actual_minutes?: number;
  score?: number;
  passed?: boolean;
  attempts: number;
  max_attempts: number;
  attendance_status: 'REGISTERED' | 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY_DEPARTURE' | 'EXCUSED';
  attendance_percentage?: number;
  participation_score?: number;
  instructor_notes?: string;
  participant_feedback?: string;
  completion_notes?: string;
  created_at: string;
  updated_at: string;
  completed_by?: string;
}

export interface CoursePrerequisite {
  id: string;
  course_id: string;
  prerequisite_course_id: string;
  prerequisite_type: 'REQUIRED' | 'RECOMMENDED' | 'ALTERNATIVE' | 'CONCURRENT';
  min_score_required?: number;
  validity_months?: number;
  alternative_qualification?: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
}

// Service class for Multi-Course Training operations
export class MultiCourseTrainingService {
  
  // ===== SESSION TEMPLATES =====
  
  static async getSessionTemplates(activeOnly = false) {
    let query = supabase
      .from('training_session_templates')
      .select(`
        *,
        session_template_components(*)
      `)
      .order('created_at', { ascending: false });
    
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching session templates:', error);
      throw error;
    }
    
    return data;
  }
  
  static async getSessionTemplate(id: string) {
    const { data, error } = await supabase
      .from('training_session_templates')
      .select(`
        *,
        session_template_components(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching session template:', error);
      throw error;
    }
    
    return data;
  }
  
  static async createSessionTemplate(templateData: Omit<SessionTemplate, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('training_session_templates')
      .insert(templateData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating session template:', error);
      throw error;
    }
    
    return data;
  }
  
  static async updateSessionTemplate(id: string, updates: Partial<SessionTemplate>) {
    const { data, error } = await supabase
      .from('training_session_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating session template:', error);
      throw error;
    }
    
    return data;
  }
  
  static async deleteSessionTemplate(id: string) {
    const { error } = await supabase
      .from('training_session_templates')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting session template:', error);
      throw error;
    }
  }
  
  // ===== TEMPLATE COMPONENTS =====
  
  static async getTemplateComponents(templateId: string) {
    const { data, error } = await supabase
      .from('session_template_components')
      .select('*')
      .eq('session_template_id', templateId)
      .order('sequence_order');
    
    if (error) {
      console.error('Error fetching template components:', error);
      throw error;
    }
    
    return data;
  }
  
  static async createTemplateComponent(componentData: Omit<SessionTemplateComponent, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('session_template_components')
      .insert(componentData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating template component:', error);
      throw error;
    }
    
    return data;
  }
  
  static async updateTemplateComponent(id: string, updates: Partial<SessionTemplateComponent>) {
    const { data, error } = await supabase
      .from('session_template_components')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating template component:', error);
      throw error;
    }
    
    return data;
  }
  
  static async deleteTemplateComponent(id: string) {
    const { error } = await supabase
      .from('session_template_components')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting template component:', error);
      throw error;
    }
  }
  
  static async reorderTemplateComponents(templateId: string, componentOrders: { id: string; sequence_order: number }[]) {
    const updates = componentOrders.map(({ id, sequence_order }) => 
      supabase
        .from('session_template_components')
        .update({ sequence_order })
        .eq('id', id)
    );
    
    const results = await Promise.all(updates);
    
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      console.error('Error reordering components:', errors);
      throw new Error('Failed to reorder components');
    }
    
    return true;
  }
  
  // ===== MULTI-COURSE SESSIONS =====
  
  static async createSessionFromTemplate(templateId: string, sessionData: any) {
    const { data, error } = await supabase.rpc('create_session_from_template', {
      p_template_id: templateId,
      p_session_data: sessionData
    });
    
    if (error) {
      console.error('Error creating session from template:', error);
      throw error;
    }
    
    return data;
  }
  
  static async getMultiCourseSessions() {
    const { data, error } = await supabase
      .from('training_sessions')
      .select(`
        *,
        training_session_templates(name, code),
        instructor_profiles(user_id, users(first_name, last_name, email)),
        locations(name, address)
      `)
      .not('session_template_id', 'is', null)
      .order('session_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching multi-course sessions:', error);
      throw error;
    }
    
    return data;
  }
  
  static async getSessionProgress(sessionId: string) {
    const { data, error } = await supabase
      .from('session_enrollments')
      .select(`
        *,
        student_enrollment_profiles(user_id, users(first_name, last_name, email)),
        session_component_progress(
          *,
          session_template_components(*)
        )
      `)
      .eq('session_id', sessionId)
      .order('enrollment_date');
    
    if (error) {
      console.error('Error fetching session progress:', error);
      throw error;
    }
    
    return data;
  }
  
  // ===== COMPONENT PROGRESS TRACKING =====
  
  static async updateComponentProgress(enrollmentId: string, componentId: string, updates: Partial<SessionComponentProgress>) {
    const { data, error } = await supabase.rpc('update_component_progress', {
      p_enrollment_id: enrollmentId,
      p_component_id: componentId,
      p_updates: updates
    });
    
    if (error) {
      console.error('Error updating component progress:', error);
      throw error;
    }
    
    return data;
  }
  
  static async initializeComponentProgress(enrollmentId: string) {
    const { data, error } = await supabase.rpc('initialize_component_progress', {
      p_enrollment_id: enrollmentId
    });
    
    if (error) {
      console.error('Error initializing component progress:', error);
      throw error;
    }
    
    return data;
  }
  
  static async calculateSessionCompletion(sessionId: string) {
    const { data, error } = await supabase.rpc('calculate_session_completion_rate', {
      p_session_id: sessionId
    });
    
    if (error) {
      console.error('Error calculating session completion:', error);
      throw error;
    }
    
    return data;
  }
  
  // ===== COURSE PREREQUISITES =====
  
  static async getCoursePrerequisites(courseId: string) {
    const { data, error } = await supabase
      .from('course_prerequisites')
      .select(`
        *,
        prerequisite_course:courses!prerequisite_course_id(name, code)
      `)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .order('prerequisite_type');
    
    if (error) {
      console.error('Error fetching course prerequisites:', error);
      throw error;
    }
    
    return data;
  }
  
  static async validateStudentPrerequisites(studentId: string, courseId: string) {
    const { data, error } = await supabase.rpc('validate_course_prerequisites', {
      p_student_id: studentId,
      p_course_id: courseId
    });
    
    if (error) {
      console.error('Error validating prerequisites:', error);
      throw error;
    }
    
    return data;
  }
  
  static async enrollStudentInSession(studentId: string, sessionId: string) {
    const { data, error } = await supabase.rpc('enroll_student_in_session', {
      p_student_id: studentId,
      p_session_id: sessionId
    });
    
    if (error) {
      console.error('Error enrolling student:', error);
      throw error;
    }
    
    return data;
  }
  
  // ===== ANALYTICS AND REPORTING =====
  
  static async getTemplateUsageStats() {
    const { data, error } = await supabase
      .from('training_session_templates')
      .select(`
        id,
        name,
        code,
        training_sessions(count)
      `)
      .eq('is_active', true);
    
    if (error) {
      console.error('Error fetching template usage stats:', error);
      throw error;
    }
    
    return data;
  }
  
  static async getComponentProgressStats(sessionId: string) {
    const { data, error } = await supabase
      .from('session_component_progress')
      .select(`
        session_template_component_id,
        status,
        count()
      `)
      .eq('session_enrollment_id', sessionId);
    
    if (error) {
      console.error('Error fetching component progress stats:', error);
      throw error;
    }
    
    return data;
  }
  
  // ===== UTILITY FUNCTIONS =====
  
  static async getCourses() {
    const { data, error } = await supabase
      .from('courses')
      .select('id, name, code, duration_hours')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
    
    return data;
  }
  
  static async getInstructors() {
    const { data, error } = await supabase
      .from('instructor_profiles')
      .select(`
        id,
        user_id,
        users(first_name, last_name, email),
        specializations,
        is_active
      `)
      .eq('is_active', true)
      .order('users(last_name)');
    
    if (error) {
      console.error('Error fetching instructors:', error);
      throw error;
    }
    
    return data;
  }
  
  static async getLocations() {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, address, capacity, equipment')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
    
    return data;
  }
}