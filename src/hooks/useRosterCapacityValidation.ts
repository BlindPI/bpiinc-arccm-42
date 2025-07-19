import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EnrollmentService } from '@/services/enrollment/enrollmentService';
import { RosterEnrollmentIntegration } from '@/services/enrollment/rosterEnrollmentIntegration';
import type {
  CapacityValidationResult,
  RosterCapacityInfo,
  RosterEnrollmentParams,
  BatchRosterEnrollmentParams,
  WaitlistPromotionParams,
  WaitlistPromotionResult,
  CapacityStatus
} from '@/types/roster-enrollment';
import type { DatabaseUserRole } from '@/types/database-roles';

// ============================================================================
// HOOK INTERFACES
// ============================================================================

export interface UseRosterCapacityValidationOptions {
  rosterId: string;
  additionalStudents?: number;
  includeWaitlist?: boolean;
  autoRefresh?: boolean;
  refetchInterval?: number;
}

export interface UseRosterCapacityValidationReturn {
  // Capacity Data
  capacityInfo: RosterCapacityInfo | undefined;
  capacityStatus: CapacityValidationResult | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  
  // Capacity Helpers
  canEnroll: boolean;
  availableSpots: number | null;
  utilizationPercentage: number;
  capacityStatusType: CapacityStatus;
  isNearlyFull: boolean;
  isFull: boolean;
  isOverCapacity: boolean;
  
  // Enrollment Actions
  enrollStudent: (params: Omit<RosterEnrollmentParams, 'rosterId'>) => Promise<void>;
  enrollStudentBatch: (params: Omit<BatchRosterEnrollmentParams, 'rosterId'>) => Promise<void>;
  promoteFromWaitlist: (params: Omit<WaitlistPromotionParams, 'rosterId'>) => Promise<WaitlistPromotionResult>;
  
  // State Management
  refetch: () => void;
  invalidateQueries: () => void;
  
