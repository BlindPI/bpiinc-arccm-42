
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CertificateRequest } from '@/types/supabase-schema';
import { toast } from 'sonner';

interface UseCertificateRequestsParams {
  isAdmin?: boolean;
  statusFilter: string;
  profileId?: string;
}

export function useCertificateRequests({ isAdmin, statusFilter, profileId }: UseCertificateRequestsParams) {
  const { data: requests = [], isLoading, error } = useQuery({
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
        return data as CertificateRequest[];
      } catch (error) {
        console.error('Error in certificate requests query:', error);
        toast.error(`Failed to fetch certificate requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    },
    enabled: !!profileId || isAdmin,
  });

  return {
    requests,
    isLoading,
    error
  };
}
