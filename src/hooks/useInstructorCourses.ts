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

export function useCreateRosterForBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      bookingId, 
      rosterName,
      courseTitle 
    }: { 
      bookingId: string; 
      rosterName: string;
      courseTitle: string;
    }) => {
      const user = await supabase.auth.getUser();
      if (!user.data.user?.id) throw new Error('Not authenticated');
      
      // Create the roster linked to the booking with required fields
      const { data: roster, error: rosterError } = await supabase
        .from('student_rosters')
        .insert({
          roster_name: rosterName,
          course_name: courseTitle,
          availability_booking_id: bookingId,
          location_id: '06752dc0-3e19-4ece-98f8-c0b94c2eb818', // BPI INC location
          instructor_id: user.data.user.id,
          roster_status: 'active',
          roster_type: 'course',
          created_by: user.data.user.id
        })
        .select()
        .single();
      
      if (rosterError) throw rosterError;
      
      return roster;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-courses'] });
      toast.success('Roster created and assigned to course');
    },
    onError: (error: any) => {
      toast.error(`Failed to create roster: ${error.message}`);
    }
  });
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