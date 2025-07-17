/**
 * SA User Cache Clearing Utility
 * 
 * CRITICAL FIX for SA user access issues:
 * 1. Clears cached permission data
 * 2. Forces profile refetch
 * 3. Invalidates authorization checks
 * 4. Refreshes navigation permissions
 */

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const clearSAUserCache = async () => {
  const queryClient = useQueryClient();
  
  try {
    console.log('🧹 Clearing SA user cache - fixing permission issues...');
    
    // Clear all profile-related cache
    await queryClient.invalidateQueries({ queryKey: ['profile'] });
    await queryClient.invalidateQueries({ queryKey: ['profiles'] });
    
    // Clear navigation and permission cache
    await queryClient.invalidateQueries({ queryKey: ['navigation-visibility-config'] });
    await queryClient.invalidateQueries({ queryKey: ['system-configurations'] });
    await queryClient.invalidateQueries({ queryKey: ['team-navigation-configs'] });
    await queryClient.invalidateQueries({ queryKey: ['provider-navigation-configs'] });
    
    // Clear authorized_providers cache (main issue source)
    await queryClient.invalidateQueries({ queryKey: ['authorized_providers'] });
    await queryClient.invalidateQueries({ queryKey: ['authorized-providers'] });
    await queryClient.invalidateQueries({ queryKey: ['authorized-providers-sync'] });
    
    // Clear team and location cache
    await queryClient.invalidateQueries({ queryKey: ['team-memberships'] });
    await queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
    await queryClient.invalidateQueries({ queryKey: ['locations'] });
    
    // Force immediate refetch of critical data
    await queryClient.refetchQueries({ queryKey: ['profile'], exact: false });
    await queryClient.refetchQueries({ queryKey: ['navigation-visibility-config'], exact: false });
    
    console.log('✅ SA user cache cleared successfully');
    toast.success('Cache cleared - SA user permissions refreshed');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to clear SA user cache:', error);
    toast.error('Failed to clear cache');
    return false;
  }
};

export const useSAUserCacheClear = () => {
  const queryClient = useQueryClient();
  
  return {
    clearCache: () => clearSAUserCache(),
    clearAndReload: async () => {
      const success = await clearSAUserCache();
      if (success) {
        // Reload page after cache clear to ensure fresh start
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
      return success;
    }
  };
};