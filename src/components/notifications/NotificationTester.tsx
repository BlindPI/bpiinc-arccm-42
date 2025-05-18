
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { testEmailSending, processNotificationQueue } from '@/services/notifications/certificateNotifications';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Renaming the imported type to avoid conflict
import type { NotificationQueueEntry as QueueEntry } from '@/types/notifications';

export function NotificationTester() {
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  
  // Get notification queue information
  const queueQuery = useQuery({
    queryKey: ['notification-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      return data as QueueEntry[];
    },
    refetchInterval: 10000
  });
  
  const handleSendTestEmail = async () => {
    if (!testEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    try {
      setIsSendingTest(true);
      await testEmailSending(testEmail);
      toast.success('Test email sent successfully!');
      setTestEmail('');
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email');
    } finally {
      setIsSendingTest(false);
    }
  };
  
  const handleProcessQueue = async () => {
    try {
      setIsProcessingQueue(true);
      await processNotificationQueue();
      toast.success('Notification queue processing triggered');
      queueQuery.refetch();
    } catch (error) {
      console.error('Error processing notification queue:', error);
      toast.error('Failed to process notification queue');
    } finally {
      setIsProcessingQueue(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input 
          placeholder="Enter email for test notification" 
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          className="flex-grow"
        />
        <Button 
          onClick={handleSendTestEmail}
          disabled={isSendingTest || !testEmail}
          className="whitespace-nowrap"
        >
          {isSendingTest ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            'Send Test Email'
          )}
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2 items-start justify-between">
        <div className="text-sm text-muted-foreground">
          {queueQuery.isLoading ? (
            <span className="flex items-center">
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Checking notification queue...
            </span>
          ) : queueQuery.isError ? (
            <span className="flex items-center text-red-500">
              <AlertCircle className="h-4 w-4 mr-1" />
              Error checking queue
            </span>
          ) : queueQuery.data && queueQuery.data.length > 0 ? (
            <span className="flex items-center text-amber-500">
              <AlertCircle className="h-4 w-4 mr-1" />
              {queueQuery.data.length} notification(s) in queue
            </span>
          ) : (
            <span className="flex items-center text-green-500">
              <CheckCircle className="h-4 w-4 mr-1" />
              Queue is empty
            </span>
          )}
        </div>
        
        <Button 
          variant="outline"
          onClick={handleProcessQueue}
          disabled={isProcessingQueue}
        >
          {isProcessingQueue ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            'Process Queue'
          )}
        </Button>
      </div>
    </div>
  );
}
