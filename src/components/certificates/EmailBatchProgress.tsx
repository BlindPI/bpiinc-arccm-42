
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Mail, Clock, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EmailBatchOperation } from '@/types/certificates';

interface EmailBatchProgressProps {
  batchId: string;
  onComplete?: () => void;
}

export function EmailBatchProgress({ batchId, onComplete }: EmailBatchProgressProps) {
  const [isComplete, setIsComplete] = useState(false);

  const { data: batchOperation, isLoading } = useQuery({
    queryKey: ['email-batch-progress', batchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_batch_operations')
        .select('*')
        .eq('id', batchId)
        .single();
      
      if (error) throw error;
      return data as EmailBatchOperation;
    },
    refetchInterval: (query) => {
      // Stop polling when complete or failed
      if (query.state.data?.status === 'COMPLETED' || query.state.data?.status === 'FAILED') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
    enabled: !!batchId
  });

  useEffect(() => {
    if (batchOperation?.status === 'COMPLETED' || batchOperation?.status === 'FAILED') {
      if (!isComplete) {
        setIsComplete(true);
        if (onComplete) {
          setTimeout(onComplete, 2000); // Give user time to see the result
        }
      }
    }
  }, [batchOperation?.status, isComplete, onComplete]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 animate-spin" />
            <span>Initializing email batch...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!batchOperation) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-4 w-4" />
            <span>Batch operation not found</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = batchOperation.total_certificates > 0 
    ? Math.round((batchOperation.processed_certificates / batchOperation.total_certificates) * 100)
    : 0;

  const getStatusBadge = () => {
    switch (batchOperation.status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'PROCESSING':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Mail className="h-3 w-3 mr-1 animate-pulse" />
            Sending...
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Progress
          </span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{batchOperation.processed_certificates} / {batchOperation.total_certificates}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="text-center text-sm text-muted-foreground">
            {progressPercentage}% complete
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Successful: {batchOperation.successful_emails}</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span>Failed: {batchOperation.failed_emails}</span>
          </div>
        </div>

        {/* Batch Details */}
        {batchOperation.batch_name && (
          <div className="text-sm text-muted-foreground">
            Batch: {batchOperation.batch_name}
          </div>
        )}

        {/* Error Message */}
        {batchOperation.error_message && (
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <div className="text-sm text-red-700">
              <strong>Error:</strong> {batchOperation.error_message}
            </div>
          </div>
        )}

        {/* Completion Message */}
        {batchOperation.status === 'COMPLETED' && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-md">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div className="text-sm text-green-700">
              <strong>Success!</strong> All emails have been sent successfully.
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Started: {new Date(batchOperation.created_at).toLocaleString()}</div>
          {batchOperation.completed_at && (
            <div>Completed: {new Date(batchOperation.completed_at).toLocaleString()}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
