
import { useQuery } from '@tanstack/react-query';
import { useProfile } from '@/hooks/useProfile';
import { CRMNavigationService } from '@/services/navigation/crmNavigationService';

export const useCRMNavigation = () => {
  const { data: profile } = useProfile();

  const { data: crmNavConfig, isLoading, error } = useQuery({
    queryKey: ['crm-navigation', profile?.role],
    queryFn: () => CRMNavigationService.getCRMNavigationConfig(profile?.role || 'IN'),
    enabled: !!profile?.role,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isCRMEnabled = crmNavConfig?.isEnabled || false;
  const visibleCRMItems = crmNavConfig?.visibleItems || [];

  const canAccessCRMItem = (itemName: string): boolean => {
    return visibleCRMItems.some(item => item.name === itemName);
  };

  const canAccessCRMPath = (path: string): boolean => {
    return visibleCRMItems.some(item => item.path === path);
  };

  return {
    isCRMEnabled,
    visibleCRMItems,
    canAccessCRMItem,
    canAccessCRMPath,
    isLoading,
    error
  };
};
