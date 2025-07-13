import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarSyncService, CalendarSyncResult } from '@/services/integration/calendarSyncService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type CalendarIntegration = Database['public']['Tables']['external_calendar_integrations']['Row'];
type CalendarSyncEvent = Database['public']['Tables']['calendar_sync_events']['Row'];
type CalendarOperation = Database['public']['Tables']['calendar_operations']['Row'];

export function useCalendarSync() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's calendar integrations
  const {
    data: integrations = [],
    isLoading: integrationsLoading,
    error: integrationsError
  } = useQuery({
    queryKey: ['calendar-integrations', user?.id],
    queryFn: () => CalendarSyncService.getIntegrations(user!.id),
    enabled: !!user?.id
  });

  // Get calendar operations history
  const {
    data: operations = [],
    isLoading: operationsLoading
  } = useQuery({
    queryKey: ['calendar-operations', user?.id],
    queryFn: () => CalendarSyncService.getOperations(user!.id),
    enabled: !!user?.id
  });

  // Get calendar conflicts
  const {
    data: conflicts = [],
    isLoading: conflictsLoading
  } = useQuery({
    queryKey: ['calendar-conflicts', user?.id],
    queryFn: () => CalendarSyncService.getConflicts(user!.id),
    enabled: !!user?.id
  });

  // Save integration mutation
  const saveIntegrationMutation = useMutation({
    mutationFn: (integration: Partial<CalendarIntegration>) =>
      CalendarSyncService.saveIntegration(integration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-integrations'] });
      toast({
        title: 'Integration saved',
        description: 'Calendar integration has been configured successfully.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Failed to save integration',
        variant: 'destructive'
      });
    }
  });

  // Remove integration mutation
  const removeIntegrationMutation = useMutation({
    mutationFn: (integrationId: string) =>
      CalendarSyncService.removeIntegration(integrationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-integrations'] });
      toast({
        title: 'Integration removed',
        description: 'Calendar integration has been removed successfully.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Remove failed',
        description: error instanceof Error ? error.message : 'Failed to remove integration',
        variant: 'destructive'
      });
    }
  });

  // Sync availability mutation
  const syncAvailabilityMutation = useMutation({
    mutationFn: (integrationId: string) =>
      CalendarSyncService.syncAvailability(integrationId),
    onSuccess: (result: CalendarSyncResult) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-integrations'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-operations'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-conflicts'] });
      
      toast({
        title: 'Sync completed',
        description: `Imported: ${result.imported}, Exported: ${result.exported}, Conflicts: ${result.conflicts}`
      });
    },
    onError: (error) => {
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Failed to sync calendar',
        variant: 'destructive'
      });
    }
  });

  // Export to ICS mutation
  const exportToICSMutation = useMutation({
    mutationFn: (options: {
      startDate: string;
      endDate: string;
      includeAvailable?: boolean;
      includeBooked?: boolean;
    }) => CalendarSyncService.exportToICS(user!.id, options),
    onSuccess: (result) => {
      // Trigger download
      const link = document.createElement('a');
      link.href = result.url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export completed',
        description: 'Calendar has been exported successfully.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export calendar',
        variant: 'destructive'
      });
    }
  });

  // Import from ICS mutation
  const importFromICSMutation = useMutation({
    mutationFn: (file: File) =>
      CalendarSyncService.importFromICS(user!.id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-operations'] });
      toast({
        title: 'Import started',
        description: 'Calendar import is being processed.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import calendar',
        variant: 'destructive'
      });
    }
  });

  // Refresh token mutation
  const refreshTokenMutation = useMutation({
    mutationFn: (integrationId: string) =>
      CalendarSyncService.refreshToken(integrationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-integrations'] });
      toast({
        title: 'Token refreshed',
        description: 'Access token has been refreshed successfully.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Refresh failed',
        description: error instanceof Error ? error.message : 'Failed to refresh token',
        variant: 'destructive'
      });
    }
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: (integrationId: string) =>
      CalendarSyncService.testConnection(integrationId),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Connection successful',
          description: 'Calendar connection is working properly.'
        });
      } else {
        toast({
          title: 'Connection failed',
          description: result.error || 'Unknown connection error',
          variant: 'destructive'
        });
      }
    }
  });

  // Resolve conflict mutation
  const resolveConflictMutation = useMutation({
    mutationFn: ({ eventId, resolution }: {
      eventId: string;
      resolution: 'keep_external' | 'keep_internal' | 'merge';
    }) => CalendarSyncService.resolveConflict(eventId, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-conflicts'] });
      toast({
        title: 'Conflict resolved',
        description: 'Calendar conflict has been resolved successfully.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Resolution failed',
        description: error instanceof Error ? error.message : 'Failed to resolve conflict',
        variant: 'destructive'
      });
    }
  });

  // Helper functions
  const getIntegrationByProvider = (provider: string) =>
    integrations.find(i => i.provider_type === provider);

  const hasActiveIntegration = (provider: string) =>
    integrations.some(i => i.provider_type === provider && i.sync_enabled && i.sync_status === 'active');

  const getConflictCount = () => conflicts.length;

  const getPendingOperations = () =>
    operations.filter(op => op.status === 'pending' || op.status === 'processing');

  return {
    // Data
    integrations,
    operations,
    conflicts,
    
    // Loading states
    integrationsLoading,
    operationsLoading,
    conflictsLoading,
    
    // Error states
    integrationsError,
    
    // Mutations
    saveIntegration: saveIntegrationMutation.mutate,
    removeIntegration: removeIntegrationMutation.mutate,
    syncAvailability: syncAvailabilityMutation.mutate,
    exportToICS: exportToICSMutation.mutate,
    importFromICS: importFromICSMutation.mutate,
    refreshToken: refreshTokenMutation.mutate,
    testConnection: testConnectionMutation.mutate,
    resolveConflict: resolveConflictMutation.mutate,
    
    // Loading states for mutations
    isSaving: saveIntegrationMutation.isPending,
    isRemoving: removeIntegrationMutation.isPending,
    isSyncing: syncAvailabilityMutation.isPending,
    isExporting: exportToICSMutation.isPending,
    isImporting: importFromICSMutation.isPending,
    isRefreshing: refreshTokenMutation.isPending,
    isTesting: testConnectionMutation.isPending,
    isResolving: resolveConflictMutation.isPending,
    
    // Helper functions
    getIntegrationByProvider,
    hasActiveIntegration,
    getConflictCount,
    getPendingOperations
  };
}