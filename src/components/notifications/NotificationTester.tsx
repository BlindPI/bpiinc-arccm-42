
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function NotificationTester() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "Test Notification",
    message: "This is a test notification message.",
    type: "INFO" as "SUCCESS" | "ERROR" | "WARNING" | "INFO" | "ACTION",
    priority: "NORMAL" as "LOW" | "NORMAL" | "HIGH" | "URGENT",
    category: "GENERAL" as "GENERAL" | "SYSTEM" | "CERTIFICATE" | "COURSE" | "ACCOUNT" | "SUPERVISION" | "ROLE_MANAGEMENT",
    actionUrl: "",
    sendEmail: true,
    imageUrl: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      type: value as "SUCCESS" | "ERROR" | "WARNING" | "INFO" | "ACTION" 
    }));
  };
  
  const handlePriorityChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      priority: value as "LOW" | "NORMAL" | "HIGH" | "URGENT" 
    }));
  };
  
  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      category: value as "GENERAL" | "SYSTEM" | "CERTIFICATE" | "COURSE" | "ACCOUNT" | "SUPERVISION" | "ROLE_MANAGEMENT" 
    }));
  };

  const handleEmailToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, sendEmail: e.target.checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to send notifications");
      return;
    }

    setLoading(true);
    try {
      const result = await supabase.functions.invoke('send-notification', {
        body: {
          userId: user.id,
          title: formData.title,
          message: formData.message,
          type: formData.type,
          priority: formData.priority,
          category: formData.category,
          actionUrl: formData.actionUrl || undefined,
          imageUrl: formData.imageUrl || undefined,
          sendEmail: formData.sendEmail
        }
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      toast.success("Test notification sent successfully");
      console.log("Notification result:", result.data);
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast.error("Failed to send test notification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Tester</CardTitle>
        <CardDescription>
          Send a test notification to yourself
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select notification type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INFO">Information</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="ERROR">Error</SelectItem>
                  <SelectItem value="ACTION">Action Required</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={handlePriorityChange}
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select notification category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GENERAL">General</SelectItem>
                <SelectItem value="SYSTEM">System</SelectItem>
                <SelectItem value="CERTIFICATE">Certificate</SelectItem>
                <SelectItem value="COURSE">Course</SelectItem>
                <SelectItem value="ACCOUNT">Account</SelectItem>
                <SelectItem value="SUPERVISION">Supervision</SelectItem>
                <SelectItem value="ROLE_MANAGEMENT">Role Management</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="actionUrl">Action URL (optional)</Label>
            <Input
              id="actionUrl"
              name="actionUrl"
              value={formData.actionUrl}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (optional)</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="sendEmail"
              checked={formData.sendEmail}
              onChange={handleEmailToggle}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="sendEmail" className="text-sm font-normal">
              Also send as email
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !user}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Test Notification
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
