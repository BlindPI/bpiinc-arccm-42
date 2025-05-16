
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Settings2, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';

export function EmailConfigurationTool() {
  const [loading, setLoading] = useState(false);
  const [configStatus, setConfigStatus] = useState<{
    resendApiKey: boolean;
    domainVerified: boolean;
    error?: string;
  } | null>(null);

  const checkEmailConfiguration = async () => {
    setLoading(true);
    try {
      const result = await supabase.functions.invoke('send-notification', {
        body: {
          checkConfigOnly: true
        }
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      setConfigStatus({
        resendApiKey: result.data.hasResendApiKey,
        domainVerified: result.data.domainVerified,
        error: result.data.error
      });
    } catch (error) {
      setConfigStatus({
        resendApiKey: false,
        domainVerified: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Configuration Checker</CardTitle>
        <CardDescription>
          Verify that your email configuration is properly setup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {configStatus && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <span className="font-medium">Resend API Key</span>
              </div>
              {configStatus.resendApiKey ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" /> Configured
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <AlertCircle className="h-3 w-3 mr-1" /> Missing
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <span className="font-medium">Domain Verification</span>
              </div>
              {configStatus.domainVerified ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" /> Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <AlertCircle className="h-3 w-3 mr-1" /> Not Verified
                </Badge>
              )}
            </div>
            
            {configStatus.error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md">
                <p className="font-medium">Error</p>
                <p className="text-sm">{configStatus.error}</p>
              </div>
            )}
            
            {(!configStatus.resendApiKey || !configStatus.domainVerified) && (
              <div className="p-4 bg-blue-50 text-blue-700 rounded-md space-y-2">
                <p className="font-medium">Configuration Recommendations</p>
                {!configStatus.resendApiKey && (
                  <p className="text-sm">Set up a Resend API key in Supabase Edge Function secrets.</p>
                )}
                {!configStatus.domainVerified && (
                  <p className="text-sm">Verify your email domain in Resend or use the default Resend domain for testing.</p>
                )}
                <div className="pt-2">
                  <a 
                    href="https://resend.com/domains" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    Visit Resend Domain Settings
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {!configStatus && !loading && (
          <div className="text-center py-6 text-muted-foreground">
            <p>Click the button below to check your email configuration</p>
          </div>
        )}
        
        {loading && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={checkEmailConfiguration}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking Configuration...
            </>
          ) : (
            <>
              <Settings2 className="mr-2 h-4 w-4" />
              Check Email Configuration
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
