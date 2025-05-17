import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { testEmailSending } from "@/services/notifications/certificateNotifications";
import { toast } from "sonner";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface NotificationQueueEntry {
  status: string;
  processed_at?: string;
  error?: string;
}

export function NotificationTester() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);
  const [result, setResult] = useState<{success: boolean, message?: string} | null>(null);

  // Query to monitor notification status if we have a notification ID
  const notificationStatusQuery = useQuery<NotificationQueueEntry | null>({
    queryKey: ['notification-status', lastNotificationId],
    queryFn: async () => {
      if (!lastNotificationId) return null;
      
      const { data: queueEntry, error } = await supabase
        .from('notification_queue')
        .select('status, processed_at, error')
        .eq('notification_id', lastNotificationId)
        .single();
        
      if (error) throw error;
      return queueEntry as NotificationQueueEntry;
    },
    enabled: !!lastNotificationId,
    refetchInterval: (data) => {
      // Keep polling until the notification is no longer pending
      return data && data.status === 'PENDING' ? 1000 : false;
    }
  });

  const notificationStatus = notificationStatusQuery.data;
  const isLoadingStatus = notificationStatusQuery.isLoading;

  const handleSendTestEmail = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setSending(true);
    setResult(null);
    
    try {
      const response = await testEmailSending(email);
      setResult({ 
        success: response.success, 
        message: response.success ? 'Email sent successfully' : response.error 
      });
    } catch (error) {
      console.error('Email test failed:', error);
      setResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Diagnostic Tool</CardTitle>
        <CardDescription>
          Send a test email to verify the notification delivery system is working correctly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        {result && (
          <div className={`p-3 rounded flex items-center ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {result.success ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            <span>{result.message}</span>
          </div>
        )}
        
        {lastNotificationId && notificationStatus && (
          <div className={`p-3 rounded-md mt-4 ${
            notificationStatus.status === 'SENT' ? 'bg-green-50 text-green-800' :
            notificationStatus.status === 'FAILED' ? 'bg-red-50 text-red-800' :
            'bg-blue-50 text-blue-800'
          }`}>
            <p className="text-sm font-medium">
              {isLoadingStatus ? 'Checking notification status...' : 
               notificationStatus.status === 'SENT' ? 'Email sent successfully!' :
               notificationStatus.status === 'FAILED' ? 'Email failed to send' :
               notificationStatus.status === 'PENDING' ? 'Email is queued for sending...' :
               'Unknown status'}
            </p>
            {notificationStatus.processed_at && (
              <p className="text-xs mt-1">
                Processed at: {new Date(notificationStatus.processed_at).toLocaleString()}
              </p>
            )}
            {notificationStatus.error && (
              <p className="text-xs mt-1 text-red-600">
                Error: {notificationStatus.error}
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSendTestEmail}
          disabled={sending || !email}
        >
          {sending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Send Test Email
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}