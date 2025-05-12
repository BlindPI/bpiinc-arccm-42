
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { testEmailSending } from "@/services/notifications/certificateNotifications";

export function EmailDiagnosticTool() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{success: boolean, error?: string} | null>(null);

  const handleTestEmail = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      const testResult = await testEmailSending(email);
      setResult(testResult);
    } catch (error) {
      setResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Diagnostic Tool</CardTitle>
        <CardDescription>
          Test the email notification system by sending a test email
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="test-email" className="text-sm font-medium block mb-1">
            Email Address
          </label>
          <Input
            id="test-email"
            type="email"
            placeholder="Enter email to test"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {result && (
          <div className={`rounded p-3 ${result.success ? 'bg-green-50' : 'bg-red-50'} flex items-start gap-3`}>
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
            )}
            <div>
              <p className="font-medium">
                {result.success ? 'Email sent successfully' : 'Email test failed'}
              </p>
              {!result.success && result.error && (
                <p className="text-sm text-red-700 mt-1">{result.error}</p>
              )}
              {result.success && (
                <p className="text-sm text-green-700 mt-1">
                  Check the inbox for the test email. If you don't see it, check your spam folder.
                </p>
              )}
            </div>
          </div>
        )}
        
        <div className="bg-muted p-3 rounded text-sm">
          <p className="font-medium mb-2">Troubleshooting Tips:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Verify the Resend API key is valid and properly set in Supabase secrets</li>
            <li>Confirm the domain (mail.bpiincworks.com) is properly verified in Resend</li>
            <li>Check DNS settings for proper SPF, DKIM, and DMARC records</li>
            <li>Examine the edge function logs for detailed error information</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleTestEmail}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Test Email...
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
