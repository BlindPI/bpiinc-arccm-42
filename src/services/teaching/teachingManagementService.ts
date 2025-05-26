
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { UserRole } from '@/types/supabase-schema';

export interface TeachingSession {
  id: string;
  instructor_id: string;
  course_id: string;
  course_schedule_id?: string;
  session_date: string;
  duration_minutes: number;
  attendees: string[];
  attendance_count: number;
  compliance_status: 'pending' | 'compliant' | 'non_compliant';
  teaching_hours_credit: number;
  session_notes?: string;
  materials_used?: Record<string, any>;
  assessment_conducted: boolean;
  hours_taught: number;
  completion_status: string;
  created_at: string;
  updated_at: string;
}

export interface InstructorWorkload {
  instructor_id: string;
  display_name: string;
  role: UserRole;
  total_sessions_all_time: number;
  total_hours_all_time: number;
  sessions_this_month: number;
  hours_this_month: number;
  compliance_percentage: number;
}

export interface ComplianceCheck {
  id: string;
  instructor_id: string;
  check_type: 'teaching_hours' | 'session_quality' | 'documentation' | 'attendance';
  check_date: string;
  status: 'pending' | 'passed' | 'failed' | 'requires_attention';
  score?: number;
  notes?: string;
  checked_by?: string;
  due_date?: string;
  resolved_at?: string;
}

export interface SessionAttendance {
  id: string;
  teaching_session_id: string;
  student_id: string;
  attendance_status: 'present' | 'absent' | 'late' | 'excused';
  arrival_time?: string;
  departure_time?: string;
  notes?: string;
  recorded_by?: string;
}

export interface ComplianceReport {
  instructor_id: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  total_sessions: number;
  compliant_sessions: number;
  compliance_rate: number;
  hours_logged: number;
  recommendations: string[];
}

export interface LoadBalancingResult {
  current_distribution: InstructorWorkload[];
  recommendations: LoadBalancingRecommendation[];
  optimal_distribution: InstructorWorkload[];
}

export interface LoadBalancingRecommendation {
  type: 'redistribute' | 'hire_more' | 'reduce_load';
  priority: 'high' | 'medium' | 'low';
  message: string;
  affected_instructors: string[];
}

