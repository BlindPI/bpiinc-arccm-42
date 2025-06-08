
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authorizedProviderService, type AuthorizedProvider } from '@/services/provider/authorizedProviderService';

export function useProviderAccess() {
  const { user } = useAuth();
  const [provider, setProvider] = useState<AuthorizedProvider | null>(null);
  const [isProvider, setIsProvider] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setProvider(null);
      setIsProvider(false);
      setLoading(false);
      return;
    }

    const checkProviderAccess = async () => {
      try {
        // Check if current user is an authorized provider
        const providers = await authorizedProviderService.getAllProviders();
        // Convert user.id to number for comparison with provider id (bigint)
        const userProvider = providers.find(p => p.id.toString() === user.id);
        
        if (userProvider) {
          setProvider(userProvider);
          setIsProvider(true);
        } else {
          setProvider(null);
          setIsProvider(false);
        }
      } catch (error) {
        console.error('Error checking provider access:', error);
        setProvider(null);
        setIsProvider(false);
      } finally {
        setLoading(false);
      }
    };

    checkProviderAccess();
  }, [user?.id]);

  const canManageLocation = (locationId?: string): boolean => {
    if (!isProvider || !provider) return false;
    return provider.primary_location_id === locationId;
  };

  const canManageTeam = (teamLocationId?: string): boolean => {
    if (!isProvider || !provider) return false;
    return provider.primary_location_id === teamLocationId;
  };

  return {
    provider,
    isProvider,
    loading,
    canManageLocation,
    canManageTeam
  };
}
