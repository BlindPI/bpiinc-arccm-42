import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import { parseJsonToRecord } from '@/types/user-management';

// Database row interface matching the actual schema
interface StudentProfileRow {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  external_student_id?: string;
  is_active: boolean;
  enrollment_status: string;
  imported_from: string;
  import_date: string;
  last_sync_date?: string;
  sync_status: string;
  student_metadata: Json | null;
  created_at: string;
  updated_at: string;
}

// Public interface with transformed metadata
export interface StudentProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  external_student_id?: string;
  is_active: boolean;
  enrollment_status: string;
  imported_from: string;
  import_date: string;
  last_sync_date?: string;
  sync_status: string;
  student_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Certificate data
  certificate_count?: number;
  has_certificates?: boolean;
  latest_certificate_date?: string;
  certificate_status_summary?: {
    active: number;
    archived: number;
    pending: number;
  };
}

// Helper function to transform database row to public interface
function transformStudentProfile(row: StudentProfileRow): StudentProfile {
  return {
    ...row,
    student_metadata: parseJsonToRecord(row.student_metadata) || {}
  };
}

export interface StudentFilters {
  search?: string;
  enrollment_status?: string;
  imported_from?: string;
  is_active?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface StudentQueryResult {
  data: StudentProfile[];
  count: number;
  totalPages: number;
}

export function useStudentManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to enrich students with certificate data
  const enrichStudentsWithCertificates = useCallback(async (students: StudentProfile[]): Promise<StudentProfile[]> => {
    if (students.length === 0) return students;
    
    const emails = students.map(s => s.email);
    
    // Fetch certificate counts and status for these emails
    const { data: certificateData, error: certError } = await supabase
      .from('certificate_requests')
      .select('recipient_email, status, created_at')
      .in('recipient_email', emails);
    
    if (certError) {
      console.warn('Failed to fetch certificate data:', certError);
      return students;
    }
    
    // Group certificates by email
    const certificatesByEmail = certificateData?.reduce((acc, cert) => {
      const email = cert.recipient_email;
      if (!acc[email]) {
        acc[email] = [];
      }
      acc[email].push(cert);
      return acc;
    }, {} as Record<string, any[]>) || {};
    
    // Enrich students with certificate data
    return students.map(student => {
      const certificates = certificatesByEmail[student.email] || [];
      const certificateCount = certificates.length;
      const hasCertificates = certificateCount > 0;
      
      let latestCertificateDate: string | undefined;
      const statusSummary = { active: 0, archived: 0, pending: 0 };
      
      if (certificates.length > 0) {
        // Find latest certificate date
        latestCertificateDate = certificates
          .map(c => c.created_at)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
        
        // Count by status
        certificates.forEach(cert => {
          const status = cert.status?.toLowerCase();
          if (status === 'approved' || status === 'generated') {
            statusSummary.active++;
          } else if (status === 'archived') {
            statusSummary.archived++;
          } else {
            statusSummary.pending++;
          }
        });
      }
      
      return {
        ...student,
        certificate_count: certificateCount,
        has_certificates: hasCertificates,
        latest_certificate_date: latestCertificateDate,
        certificate_status_summary: statusSummary
      };
    });
  }, []);

