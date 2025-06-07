
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserRole } from "@/types/supabase-schema";
import { DocumentRequirement, DocumentSubmission } from "@/types/api";

interface DocumentRequirementsProps { 
  userId: string;
  fromRole: UserRole;
  toRole: UserRole;
}

type ExtendedDocumentSubmission = DocumentSubmission & {
  status: 'pending' | 'approved' | 'rejected';
};

export const DocumentRequirements = ({ 
  userId,
  fromRole,
  toRole 
}: DocumentRequirementsProps) => {
  const { data: requirements } = useQuery({
    queryKey: ['document-requirements', fromRole, toRole],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_requirements')
        .select('*')
        .eq('from_role', fromRole)
        .eq('to_role', toRole);

      if (error) throw error;
      return data as unknown as DocumentRequirement[];
    }
  });

  const { data: submissions } = useQuery({
    queryKey: ['document-submissions', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_submissions')
        .select('*')
        .eq('instructor_id', userId);

      if (error) throw error;
      return data as unknown as ExtendedDocumentSubmission[];
    }
  });

  const getSubmissionStatus = (requirementId: string): ExtendedDocumentSubmission["status"] => {
    const submission = submissions?.find(s => s.requirement_id === requirementId);
    return submission?.status || 'pending';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Required Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requirements?.map((req, index) => (
            <div key={req.id}>
              {index > 0 && <Separator className="my-4" />}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{req.document_type}</p>
                  {req.is_mandatory && (
                    <Badge variant="secondary" className="text-xs">Required</Badge>
                  )}
                </div>
                <StatusBadge status={getSubmissionStatus(req.id)} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const StatusBadge = ({ 
  status 
}: { 
  status: ExtendedDocumentSubmission["status"];
}) => {
  switch (status.toLowerCase()) {
    case 'approved':
      return (
        <Badge className="bg-green-500">
          <CheckCircle className="mr-1 h-3 w-3" />
          Approved
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="secondary">
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
      );
    case 'rejected':
    default:
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" />
          Missing
        </Badge>
      );
  }
};