export class TeachingManagementService {
  static async createTeachingSession(
    sessionData: Partial<TeachingSession>
  ): Promise<TeachingSession> {
    console.log('Creating teaching session:', sessionData);

    // Validate instructor availability
    if (sessionData.instructor_id && sessionData.session_date && sessionData.duration_minutes) {
      const { data: isAvailable, error: availabilityError } = await supabase
        .rpc('check_instructor_availability', {
          p_instructor_id: sessionData.instructor_id,
          p_start_time: sessionData.session_date,
          p_duration_minutes: sessionData.duration_minutes
        });

      if (availabilityError) {
        console.error('Error checking availability:', availabilityError);
        throw availabilityError;
      }

      if (!isAvailable) {
        throw new Error('Instructor has scheduling conflicts');
      }
    }

    const { data, error } = await supabase
      .from('teaching_sessions')
      .insert({
        instructor_id: sessionData.instructor_id,
        course_id: sessionData.course_id,
        course_schedule_id: sessionData.course_schedule_id,
        session_date: sessionData.session_date,
        duration_minutes: sessionData.duration_minutes || 60,
        hours_taught: sessionData.hours_taught || 1,
        completion_status: sessionData.completion_status || 'COMPLETED',
        attendees: sessionData.attendees || [],
        attendance_count: sessionData.attendance_count || 0,
        compliance_status: 'pending',
        assessment_conducted: sessionData.assessment_conducted || false,
        session_notes: sessionData.session_notes,
        materials_used: sessionData.materials_used
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating teaching session:', error);
      throw error;
    }

    // Auto-calculate teaching hours credit
    if (data.id) {
      await this.calculateTeachingHours(data.id);
    }
    
    return data as TeachingSession;
  }

  static async recordSessionAttendance(
    sessionId: string,
    attendees: SessionAttendance[]
  ): Promise<void> {
    console.log('Recording session attendance:', sessionId, attendees);

    // Update the teaching session with attendee IDs
    const attendeeIds = attendees.map(a => a.student_id);
    
    const { error: sessionError } = await supabase
      .from('teaching_sessions')
      .update({
        attendees: attendeeIds,
        attendance_count: attendeeIds.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (sessionError) {
      console.error('Error updating session attendance:', sessionError);
      throw sessionError;
    }

    // Insert detailed attendance records
    for (const attendance of attendees) {
      const { error } = await supabase
        .from('session_attendance')
        .upsert({
          teaching_session_id: sessionId,
          student_id: attendance.student_id,
          attendance_status: attendance.attendance_status,
          arrival_time: attendance.arrival_time,
          departure_time: attendance.departure_time,
          notes: attendance.notes,
          recorded_by: attendance.recorded_by
        });

      if (error) {
        console.error('Error recording individual attendance:', error);
      }
    }

    // Update compliance status
    await this.updateComplianceStatus(sessionId);
  }

  static async getInstructorWorkload(
    instructorId?: string
  ): Promise<InstructorWorkload[]> {
    console.log('Getting instructor workload:', instructorId);
    
    let query = supabase
      .from('instructor_workload_summary')
      .select('*');

    if (instructorId) {
      query = query.eq('instructor_id', instructorId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting instructor workload:', error);
      throw error;
    }

    return (data || []) as InstructorWorkload[];
  }

  static async generateComplianceReport(
    instructorId: string,
    period: 'monthly' | 'quarterly' | 'yearly'
  ): Promise<ComplianceReport> {
    console.log('Generating compliance report:', instructorId, period);

    const periodMap = {
      'monthly': '1 month',
      'quarterly': '3 months',
      'yearly': '12 months'
    };

    const { data: sessions, error } = await supabase
      .from('teaching_sessions')
      .select('*')
      .eq('instructor_id', instructorId)
      .gte('session_date', `NOW() - INTERVAL '${periodMap[period]}'`);

    if (error) {
      console.error('Error fetching sessions for compliance report:', error);
      throw error;
    }

    const totalSessions = sessions?.length || 0;
    const compliantSessions = sessions?.filter(s => s.compliance_status === 'compliant').length || 0;
    const complianceRate = totalSessions > 0 ? (compliantSessions / totalSessions) * 100 : 0;
    const hoursLogged = sessions?.reduce((total, s) => total + (s.teaching_hours_credit || 0), 0) || 0;

    const recommendations = await this.generateComplianceRecommendations(instructorId, sessions || []);

    return {
      instructor_id: instructorId,
      period,
      total_sessions: totalSessions,
      compliant_sessions: compliantSessions,
      compliance_rate: complianceRate,
      hours_logged: hoursLogged,
      recommendations
    };
  }

  static async balanceInstructorLoad(): Promise<LoadBalancingResult> {
    console.log('Balancing instructor load');
    
    const workloads = await this.getInstructorWorkload();
    const recommendations = this.generateLoadBalancingRecommendations(workloads);
    
    return {
      current_distribution: workloads,
      recommendations,
      optimal_distribution: this.calculateOptimalDistribution(workloads)
    };
  }

  static async getTeachingSessions(
    instructorId?: string,
    period?: 'monthly' | 'quarterly' | 'yearly'
  ): Promise<TeachingSession[]> {
    console.log('Getting teaching sessions:', instructorId, period);

    let query = supabase
      .from('teaching_sessions')
      .select('*')
      .order('session_date', { ascending: false });

    if (instructorId) {
      query = query.eq('instructor_id', instructorId);
    }

    if (period) {
      const periodMap = {
        'monthly': '1 month',
        'quarterly': '3 months',
        'yearly': '12 months'
      };
      query = query.gte('session_date', `NOW() - INTERVAL '${periodMap[period]}'`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting teaching sessions:', error);
      throw error;
    }

    return (data || []) as TeachingSession[];
  }

  // Helper methods
  private static async calculateTeachingHours(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('calculate_teaching_hours_credit', {
        p_session_id: sessionId
      });

      if (error) {
        console.error('Error calculating teaching hours:', error);
      }
    } catch (error) {
      console.error('Exception calculating teaching hours:', error);
    }
  }

  private static async updateComplianceStatus(sessionId: string): Promise<void> {
    // Simple compliance logic - can be enhanced
    const { data: session } = await supabase
      .from('teaching_sessions')
      .select('attendance_count, duration_minutes')
      .eq('id', sessionId)
      .single();

    if (session) {
      const compliance_status = session.attendance_count > 0 && session.duration_minutes >= 60 
        ? 'compliant' 
        : 'non_compliant';

      await supabase
        .from('teaching_sessions')
        .update({ compliance_status })
        .eq('id', sessionId);
    }
  }

  private static async generateComplianceRecommendations(
    instructorId: string,
    sessions: any[]
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    const lowAttendanceSessions = sessions.filter(s => s.attendance_count < 5);
    const shortSessions = sessions.filter(s => s.duration_minutes < 60);
    
    if (lowAttendanceSessions.length > sessions.length * 0.3) {
      recommendations.push('Focus on improving session attendance rates');
    }
    
    if (shortSessions.length > 0) {
      recommendations.push('Ensure all sessions meet minimum duration requirements');
    }
    
    if (sessions.filter(s => s.compliance_status === 'compliant').length < sessions.length * 0.8) {
      recommendations.push('Review teaching practices to improve overall compliance');
    }

    return recommendations;
  }

  private static generateLoadBalancingRecommendations(
    workloads: InstructorWorkload[]
  ): LoadBalancingRecommendation[] {
    const recommendations: LoadBalancingRecommendation[] = [];
    
    if (workloads.length === 0) return recommendations;

    const avgHours = workloads.reduce((sum, w) => sum + w.hours_this_month, 0) / workloads.length;
    const overloadedInstructors = workloads.filter(w => w.hours_this_month > avgHours * 1.5);
    const underloadedInstructors = workloads.filter(w => w.hours_this_month < avgHours * 0.5);

    if (overloadedInstructors.length > 0) {
      recommendations.push({
        type: 'redistribute',
        priority: 'high',
        message: `${overloadedInstructors.length} instructor(s) are overloaded. Consider redistributing sessions.`,
        affected_instructors: overloadedInstructors.map(i => i.instructor_id)
      });
    }

    if (underloadedInstructors.length > workloads.length * 0.3) {
      recommendations.push({
        type: 'redistribute',
        priority: 'medium',
        message: 'Several instructors have low teaching loads. Consider better distribution.',
        affected_instructors: underloadedInstructors.map(i => i.instructor_id)
      });
    }

    return recommendations;
  }

  private static calculateOptimalDistribution(
    current: InstructorWorkload[]
  ): InstructorWorkload[] {
    if (current.length === 0) return [];

    const totalHours = current.reduce((sum, w) => sum + w.hours_this_month, 0);
    const optimalHoursPerInstructor = totalHours / current.length;

    return current.map(instructor => ({
      ...instructor,
      hours_this_month: optimalHoursPerInstructor,
      sessions_this_month: Math.round(optimalHoursPerInstructor / 2) // Assuming 2 hours per session average
    }));
  }
}
