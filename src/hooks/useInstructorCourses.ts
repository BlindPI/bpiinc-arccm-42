import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface InstructorCourse {
  booking_id: string;
  title: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  roster_id: string | null;
  roster_name: string | null;
  student_count: number;
  completion_status: string;
}

export function useInstructorCourses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const coursesQuery = useQuery({
    queryKey: ['instructor-courses', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');
      
      const { data, error } = await supabase.rpc('get_instructor_assigned_courses', {
        p_instructor_id: user.id
      });
      
      if (error) throw error;
      return data as InstructorCourse[];
    },
    enabled: !!user?.id
  });

  return {
    data: coursesQuery.data || [],
    isLoading: coursesQuery.isLoading,
    error: coursesQuery.error,
    refetch: coursesQuery.refetch
  };
}

export function useRosterStudents(rosterId: string | null) {
  return useQuery({
    queryKey: ['roster-students', rosterId],
    queryFn: async () => {
      if (!rosterId) return [];
      
      const { data, error } = await supabase
        .from('student_roster_members')
        .select(`
          *,
          student_enrollment_profiles(
            display_name,
            email,
            first_name,
            last_name
          )
        `)
        .eq('roster_id', rosterId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!rosterId
  });
}

export function useUpdateStudentAssessment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      studentId, 
      updates 
    }: { 
      studentId: string; 
      updates: {
        attendance_status?: string;
        practical_score?: number;
        written_score?: number;
        completion_status?: string;
        completion_date?: string;
        notes?: string;
        assessed_by?: string;
      }
    }) => {
      const { data, error } = await supabase
        .from('student_roster_members')
        .update(updates)
        .eq('id', studentId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { updates }) => {
      queryClient.invalidateQueries({ queryKey: ['roster-students'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      toast.success('Student assessment updated');
    },
    onError: (error: any) => {
      toast.error(`Failed to update assessment: ${error.message}`);
    }
  });
}

export function useBulkUpdateAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      rosterId, 
      attendanceStatus,
      assessedBy 
    }: { 
      rosterId: string; 
      attendanceStatus: string;
      assessedBy: string;
    }) => {
      const { data, error } = await supabase
        .from('student_roster_members')
        .update({ 
          attendance_status: attendanceStatus,
          assessed_by: assessedBy 
        })
        .eq('roster_id', rosterId);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roster-students'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      toast.success('Bulk attendance updated');
    },
    onError: (error: any) => {
      toast.error(`Failed to update attendance: ${error.message}`);
    }
  });
}