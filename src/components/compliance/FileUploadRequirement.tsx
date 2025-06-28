// File: src/components/compliance/FileUploadRequirement.tsx

import React, { useState } from 'react';
import { useRequirementSubmission } from '../../hooks/useComplianceRequirements';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// UI Components
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { Loader2, Upload, File as FileIcon, X } from 'lucide-react';

interface FileUploadProps {
  requirement: {
    id: string;
    name: string;
    validation_rules?: {
      file_types?: string[];
      max_file_size?: number;
    }
  };
  onSubmit?: () => void;
  onSave?: () => void;
}

// Helper function to format file size
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export function FileUploadRequirement({ requirement, onSubmit, onSave }: FileUploadProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const { submitRequirement, isLoading: isSubmitting } = useRequirementSubmission();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Check for file size limit if specified in validation rules
      const maxSize = requirement.validation_rules?.max_file_size || 10485760; // 10MB default
      
      // Filter out files that exceed the size limit
      const validFiles = Array.from(e.target.files).filter(file => {
        if (file.size > maxSize) {
          toast.error(`File "${file.name}" exceeds the maximum file size of ${formatBytes(maxSize)}`);
          return false;
        }
        return true;
      });
      
      setFiles(validFiles);
    }
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to submit requirements');
      return;
    }
    
    if (files.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }
    
    setUploading(true);
    
    try {
      // Upload files to storage
      const uploadedFiles = await Promise.all(
        files.map(async (file, index) => {
          const filePath = `${requirement.id}/${user.id}/${Date.now()}_${file.name}`;
          
          const { data, error } = await supabase.storage
            .from('requirement-uploads')
            .upload(filePath, file, {
              onUploadProgress: (progress) => {
                // Update progress for this specific file
                const totalProgress = (index + progress.percent / 100) / files.length * 100;
                setUploadProgress(totalProgress);
              }
            });
            
          if (error) throw error;
          
          return {
            id: data.path,
            name: file.name,
            size: file.size,
            url: supabase.storage.from('requirement-uploads').getPublicUrl(data.path).data.publicUrl,
            uploadedAt: new Date().toISOString()
          };
        })
      );
      
      // Submit requirement with proper structure
      await submitRequirement({
        userId: user.id,
        requirementId: requirement.id,
        submissionData: {
          files: uploadedFiles,
          notes,
          submittedAt: new Date().toISOString()
        }
      });
      
      toast.success('Requirement submitted successfully');
      setFiles([]);
      setNotes('');
      onSubmit?.();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };
  
  const handleSaveDraft = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to save drafts');
      return;
    }
    
    try {
      // Just save the notes for now
      await supabase
        .from('user_compliance_records')
        .update({
          ui_state: {
            expanded: true,
            notes_draft: notes,
            last_saved: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('requirement_id', requirement.id);
      
      toast.success('Draft saved successfully');
      onSave?.();
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft. Please try again.');
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-lg p-6 text-center">
        <Input
          type="file"
          multiple
          accept={requirement.validation_rules?.file_types?.join(',')}
          onChange={handleFileChange}
          className="hidden"
          id={`file-upload-${requirement.id}`}
        />
        <label
          htmlFor={`file-upload-${requirement.id}`}
          className="cursor-pointer flex flex-col items-center"
        >
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <span className="text-sm font-medium">
            Click to upload or drag and drop
          </span>
          <span className="text-xs text-gray-500 mt-1">
            {requirement.validation_rules?.file_types?.join(', ') || 'All files'} 
            (Max: {formatBytes(requirement.validation_rules?.max_file_size || 10485760)})
          </span>
        </label>
      </div>
      
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
              <div className="flex items-center">
                <FileIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm truncate max-w-xs">{file.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">{formatBytes(file.size)}</span>
                <button 
                  onClick={() => removeFile(i)}
                  className="p-1 hover:bg-gray-200 rounded-full"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}
      
      <Textarea
        placeholder="Additional notes or context about this submission (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
      />
      
      <div className="flex justify-end space-x-2">
        <Button 
          variant="outline" 
          onClick={handleSaveDraft}
          disabled={uploading || isSubmitting}
        >
          Save Draft
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={files.length === 0 || uploading || isSubmitting}
        >
          {(uploading || isSubmitting) ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {uploading ? 'Uploading...' : 'Submitting...'}
            </>
          ) : 'Submit Requirement'}
        </Button>
      </div>
    </div>
  );
}

export default FileUploadRequirement;
