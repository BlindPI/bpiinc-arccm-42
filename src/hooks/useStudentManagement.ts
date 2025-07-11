import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
}

export interface StudentFilters {
  search?: string;
  enrollment_status?: string;
  imported_from?: string;
  is_active?: boolean;
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

  const fetchStudents = useCallback(async (
    filters: StudentFilters = {},
    pagination: PaginationParams = { page: 1, pageSize: 50 }
  ): Promise<StudentQueryResult> => {
    setIsLoading(true);
    setError(null);

    try {
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

      // Order by created_at desc
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      const totalPages = Math.ceil((count || 0) / pagination.pageSize);

      return {
        data: data || [],
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
  }, []);

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