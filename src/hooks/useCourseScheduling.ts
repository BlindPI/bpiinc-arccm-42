
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CourseSchedulingService } from '@/services/courses/courseSchedulingService';
import { toast } from 'sonner';
import type { CourseSchedule, ScheduleFormData } from '@/types/courseScheduling';

export function useCourseScheduling() {
  const queryClient = useQueryClient();

  const createSchedule = useMutation({
    mutationFn: CourseSchedulingService.createSchedule,
    onSuccess: () => {
      toast.success('Course schedule created successfully');
      queryClient.invalidateQueries({ queryKey: ['course-schedules'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to create schedule: ${error.message}`);
    }
  });

  const enrollStudent = useMutation({
    mutationFn: ({ scheduleId, studentId }: { scheduleId: string; studentId: string }) =>
      CourseSchedulingService.enrollStudent(scheduleId, studentId),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ['course-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
    onError: (error: any) => {
      toast.error(`Enrollment failed: ${error.message}`);
    }
  });

  const getCourseSchedules = (courseId?: string) => {
    return useQuery({
      queryKey: ['course-schedules', courseId],
      queryFn: () => CourseSchedulingService.getCourseSchedules(courseId)
    });
  };

  const checkConflicts = useMutation({
    mutationFn: ({ instructorId, startDate, endDate }: { 
      instructorId: string; 
      startDate: string; 
      endDate: string; 
    }) => CourseSchedulingService.checkScheduleConflicts(instructorId, startDate, endDate)
  });

  return {
    createSchedule,
    enrollStudent,
    getCourseSchedules,
    checkConflicts
  };
}
