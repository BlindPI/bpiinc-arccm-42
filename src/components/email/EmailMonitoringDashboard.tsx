import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { EmailDeliveryService } from '@/services/email/emailDeliveryService';
import { AlertTriangle, CheckCircle, XCircle, Clock, RefreshCw, Bell } from 'lucide-react';
import { toast } from 'sonner';

interface DeliveryAlert {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  metadata: Record<string, any>;
  created_at: string;
  resolved_at?: string;
}

interface RetryJob {
  id: string;
  certificate_id: string;
  retry_count: number;
  next_retry_at: string;
  status: string;
  error_message?: string;
  created_at: string;
}

export function EmailMonitoringDashboard() {
  const queryClient = useQueryClient();

  // Fetch active alerts
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['email-delivery-alerts'],
    queryFn: async (): Promise<DeliveryAlert[]> => {
      const { data, error } = await supabase
        .from('email_delivery_alerts')
        .select('*')
        .is('resolved_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000 // Refresh every minute
  });

  // Fetch retry queue
  const { data: retryQueue, isLoading: retryLoading } = useQuery({
    queryKey: ['email-retry-queue'],
    queryFn: async (): Promise<RetryJob[]> => {
      const { data, error } = await supabase
        .from('email_retry_queue')
        .select('*')
        .in('status', ['pending', 'processing'])
        .order('next_retry_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Process retry queue mutation
  const processRetryMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('process-email-retries', {
        body: { processQueue: true }
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Retry queue processing started');
      queryClient.invalidateQueries({ queryKey: ['email-retry-queue'] });
      queryClient.invalidateQueries({ queryKey: ['email-delivery-stats'] });
    },
    onError: (error) => {
      toast.error('Failed to process retry queue');
      console.error('Error processing retry queue:', error);
    }
  });

  // Resolve alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await EmailDeliveryService.resolveAlert(alertId);
    },
    onSuccess: () => {
      toast.success('Alert resolved');
      queryClient.invalidateQueries({ queryKey: ['email-delivery-alerts'] });
    },
    onError: (error) => {
      toast.error('Failed to resolve alert');
      console.error('Error resolving alert:', error);
    }
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'high': return <Badge variant="destructive">High</Badge>;
      case 'medium': return <Badge variant="secondary">Medium</Badge>;
      default: return <Badge variant="outline">Low</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline">Pending</Badge>;
      case 'processing': return <Badge variant="secondary">Processing</Badge>;
      case 'completed': return <Badge variant="default">Completed</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Monitoring & Alerts</h2>
          <p className="text-muted-foreground">Monitor email delivery issues and manage automated retries</p>
        </div>
        <Button 
          onClick={() => processRetryMutation.mutate()}
          disabled={processRetryMutation.isPending}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${processRetryMutation.isPending ? 'animate-spin' : ''}`} />
          Process Retries
        </Button>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Active Alerts</span>
            {alerts && alerts.length > 0 && (
              <Badge variant="destructive">{alerts.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>Email delivery issues requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          {alertsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : alerts && alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Alert key={alert.id} className="relative">
                  <div className="flex items-start space-x-3">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{alert.message}</span>
                          {getSeverityBadge(alert.severity)}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveAlertMutation.mutate(alert.id)}
                          disabled={resolveAlertMutation.isPending}
                        >
                          Resolve
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {new Date(alert.created_at).toLocaleString()}
                      </div>
                      {alert.metadata?.domain && (
                        <div className="text-sm text-muted-foreground">
                          Domain: {alert.metadata.domain} | 
                          Bounce Rate: {alert.metadata.bounce_rate}% | 
                          Total Emails: {alert.metadata.total_emails}
                        </div>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              No active alerts
            </div>
          )}
        </CardContent>
      </Card>

      {/* Retry Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5" />
            <span>Email Retry Queue</span>
            {retryQueue && retryQueue.length > 0 && (
              <Badge variant="outline">{retryQueue.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>Failed emails scheduled for retry</CardDescription>
        </CardHeader>
        <CardContent>
          {retryLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : retryQueue && retryQueue.length > 0 ? (
            <div className="space-y-3">
              {retryQueue.map((retry) => (
                <div key={retry.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Certificate {retry.certificate_id.slice(0, 8)}...</span>
                      {getStatusBadge(retry.status)}
                      <Badge variant="outline">Attempt {retry.retry_count}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Next retry: {new Date(retry.next_retry_at).toLocaleString()}
                    </div>
                    {retry.error_message && (
                      <div className="text-sm text-red-600 mt-1">
                        Error: {retry.error_message}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      Created: {new Date(retry.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              No pending retries
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Status */}
      {processRetryMutation.isPending && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Processing email retry queue... This may take a few moments.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}