
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
          // AP users: Don't filter by user_id - let RLS handle location-based visibility
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', profileId)
            .single();
            
          if (profile?.role === 'AP') {
            console.log('AP user: Relying on RLS for location-based certificate request visibility');
            // RLS policy will filter certificate requests based on AP user's location assignments
          } else {
            // Other roles: Filter by user_id (existing behavior)
            console.log('Filtering requests by user_id:', profileId);
            query = query.eq('user_id', profileId);
          }
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
  });

  return {
    requests,
    isLoading,
    error
  };
}
