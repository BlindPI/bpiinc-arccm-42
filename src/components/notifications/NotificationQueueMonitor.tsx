
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { processNotificationQueue } from "@/services/notifications/certificateNotifications";

export function NotificationQueueMonitor() {
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();
  
  // Query to get the queue status
  const { data: queueStatus, isLoading, error } = useQuery({
    queryKey: ['notification-queue-status'],
    queryFn: async () => {
      // Get counts by status
      const { data: countData, error: countError } = await supabase
        .from('notification_queue')
        .select('status, count')
        .select()
        .select('status')
        .select('id, status, notification_id, created_at, processed_at, error')
        .limit(50)
        .order('created_at', { ascending: false });
        
      if (countError) throw countError;
      
      // Get the latest few entries
      const { data: latestItems, error: latestError } = await supabase
        .from('notification_queue')
        .select('id, status, notification_id, created_at, processed_at, error')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (latestError) throw latestError;
      
      // Calculate counts by status
      const counts = {
        PENDING: 0,
        SENT: 0,
        FAILED: 0,
        SKIPPED: 0
      };
      
      if (countData) {
        countData.forEach(item => {
          if (counts.hasOwnProperty(item.status)) {
            counts[item.status as keyof typeof counts]++;
          }
        });
      }
      
      return {
        counts,
        latestItems: latestItems || []
      };
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });
  
  // Handle processing the queue
  const handleProcessQueue = async () => {
    setProcessing(true);
    try {
      await processNotificationQueue();
      toast.success('Queue processing complete');
      queryClient.invalidateQueries({ queryKey: ['notification-queue-status'] });
    } catch (error) {
      console.error('Failed to process queue:', error);
    } finally {
      setProcessing(false);
    }
  };
  
  // Handle manual refresh
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['notification-queue-status'] });
  };
  
  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'SENT':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" /> Sent</Badge>;
      case 'FAILED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertTriangle className="h-3 w-3 mr-1" /> Failed</Badge>;
      case 'SKIPPED':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Skipped</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="bg-red-50 p-4 rounded-md text-red-700">
            <h3 className="font-medium">Error loading queue status</h3>
            <p className="text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Queue Monitor</CardTitle>
        <CardDescription>
          Monitor and manage the email notification queue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Queue statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-md text-center">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold">{queueStatus?.counts.PENDING || 0}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-md text-center">
            <p className="text-sm text-green-700">Sent</p>
            <p className="text-2xl font-bold text-green-700">{queueStatus?.counts.SENT || 0}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-md text-center">
            <p className="text-sm text-red-700">Failed</p>
            <p className="text-2xl font-bold text-red-700">{queueStatus?.counts.FAILED || 0}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-md text-center">
            <p className="text-sm text-gray-500">Skipped</p>
            <p className="text-2xl font-bold">{queueStatus?.counts.SKIPPED || 0}</p>
          </div>
        </div>
        
        {/* Latest items */}
        {queueStatus?.latestItems && queueStatus.latestItems.length > 0 && (
          <div className="border rounded-md">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h3 className="font-medium">Latest Queue Entries</h3>
            </div>
            <div className="divide-y">
              {queueStatus.latestItems.map(item => (
                <div key={item.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {renderStatusBadge(item.status)}
                        <span className="text-sm text-gray-500">
                          {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm truncate">ID: {item.notification_id}</p>
                      {item.processed_at && (
                        <p className="text-xs text-gray-500">
                          Processed: {new Date(item.processed_at).toLocaleDateString()} {new Date(item.processed_at).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {item.error && (
                    <div className="mt-2 p-2 bg-red-50 text-red-700 text-xs rounded">
                      Error: {item.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {queueStatus?.latestItems && queueStatus.latestItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No notification queue entries found</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
        <Button 
          onClick={handleProcessQueue}
          disabled={processing || isLoading || (queueStatus?.counts.PENDING === 0)}
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Process Queue
              {queueStatus?.counts.PENDING ? ` (${queueStatus.counts.PENDING})` : ''}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
