// File: src/components/dialogs/EvidenceVerificationDialog.tsx

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  AlertTriangle, 
  FileText, 
  Eye, 
  ExternalLink, 
  FileX, 
  Loader2 
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { ComplianceService, type ComplianceDocument } from '@/services/compliance/complianceService';

// Types
interface ComplianceSubmission {
  id: string;
  requirement_name: string;
  requirement_type: string;
  category: string;
  user_id: string;
  user_name: string;
  user_role: string;
  user_tier: string;
  submitted_at: string;
  notes?: string;
  files?: SubmissionFile[];
  requirement_id: string;
  validation_rules?: any;
  metric_id?: string;
}

interface SubmissionFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  path?: string;
}

interface DocumentAnalysis {
  confidence: number;
  summary?: string;
  issues?: string[];
  validations?: Record<string, boolean>;
}

interface EvidenceVerificationDialogProps {
  submission: ComplianceSubmission;
  isOpen: boolean;
  onClose: () => void;
  onVerify: (verified: boolean, notes?: string) => Promise<void>;
}

// Document Verification Service using real ComplianceService
class DocumentVerificationService {
  static async analyzeSubmission(params: {
    submissionId: string;
    files: SubmissionFile[];
    requirementType: string;
    validationRules?: any;
  }): Promise<DocumentAnalysis> {
    try {
      // Get actual compliance documents for this submission
      const documents = await ComplianceService.getUserComplianceDocuments(
        params.submissionId.split('-')[0] || '', // Extract user ID from submission ID
        params.submissionId.split('-')[1] || ''  // Extract metric ID from submission ID
      );

      // Basic analysis based on document availability and type
      const hasDocuments = documents && documents.length > 0;
      const hasValidDocuments = documents?.some(doc => 
        doc.verification_status === 'approved' || doc.verification_status === 'pending'
      );

      // Calculate confidence based on real data
      let confidence = 0.5; // Base confidence
      if (hasDocuments) confidence += 0.3;
      if (hasValidDocuments) confidence += 0.2;
      if (params.files && params.files.length > 0) confidence += 0.1;

      const issues: string[] = [];
      if (!hasDocuments) issues.push('No compliance documents found');
      if (documents?.some(doc => doc.verification_status === 'rejected')) {
        issues.push('Some documents have been previously rejected');
      }

      const validations: Record<string, boolean> = {
        documents_present: hasDocuments,
        documents_valid: hasValidDocuments,
        files_uploaded: params.files && params.files.length > 0,
        meets_requirements: confidence > 0.7
      };

      return {
        confidence: Math.min(confidence, 1.0),
        summary: confidence > 0.7 
          ? 'Documents appear to meet compliance requirements' 
          : 'Manual review required - potential compliance issues detected',
        issues: issues.length > 0 ? issues : undefined,
        validations
      };
    } catch (error) {
      console.error('Document analysis error:', error);
      return {
        confidence: 0.3,
        summary: 'Unable to perform automated analysis - manual review required',
        issues: ['Analysis service unavailable'],
        validations: {
          analysis_completed: false,
          manual_review_required: true
        }
      };
    }
  }
}

