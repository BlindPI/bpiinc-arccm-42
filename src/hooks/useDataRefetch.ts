
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { queryInvalidationService } from '@/services/QueryInvalidationService';

export function useDataRefetch() {
  const queryClient = useQueryClient();
  
  // Initialize the query invalidation service with the query client
  queryInvalidationService.setQueryClient(queryClient);
  
  const refetchCertificates = useCallback(() => {
    queryInvalidationService.invalidateCertificates();
  }, []);
  
  const refetchProfiles = useCallback(() => {
    queryInvalidationService.invalidateProfiles();
  }, []);
  
  const refetchNotifications = useCallback(() => {
    queryInvalidationService.invalidateNotifications();
  }, []);
  
  const refetchAll = useCallback(() => {
    queryInvalidationService.invalidateAll();
  }, []);

  return {
    refetchCertificates,
    refetchProfiles,
    refetchNotifications,
    refetchAll
  };
}
