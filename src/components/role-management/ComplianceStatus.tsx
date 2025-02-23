
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileCheck, AlertTriangle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface DocumentStatus {
  document_type: string;
  category: string;
  status: string;
  verification_status: {
    is_verified: boolean;
    expiry_status: 'VALID' | 'EXPIRED' | 'EXPIRING_SOON' | 'NOT_APPLICABLE';
  };
  expiry_date: string | null;
}

interface ComplianceDetail {
  instructor_id: string;
  display_name: string;
  current_role: string;
  documents: DocumentStatus[];
  is_compliant: boolean;
}

interface ComplianceStatusProps {
  userId: string;
}

const getStatusColor = (status: string, expiry_status: string) => {
  if (status !== 'APPROVED') return 'bg-yellow-500';
  if (expiry_status === 'EXPIRED') return 'bg-red-500';
  if (expiry_status === 'EXPIRING_SOON') return 'bg-yellow-500';
  return 'bg-green-500';
};

export function ComplianceStatus({ userId }: ComplianceStatusProps) {
  const { data: compliance, isLoading } = useQuery({
    queryKey: ['compliance-detail', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instructor_compliance_detail')
        .select('*')
        .eq('instructor_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      
      // Transform the data to match our expected types
      if (data) {
        return {
          ...data,
          documents: data.documents as DocumentStatus[]
        } as ComplianceDetail;
      }
      return null;
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!compliance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span>No compliance information available</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const documentsByCategory = compliance.documents.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, DocumentStatus[]>);

  const totalDocuments = compliance.documents.length;
  const approvedDocuments = compliance.documents.filter(
    doc => doc.status === 'APPROVED' && 
    doc.verification_status?.expiry_status !== 'EXPIRED'
  ).length;
  const completionPercentage = (approvedDocuments / totalDocuments) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Compliance Status</span>
          <Badge
            variant={compliance.is_compliant ? 'default' : 'destructive'}
            className="ml-2"
          >
            {compliance.is_compliant ? 'Compliant' : 'Non-Compliant'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-primary" />
              <span>Overall Progress</span>
            </div>
            <span className="text-sm">
              {approvedDocuments} of {totalDocuments} Complete
            </span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        {Object.entries(documentsByCategory).map(([category, documents], index) => (
          <div key={category}>
            {index > 0 && <Separator className="my-4" />}
            <h3 className="font-semibold mb-2">{category}</h3>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.document_type} className="flex items-center justify-between">
                  <span className="text-sm">{doc.document_type}</span>
                  <div className="flex items-center gap-2">
                    {doc.expiry_date && doc.verification_status.expiry_status !== 'NOT_APPLICABLE' && (
                      <span className="text-xs text-muted-foreground">
                        {doc.verification_status.expiry_status === 'EXPIRED' ? 'Expired' :
                         doc.verification_status.expiry_status === 'EXPIRING_SOON' ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Expiring {new Date(doc.expiry_date).toLocaleDateString()}</span>
                          </div>
                         ) : new Date(doc.expiry_date).toLocaleDateString()}
                      </span>
                    )}
                    <Badge
                      className={getStatusColor(
                        doc.status,
                        doc.verification_status?.expiry_status || 'NOT_APPLICABLE'
                      )}
                    >
                      {doc.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
