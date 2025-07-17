import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { DatabaseUserRole, ROLE_HIERARCHY } from '@/types/database-roles';
import UnifiedDatabaseService from './UnifiedDatabaseService';

type Tables = Database['public']['Tables'];

/**
 * Production-ready query optimization service
 * Implements optimized query patterns from DATABASE_INTEGRATION_ARCHITECTURE.md
 */
export class OptimizedQueryService {
  
  /**
   * Dashboard data aggregation with single optimized query
   * Combines multiple data sources efficiently
   */
  static async getDashboardData(
    userRole: DatabaseUserRole,
    userId: string,
    locationId?: string
  ): Promise<{
    sessions: any[];
    certificates: any;
    compliance: any;
    teams: any;
  }> {
    try {
      // Parallel queries for optimal performance
      const [sessionsResult, certificatesResult, complianceResult, teamsResult] = await Promise.all([
        this.getSessionsData(userRole, userId, locationId),
        this.getCertificatesData(userRole, userId, locationId),
        this.getComplianceData(userRole, userId),
        this.getTeamsData(userRole, userId, locationId)
      ]);

      return {
        sessions: sessionsResult.data || [],
        certificates: certificatesResult.data || {},
        compliance: complianceResult.data || {},
        teams: teamsResult.data || []
      };
    } catch (error: any) {
      console.error('Dashboard query failed:', error);
      throw new Error(`Dashboard data fetch failed: ${error.message}`);
    }
  }

  /**
   * Optimized sessions query with role-based filtering
   */
  private static async getSessionsData(
    userRole: DatabaseUserRole,
    userId: string,
    locationId?: string
  ): Promise<{ data: any[] | null; error: any }> {
    let query = supabase
      .from('training_sessions')
      .select(`
        id,
        title,
        session_date,
        start_time,
        end_time,
        status,
        current_enrollment,
        max_capacity,
        instructor_profiles!inner(
          display_name,
          specialties
        ),
        locations!inner(
          name,
          address
        )
      `)
      .order('session_date', { ascending: true })
      .limit(20);

    // Apply role-based filters
    query = UnifiedDatabaseService.applyRoleBasedFilters(query, userRole, userId, locationId);

    return query;
  }

