import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ThinkificProgressService, StudentWithProgress } from '@/services/enrollment/thinkificProgressService';
import { toast } from 'sonner';

export const useThinkificProgress = () => {
  return useQuery({
    queryKey: ['thinkific-progress'],
    queryFn: () => ThinkificProgressService.getStudentsWithProgress(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useThinkificCourses = () => {
  return useQuery({
    queryKey: ['thinkific-courses'],
    queryFn: () => ThinkificProgressService.getAvailableThinkificCourses(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useThinkificCourseProgress = (courseId: string | null) => {
  return useQuery({
    queryKey: ['thinkific-course-progress', courseId],
    queryFn: () => courseId ? ThinkificProgressService.getStudentsInThinkificCourse(courseId) : Promise.resolve([]),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useThinkificCourseStats = (courseId: string | null) => {
  return useQuery({
    queryKey: ['thinkific-course-stats', courseId],
    queryFn: () => courseId ? ThinkificProgressService.getCourseProgressStats(courseId) : Promise.resolve({
      total_students: 0,
      completed: 0,
      in_progress: 0,
      average_progress: 0,
      completion_rate: 0
    }),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useRefreshThinkificData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Invalidate all Thinkific-related queries to force refresh
      await queryClient.invalidateQueries({ queryKey: ['thinkific-progress'] });
      await queryClient.invalidateQueries({ queryKey: ['thinkific-courses'] });
      await queryClient.invalidateQueries({ queryKey: ['thinkific-course-progress'] });
      await queryClient.invalidateQueries({ queryKey: ['thinkific-course-stats'] });
    },
    onSuccess: () => {
      toast.success('Thinkific data refreshed');
    },
    onError: (error) => {
      console.error('Error refreshing Thinkific data:', error);
      toast.error('Failed to refresh Thinkific data');
    },
  });
};