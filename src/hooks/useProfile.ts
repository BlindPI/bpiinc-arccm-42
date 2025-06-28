
import { useQuery } from '@tanstack/react-query';
import { foundationService } from '@/services/foundation';
import type { UserProfile } from '@/types/foundation';

export function useProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async (): Promise<UserProfile | null> => {
      const response = await foundationService.getCurrentUser();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
