
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FileIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DocumentSubmissionCard } from './document-components/DocumentSubmissionCard';
import { calculateDocumentStatus } from '@/utils/documentUtils';
import type { DocumentSubmission } from '@/types/user-management';

interface DocumentManagementInterfaceProps {
  userId: string;
}

export const DocumentManagementInterface = ({ userId }: DocumentManagementInterfaceProps) => {
  const queryClient = useQueryClient();

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['document-submissions', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_submissions')
        .select('*, document_requirements(*)')
        .eq('instructor_id', userId);
      
      if (error) throw error;
      return data as DocumentSubmission[];
    }
  });

  const { data: userRole } = useQuery({
    queryKey: ['user-role'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return profile.role;
    }
  });

  const handleFileUpload = async (requirementId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const { error: submissionError } = await supabase
        .from('document_submissions')
        .insert({
          instructor_id: userId,
          requirement_id: requirementId,
          document_url: publicUrl,
          status: 'PENDING'
        });

      if (submissionError) throw submissionError;

      toast.success('Document uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['document-submissions'] });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const { totalDocuments, approvedDocuments, completionPercentage } = calculateDocumentStatus(submissions);
  const canReviewDocuments = ['SA', 'AD', 'AP'].includes(userRole || '');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileIcon className="h-5 w-5" />
            Document Management
          </div>
          <div className="text-sm font-normal">
            {approvedDocuments} of {totalDocuments} Documents Approved
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Progress value={completionPercentage} className="h-2" />
        </div>

        <div className="space-y-6">
          {submissions?.map((submission) => (
            <DocumentSubmissionCard
              key={submission.id}
              submission={submission}
              canReviewDocuments={canReviewDocuments}
              onUpload={handleFileUpload}
              onReviewComplete={() => queryClient.invalidateQueries({ queryKey: ['document-submissions'] })}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
