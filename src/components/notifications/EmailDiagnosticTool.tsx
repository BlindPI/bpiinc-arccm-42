
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { testEmailSending } from "@/services/notifications/certificateNotifications";
import { toast } from "sonner";

export function EmailDiagnosticTool() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{success: boolean, message?: string} | null>(null);

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
