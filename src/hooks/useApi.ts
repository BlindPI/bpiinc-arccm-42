
import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiClient } from '@/api/ApiClient';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/lib/roles';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import type { ComplianceData, TeachingData, DocumentRequirement, ApiResponse } from '@/types/api';

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

export const useTeachingData = (options?: UseQueryOptions<TeachingData[]>) => {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['teaching', user?.id],
    queryFn: async () => {
      const response = await apiClient.getTeachingAssignments(user?.id || '');
      if (response.error) throw new Error(response.error.message);
      return response.data as TeachingData[];
    },
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
    queryFn: async () => {
      const response = await apiClient.getDocumentRequirements({ fromRole, toRole });
      if (response.error) throw new Error(response.error.message);
      return response.data as DocumentRequirement[];
    },
    enabled: !!user?.id && hasRequiredRole(profile?.role, fromRole),
    ...options
  });
};

export const useComplianceStatus = (options?: UseQueryOptions<ComplianceData>) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['compliance', user?.id],
    queryFn: async () => {
      console.log('Starting compliance status fetch for user:', user?.id);
      
      try {
        const response = await apiClient.getComplianceStatus(user?.id || '');
        console.log('Compliance status response:', response);
        
        if (response.error) {
          console.error('Error in compliance status response:', response.error);
          throw new Error(response.error.message);
        }
        
        return response.data as ComplianceData;
      } catch (error) {
        console.error('Error in useComplianceStatus:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    retry: 1, // Only retry once
    retryDelay: 1000, // Wait 1 second before retrying
    ...options
  });
};

export const useUpdateComplianceCheck = (
  options?: UseMutationOptions<void, Error, any>
) => {
  return useMutation({
    mutationFn: async (checkData: any) => {
      const response = await apiClient.updateComplianceCheck(checkData);
      if (response.error) throw new Error(response.error.message);
    },
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
    mutationFn: async (documentData: any) => {
      const response = await apiClient.submitDocument(documentData);
      if (response.error) throw new Error(response.error.message);
    },
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
    mutationFn: async ({ sessionId, status }) => {
      const response = await apiClient.updateTeachingStatus(sessionId, status);
      if (response.error) throw new Error(response.error.message);
    },
    onSuccess: () => {
      toast.success('Teaching status updated successfully');
    },
    ...options
  });
};
