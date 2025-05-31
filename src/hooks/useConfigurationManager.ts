
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfigurationManager, ImportOptions, ConfigurationExport } from '@/services/configuration/configurationManager';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useConfigurationManager() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: configurations, isLoading } = useQuery({
    queryKey: ['system-configurations'],
    queryFn: async () => {
      console.log('🔍 ConfigurationManager: Fetching all configurations');
      const configs = await ConfigurationManager.getAllConfigurations();
      console.log('🔍 ConfigurationManager: Fetched configurations count:', configs?.length);
      console.log('🔍 ConfigurationManager: Available config keys:', configs?.map(c => `${c.category}.${c.key}`));
      return configs;
    },
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
  });

  const updateConfig = useMutation({
    mutationFn: async ({ category, key, value, reason }: {
      category: string;
      key: string;
      value: any;
      reason?: string;
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 ConfigurationManager: Updating config:', { category, key, value, reason });
      
      try {
        await ConfigurationManager.updateConfiguration(category, key, value, user.id, reason);
        return { category, key, value };
      } catch (error) {
        console.error('🔍 ConfigurationManager: Update failed:', error);
        throw error;
      }
    },
    onSuccess: ({ category, key }) => {
      console.log('🔍 ConfigurationManager: Successfully updated config:', category, key);
      toast.success('Configuration updated successfully');
      
      // FIXED: Immediate cache invalidation and refetch
      console.log('🔍 ConfigurationManager: Invalidating and refetching all related queries');
      
      // Remove old cached data immediately
      queryClient.removeQueries({ queryKey: ['system-configurations'] });
      queryClient.removeQueries({ queryKey: ['navigation-visibility-config'] });
      
      // Invalidate and refetch immediately
      queryClient.invalidateQueries({ queryKey: ['system-configurations'] });
      queryClient.invalidateQueries({ queryKey: ['navigation-visibility-config'] });
      
      // Force immediate refetch to ensure fresh data
      queryClient.refetchQueries({ queryKey: ['system-configurations'] });
    },
    onError: (error: any) => {
      console.error('🔍 ConfigurationManager: Update error:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      toast.error(`Failed to update configuration: ${errorMessage}`);
    },
    retry: 1,
  });

  const exportConfig = useMutation({
    mutationFn: () => ConfigurationManager.exportConfiguration(),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `configuration-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Configuration exported successfully');
    },
    onError: (error: any) => {
      console.error('🔍 ConfigurationManager: Export error:', error);
      toast.error(`Failed to export configuration: ${error.message}`);
    }
  });

  const importConfig = useMutation({
    mutationFn: ({ config, options }: { config: ConfigurationExport; options?: ImportOptions }) =>
      ConfigurationManager.importConfiguration(config, options),
    onSuccess: (result) => {
      toast.success(`Import completed: ${result.imported} imported, ${result.skipped} skipped, ${result.errors.length} errors`);
      queryClient.invalidateQueries({ queryKey: ['system-configurations'] });
    },
    onError: (error: any) => {
      console.error('🔍 ConfigurationManager: Import error:', error);
      toast.error(`Failed to import configuration: ${error.message}`);
    }
  });

  return {
    configurations,
    isLoading,
    updateConfig,
    exportConfig,
    importConfig
  };
}
