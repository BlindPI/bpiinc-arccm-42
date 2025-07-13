import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamManagementService, TeamMemberAvailability, BulkSchedulingData } from '@/services/team/teamManagementService';
import { useToast } from '@/hooks/use-toast';

export function useTeamAvailability(teamId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['team-availability', teamId, startDate, endDate],
    queryFn: () => teamManagementService.getTeamAvailability(teamId, startDate, endDate),
    enabled: !!teamId && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTeamPermission(teamId: string, userId: string) {
  return useQuery({
    queryKey: ['team-permission', teamId, userId],
    queryFn: () => teamManagementService.hasTeamPermission(teamId, userId),
    enabled: !!teamId && !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useGrantTeamPermission() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ teamId, managerId, permissionLevel, expiresAt }: {
      teamId: string;
      managerId: string;
      permissionLevel: 'view' | 'edit' | 'full';
      expiresAt?: string;
    }) => teamManagementService.grantTeamPermission(teamId, managerId, permissionLevel, expiresAt),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team-permission', variables.teamId] });
      toast({
        title: 'Permission Granted',
        description: 'Team management permission has been granted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to grant team permission.',
        variant: 'destructive',
      });
    },
  });
}

export function useBulkOperation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createBulkOperation = useMutation({
    mutationFn: (operationData: BulkSchedulingData) => 
      teamManagementService.createBulkOperation(operationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulk-operations'] });
      toast({
        title: 'Bulk Operation Created',
        description: 'Bulk scheduling operation has been queued for processing.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create bulk operation.',
        variant: 'destructive',
      });
    },
  });

  const processBulkOperation = useMutation({
    mutationFn: (operationId: string) => 
      teamManagementService.processBulkOperation(operationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulk-operations'] });
      queryClient.invalidateQueries({ queryKey: ['team-availability'] });
      toast({
        title: 'Operation Processed',
        description: 'Bulk operation has been processed successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to process bulk operation.',
        variant: 'destructive',
      });
    },
  });

  return {
    createBulkOperation,
    processBulkOperation,
  };
}

export function useBulkOperations(limit = 20) {
  return useQuery({
    queryKey: ['bulk-operations', limit],
    queryFn: () => teamManagementService.getBulkOperations(limit),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useAvailabilityApprovals() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const requestApproval = useMutation({
    mutationFn: ({ changeId, requestedChanges }: { changeId: string; requestedChanges: any }) =>
      teamManagementService.requestApproval({ changeId, requestedChanges }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      toast({
        title: 'Approval Requested',
        description: 'Your availability change request has been submitted for approval.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to request approval.',
        variant: 'destructive',
      });
    },
  });

  const processApproval = useMutation({
    mutationFn: ({ approvalId, status, reason }: { 
      approvalId: string; 
      status: 'approved' | 'rejected'; 
      reason?: string; 
    }) => teamManagementService.processApproval(approvalId, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['team-availability'] });
      toast({
        title: 'Approval Processed',
        description: 'Availability change request has been processed.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to process approval.',
        variant: 'destructive',
      });
    },
  });

  return {
    requestApproval,
    processApproval,
  };
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => teamManagementService.getPendingApprovals(),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useTeamUtilizationMetrics(teamId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['team-utilization', teamId, startDate, endDate],
    queryFn: () => teamManagementService.getTeamUtilizationMetrics(teamId, startDate, endDate),
    enabled: !!teamId && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCalculateTeamUtilization() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ teamId, date }: { teamId: string; date: string }) =>
      teamManagementService.calculateTeamUtilization(teamId, date),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team-utilization', variables.teamId] });
      toast({
        title: 'Metrics Updated',
        description: 'Team utilization metrics have been calculated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to calculate team utilization metrics.',
        variant: 'destructive',
      });
    },
  });
}