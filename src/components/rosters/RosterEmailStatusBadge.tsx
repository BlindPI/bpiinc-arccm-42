
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Mail, MailCheck, Clock, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RosterEmailStatusBadgeProps {
  rosterId: string;
  certificateCount: number;
}

export function RosterEmailStatusBadge({ rosterId, certificateCount }: RosterEmailStatusBadgeProps) {
  // Get email status for certificates in this roster
  const { data: emailStatus } = useQuery({
    queryKey: ['roster-email-status', rosterId],
    queryFn: async () => {
      if (certificateCount === 0) return { emailed: 0, total: 0 };
      
      const { data, error } = await supabase
        .from('certificates')
        .select('email_status, is_batch_emailed, last_emailed_at')
        .eq('roster_id', rosterId);
      
      if (error) throw error;
      
      const emailed = data?.filter(cert => 
        cert.is_batch_emailed || 
        cert.email_status === 'SENT' || 
        cert.last_emailed_at
      ).length || 0;
      
      return { emailed, total: data?.length || 0 };
    },
    enabled: certificateCount > 0
  });

  // Check for pending email operations
  const { data: pendingOperations } = useQuery({
    queryKey: ['roster-pending-emails', rosterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_batch_operations')
        .select('status')
        .eq('batch_name', `Roster ${rosterId}`)
        .in('status', ['PENDING', 'PROCESSING'])
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      return data?.[0];
    }
  });

  if (certificateCount === 0) {
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-500">
        <AlertCircle className="h-3 w-3 mr-1" />
        No Certificates
      </Badge>
    );
  }

  if (pendingOperations) {
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 animate-pulse">
        <Clock className="h-3 w-3 mr-1" />
        Sending...
      </Badge>
    );
  }

  if (!emailStatus) {
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-500">
        <Mail className="h-3 w-3 mr-1" />
        Checking...
      </Badge>
    );
  }

  const { emailed, total } = emailStatus;

  if (emailed === 0) {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700">
        <Mail className="h-3 w-3 mr-1" />
        Not Emailed
      </Badge>
    );
  }

  if (emailed === total) {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700">
        <MailCheck className="h-3 w-3 mr-1" />
        All Emailed ({emailed})
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
      <Mail className="h-3 w-3 mr-1" />
      Partial ({emailed}/{total})
    </Badge>
  );
}
