
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileIcon, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type DocumentSubmission = Database['public']['Tables']['document_submissions']['Row'];

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
      return data as (DocumentSubmission & {
        document_requirements: Database['public']['Tables']['document_requirements']['Row']
      })[];
    }
  });

  const handleFileUpload = async (requirementId: string) => {
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${crypto.randomUUID()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Create submission record
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileIcon className="h-5 w-5" />
          Document Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {submissions?.map((submission) => (
            <div key={submission.id} className="space-y-4 rounded-lg border p-4">
              <div>
                <h4 className="font-medium">
                  {submission.document_requirements.document_type}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Status: {submission.status}
                </p>
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
