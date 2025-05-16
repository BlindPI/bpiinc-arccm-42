
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BellRing } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { sendCertificateNotification } from "@/services/notifications/certificateNotifications";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface NotificationQueueEntry {
  status: string;
  processed_at?: string;
  error?: string;
}

export function NotificationTester() {
  const { data: profile } = useProfile();
  const [title, setTitle] = useState('Test Notification');
  const [message, setMessage] = useState('This is a test notification message.');
  const [type, setType] = useState('INFO');
  const [category, setCategory] = useState('TEST');
  const [sending, setSending] = useState(false);
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);

  // Query to monitor notification status if we have a notification ID
  const { data: notificationStatus, isLoading: isLoadingStatus } = useQuery<NotificationQueueEntry | null>({
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
      return data?.status === 'PENDING' ? 1000 : false;
    }
  });

  const handleSendNotification = async () => {
    if (!profile) {
      toast.error('User profile not found');
      return;
    }
    
    setSending(true);
    setLastNotificationId(null);
    
    try {
      const result = await sendCertificateNotification({
        recipientId: profile.id,
        recipientEmail: profile.email || '',
        recipientName: profile.display_name || 'User',
        title,
        message,
        type: type as any,
        sendEmail: true,
        category
      });
      
      toast.success('Test notification sent and queued for email delivery');
      setLastNotificationId(result?.notification_id);
      
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Tester</CardTitle>
        <CardDescription>
          Test the notification system by sending yourself a message
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Notification Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INFO">Information</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TEST">Test</SelectItem>
                <SelectItem value="CERTIFICATE">Certificate</SelectItem>
                <SelectItem value="SYSTEM">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
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
          onClick={handleSendNotification}
          disabled={sending || !title || !message}
        >
          {sending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <BellRing className="mr-2 h-4 w-4" />
              Send Test Notification
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