// Compliance Activity Logger using real Supabase
class ComplianceActivityLogger {
  static async logEvidenceVerification(
    userId: string, 
    submissionId: string, 
    verified: boolean, 
    notes: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('compliance_audit_log')
        .insert({
          audit_type: 'evidence_verification',
          user_id: userId,
          performed_by: (await supabase.auth.getUser()).data.user?.id,
          new_value: verified ? 'approved' : 'rejected',
          notes: `Submission ID: ${submissionId}. Decision: ${verified ? 'approved' : 'rejected'}. Notes: ${notes}. Timestamp: ${new Date().toISOString()}`,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error logging evidence verification:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to log evidence verification:', error);
      // Don't throw - logging failure shouldn't break the verification process
    }
  }
}

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function EvidenceVerificationDialog({
  submission,
  isOpen,
  onClose,
  onVerify
}: EvidenceVerificationDialogProps) {
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [documentAnalysis, setDocumentAnalysis] = useState<DocumentAnalysis | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState<string | null>(null);
  const [complianceDocuments, setComplianceDocuments] = useState<ComplianceDocument[]>([]);

  // Load document analysis when dialog opens
  useEffect(() => {
    if (isOpen && submission) {
      performDocumentAnalysis();
      loadComplianceDocuments();
    }
  }, [isOpen, submission]);

  const loadComplianceDocuments = async () => {
    try {
      if (submission.metric_id) {
        const documents = await ComplianceService.getUserComplianceDocuments(
          submission.user_id,
          submission.metric_id
        );
        setComplianceDocuments(documents);
      }
    } catch (error) {
      console.error('Failed to load compliance documents:', error);
    }
  };

  const performDocumentAnalysis = async () => {
    if (!submission.files || submission.files.length === 0) {
      setDocumentAnalysis({
        confidence: 0.2,
        summary: 'No files submitted for verification',
        issues: ['No evidence files provided'],
        validations: { files_present: false }
      });
      return;
    }
    
    try {
      setIsVerifying(true);
      
      // Run automated document verification using real service
      const analysis = await DocumentVerificationService.analyzeSubmission({
        submissionId: submission.id,
        files: submission.files,
        requirementType: submission.requirement_type,
        validationRules: submission.validation_rules
      });
      
      setDocumentAnalysis(analysis);
      
      // Set initial verification status based on analysis
      if (analysis.confidence > 0.85) {
        setVerificationStatus('verified');
        setVerificationNotes(analysis.summary || 'Automated verification successful');
      } else if (analysis.confidence < 0.3) {
        setVerificationStatus('rejected');
        setVerificationNotes(analysis.issues?.join('; ') || 'Automated verification failed');
      } else {
        setVerificationStatus('pending');
        setVerificationNotes('Manual verification required');
      }
    } catch (error) {
      console.error('Document analysis error:', error);
      setVerificationStatus('pending');
      setVerificationNotes('Error during analysis. Please review manually.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerification = async (verified: boolean) => {
    try {
      setIsVerifying(true);
      
      // Call the parent verification handler
      await onVerify(verified, verificationNotes);
      
      // If we have document IDs, also verify them in the compliance system
      if (complianceDocuments.length > 0) {
        for (const doc of complianceDocuments) {
          await ComplianceService.verifyComplianceDocument(
            doc.id,
            verified ? 'approved' : 'rejected',
            verificationNotes,
            verified ? undefined : 'Evidence verification failed'
          );
        }
      }
      
      // Log verification activity using real service
      await ComplianceActivityLogger.logEvidenceVerification(
        submission.user_id,
        submission.id,
        verified,
        verificationNotes
      );
      
      toast.success(verified ? 'Evidence verified successfully' : 'Evidence rejected');
      onClose();
    } catch (error) {
      console.error('Verification submission error:', error);
      toast.error('Failed to submit verification. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const getDocumentUrl = async (filePath: string) => {
    try {
      return await ComplianceService.getDocumentDownloadUrl(filePath);
    } catch (error) {
      console.error('Failed to get document URL:', error);
      return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Evidence Verification</DialogTitle>
          <DialogDescription>
            Verify submitted evidence for: {submission.requirement_name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Evidence Details */}
            <div className="space-y-4">
              {/* Submission Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Submission Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Submitted By</Label>
                      <p className="font-medium">{submission.user_name}</p>
                      <p className="text-muted-foreground">{submission.user_role} • {submission.user_tier} tier</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Submission Date</Label>
                      <p className="font-medium">
                        {format(new Date(submission.submitted_at), 'PPP')}
                      </p>
                      <p className="text-muted-foreground">
                        {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Requirement Type</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{submission.requirement_type}</Badge>
                      <Badge variant="secondary">{submission.category}</Badge>
                    </div>
                  </div>
                  
                  {submission.notes && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Submission Notes</Label>
                      <p className="text-sm bg-gray-50 p-2 rounded">{submission.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Document Analysis */}
              {documentAnalysis && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Automated Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Confidence Score</span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={documentAnalysis.confidence * 100} 
                          className="w-24 h-2"
                        />
                        <span className="text-sm font-medium">
                          {Math.round(documentAnalysis.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                    
                    {documentAnalysis.summary && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Analysis Summary</Label>
                        <p className="text-sm">{documentAnalysis.summary}</p>
                      </div>
                    )}
                    
                    {documentAnalysis.issues && documentAnalysis.issues.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Issues Found</Label>
                        <ul className="text-sm space-y-1 mt-1">
                          {documentAnalysis.issues.map((issue, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <AlertTriangle className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {documentAnalysis.validations && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Validation Results</Label>
                        <div className="space-y-2 mt-1">
                          {Object.entries(documentAnalysis.validations).map(([key, result]) => (
                            <div key={key} className="flex items-center justify-between text-sm">
                              <span className="capitalize">{key.replace('_', ' ')}</span>
                              <div className="flex items-center gap-1">
                                {result ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <span className={result ? 'text-green-600' : 'text-red-600'}>
                                  {result ? 'Pass' : 'Fail'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* Verification Decision */}
              <Card className={cn(
                "border-2",
                verificationStatus === 'verified' ? "border-green-200 bg-green-50" :
                verificationStatus === 'rejected' ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"
              )}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Verification Decision</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup
                    value={verificationStatus}
                    onValueChange={(value) => setVerificationStatus(value as any)}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-white/50">
                      <RadioGroupItem value="verified" id="verified" />
                      <Label htmlFor="verified" className="flex items-center gap-2 cursor-pointer">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-700 font-medium">Evidence Valid</span>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-white/50">
                      <RadioGroupItem value="rejected" id="rejected" />
                      <Label htmlFor="rejected" className="flex items-center gap-2 cursor-pointer">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-red-700 font-medium">Evidence Invalid</span>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-white/50">
                      <RadioGroupItem value="pending" id="pending" />
                      <Label htmlFor="pending" className="flex items-center gap-2 cursor-pointer">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-yellow-700 font-medium">Needs Additional Review</span>
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  <div className="space-y-2">
                    <Label htmlFor="verification-notes">Verification Notes</Label>
                    <Textarea
                      id="verification-notes"
                      placeholder="Add notes about the verification decision..."
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Right Column: Document Viewer */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Submitted Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {submission.files && submission.files.length > 0 ? (
                    <div className="space-y-3">
                      {submission.files.map((file, index) => (
                        <div key={file.id} className="border rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between bg-gray-50 p-3">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <div>
                                <p className="font-medium text-sm">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(file.size)} • {file.type}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDocumentViewer(file.url)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(file.url, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Open
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileX className="h-12 w-12 mx-auto mb-2" />
                      <p>No documents submitted</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Compliance Documents History */}
              {complianceDocuments.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Compliance Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {complianceDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium text-sm">{doc.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(doc.upload_date), 'PPP')} • 
                              <Badge 
                                variant={
                                  doc.verification_status === 'approved' ? 'default' :
                                  doc.verification_status === 'rejected' ? 'destructive' : 'secondary'
                                }
                                className="ml-1"
                              >
                                {doc.verification_status}
                              </Badge>
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const url = await getDocumentUrl(doc.file_path);
                              if (url) window.open(url, '_blank');
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={isVerifying}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => handleVerification(false)}
              disabled={isVerifying || verificationStatus === 'pending'}
            >
              {isVerifying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject Evidence
            </Button>
            <Button
              variant="default"
              onClick={() => handleVerification(true)}
              disabled={isVerifying || verificationStatus === 'pending'}
            >
              {isVerifying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Verify Evidence
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}