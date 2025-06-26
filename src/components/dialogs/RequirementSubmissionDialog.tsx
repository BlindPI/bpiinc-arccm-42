import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, File, X, AlertCircle, Send, Loader2, FileText, Eye, Download } from 'lucide-react';
import { ComplianceService } from '@/services/compliance/complianceService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface RequirementSubmissionDialogProps {
  requirement: {
    id: string;
    name: string;
    description: string;
    category: string;
    measurement_type: string;
    validation_rules?: {
      file_types?: string[];
      max_file_size?: number;
      required_fields?: string[];
      min_score?: number;
      evidence_required?: boolean;
      min_files?: number;
    };
    ui_component: 'file_upload' | 'form' | 'external_link' | 'checkbox';
  };
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  userId: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  url: string;
  uploadedAt: string;
}

interface ValidationError {
  field: string;
  message: string;
}

export function RequirementSubmissionDialog({
  requirement,
  isOpen,
  onClose,
  onSubmit,
  userId
}: RequirementSubmissionDialogProps) {
  const [submissionData, setSubmissionData] = useState<Record<string, any>>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isDragActive, setIsDragActive] = useState(false);
  const [rejectedFiles, setRejectedFiles] = useState<Array<{ file: File; errors: string[] }>>([]);
  
  // File upload handling with real validation
  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const rejected: Array<{ file: File; errors: string[] }> = [];
    
    for (const file of fileArray) {
      const errors = validateFile(file);
      if (errors.length > 0) {
        rejected.push({ file, errors });
        continue;
      }
      
      try {
        const fileId = `${Date.now()}_${file.name}`;
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
        
        // Upload to Supabase storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${requirement.id}/${fileId}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('compliance-documents')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('compliance-documents')
          .getPublicUrl(uploadData.path);
        
        // Create document record
        const { data: documentRecord, error: recordError } = await supabase
          .from('compliance_documents')
          .insert({
            user_id: userId,
            metric_id: requirement.id,
            file_name: file.name,
            file_size: file.size,
            file_type: fileExt || 'unknown',
            file_path: uploadData.path,
            upload_date: new Date().toISOString(),
            verification_status: 'pending',
            is_current: true
          })
          .select()
          .single();
        
        if (recordError) throw recordError;
        
        // Add to uploaded files list
        setUploadedFiles(prev => [...prev, {
          id: documentRecord.id,
          name: file.name,
          size: file.size,
          url: urlData.publicUrl,
          uploadedAt: new Date().toISOString()
        }]);
        
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
        
        toast({
          title: "Upload Successful",
          description: `${file.name} uploaded successfully`
        });
        
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive"
        });
      }
    }
    
    setRejectedFiles(rejected);
  };
  
  const validateFile = (file: File): string[] => {
    const errors: string[] = [];
    const maxSize = requirement.validation_rules?.max_file_size || 10485760; // 10MB default
    const allowedTypes = requirement.validation_rules?.file_types || ['pdf', 'jpg', 'png', 'docx'];
    
    // Check file size
    if (file.size > maxSize) {
      errors.push(`File exceeds maximum size of ${Math.round(maxSize / 1048576)}MB`);
    }
    
    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension && !allowedTypes.includes(fileExtension)) {
      errors.push(`File type .${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }
    
    // Check for suspicious files
    const suspiciousExtensions = ['exe', 'bat', 'cmd', 'scr', 'vbs'];
    if (fileExtension && suspiciousExtensions.includes(fileExtension)) {
      errors.push(`File type .${fileExtension} is not allowed for security reasons`);
    }
    
    return errors;
  };
  
  const removeFile = async (fileId: string) => {
    try {
      // Get file record
      const { data: fileRecord } = await supabase
        .from('compliance_documents')
        .select('file_path')
        .eq('id', fileId)
        .single();
      
      if (fileRecord) {
        // Delete from storage
        await supabase.storage
          .from('compliance-documents')
          .remove([fileRecord.file_path]);
        
        // Delete record
        await supabase
          .from('compliance_documents')
          .delete()
          .eq('id', fileId);
      }
      
      // Remove from local state
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
      
    } catch (error) {
      console.error('Error removing file:', error);
      toast({
        title: "Error",
        description: "Failed to remove file",
        variant: "destructive"
      });
    }
  };
  
  const validateSubmission = (): boolean => {
    const errors: ValidationError[] = [];
    
    // File upload validation
    if (requirement.ui_component === 'file_upload' && uploadedFiles.length === 0) {
      if (requirement.validation_rules?.evidence_required) {
        errors.push({
          field: 'files',
          message: 'At least one file must be uploaded'
        });
      }
    }
    
    // Form field validation
    if (requirement.validation_rules?.required_fields) {
      requirement.validation_rules.required_fields.forEach(field => {
        if (!submissionData[field]) {
          errors.push({
            field,
            message: `${field} is required`
          });
        }
      });
    }
    
    // Score validation for assessments
    if (requirement.measurement_type === 'percentage' && requirement.validation_rules?.min_score) {
      const score = parseFloat(submissionData.score);
      if (isNaN(score) || score < requirement.validation_rules.min_score) {
        errors.push({
          field: 'score',
          message: `Minimum score of ${requirement.validation_rules.min_score}% required`
        });
      }
    }
    
    // Minimum files validation
    if (requirement.validation_rules?.min_files && uploadedFiles.length < requirement.validation_rules.min_files) {
      errors.push({
        field: 'files',
        message: `At least ${requirement.validation_rules.min_files} file(s) required`
      });
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateSubmission()) {
      toast({
        title: "Validation Error",
        description: "Please fix validation errors before submitting",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const fullSubmissionData = {
        ...submissionData,
        files: uploadedFiles,
        submittedAt: new Date().toISOString(),
        requirementId: requirement.id,
        userId: userId
      };
      
      // Submit to backend
      await onSubmit(fullSubmissionData);
      
      // Update compliance record
      await ComplianceService.updateComplianceRecord(
        userId,
        requirement.id,
        submissionData.score || submissionData.value || true,
        'pending',
        submissionData.notes || 'Requirement submitted for review'
      );
      
      // Log submission activity
      await supabase
        .from('compliance_audit_log')
        .insert({
          user_id: userId,
          audit_type: 'requirement_submitted',
          metric_id: requirement.id,
          notes: `Requirement submitted: ${requirement.name} - ${uploadedFiles.length} files uploaded`,
          new_value: {
            submission_id: fullSubmissionData.requirementId,
            files_count: uploadedFiles.length,
            has_notes: !!submissionData.notes,
            submitted_at: fullSubmissionData.submittedAt
          },
          performed_by: userId
        });
      
      // Clear form and close
      setSubmissionData({});
      setUploadedFiles([]);
      onClose();
      
      toast({
        title: "Submission Successful",
        description: "Your requirement has been submitted for review"
      });
      
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit requirement. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, []);
  
  const renderUploadComponent = () => (
    <div className="space-y-4">
      <Label>Upload Required Documents</Label>
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-upload')?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        )}
      >
        <input
          id="file-upload"
          type="file"
          multiple
          accept={requirement.validation_rules?.file_types?.map(type => `.${type}`).join(',')}
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
        />
        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-sm text-gray-600">
          {isDragActive
            ? "Drop files here..."
            : "Drag & drop files here, or click to select"}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Accepted formats: {requirement.validation_rules?.file_types?.join(', ') || 'PDF, JPG, PNG, DOCX'}
        </p>
        <p className="text-xs text-gray-500">
          Max size: {formatFileSize(requirement.validation_rules?.max_file_size || 10485760)}
        </p>
      </div>
      
      {/* Upload Progress */}
      {Object.entries(uploadProgress).map(([fileId, progress]) => (
        progress < 100 && (
          <div key={fileId} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )
      ))}
      
      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <Label>Uploaded Files</Label>
          {uploadedFiles.map(file => (
            <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • Uploaded {new Date(file.uploadedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(file.url, '_blank')}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Rejected Files */}
      {rejectedFiles.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>File Upload Errors</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2">
              {rejectedFiles.map((rejection, idx) => (
                <li key={idx}>
                  {rejection.file.name}: {rejection.errors.join(', ')}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
  
  const renderFormComponent = () => (
    <div className="space-y-4">
      {requirement.validation_rules?.required_fields?.map(field => (
        <div key={field} className="space-y-2">
          <Label htmlFor={field}>
            {field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ')}
            <span className="text-red-500 ml-1">*</span>
          </Label>
          {field === 'score' ? (
            <div className="relative">
              <input
                type="number"
                id={field}
                min="0"
                max="100"
                value={submissionData[field] || ''}
                onChange={(e) => setSubmissionData(prev => ({ ...prev, [field]: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter score (0-100)"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
            </div>
          ) : (
            <Textarea
              id={field}
              value={submissionData[field] || ''}
              onChange={(e) => setSubmissionData(prev => ({ ...prev, [field]: e.target.value }))}
              placeholder={`Enter ${field.replace('_', ' ')}`}
              rows={3}
            />
          )}
        </div>
      ))}
    </div>
  );
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{requirement.name}</DialogTitle>
          <DialogDescription>{requirement.description}</DialogDescription>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{requirement.category}</Badge>
            <Badge variant="outline">{requirement.measurement_type}</Badge>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Component based on type */}
          {requirement.ui_component === 'file_upload' && renderUploadComponent()}
          {requirement.ui_component === 'form' && renderFormComponent()}
          
          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="submission-notes">Additional Notes (Optional)</Label>
            <Textarea
              id="submission-notes"
              placeholder="Add any relevant notes or comments..."
              value={submissionData.notes || ''}
              onChange={(e) => setSubmissionData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>
          
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Please fix the following errors:</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Requirement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}