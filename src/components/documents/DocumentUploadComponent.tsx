import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, AlertCircle, Download, Eye, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DocumentUploadComponentProps {
  metricId: string;
  userId: string;
  onUploadComplete?: () => void;
}

interface ComplianceDocument {
  id: string;
  user_id: string;
  metric_id: string;
  document_name: string;
  document_path: string;
  document_type: string;
  file_size: number;
  upload_notes: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export function DocumentUploadComponent({ metricId, userId, onUploadComplete }: DocumentUploadComponentProps) {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadNotes, setUploadNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documents, setDocuments] = useState<ComplianceDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    loadDocuments();
  }, [metricId, userId]);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('compliance_documents')
        .select('*')
        .eq('user_id', userId)
        .eq('metric_id', metricId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments((data as any) || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (50MB limit)
    if (file.size > 52428800) {
      toast.error('File size must be less than 50MB');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PDF, Word documents, or images.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create file path with user ID folder structure
      const filePath = `${user.id}/${metricId}/${Date.now()}_${selectedFile.name}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('compliance-documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setUploadProgress(50);

      // Save document record to database
      const { error: dbError } = await supabase
        .from('compliance_documents')
        .insert({
          user_id: userId,
          metric_id: metricId,
          document_name: selectedFile.name,
          document_path: filePath,
          document_type: selectedFile.type,
          file_size: selectedFile.size,
          upload_notes: uploadNotes || null,
          status: 'pending'
        } as any);

      if (dbError) throw dbError;

      setUploadProgress(100);
      toast.success('Document uploaded successfully!');
      
      // Reset form
      setSelectedFile(null);
      setUploadNotes('');
      
      // Reload documents
      await loadDocuments();
      
      // Trigger callback
      onUploadComplete?.();

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const downloadDocument = async (documentPath: string, documentName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('compliance-documents')
        .download(documentPath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = documentName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  const getStatusBadge = (status: ComplianceDocument['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Under Review</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Upload className="h-4 w-4" />
            Upload Compliance Document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Selection */}
          <div className="space-y-2">
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="cursor-pointer"
            />
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  disabled={isUploading}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Upload Notes */}
          <Textarea
            placeholder="Add notes about this document (optional)..."
            value={uploadNotes}
            onChange={(e) => setUploadNotes(e.target.value)}
            disabled={isUploading}
            rows={2}
          />

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="w-full"
          >
            {isUploading ? (
              'Uploading...'
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Uploaded Documents */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              Uploaded Documents ({documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium text-sm">{doc.document_name}</span>
                      {getStatusBadge(doc.status)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Uploaded {new Date(doc.created_at).toLocaleDateString()}
                      {doc.upload_notes && <span> • {doc.upload_notes}</span>}
                    </div>
                    {doc.status === 'rejected' && doc.review_notes && (
                      <Alert className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Rejection reason: {doc.review_notes}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadDocument(doc.document_path, doc.document_name)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {documents.length === 0 && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            No documents uploaded yet. Upload your compliance documents above.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}