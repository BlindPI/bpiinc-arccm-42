
import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiClient } from '@/api/ApiClient';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/roles';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import type { ComplianceData, TeachingData, DocumentRequirement } from '@/types/api';

// Utility to check if user has required role
const hasRequiredRole = (userRole: UserRole | undefined, requiredRole: UserRole): boolean => {
  const roleHierarchy: { [key in UserRole]: number } = {
    'SA': 5,
    'AD': 4,
    'AP': 3,
    'IC': 2,
    'IP': 1,
    'IT': 0
  };
  
  return userRole ? roleHierarchy[userRole] >= roleHierarchy[requiredRole] : false;
};

export const useTeachingData = (options?: UseQueryOptions<TeachingData>) => {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['teaching', user?.id],
    queryFn: () => apiClient.getTeachingAssignments(user?.id || ''),
    enabled: !!user?.id && hasRequiredRole(profile?.role, 'IT'),
    ...options
  });
};

export const useDocumentRequirements = (
  fromRole: UserRole,
  toRole: UserRole,
  options?: UseQueryOptions<DocumentRequirement[]>
) => {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['documents', fromRole, toRole],
    queryFn: () => apiClient.getDocumentRequirements({ fromRole, toRole }),
    enabled: !!user?.id && hasRequiredRole(profile?.role, fromRole),
    ...options
  });
};

export const useComplianceStatus = (options?: UseQueryOptions<ComplianceData>) => {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['compliance', user?.id],
    queryFn: () => apiClient.getComplianceStatus(user?.id || ''),
    enabled: !!user?.id,
    ...options
  });
};

export const useUpdateComplianceCheck = (
  options?: UseMutationOptions<void, Error, any>
) => {
  return useMutation({
    mutationFn: (checkData: any) => apiClient.updateComplianceCheck(checkData),
    onSuccess: () => {
      toast.success('Compliance check updated successfully');
    },
    ...options
  });
};

export const useSubmitDocument = (
  options?: UseMutationOptions<void, Error, any>
) => {
  return useMutation({
    mutationFn: (documentData: any) => apiClient.submitDocument(documentData),
    onSuccess: () => {
      toast.success('Document submitted successfully');
    },
    ...options
  });
};

export const useUpdateTeachingStatus = (
  options?: UseMutationOptions<void, Error, { sessionId: string; status: string }>
) => {
  return useMutation({
    mutationFn: ({ sessionId, status }) => apiClient.updateTeachingStatus(sessionId, status),
    onSuccess: () => {
      toast.success('Teaching status updated successfully');
    },
    ...options
  });
};
