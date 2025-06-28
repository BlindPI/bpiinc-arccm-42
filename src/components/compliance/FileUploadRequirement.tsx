
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { FileText, Upload, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FileUploadRequirementProps } from './interfaces';

export function FileUploadRequirement({ 
  requirement, 
  onUpload, 
  onSave 
}: FileUploadRequirementProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = requirement.validation_rules?.file_types || [];
    if (allowedTypes.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(fileExtension || '')) {
        alert(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
        return;
      }
    }

    // Validate file size
    const maxSize = requirement.validation_rules?.max_file_size || 10485760; // 10MB default
    if (file.size > maxSize) {
      alert(`File size too large. Maximum size: ${(maxSize / 1048576).toFixed(1)}MB`);
      return;
    }

    setSelectedFile(file);
    setUploadComplete(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload file to Supabase storage
      const fileName = `${requirement.id}/${Date.now()}-${selectedFile.name}`;
      const { data, error } = await supabase.storage
        .from('compliance-documents')
        .upload(fileName, selectedFile);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) {
        throw error;
      }

      // Call the onUpload callback
      await onUpload(selectedFile);
      
      setUploadComplete(true);
      setTimeout(() => {
        onSave();
      }, 1000);

    } catch (error: any) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload">Select File</Label>
          <Input
            id="file-upload"
            type="file"
            onChange={handleFileSelect}
            disabled={uploading || uploadComplete}
            accept={requirement.validation_rules?.file_types?.map(type => `.${type}`).join(',')}
          />
        </div>

        {requirement.validation_rules && (
          <div className="text-sm text-muted-foreground space-y-1">
            {requirement.validation_rules.file_types && (
              <p>Allowed types: {requirement.validation_rules.file_types.join(', ')}</p>
            )}
            {requirement.validation_rules.max_file_size && (
              <p>Maximum size: {(requirement.validation_rules.max_file_size / 1048576).toFixed(1)}MB</p>
            )}
          </div>
        )}

        {selectedFile && (
          <div className="space-y-2">
            <p className="text-sm">
              Selected: <span className="font-medium">{selectedFile.name}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Size: {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        )}

        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {uploadComplete && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Upload completed successfully!</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading || uploadComplete}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
