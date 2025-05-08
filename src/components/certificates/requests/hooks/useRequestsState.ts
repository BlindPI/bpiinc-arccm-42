
import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCertificateRequest } from '@/hooks/useCertificateRequest';
import { toast } from 'sonner';

export function useRequestsState(profile: any) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('PENDING');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [selectedRequestId, setSelectedRequestId] = React.useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'list' | 'batch'>('batch');
  
  const updateRequestMutation = useCertificateRequest();
  
  // Manual refresh function
  const handleRefresh = () => {
    setIsRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ['certificateRequests'] })
      .then(() => {
        toast.success('Certificate requests refreshed');
        setIsRefreshing(false);
      })
      .catch(error => {
        console.error('Error refreshing requests:', error);
        toast.error('Failed to refresh requests');
        setIsRefreshing(false);
      });
  };

  // Handle update request function
  const handleUpdateRequest = async (params: { 
    id: string; 
    status: 'APPROVED' | 'REJECTED' | 'ARCHIVED' | 'ARCHIVE_FAILED'; 
    rejectionReason?: string 
  }): Promise<void> => {
    try {
      await updateRequestMutation.mutateAsync({
        ...params,
        profile
      });
    } catch (error) {
      console.error("Error updating request:", error);
      throw error;
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    isRefreshing,
    setIsRefreshing,
    selectedRequestId,
    setSelectedRequestId,
    rejectionReason,
    setRejectionReason,
    viewMode,
    setViewMode,
    handleRefresh,
    handleUpdateRequest,
    updateRequestMutation
  };
}
