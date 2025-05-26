
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfigurationManager, ImportOptions, ConfigurationExport } from '@/services/configuration/configurationManager';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useConfigurationManager() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: configurations, isLoading } = useQuery({
    queryKey: ['system-configurations'],
    queryFn: () => ConfigurationManager.getAllConfigurations()
  });

  const updateConfig = useMutation({
    mutationFn: ({ category, key, value, reason }: {
      category: string;
      key: string;
      value: any;
      reason?: string;
    }) => ConfigurationManager.updateConfiguration(category, key, value, user?.id || '', reason),
    onSuccess: () => {
      toast.success('Configuration updated successfully');
      queryClient.invalidateQueries({ queryKey: ['system-configurations'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to update configuration: ${error.message}`);
    }
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
