
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { processNotificationQueue } from "@/services/notifications/certificateNotifications";
import { toast } from "sonner";
import { Loader2, Mail, RefreshCw } from "lucide-react";

interface ProcessingResult {
  success: boolean;
  processed: number;
  results: Array<{
    id: string;
    success: boolean;
    error?: string;
  }>;
}

export function NotificationProcessor() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);

  const handleProcessQueue = async () => {
    setLoading(true);
    try {
      const data = await processNotificationQueue();
      setResult(data);
      toast.success(`Processed ${data.processed} notifications`);
    } catch (error) {
      console.error("Error processing queue:", error);
      toast.error("Failed to process notification queue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Queue Processor</CardTitle>
        <CardDescription>
          Process pending notifications in the queue
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Last processing result:</p>
            <div className="rounded bg-muted p-3 text-sm">
              <p>Processed: {result.processed}</p>
              <p>Successful: {result.results.filter(r => r.success).length}</p>
              <p>Failed: {result.results.filter(r => !r.success).length}</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setResult(null)}
          disabled={!result || loading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Clear Results
        </Button>
        <Button 
          onClick={handleProcessQueue}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Process Queue
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
