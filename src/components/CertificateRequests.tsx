
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

export function CertificateRequests() {
  const { data: profile } = useProfile();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['certificateRequests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificate_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <AlertCircle className="h-6 w-6 animate-pulse text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Certificate Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="text-center text-muted-foreground">
              No certificate requests available
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
