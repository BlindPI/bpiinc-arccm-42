
import React from 'react';
import { toast } from 'sonner';
import useCertificateRequests from '@/hooks/useCertificateRequests';
import { useCertificateBatches } from '@/hooks/useCertificateBatches';
import { useCertificateRequestsActions } from '@/hooks/useCertificateRequestsActions';

interface UseRequestFilteringProps {
  statusFilter: string;
  searchQuery: string;
  profile: any;
}

export function useRequestFiltering({ 
  statusFilter, 
  searchQuery, 
  profile 
}: UseRequestFilteringProps) {
  // Determine if user is admin
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  
  // Use the custom hook for fetching requests
  const { requests, isLoading, error: queryError } = useCertificateRequests({
    isAdmin,
    statusFilter,
    profileId: profile?.id
  });

  // Log any query errors
  React.useEffect(() => {
    if (queryError) {
      console.error('Certificate requests query error:', queryError);
      toast.error(`Error loading requests: ${queryError instanceof Error ? queryError.message : 'Unknown error'}`);
    }
  }, [queryError]);

  const { 
    handleApprove, 
    handleReject, 
    handleDeleteRequest, 
    deleteRequestMutation
  } = useCertificateRequestsActions(profile);
  
  // Filter requests based on search query
  const filteredRequests = React.useMemo(() => {
    if (!requests) return [];
    
    return requests.filter(request => {
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          request.recipient_name?.toLowerCase().includes(searchLower) ||
          request.course_name?.toLowerCase().includes(searchLower) ||
          (request.email && request.email.toLowerCase().includes(searchLower))
        );
      }
      
      return true;
    });
  }, [requests, searchQuery]);

  // Use our custom hook to get grouped batches
  const groupedBatches = useCertificateBatches(filteredRequests);

  return {
    requests,
    isLoading,
    filteredRequests,
    groupedBatches,
    handleApprove,
    handleReject,
    handleDeleteRequest,
    deleteRequestMutation
  };
}