  // Special function for certificate sorting that fetches all students, enriches, sorts, then paginates
  const fetchStudentsForCertificateSorting = useCallback(async (
    filters: StudentFilters,
    pagination: PaginationParams
  ): Promise<StudentQueryResult> => {
    console.log('🔍 Using certificate sorting function');
    
    // First, get all students matching the filters (except certificate sorting)
    let query = supabase
      .from('student_enrollment_profiles')
      .select('*', { count: 'exact' });

    // Apply non-certificate filters
    if (filters.search) {
      query = query.or(`email.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%`);
    }

    if (filters.enrollment_status) {
      query = query.eq('enrollment_status', filters.enrollment_status);
    }

    if (filters.imported_from) {
      query = query.eq('imported_from', filters.imported_from);
    }

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    // Don't apply pagination yet - we need all matching students to sort properly
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Transform all the data
    const transformedData = (data as StudentProfileRow[] || []).map(transformStudentProfile);
    
    // Enrich ALL students with certificate data
    const enrichedData = await enrichStudentsWithCertificates(transformedData);
    
    console.log('🔍 Certificate enriched data:', enrichedData.slice(0, 3).map(d => ({
      email: d.email,
      certificate_count: d.certificate_count,
      has_certificates: d.has_certificates
    })));
    
    // Sort by certificate data
    const sortedData = [...enrichedData].sort((a, b) => {
      const aCount = a.certificate_count || 0;
      const bCount = b.certificate_count || 0;
      
      // Primary sort by certificate count
      if (aCount !== bCount) {
        const comparison = aCount - bCount;
        return filters.sortOrder === 'asc' ? comparison : -comparison;
      }
      
      // Secondary sort by active certificates if counts are equal
      const aActive = a.certificate_status_summary?.active || 0;
      const bActive = b.certificate_status_summary?.active || 0;
      if (aActive !== bActive) {
        const activeComparison = aActive - bActive;
        return filters.sortOrder === 'asc' ? activeComparison : -activeComparison;
      }
      
      // Tertiary sort by latest certificate date
      const aDate = a.latest_certificate_date ? new Date(a.latest_certificate_date).getTime() : 0;
      const bDate = b.latest_certificate_date ? new Date(b.latest_certificate_date).getTime() : 0;
      const dateComparison = aDate - bDate;
      return filters.sortOrder === 'asc' ? dateComparison : -dateComparison;
    });
    
    console.log('🔍 Sorted data:', sortedData.slice(0, 3).map(d => ({
      email: d.email,
      certificate_count: d.certificate_count,
      has_certificates: d.has_certificates
    })));
    
    // Now apply pagination to the sorted results
    const totalPages = Math.ceil((count || 0) / pagination.pageSize);
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize;
    const paginatedData = sortedData.slice(from, to);

    return {
      data: paginatedData,
      count: count || 0,
      totalPages
    };
  }, [enrichStudentsWithCertificates]);

  const fetchStudents = useCallback(async (
    filters: StudentFilters = {},
    pagination: PaginationParams = { page: 1, pageSize: 50 }
  ): Promise<StudentQueryResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // Special handling for certificate sorting - route to different function
      if (filters.sortBy === 'certificates') {
        console.log('🔍 Routing to certificate sorting function with filters:', filters);
        const result = await fetchStudentsForCertificateSorting(filters, pagination);
        setIsLoading(false);
        return result;
      }

      let query = supabase
        .from('student_enrollment_profiles')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.or(`email.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%`);
      }

      if (filters.enrollment_status) {
        query = query.eq('enrollment_status', filters.enrollment_status);
      }

      if (filters.imported_from) {
        query = query.eq('imported_from', filters.imported_from);
      }

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      // Apply pagination
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);

      // Apply sorting (skip database sorting for certificates as it's enriched client-side)
      if (filters.sortBy && filters.sortOrder && filters.sortBy !== 'certificates') {
        // Handle special case for enrollments_list sorting
        if (filters.sortBy === 'enrollments_list') {
          query = query.order('student_metadata->enrollments_list', { ascending: filters.sortOrder === 'asc' });
        } else {
          query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });
        }
      } else if (!filters.sortBy || filters.sortBy !== 'certificates') {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      const totalPages = Math.ceil((count || 0) / pagination.pageSize);

      // Transform the data to convert Json metadata to Record<string, any>
      const transformedData = (data as StudentProfileRow[] || []).map(transformStudentProfile);
      
      // Enrich with certificate data
      const enrichedData = await enrichStudentsWithCertificates(transformedData);

      return {
        data: enrichedData,
        count: count || 0,
        totalPages
      };
    } catch (err: any) {
      setError(err.message);
      toast.error(`Failed to fetch students: ${err.message}`);
      return { data: [], count: 0, totalPages: 0 };
    } finally {
      setIsLoading(false);
    }
  }, [enrichStudentsWithCertificates, fetchStudentsForCertificateSorting]);

  const updateStudent = useCallback(async (
    id: string,
    updates: Partial<Omit<StudentProfile, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('student_enrollment_profiles')
        .update(updates)
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success('Student profile updated successfully');
      return true;
    } catch (err: any) {
      setError(err.message);
      toast.error(`Failed to update student: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteStudent = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('student_enrollment_profiles')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast.success('Student profile deleted successfully');
      return true;
    } catch (err: any) {
      setError(err.message);
      toast.error(`Failed to delete student: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const bulkUpdateStatus = useCallback(async (
    studentIds: string[],
    status: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('student_enrollment_profiles')
        .update({ enrollment_status: status })
        .in('id', studentIds);

      if (error) {
        throw error;
      }

      toast.success(`Updated ${studentIds.length} student(s) status to ${status}`);
      return true;
    } catch (err: any) {
      setError(err.message);
      toast.error(`Failed to bulk update: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    fetchStudents,
    updateStudent,
    deleteStudent,
    bulkUpdateStatus,
    isLoading,
    error
  };
}