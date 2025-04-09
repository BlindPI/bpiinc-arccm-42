
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FileIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DocumentSubmissionCard } from './document-components/DocumentSubmissionCard';
import { calculateDocumentStatus } from '@/utils/documentUtils';
import { DocumentSubmission } from '@/types/user-management';

interface DocumentManagementInterfaceProps {
  userId: string;
}

export const DocumentManagementInterface = ({ userId }: DocumentManagementInterfaceProps) => {
  const queryClient = useQueryClient();

  const { data: submissions, isLoading, error: submissionsError } = useQuery({
    queryKey: ['document-submissions', userId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('document_submissions')
          .select('*, document_requirements:requirement_id(*)')
          .eq('instructor_id', userId);
        
        if (error) throw error;
        return data as unknown as DocumentSubmission[];
      } catch (error) {
        console.error('Error fetching document submissions:', error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  const { data: userRole, error: roleError } = useQuery({
    queryKey: ['user-role'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();
        
        if (error) throw error;
        if (!data) throw new Error('No profile found');
        
        return data.role;
      } catch (error) {
        console.error('Error fetching user role:', error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  const handleFileUpload = async (requirementId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

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
          requirement_id: requirementId,
          document_url: publicUrl,
          status: 'PENDING',
          instructor_id: userId
        });

      if (submissionError) throw submissionError;

      toast.success('Document uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['document-submissions'] });
    } catch (error) {
      console.error('Error uploading document:', error);
      
      // @ts-ignore - Error might be any type
      if (error.message?.includes('storage/object-not-found')) {
        toast.error('Storage bucket not found. Please contact support.');
      // @ts-ignore - Error might be any type
      } else if (error.message?.includes('storage/unauthorized')) {
        toast.error('Not authorized to upload documents');
      } else {
        toast.error('Failed to upload document');
      }
    }
  };

  // Show error states
  if (submissionsError || roleError) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center text-destructive">
            <p className="font-medium">Error loading documents</p>
            <p className="text-sm mt-1">Please try refreshing the page</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const { totalDocuments, approvedDocuments, completionPercentage } = calculateDocumentStatus(submissions || []);
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