  // Loading States
  isEnrolling: boolean;
  isPromoting: boolean;
  isBatchEnrolling: boolean;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useRosterCapacityValidation({
  rosterId,
  additionalStudents = 0,
  includeWaitlist = true,
  autoRefresh = false,
  refetchInterval = 30000 // 30 seconds
}: UseRosterCapacityValidationOptions): UseRosterCapacityValidationReturn {
  const queryClient = useQueryClient();

  // ============================================================================
  // QUERIES
  // ============================================================================

  // Main capacity validation query
  const {
    data: capacityStatus,
    isLoading: isCapacityLoading,
    isError: isCapacityError,
    error: capacityError,
    refetch: refetchCapacity
  } = useQuery({
    queryKey: ['roster-capacity-status', rosterId, additionalStudents, includeWaitlist],
    queryFn: () => EnrollmentService.checkRosterCapacityStatus(
      rosterId,
      additionalStudents,
      includeWaitlist
    ),
    enabled: !!rosterId,
    refetchInterval: autoRefresh ? refetchInterval : false,
    staleTime: 10000, // Consider data stale after 10 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // Basic capacity info query (lighter weight)
  const {
    data: capacityInfo,
    isLoading: isInfoLoading,
    isError: isInfoError,
    error: infoError
  } = useQuery({
    queryKey: ['roster-capacity-info', rosterId],
    queryFn: () => EnrollmentService.getRosterCapacityInfo(rosterId),
    enabled: !!rosterId,
    refetchInterval: autoRefresh ? refetchInterval : false,
    staleTime: 15000, // Basic info can be stale for longer
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  // Single student enrollment mutation
  const enrollStudentMutation = useMutation({
    mutationFn: async (params: Omit<RosterEnrollmentParams, 'rosterId'>) => {
      const result = await RosterEnrollmentIntegration.enrollStudentSafely({
        rosterId,
        ...params
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Enrollment failed');
      }
      
      return result;
    },
    onSuccess: (result) => {
      // Invalidate capacity queries to get fresh data
      queryClient.invalidateQueries({ 
        queryKey: ['roster-capacity-status', rosterId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['roster-capacity-info', rosterId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['student-rosters'] 
      });
      
      // Show success toast
      const enrollmentStatus = result.results.enrollment?.enrollment_status;
      const message = enrollmentStatus === 'waitlisted' 
        ? 'Student added to waitlist successfully'
        : 'Student enrolled successfully';
      
      toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(`Enrollment failed: ${error.message}`);
    }
  });

  // Batch enrollment mutation
  const batchEnrollMutation = useMutation({
    mutationFn: async (params: Omit<BatchRosterEnrollmentParams, 'rosterId'>) => {
      const result = await RosterEnrollmentIntegration.enrollStudentsBatch({
        rosterId,
        ...params
      });
      
      if (!result.success) {
        throw new Error(`Batch enrollment failed: ${result.failedEnrollments} of ${result.totalRequested} failed`);
      }
      
      return result;
    },
    onSuccess: (result) => {
      // Invalidate capacity queries
      queryClient.invalidateQueries({ 
        queryKey: ['roster-capacity-status', rosterId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['roster-capacity-info', rosterId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['student-rosters'] 
      });
      
      // Show detailed success/warning toast
      const { successfulEnrollments, failedEnrollments, totalRequested } = result;
      
      if (failedEnrollments === 0) {
        toast.success(`All ${successfulEnrollments} students enrolled successfully`);
      } else {
        toast.warning(
          `${successfulEnrollments} students enrolled, ${failedEnrollments} failed`,
          {
            description: 'Check the detailed results for more information'
          }
        );
      }
    },
    onError: (error: Error) => {
      toast.error(`Batch enrollment failed: ${error.message}`);
    }
  });

  // Waitlist promotion mutation
  const promoteWaitlistMutation = useMutation({
    mutationFn: async (params: Omit<WaitlistPromotionParams, 'rosterId'>) => {
      return await EnrollmentService.promoteFromWaitlist(
        rosterId,
        params.promotedBy,
        params.userRole,
        params.maxPromotions
      );
    },
    onSuccess: (result: WaitlistPromotionResult) => {
      // Invalidate capacity queries
      queryClient.invalidateQueries({ 
        queryKey: ['roster-capacity-status', rosterId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['roster-capacity-info', rosterId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['student-rosters'] 
      });
      
      // Show success toast
      if (result.promotedCount > 0) {
        toast.success(
          `${result.promotedCount} student${result.promotedCount === 1 ? '' : 's'} promoted from waitlist`,
          {
            description: `${result.remainingWaitlist} students remaining on waitlist`
          }
        );
      } else {
        toast.info('No students were promoted from waitlist');
      }
    },
    onError: (error: Error) => {
      toast.error(`Waitlist promotion failed: ${error.message}`);
    }
  });

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const isLoading = isCapacityLoading || isInfoLoading;
  const isError = isCapacityError || isInfoError;
  const error = capacityError || infoError;

  // Capacity calculation helpers
  const maxCapacity = capacityInfo?.max_capacity;
  const currentEnrollment = capacityInfo?.current_enrollment || 0;
  const availableSpots = capacityInfo?.available_spots;
  const canEnroll = capacityInfo?.can_enroll || false;

  const utilizationPercentage = maxCapacity && maxCapacity > 0 
    ? Math.round((currentEnrollment / maxCapacity) * 100)
    : 0;

  // Determine capacity status type
  const getCapacityStatusType = (): CapacityStatus => {
    if (!maxCapacity) return 'UNLIMITED';
    if (currentEnrollment === 0) return 'EMPTY';
    if (currentEnrollment > maxCapacity) return 'OVER_CAPACITY';
    if (currentEnrollment === maxCapacity) return 'FULL';
    if (utilizationPercentage >= 80) return 'NEARLY_FULL';
    return 'AVAILABLE';
  };

  const capacityStatusType = getCapacityStatusType();
  const isNearlyFull = capacityStatusType === 'NEARLY_FULL';
  const isFull = capacityStatusType === 'FULL';
  const isOverCapacity = capacityStatusType === 'OVER_CAPACITY';

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ 
      queryKey: ['roster-capacity-status', rosterId] 
    });
    queryClient.invalidateQueries({ 
      queryKey: ['roster-capacity-info', rosterId] 
    });
  };

  const refetch = () => {
    refetchCapacity();
  };

  // ============================================================================
  // RETURN OBJECT
  // ============================================================================

  return {
    // Capacity Data
    capacityInfo,
    capacityStatus,
    isLoading,
    isError,
    error,
    
    // Capacity Helpers
    canEnroll,
    availableSpots,
    utilizationPercentage,
    capacityStatusType,
    isNearlyFull,
    isFull,
    isOverCapacity,
    
    // Enrollment Actions
    enrollStudent: enrollStudentMutation.mutateAsync,
    enrollStudentBatch: batchEnrollMutation.mutateAsync,
    promoteFromWaitlist: promoteWaitlistMutation.mutateAsync,
    
    // State Management
    refetch,
    invalidateQueries,
    
    // Loading States
    isEnrolling: enrollStudentMutation.isPending,
    isPromoting: promoteWaitlistMutation.isPending,
    isBatchEnrolling: batchEnrollMutation.isPending,
  };
}

// ============================================================================
// ADDITIONAL HOOKS FOR SPECIFIC USE CASES
// ============================================================================

/**
 * Lightweight hook for just checking if enrollment is possible
 */
export function useCanEnrollStudent(rosterId: string, studentCount: number = 1) {
  return useQuery({
    queryKey: ['can-enroll-students', rosterId, studentCount],
    queryFn: () => EnrollmentService.canEnrollStudents(rosterId, studentCount),
    enabled: !!rosterId,
    staleTime: 5000,
    gcTime: 2 * 60 * 1000,
  });
}

/**
 * Hook for getting capacity metrics across multiple rosters
 */
export function useRosterCapacityMetrics(rosterId?: string) {
  return useQuery({
    queryKey: ['roster-capacity-metrics', rosterId],
    queryFn: () => EnrollmentService.getRosterCapacityMetrics(rosterId),
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for auto-promoting from waitlists across all rosters
 */
export function useAutoPromoteWaitlists() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      promotedBy: string;
      userRole: DatabaseUserRole;
      maxPromotionsPerRoster?: number;
    }) => {
      return await EnrollmentService.autoPromoteFromWaitlists(
        params.promotedBy,
        params.userRole,
        params.maxPromotionsPerRoster
      );
    },
    onSuccess: (result) => {
      // Invalidate all capacity-related queries
      queryClient.invalidateQueries({ 
        queryKey: ['roster-capacity-status'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['roster-capacity-info'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['student-rosters'] 
      });
      
      toast.success(
        `Auto-promotion completed: ${result.totalPromoted} students promoted`,
        {
          description: `${result.rosterResults.length} rosters processed`
        }
      );
    },
    onError: (error: Error) => {
      toast.error(`Auto-promotion failed: ${error.message}`);
    }
  });
}