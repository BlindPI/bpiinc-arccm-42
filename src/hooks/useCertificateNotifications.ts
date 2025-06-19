import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SimpleCertificateNotificationService, CertificateNotification } from '@/services/notifications/simpleCertificateNotificationService';
import { toast } from 'sonner';

export function useCertificateNotificationsList() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['certificate-notifications', user?.id],
    queryFn: () => SimpleCertificateNotificationService.getUserNotifications(user?.id || ''),
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
}

export function useCertificateNotificationCount() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['certificate-notification-count', user?.id],
    queryFn: () => SimpleCertificateNotificationService.getUnreadCount(user?.id || ''),
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useMarkCertificateNotificationAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: (notificationId: string) => 
      SimpleCertificateNotificationService.markAsRead(notificationId),
    onSuccess: () => {
      // Invalidate and refetch notification queries
      queryClient.invalidateQueries({ queryKey: ['certificate-notifications', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['certificate-notification-count', user?.id] });
    },
    onError: (error: any) => {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  });
}

export function useCreateCertificateNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: SimpleCertificateNotificationService.createNotification,
    onSuccess: () => {
      // Invalidate notification queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['certificate-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['certificate-notification-count'] });
    },
    onError: (error: any) => {
      console.error('Failed to create notification:', error);
      toast.error('Failed to create notification');
    }
  });
}

// Real-time subscription hook for certificate notifications
export function useCertificateNotificationSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  React.useEffect(() => {
    if (!user?.id) return;
    
    console.log('Setting up certificate notification subscription for user:', user.id);
    
    const channel = supabase
      .channel('certificate-notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'certificate_notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Certificate notification change received:', payload);
          
          // Invalidate notification queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['certificate-notifications', user.id] });
          queryClient.invalidateQueries({ queryKey: ['certificate-notification-count', user.id] });
          
          // Show browser notification if supported and permission granted
          if (window.Notification && window.Notification.permission === 'granted' && payload.eventType === 'INSERT') {
            const notification = payload.new as CertificateNotification;
            if (notification && notification.title) {
              new window.Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico'
              });
            }
          }
        }
      )
      .subscribe();
    
    return () => {
      console.log('Cleaning up certificate notification subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}

// Helper hooks for specific notification workflows
export function useBatchNotifications() {
  const createNotification = useCreateCertificateNotification();
  
  const notifyBatchSubmitted = (userId: string, batchId: string, batchSize: number) =>
    SimpleCertificateNotificationService.notifyBatchSubmitted(userId, batchId, batchSize);
  
  const notifyBatchApproved = (userId: string, batchId: string, approvedCount: number) =>
    SimpleCertificateNotificationService.notifyBatchApproved(userId, batchId, approvedCount);
  
  const notifyBatchRejected = (userId: string, batchId: string, rejectedCount: number, reason?: string) =>
    SimpleCertificateNotificationService.notifyBatchRejected(userId, batchId, rejectedCount, reason);
  
  const notifyAdminsOfBatchSubmission = (batchId: string, submitterName: string, batchSize: number) =>
    SimpleCertificateNotificationService.notifyAdminsOfBatchSubmission(batchId, submitterName, batchSize);
  
  return {
    notifyBatchSubmitted,
    notifyBatchApproved,
    notifyBatchRejected,
    notifyAdminsOfBatchSubmission
  };
}

export function useCertificateWorkflowNotifications() {
  const notifyCertificateApproved = (userId: string, certificateRequestId: string, certificateName: string) =>
    SimpleCertificateNotificationService.notifyCertificateApproved(userId, certificateRequestId, certificateName);
  
  const notifyCertificateRejected = (userId: string, certificateRequestId: string, certificateName: string, reason?: string) =>
    SimpleCertificateNotificationService.notifyCertificateRejected(userId, certificateRequestId, certificateName, reason);
  
  return {
    notifyCertificateApproved,
    notifyCertificateRejected
  };
}