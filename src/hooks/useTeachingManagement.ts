
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TeachingManagementService } from '@/services/teaching/teachingManagementService';
import { toast } from 'sonner';
import type { TeachingSession, SessionAttendance, ComplianceCheck } from '@/services/teaching/teachingManagementService';

export function useTeachingManagement() {
  const queryClient = useQueryClient();

  // Create teaching session
  const createSession = useMutation({
    mutationFn: TeachingManagementService.createTeachingSession,
    onSuccess: () => {
      toast.success('Teaching session created successfully');
      queryClient.invalidateQueries({ queryKey: ['teaching-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['instructor-workload'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to create session: ${error.message}`);
    }
  });

  // Record session attendance
  const recordAttendance = useMutation({
    mutationFn: ({ sessionId, attendees }: { sessionId: string; attendees: SessionAttendance[] }) =>
      TeachingManagementService.recordSessionAttendance(sessionId, attendees),
    onSuccess: () => {
      toast.success('Attendance recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['teaching-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session-attendance'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to record attendance: ${error.message}`);
    }
  });

  // Get teaching sessions
  const useTeachingSessions = (instructorId?: string, period?: 'monthly' | 'quarterly' | 'yearly') => {
    return useQuery({
      queryKey: ['teaching-sessions', instructorId, period],
      queryFn: () => TeachingManagementService.getTeachingSessions(instructorId, period)
    });
  };

  // Get instructor workload
  const useInstructorWorkload = (instructorId?: string) => {
    return useQuery({
      queryKey: ['instructor-workload', instructorId],
      queryFn: () => TeachingManagementService.getInstructorWorkload(instructorId)
    });
  };

  // Generate compliance report
  const generateComplianceReport = useMutation({
    mutationFn: ({ instructorId, period }: { instructorId: string; period: 'monthly' | 'quarterly' | 'yearly' }) =>
      TeachingManagementService.generateComplianceReport(instructorId, period),
    onError: (error: any) => {
      toast.error(`Failed to generate compliance report: ${error.message}`);
    }
  });

  // Balance instructor load
  const balanceLoad = useMutation({
    mutationFn: TeachingManagementService.balanceInstructorLoad,
    onSuccess: () => {
      toast.success('Load balancing analysis completed');
    },
    onError: (error: any) => {
      toast.error(`Failed to balance load: ${error.message}`);
    }
  });

  return {
    createSession,
    recordAttendance,
    useTeachingSessions,
    useInstructorWorkload,
    generateComplianceReport,
    balanceLoad
  };
}
