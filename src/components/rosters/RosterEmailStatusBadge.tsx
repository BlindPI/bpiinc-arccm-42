
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
  // Get email status for certificates in this roster - reduced cache time for fresher data
  const { data: emailStatus } = useQuery({
    queryKey: ['roster-email-status', rosterId],
    queryFn: async () => {
      if (certificateCount === 0) return { emailed: 0, total: 0, failed: 0, archived: 0 };
      
      // Check both certificates and certificate_requests tables
      const [certsResult, requestsResult] = await Promise.all([
        supabase
          .from('certificates')
          .select('email_status, is_batch_emailed, last_emailed_at, status')
          .eq('roster_id', rosterId),
        supabase
          .from('certificate_requests')
          .select('status, assessment_status')
          .eq('roster_id', rosterId)
      ]);
      
      if (certsResult.error && requestsResult.error) throw certsResult.error || requestsResult.error;
      
      const certificates = certsResult.data || [];
      const requests = requestsResult.data || [];
      
      const emailed = certificates.filter(cert =>
        cert.is_batch_emailed ||
        cert.email_status === 'SENT' ||
        cert.last_emailed_at
      ).length;
      
      const failed = requests.filter(req =>
        req.assessment_status === 'FAIL' ||
        req.status === 'ARCHIVED'
      ).length;
      
      const archived = requests.filter(req => req.status === 'ARCHIVED').length;
      
      return {
        emailed,
        total: Math.max(certificates.length, requests.length),
        failed,
        archived
      };
    },
    enabled: certificateCount > 0,
    staleTime: 30000, // 30 seconds - shorter cache time
    gcTime: 60000 // 1 minute - shorter garbage collection time
  });

  // Check for pending email operations - reduced cache time
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
      
      // Always return a defined value - null if no pending operations
      return data && data.length > 0 ? data[0] : null;
    },
    staleTime: 10000, // 10 seconds - very short cache for pending operations
    gcTime: 30000 // 30 seconds
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

  const { emailed, total, failed, archived } = emailStatus;

  if (emailed === 0) {
    // Provide specific reason why not emailed
    if (failed > 0 || archived > 0) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700" title={`${failed} failed assessments, ${archived} archived`}>
          <AlertCircle className="h-3 w-3 mr-1" />
          Not Emailed (Failed)
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
          <Mail className="h-3 w-3 mr-1" />
          Not Emailed (Pending)
        </Badge>
      );
    }
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
