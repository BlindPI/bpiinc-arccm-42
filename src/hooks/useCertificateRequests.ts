
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CertificateRequest } from '@/types/supabase-schema';
import { toast } from 'sonner';
import { useCallback } from 'react';

interface UseCertificateRequestsParams {
  isAdmin?: boolean;
  statusFilter: string;
  profileId?: string;
}

export function useCertificateRequests({ isAdmin, statusFilter, profileId }: UseCertificateRequestsParams) {
  // Query for certificate requests with proper refreshing
  const {
    data: requests = [], 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['certificateRequests', isAdmin, statusFilter, profileId],
    queryFn: async () => {
      console.log('Fetching certificate requests with params:', { 
        isAdmin, 
        statusFilter, 
        userId: profileId 
      });
      
      try {
        let query = supabase
          .from('certificate_requests')
          .select('*');
        
        // Only filter by user_id if not an admin
        if (!isAdmin && profileId) {
          console.log('Filtering requests by user_id:', profileId);
          query = query.eq('user_id', profileId);
        } else {
          console.log('User is admin, fetching all requests');
        }
        
        if (statusFilter !== 'all') {
          console.log('Filtering by status:', statusFilter);
          query = query.eq('status', statusFilter);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching certificate requests:', error);
          throw error;
        }
        
        console.log(`Successfully fetched ${data?.length || 0} certificate requests`);
        // Use type assertion to handle the new properties
        return data as unknown as CertificateRequest[];
      } catch (error) {
        console.error('Error in certificate requests query:', error);
        toast.error(`Failed to fetch certificate requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    },
    enabled: !!profileId || isAdmin,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 60000, // Refetch every minute in the background
  });

  // Function to manually refresh data
  const refreshRequests = useCallback(async () => {
    try {
      await refetch();
      return true;
    } catch (error) {
      console.error('Error refreshing requests:', error);
      return false;
    }
  }, [refetch]);

  return {
    requests,
    isLoading,
    error,
    refreshRequests
  };
}
