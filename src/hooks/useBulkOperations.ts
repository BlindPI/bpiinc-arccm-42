
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';

interface BulkOperationResult {
  successful: number;
  failed: number;
  errors: string[];
}

export function useBulkUserOperations() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const bulkUpdateRoles = useMutation({
    mutationFn: async ({ userIds, newRole }: { userIds: string[]; newRole: string }) => {
      const result: BulkOperationResult = { successful: 0, failed: 0, errors: [] };
      setProgress({ current: 0, total: userIds.length });

      for (let i = 0; i < userIds.length; i++) {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userIds[i]);

          if (error) {
            result.failed++;
            result.errors.push(`User ${userIds[i]}: ${error.message}`);
          } else {
            result.successful++;
          }
        } catch (error) {
          result.failed++;
          result.errors.push(`User ${userIds[i]}: ${error}`);
        }
        
        setProgress({ current: i + 1, total: userIds.length });
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success(`Bulk update completed: ${result.successful} successful, ${result.failed} failed`);
      setProgress({ current: 0, total: 0 });
    },
    onError: () => {
      toast.error('Bulk operation failed');
      setProgress({ current: 0, total: 0 });
    }
  });

  const bulkDeactivateUsers = useMutation({
    mutationFn: async (userIds: string[]) => {
      const result: BulkOperationResult = { successful: 0, failed: 0, errors: [] };
      setProgress({ current: 0, total: userIds.length });

      for (let i = 0; i < userIds.length; i++) {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ status: 'INACTIVE' })
            .eq('id', userIds[i]);

          if (error) {
            result.failed++;
            result.errors.push(`User ${userIds[i]}: ${error.message}`);
          } else {
            result.successful++;
          }
        } catch (error) {
          result.failed++;
          result.errors.push(`User ${userIds[i]}: ${error}`);
        }
        
        setProgress({ current: i + 1, total: userIds.length });
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success(`Bulk deactivation completed: ${result.successful} successful, ${result.failed} failed`);
      setProgress({ current: 0, total: 0 });
    }
  });

  return {
    bulkUpdateRoles,
    bulkDeactivateUsers,
    progress,
    isProcessing: bulkUpdateRoles.isPending || bulkDeactivateUsers.isPending
  };
}

export function useBulkCertificateOperations() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const bulkEmailCertificates = useMutation({
    mutationFn: async (certificateIds: string[]) => {
      const result: BulkOperationResult = { successful: 0, failed: 0, errors: [] };
      setProgress({ current: 0, total: certificateIds.length });

      // Process in batches of 10
      const batchSize = 10;
      for (let i = 0; i < certificateIds.length; i += batchSize) {
        const batch = certificateIds.slice(i, i + batchSize);
        
        try {
          const { data, error } = await supabase.functions.invoke('send-batch-certificate-emails', {
            body: { certificateIds: batch }
          });

          if (error) {
            result.failed += batch.length;
            result.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
          } else {
            result.successful += data?.successful || 0;
            result.failed += data?.failed || 0;
            if (data?.errors) result.errors.push(...data.errors);
          }
        } catch (error) {
          result.failed += batch.length;
          result.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error}`);
        }

        setProgress({ current: Math.min(i + batchSize, certificateIds.length), total: certificateIds.length });
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success(`Bulk email completed: ${result.successful} sent, ${result.failed} failed`);
      setProgress({ current: 0, total: 0 });
    }
  });

  const bulkUpdateCertificateStatus = useMutation({
    mutationFn: async ({ certificateIds, status }: { certificateIds: string[]; status: string }) => {
      const result: BulkOperationResult = { successful: 0, failed: 0, errors: [] };
      setProgress({ current: 0, total: certificateIds.length });

      // Process in smaller batches to avoid timeout
      const batchSize = 50;
      for (let i = 0; i < certificateIds.length; i += batchSize) {
        const batch = certificateIds.slice(i, i + batchSize);
        
        try {
          const { error } = await supabase
            .from('certificates')
            .update({ status })
            .in('id', batch);

          if (error) {
            result.failed += batch.length;
            result.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
          } else {
            result.successful += batch.length;
          }
        } catch (error) {
          result.failed += batch.length;
          result.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error}`);
        }

        setProgress({ current: Math.min(i + batchSize, certificateIds.length), total: certificateIds.length });
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      toast.success(`Bulk status update completed: ${result.successful} updated, ${result.failed} failed`);
      setProgress({ current: 0, total: 0 });
    }
  });

  return {
    bulkEmailCertificates,
    bulkUpdateCertificateStatus,
    progress,
    isProcessing: bulkEmailCertificates.isPending || bulkUpdateCertificateStatus.isPending
  };
}
