import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationService, NotificationEvent, NotificationStats } from '@/services/integration/notificationService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type NotificationPreference = Database['public']['Tables']['notification_preferences']['Row'];
type NotificationDeliveryLog = Database['public']['Tables']['notification_delivery_log']['Row'];
type WebhookConfiguration = Database['public']['Tables']['webhook_configurations']['Row'];

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get notification preferences
  const {
    data: preferences = [],
    isLoading: preferencesLoading,
    error: preferencesError
  } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: () => NotificationService.getPreferences(user!.id),
    enabled: !!user?.id
  });

  // Get delivery logs
  const {
    data: deliveryLogs = [],
    isLoading: logsLoading
  } = useQuery({
    queryKey: ['notification-logs', user?.id],
    queryFn: () => NotificationService.getDeliveryLogs(user!.id, { limit: 100 }),
    enabled: !!user?.id
  });

  // Get notification statistics
  const {
    data: stats,
    isLoading: statsLoading
  } = useQuery({
    queryKey: ['notification-stats', user?.id],
    queryFn: () => NotificationService.getStats(user!.id),
    enabled: !!user?.id
  });

  // Get webhooks
  const {
    data: webhooks = [],
    isLoading: webhooksLoading
  } = useQuery({
    queryKey: ['webhooks', user?.id],
    queryFn: () => NotificationService.getWebhooks(user!.id),
    enabled: !!user?.id
  });

  // Update preference mutation
  const updatePreferenceMutation = useMutation({
    mutationFn: (preference: Partial<NotificationPreference>) =>
      NotificationService.updatePreference(preference),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast({
        title: 'Preference updated',
        description: 'Notification preference has been updated successfully.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update preference',
        variant: 'destructive'
      });
    }
  });

  // Delete preference mutation
  const deletePreferenceMutation = useMutation({
    mutationFn: (preferenceId: string) =>
      NotificationService.deletePreference(preferenceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast({
        title: 'Preference deleted',
        description: 'Notification preference has been deleted successfully.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete preference',
        variant: 'destructive'
      });
    }
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: (notification: NotificationEvent) =>
      NotificationService.sendNotification(notification),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
      toast({
        title: 'Notification sent',
        description: `Notification sent successfully (${result.messageIds.length} messages)`
      });
    },
    onError: (error) => {
      toast({
        title: 'Send failed',
        description: error instanceof Error ? error.message : 'Failed to send notification',
        variant: 'destructive'
      });
    }
  });

  // Send bulk notifications mutation
  const sendBulkNotificationsMutation = useMutation({
    mutationFn: (notifications: NotificationEvent[]) =>
      NotificationService.sendBulkNotifications(notifications),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
      toast({
        title: 'Bulk notifications sent',
        description: `${result.success} successful, ${result.failed} failed`
      });
    },
    onError: (error) => {
      toast({
        title: 'Bulk send failed',
        description: error instanceof Error ? error.message : 'Failed to send bulk notifications',
        variant: 'destructive'
      });
    }
  });

  // Create webhook mutation
  const createWebhookMutation = useMutation({
    mutationFn: (webhook: Partial<WebhookConfiguration>) =>
      NotificationService.createWebhook(webhook),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast({
        title: 'Webhook created',
        description: 'Webhook has been created successfully.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Create failed',
        description: error instanceof Error ? error.message : 'Failed to create webhook',
        variant: 'destructive'
      });
    }
  });

  // Update webhook mutation
  const updateWebhookMutation = useMutation({
    mutationFn: ({ webhookId, updates }: {
      webhookId: string;
      updates: Partial<WebhookConfiguration>;
    }) => NotificationService.updateWebhook(webhookId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast({
        title: 'Webhook updated',
        description: 'Webhook has been updated successfully.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update webhook',
        variant: 'destructive'
      });
    }
  });

  // Delete webhook mutation
  const deleteWebhookMutation = useMutation({
    mutationFn: (webhookId: string) =>
      NotificationService.deleteWebhook(webhookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast({
        title: 'Webhook deleted',
        description: 'Webhook has been deleted successfully.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete webhook',
        variant: 'destructive'
      });
    }
  });

  // Test webhook mutation
  const testWebhookMutation = useMutation({
    mutationFn: (webhookId: string) =>
      NotificationService.testWebhook(webhookId),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Webhook test successful',
          description: 'Webhook endpoint is responding correctly.'
        });
      } else {
        toast({
          title: 'Webhook test failed',
          description: result.error || 'Unknown error occurred',
          variant: 'destructive'
        });
      }
    }
  });

  // Send test notification mutation
  const sendTestNotificationMutation = useMutation({
    mutationFn: ({ deliveryMethod }: { deliveryMethod: string }) =>
      NotificationService.sendTestNotification(user!.id, deliveryMethod),
    onSuccess: (result) => {
      if (result.success) {
        toast({
          title: 'Test notification sent',
          description: 'Check your delivery method for the test message.'
        });
      } else {
        toast({
          title: 'Test failed',
          description: result.error || 'Unknown error occurred',
          variant: 'destructive'
        });
      }
    }
  });

  // Set default preferences mutation
  const setDefaultPreferencesMutation = useMutation({
    mutationFn: () => NotificationService.setDefaultPreferences(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast({
        title: 'Default preferences set',
        description: 'Default notification preferences have been configured.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Setup failed',
        description: error instanceof Error ? error.message : 'Failed to set default preferences',
        variant: 'destructive'
      });
    }
  });

  // Helper functions
  const getPreferenceByType = (type: string, method: string) =>
    preferences.find(p => p.notification_type === type && p.delivery_method === method);

  const isNotificationEnabled = (type: string, method: string) => {
    const preference = getPreferenceByType(type, method);
    return preference?.enabled ?? false;
  };

  const getActiveWebhooks = () =>
    webhooks.filter(w => w.is_active);

  const getRecentLogs = (count: number = 10) =>
    deliveryLogs.slice(0, count);

  const getFailedNotifications = () =>
    deliveryLogs.filter(log => ['failed', 'bounced'].includes(log.status));

  return {
    // Data
    preferences,
    deliveryLogs,
    stats,
    webhooks,
    
    // Loading states
    preferencesLoading,
    logsLoading,
    statsLoading,
    webhooksLoading,
    
    // Error states
    preferencesError,
    
    // Mutations
    updatePreference: updatePreferenceMutation.mutate,
    deletePreference: deletePreferenceMutation.mutate,
    sendNotification: sendNotificationMutation.mutate,
    sendBulkNotifications: sendBulkNotificationsMutation.mutate,
    createWebhook: createWebhookMutation.mutate,
    updateWebhook: updateWebhookMutation.mutate,
    deleteWebhook: deleteWebhookMutation.mutate,
    testWebhook: testWebhookMutation.mutate,
    sendTestNotification: sendTestNotificationMutation.mutate,
    setDefaultPreferences: setDefaultPreferencesMutation.mutate,
    
    // Loading states for mutations
    isUpdating: updatePreferenceMutation.isPending,
    isDeleting: deletePreferenceMutation.isPending,
    isSending: sendNotificationMutation.isPending,
    isSendingBulk: sendBulkNotificationsMutation.isPending,
    isCreatingWebhook: createWebhookMutation.isPending,
    isUpdatingWebhook: updateWebhookMutation.isPending,
    isDeletingWebhook: deleteWebhookMutation.isPending,
    isTestingWebhook: testWebhookMutation.isPending,
    isSendingTest: sendTestNotificationMutation.isPending,
    isSettingDefaults: setDefaultPreferencesMutation.isPending,
    
    // Helper functions
    getPreferenceByType,
    isNotificationEnabled,
    getActiveWebhooks,
    getRecentLogs,
    getFailedNotifications
  };
}