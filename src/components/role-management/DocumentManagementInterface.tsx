
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileIcon, Loader2, Upload, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DocumentReviewInterface } from './DocumentReviewInterface';
import type { Database } from '@/integrations/supabase/types';

type DocumentSubmission = Database['public']['Tables']['document_submissions']['Row'] & {
  document_requirements: Database['public']['Tables']['document_requirements']['Row']
};

export const DocumentManagementInterface = ({ userId }: { userId: string }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
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

  const handleFileUpload = async (requirementId: string) => {
    if (!file) return;

    setUploading(true);
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
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['document-submissions'] });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Approved</span>
          </div>
        );
      case 'REJECTED':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-4 w-4" />
            <span>Rejected</span>
          </div>
        );
      case 'PENDING':
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <Clock className="h-4 w-4" />
            <span>Pending Review</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-gray-600">
            <AlertCircle className="h-4 w-4" />
            <span>Missing</span>
          </div>
        );
    }
  };

  const canReviewDocuments = ['SA', 'AD', 'AP'].includes(userRole || '');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const totalDocuments = submissions?.length || 0;
  const approvedDocuments = submissions?.filter(s => s.status === 'APPROVED').length || 0;
  const completionPercentage = totalDocuments > 0 ? (approvedDocuments / totalDocuments) * 100 : 0;

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
            <div key={submission.id} className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">
                    {submission.document_requirements.document_type}
                  </h4>
                  {submission.document_requirements.is_mandatory && (
                    <span className="text-xs text-red-600">Required</span>
                  )}
                </div>
                {getStatusBadge(submission.status)}
              </div>
              
              {submission.document_url && (
                <div className="flex items-center gap-2">
                  <FileIcon className="h-4 w-4" />
                  <a 
                    href={submission.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Document
                  </a>
                </div>
              )}

              {submission.feedback_text && (
                <div className="rounded-md bg-gray-50 p-3">
                  <p className="text-sm text-gray-600">{submission.feedback_text}</p>
                </div>
              )}

              {submission.expiry_date && (
                <div className="text-sm text-gray-600">
                  Expires: {new Date(submission.expiry_date).toLocaleDateString()}
                </div>
              )}

              {canReviewDocuments && (
                <DocumentReviewInterface 
                  submission={submission} 
                  onReviewComplete={() => queryClient.invalidateQueries({ queryKey: ['document-submissions'] })}
                />
              )}

              <div className="space-y-2">
                <Label htmlFor={`file-${submission.id}`}>Upload New Version</Label>
                <div className="flex gap-2">
                  <Input
                    id={`file-${submission.id}`}
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    accept=".pdf,.doc,.docx"
                    className="flex-1"
                  />
                  <Button
                    onClick={() => handleFileUpload(submission.document_requirements.id)}
                    disabled={!file || uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span className="ml-2">Upload</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
