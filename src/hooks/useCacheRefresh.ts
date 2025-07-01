
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useCacheRefresh() {
  const queryClient = useQueryClient();

  const refreshEmailStatus = async () => {
    try {
      // Invalidate all email status related queries
      await queryClient.invalidateQueries({ queryKey: ['roster-email-status'] });
      await queryClient.invalidateQueries({ queryKey: ['roster-pending-emails'] });
      await queryClient.invalidateQueries({ queryKey: ['enhanced-rosters'] });
      await queryClient.invalidateQueries({ queryKey: ['rosters'] });
      await queryClient.invalidateQueries({ queryKey: ['roster-certificate-count'] });
      
      toast.success('Email status refreshed successfully');
    } catch (error) {
      console.error('Error refreshing email status:', error);
      toast.error('Failed to refresh email status');
    }
  };

  const refreshAllRosterData = async () => {
    try {
      // Clear all roster-related cache
      await queryClient.clear();
      
      toast.success('All roster data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing roster data:', error);
      toast.error('Failed to refresh roster data');
    }
  };

  return {
    refreshEmailStatus,
    refreshAllRosterData
  };
}
