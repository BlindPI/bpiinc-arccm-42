
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfigurationManager } from '@/services/configuration/configurationManager';
import { toast } from 'sonner';

export interface MaintenanceConfig {
  enabled: boolean;
  message: string;
  estimatedDuration?: string;
  startTime?: string;
  endTime?: string;
}

export function useMaintenanceMode() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceConfig, setMaintenanceConfig] = useState<MaintenanceConfig | null>(null);
  const queryClient = useQueryClient();

  const { data: configData, isLoading } = useQuery({
    queryKey: ['maintenanceMode'],
    queryFn: async () => {
      try {
        const enabled = await ConfigurationManager.getConfiguration('system', 'maintenance_mode');
        const message = await ConfigurationManager.getConfiguration('system', 'maintenance_message');
        const duration = await ConfigurationManager.getConfiguration('system', 'maintenance_duration');
        const startTime = await ConfigurationManager.getConfiguration('system', 'maintenance_start_time');
        
        return {
          enabled: enabled || false,
          message: message || 'System is currently under maintenance. Please try again later.',
          estimatedDuration: duration || '',
          startTime: startTime || ''
        };
      } catch (error) {
        console.error('Error fetching maintenance configuration:', error);
        return {
          enabled: false,
          message: 'System is currently under maintenance. Please try again later.',
          estimatedDuration: '',
          startTime: ''
        };
      }
    },
    refetchInterval: 30000 // Check every 30 seconds
  });

  useEffect(() => {
    if (configData) {
      setIsMaintenanceMode(configData.enabled);
      setMaintenanceConfig(configData);
    }
  }, [configData]);

  const enableMaintenanceMutation = useMutation({
    mutationFn: async ({ message, duration }: { message: string; duration: string }) => {
      const startTime = new Date().toISOString();
      
      await Promise.all([
        ConfigurationManager.updateConfiguration('system', 'maintenance_mode', true, 'system', 'Enabling maintenance mode'),
        ConfigurationManager.updateConfiguration('system', 'maintenance_message', message, 'system', 'Setting maintenance message'),
        ConfigurationManager.updateConfiguration('system', 'maintenance_duration', duration, 'system', 'Setting maintenance duration'),
        ConfigurationManager.updateConfiguration('system', 'maintenance_start_time', startTime, 'system', 'Setting maintenance start time')
      ]);
      
      return { enabled: true, message, estimatedDuration: duration, startTime };
    },
    onSuccess: (data) => {
      setIsMaintenanceMode(true);
      setMaintenanceConfig(data);
      queryClient.invalidateQueries({ queryKey: ['maintenanceMode'] });
      toast.success('Maintenance mode enabled');
    },
    onError: (error) => {
      console.error('Error enabling maintenance mode:', error);
      toast.error('Failed to enable maintenance mode');
    }
  });

  const disableMaintenanceMutation = useMutation({
    mutationFn: async () => {
      await ConfigurationManager.updateConfiguration('system', 'maintenance_mode', false, 'system', 'Disabling maintenance mode');
      return { enabled: false };
    },
    onSuccess: () => {
      setIsMaintenanceMode(false);
      setMaintenanceConfig(null);
      queryClient.invalidateQueries({ queryKey: ['maintenanceMode'] });
      toast.success('Maintenance mode disabled');
    },
    onError: (error) => {
      console.error('Error disabling maintenance mode:', error);
      toast.error('Failed to disable maintenance mode');
    }
  });

  const enableMaintenanceMode = async (message: string, duration: string) => {
    await enableMaintenanceMutation.mutateAsync({ message, duration });
  };

  const disableMaintenanceMode = async () => {
    await disableMaintenanceMutation.mutateAsync();
  };

  const updateMaintenanceMessage = async (message: string) => {
    try {
      await ConfigurationManager.updateConfiguration('system', 'maintenance_message', message, 'system', 'Updating maintenance message');
      queryClient.invalidateQueries({ queryKey: ['maintenanceMode'] });
      toast.success('Maintenance message updated');
    } catch (error) {
      console.error('Error updating maintenance message:', error);
      toast.error('Failed to update maintenance message');
    }
  };

  return {
    isMaintenanceMode,
    maintenanceConfig,
    enableMaintenanceMode,
    disableMaintenanceMode,
    updateMaintenanceMessage,
    isLoading: isLoading || enableMaintenanceMutation.isPending || disableMaintenanceMutation.isPending
  };
}
