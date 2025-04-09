import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Enrollment, EnrollmentInsert } from '@/types/enrollment';

export const useEnrollments = (courseOfferingId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['enrollments', courseOfferingId],
    queryFn: async () => {
      let query = supabase
        .from('enrollments')
        .select(`
          *,
          profiles:user_id(display_name, email)
        `)
        .order('enrollment_date', { ascending: false });
      
      if (courseOfferingId) {
        query = query.eq('course_offering_id', courseOfferingId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Use as unknown first to handle the type mismatch
      return (data as unknown) as Array<Enrollment & {
        profiles: { display_name: string; email: string | null };
      }>;
    },
    enabled: !!user,
  });
};

export const useUserEnrollments = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-enrollments', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          course_offerings:course_offering_id(
            start_date, 
            end_date,
            courses:course_id(name),
            locations:location_id(name, address, city)
          )
        `)
        .eq('user_id', user.id)
        .order('enrollment_date', { ascending: false });
      
      if (error) throw error;
      return data as Array<Enrollment & {
        course_offerings: {
          start_date: string;
          end_date: string;
          courses: { name: string };
          locations: { name: string; address: string | null; city: string | null } | null;
        };
      }>;
    },
    enabled: !!user?.id,
  });
};

export const useCreateEnrollment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (enrollmentData: EnrollmentInsert) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // First check if the course is full
      const { data: offering, error: offeringError } = await supabase
        .from('course_offerings')
        .select('max_participants')
        .eq('id', enrollmentData.course_offering_id)
        .single();
      
      if (offeringError) throw offeringError;
      
      // Count current enrollments
      const { count, error: countError } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_offering_id', enrollmentData.course_offering_id)
        .eq('status', 'ENROLLED');
      
      if (countError) throw countError;
      
      // Determine if the student should be enrolled or waitlisted
      const status = (count && offering) 
        ? (count >= offering.max_participants ? 'WAITLISTED' : 'ENROLLED') 
        : 'ENROLLED';
      
      // Calculate waitlist position if needed
      let waitlistPosition = 0;
      if (status === 'WAITLISTED') {
        const { count: waitlistCount, error: waitlistError } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('course_offering_id', enrollmentData.course_offering_id)
          .eq('status', 'WAITLISTED');
        
        if (waitlistError) throw waitlistError;
        waitlistPosition = (waitlistCount || 0) + 1;
      }
      
      const insertData = {
        user_id: enrollmentData.user_id,
        course_offering_id: enrollmentData.course_offering_id,
        status,
        attendance: enrollmentData.attendance,
        attendance_notes: enrollmentData.attendance_notes,
        waitlist_position: status === 'WAITLISTED' ? waitlistPosition : null
      };
      
      const { data, error } = await supabase
        .from('enrollments')
        .insert([insertData])
        .select()
        .single();
      
      if (error) throw error;
      
      return data as Enrollment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', variables.course_offering_id] });
      queryClient.invalidateQueries({ queryKey: ['user-enrollments', user?.id] });
      toast.success('Enrollment successful');
    },
    onError: (error: any) => {
      toast.error(`Enrollment failed: ${error.message}`);
    }
  });
};

export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      enrollmentId, 
      attendance, 
      notes 
    }: { 
      enrollmentId: string; 
      attendance: Enrollment['attendance']; 
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('enrollments')
        .update({
          attendance,
          attendance_notes: notes
        })
        .eq('id', enrollmentId)
        .select()
        .single();
      
      if (error) throw error;
      return data as Enrollment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', data.course_offering_id] });
      toast.success('Attendance updated');
    },
    onError: (error: any) => {
      toast.error(`Failed to update attendance: ${error.message}`);
    }
  });
};

export const useCancelEnrollment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // First get the enrollment to find course offering
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('id', enrollmentId)
        .single();
      
      if (enrollmentError) throw enrollmentError;
      
      // Update the enrollment status
      const { data, error } = await supabase
        .from('enrollments')
        .update({
          status: 'CANCELLED'
        })
        .eq('id', enrollmentId)
        .select()
        .single();
      
      if (error) throw error;
      
      // If this was an enrolled (not waitlisted) student, promote the first waitlisted student
      if (enrollment.status === 'ENROLLED') {
        // Find the first waitlisted student
        const { data: waitlistedStudent, error: waitlistError } = await supabase
          .from('enrollments')
          .select('*')
          .eq('course_offering_id', enrollment.course_offering_id)
          .eq('status', 'WAITLISTED')
          .order('waitlist_position', { ascending: true })
          .limit(1)
          .single();
        
        if (!waitlistError && waitlistedStudent) {
          // Promote the student
          await supabase
            .from('enrollments')
            .update({
              status: 'ENROLLED',
              waitlist_position: null
            })
            .eq('id', waitlistedStudent.id);
          
          // Send notification to promoted student
          await supabase.from('notifications').insert([{
            user_id: waitlistedStudent.user_id,
            title: 'Enrollment Status Updated',
            message: 'You have been moved from the waitlist to enrolled status for a course.',
            type: 'SUCCESS',
            priority: 'HIGH',
            category: 'COURSE'
          }]);
        }
      }
      
      return data as Enrollment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', data.course_offering_id] });
      queryClient.invalidateQueries({ queryKey: ['user-enrollments', user?.id] });
      toast.success('Enrollment cancelled');
    },
    onError: (error: any) => {
      toast.error(`Failed to cancel enrollment: ${error.message}`);
    }
  });
};

export const useWaitlist = (courseOfferingId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['waitlist', courseOfferingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          profiles:user_id(display_name, email)
        `)
        .eq('course_offering_id', courseOfferingId)
        .eq('status', 'WAITLISTED')
        .order('waitlist_position', { ascending: true });
      
      if (error) throw error;
      
      // Use as unknown first to handle the type mismatch
      return (data as unknown) as Array<Enrollment & {
        profiles: { display_name: string; email: string | null };
      }>;
    },
    enabled: !!courseOfferingId && !!user,
  });
};
