
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

export function NotificationTester() {
  const { data: profile } = useProfile();
  const [title, setTitle] = useState('Test Notification');
  const [message, setMessage] = useState('This is a test notification message.');
  const [type, setType] = useState('INFO');
  const [sending, setSending] = useState(false);

  const handleSendNotification = async () => {
    if (!profile) {
      toast.error('User profile not found');
      return;
    }
    
    setSending(true);
    
    try {
      await sendCertificateNotification({
        recipientId: profile.id,
        recipientEmail: profile.email || '',
        recipientName: profile.display_name || 'User',
        title,
        message,
        type: type as any,
        sendEmail: true
      });
      
      toast.success('Test notification sent');
      
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