  /**
   * Optimized certificates query with aggregation
   */
  private static async getCertificatesData(
    userRole: DatabaseUserRole,
    userId: string,
    locationId?: string
  ): Promise<{ data: any; error?: any }> {
    let query = supabase
      .from('certificates')
      .select(`
        id,
        status,
        created_at,
        course_name,
        recipient_name
      `)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });

    query = UnifiedDatabaseService.applyRoleBasedFilters(query, userRole, userId, locationId);

    const { data, error } = await query;
    
    if (error) throw error;

    // Calculate metrics
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return {
      data: {
        total: data?.length || 0,
        recent: data?.filter(cert => new Date(cert.created_at) >= oneWeekAgo).length || 0,
        byStatus: data?.reduce((acc, cert) => {
          acc[cert.status] = (acc[cert.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {}
      }
    };
  }

  /**
   * Compliance metrics query
   */
  private static async getComplianceData(userRole: DatabaseUserRole, userId: string): Promise<{ data: any; error?: any }> {
    if (userRole === 'IT' || userRole === 'IN') {
      // Individual compliance for trainees
      const { data, error } = await supabase
        .from('profiles')
        .select('compliance_score, compliance_tier, compliance_status')
        .eq('id', userId)
        .single();

      return { data: data || { compliance_score: 0, compliance_tier: 'basic', compliance_status: false } };
    }

    // Aggregate compliance for managers
    const { data, error } = await supabase
      .from('profiles')
      .select('compliance_score, compliance_tier, compliance_status')
      .eq('status', 'ACTIVE');

    if (error) throw error;

    return {
      data: {
        averageScore: data?.reduce((sum, p) => sum + (p.compliance_score || 0), 0) / (data?.length || 1) || 0,
        robustTierCount: data?.filter(p => p.compliance_tier === 'robust').length || 0,
        compliantCount: data?.filter(p => p.compliance_status === true).length || 0,
        totalUsers: data?.length || 0
      }
    };
  }

  /**
   * Teams data query with member counts
   */
  private static async getTeamsData(
    userRole: DatabaseUserRole,
    userId: string,
    locationId?: string
  ): Promise<{ data: any[] | null; error: any }> {
    let query = supabase
      .from('teams')
      .select(`
        id,
        name,
        description,
        team_type,
        status,
        performance_score,
        created_at,
        team_members(count)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10);

    // Apply role-based filtering
    if (userRole === 'AP' && locationId) {
      query = query.eq('location_id', locationId);
    } else if (['IC', 'IP', 'IT', 'IN'].includes(userRole)) {
      query = query.eq('created_by', userId);
    }

    return query;
  }

  /**
   * Calendar view optimization with date range filtering
   */
  static async getCalendarSessions(
    startDate: Date,
    endDate: Date,
    userRole: DatabaseUserRole,
    userId: string,
    locationId?: string
  ): Promise<any[]> {
    let query = supabase
      .from('training_sessions')
      .select(`
        id,
        title,
        session_date,
        start_time,
        end_time,
        current_enrollment,
        max_capacity,
        status,
        instructor_profiles!inner(
          display_name,
          specialties
        ),
        locations!inner(
          name,
          address
        )
      `)
      .gte('session_date', startDate.toISOString().split('T')[0])
      .lte('session_date', endDate.toISOString().split('T')[0])
      .order('session_date', { ascending: true })
      .order('start_time', { ascending: true });

    query = UnifiedDatabaseService.applyRoleBasedFilters(query, userRole, userId, locationId);

    const { data, error } = await query;
    if (error) throw new Error(`Calendar query failed: ${error.message}`);
    
    return (data || []).map(session => ({
      ...session,
      enrollment_percentage: (session.current_enrollment / session.max_capacity) * 100,
      is_full: session.current_enrollment >= session.max_capacity,
      spots_remaining: session.max_capacity - session.current_enrollment
    }));
  }

  /**
   * Batch certificate generation with optimized queries
   */
  static async generateBatchCertificates(
    rosterId: string,
    templateId: string,
    issuedBy: string,
    userRole: DatabaseUserRole
  ): Promise<{
    success: boolean;
    certificatesGenerated: number;
    certificates: any[];
  }> {
    // Validate permissions
    if (ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY['AP']) {
      throw new Error('Insufficient permissions to generate certificates');
    }

    // Single optimized query to get all roster member data
    const { data: rosterMembers, error: rosterError } = await supabase
      .from('student_roster_members')
      .select(`
        id,
        student_profile_id,
        practical_score,
        written_score,
        completion_status,
        student_enrollment_profiles!inner(
          first_name,
          last_name,
          email,
          company
        ),
        rosters!inner(
          name,
          instructor_name,
          issue_date,
          locations!inner(name)
        )
      `)
      .eq('roster_id', rosterId)
      .eq('completion_status', 'completed');

    if (rosterError) throw new Error(`Roster query failed: ${rosterError.message}`);

    if (!rosterMembers || rosterMembers.length === 0) {
      return {
        success: true,
        certificatesGenerated: 0,
        certificates: []
      };
    }

    // Generate verification codes and prepare certificate data
    const certificates = rosterMembers.map(member => ({
      recipient_name: `${member.student_enrollment_profiles.first_name} ${member.student_enrollment_profiles.last_name}`,
      recipient_email: member.student_enrollment_profiles.email,
      course_name: member.rosters.name,
      instructor_name: member.rosters.instructor_name,
      issued_by: issuedBy,
      template_id: templateId,
      roster_id: rosterId,
      user_id: member.student_profile_id,
      verification_code: this.generateVerificationCode(),
      issue_date: member.rosters.issue_date || new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      generation_status: 'COMPLETED'
    }));

    // Batch insert certificates using UnifiedDatabaseService
    const insertedCertificates = await UnifiedDatabaseService.batchInsert(
      'certificates',
      certificates,
      userRole,
      {
        chunkSize: 500,
        onProgress: (processed, total) => {
          console.log(`Certificate generation progress: ${processed}/${total}`);
        }
      }
    );

    return {
      success: true,
      certificatesGenerated: insertedCertificates.length,
      certificates: insertedCertificates
    };
  }

  /**
   * Generate unique verification code
   */
  private static generateVerificationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Performance analytics query
   */
  static async getPerformanceMetrics(
    userRole: DatabaseUserRole,
    userId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<{
    sessionMetrics: any;
    certificateMetrics: any;
    enrollmentMetrics: any;
  }> {
    const startDate = dateRange.start.toISOString().split('T')[0];
    const endDate = dateRange.end.toISOString().split('T')[0];

    // Parallel performance queries
    const [sessionMetrics, certificateMetrics, enrollmentMetrics] = await Promise.all([
      this.getSessionPerformanceMetrics(userRole, userId, startDate, endDate),
      this.getCertificatePerformanceMetrics(userRole, userId, startDate, endDate),
      this.getEnrollmentPerformanceMetrics(userRole, userId, startDate, endDate)
    ]);

    return {
      sessionMetrics: sessionMetrics.data || {},
      certificateMetrics: certificateMetrics.data || {},
      enrollmentMetrics: enrollmentMetrics.data || {}
    };
  }

  private static async getSessionPerformanceMetrics(
    userRole: DatabaseUserRole,
    userId: string,
    startDate: string,
    endDate: string
  ) {
    let query = supabase
      .from('training_sessions')
      .select('id, status, current_enrollment, max_capacity, session_date')
      .gte('session_date', startDate)
      .lte('session_date', endDate);

    query = UnifiedDatabaseService.applyRoleBasedFilters(query, userRole, userId);

    const { data, error } = await query;
    if (error) throw error;

    return {
      data: {
        totalSessions: data?.length || 0,
        completedSessions: data?.filter(s => s.status === 'COMPLETED').length || 0,
        averageCapacity: data?.reduce((sum, s) => sum + (s.current_enrollment / s.max_capacity), 0) / (data?.length || 1) || 0,
        totalEnrollments: data?.reduce((sum, s) => sum + s.current_enrollment, 0) || 0
      }
    };
  }

  private static async getCertificatePerformanceMetrics(
    userRole: DatabaseUserRole,
    userId: string,
    startDate: string,
    endDate: string
  ) {
    let query = supabase
      .from('certificates')
      .select('id, status, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    query = UnifiedDatabaseService.applyRoleBasedFilters(query, userRole, userId);

    const { data, error } = await query;
    if (error) throw error;

    return {
      data: {
        totalCertificates: data?.length || 0,
        activeCertificates: data?.filter(c => c.status === 'ACTIVE').length || 0,
        issuanceRate: (data?.length || 0) / ((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) || 0
      }
    };
  }

  private static async getEnrollmentPerformanceMetrics(
    userRole: DatabaseUserRole,
    userId: string,
    startDate: string,
    endDate: string
  ) {
    let query = supabase
      .from('session_enrollments')
      .select('id, completion_status, attendance_status, enrollment_date')
      .gte('enrollment_date', startDate)
      .lte('enrollment_date', endDate);

    query = UnifiedDatabaseService.applyRoleBasedFilters(query, userRole, userId);

    const { data, error } = await query;
    if (error) throw error;

    return {
      data: {
        totalEnrollments: data?.length || 0,
        completedEnrollments: data?.filter(e => e.completion_status === 'COMPLETED').length || 0,
        attendanceRate: data?.filter(e => e.attendance_status === 'ATTENDED').length / (data?.length || 1) || 0,
        completionRate: data?.filter(e => e.completion_status === 'COMPLETED').length / (data?.length || 1) || 0
      }
    };
  }
}

export default OptimizedQueryService;