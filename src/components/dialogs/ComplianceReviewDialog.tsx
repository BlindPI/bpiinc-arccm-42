import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, 
  XCircle, 
  FileText, 
  Eye, 
  Download, 
  AlertCircle, 
  Loader2,
  Star,
  User,
  Calendar
} from 'lucide-react';
import { ComplianceService } from '@/services/compliance/complianceService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ComplianceReviewDialogProps {
  submission: {
    id: string;
    user_id: string;
    metric_id: string;
    requirement_name: string;
    requirement_type: string;
    submission_data: any;
    files?: Array<{
      id: string;
      name: string;
      size: number;
      url: string;
      file_type: string;
    }>;
    submitted_at: string;
    notes?: string;
    status: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onReview: (decision: ReviewDecision) => Promise<void>;
  reviewerRole: string;
}

interface ReviewDecision {
  submissionId: string;
  decision: 'approve' | 'reject' | 'request_revision';
  reviewNotes: string;
  checklist: Record<string, { checked: boolean; notes: string }>;
  reviewedBy: string;
  reviewedAt: string;
  score?: number;
  metadata?: any;
}

interface ReviewCriteria {
  id: string;
  label: string;
  description: string;
  required: boolean;
  allowNotes: boolean;
}

interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  role: string;
}

interface SubmissionHistory {
  id: string;
  status: string;
  submitted_at: string;
  reviewed_at?: string;
  review_notes?: string;
}

export function ComplianceReviewDialog({
  submission,
  isOpen,
  onClose,
  onReview,
  reviewerRole
}: ComplianceReviewDialogProps) {
  const [decision, setDecision] = useState<'approve' | 'reject' | 'request_revision' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [checklist, setChecklist] = useState<Record<string, { checked: boolean; notes: string }>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [reviewCriteria, setReviewCriteria] = useState<ReviewCriteria[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionHistory[]>([]);
  const [score, setScore] = useState<number>(0);
  
  // Load real data when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadReviewData();
    }
  }, [isOpen, submission.id]);
  
  const loadReviewData = async () => {
    try {
      // Load review criteria based on requirement type
      const defaultCriteria = getDefaultCriteria(submission.requirement_type);
      setReviewCriteria(defaultCriteria);
      
      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, email, role')
        .eq('id', submission.user_id)
        .single();
      
      if (profileError) {
        console.error('Failed to load user profile:', profileError);
      } else {
        setUserProfile(profileData);
      }
      
      // Load submission history
      const { data: historyData, error: historyError } = await supabase
        .from('user_compliance_records')
        .select('id, compliance_status, created_at, updated_at, notes')
        .eq('user_id', submission.user_id)
        .eq('metric_id', submission.metric_id)
        .order('created_at', { ascending: false });
      
      if (historyError) {
        console.error('Failed to load submission history:', historyError);
      } else {
        setSubmissionHistory(historyData?.map(h => ({
          id: h.id,
          status: h.compliance_status,
          submitted_at: h.created_at,
          reviewed_at: h.updated_at,
          review_notes: h.notes
        })) || []);
      }
      
    } catch (error) {
      console.error('Error loading review data:', error);
      toast({
        title: "Error",
        description: "Failed to load review data",
        variant: "destructive"
      });
    }
  };
  
  const getDefaultCriteria = (requirementType: string): ReviewCriteria[] => {
    const baseCriteria: ReviewCriteria[] = [
      {
        id: 'completeness',
        label: 'Submission Completeness',
        description: 'All required information and documents are provided',
        required: true,
        allowNotes: true
      },
      {
        id: 'accuracy',
        label: 'Information Accuracy',
        description: 'Information provided is accurate and verifiable',
        required: true,
        allowNotes: true
      },
      {
        id: 'quality',
        label: 'Document Quality',
        description: 'Documents are clear, legible, and professional',
        required: false,
        allowNotes: true
      }
    ];
    
    // Add type-specific criteria
    switch (requirementType) {
      case 'certification':
        baseCriteria.push({
          id: 'validity',
          label: 'Certificate Validity',
          description: 'Certificate is current and from recognized authority',
          required: true,
          allowNotes: true
        });
        break;
      case 'training':
        baseCriteria.push({
          id: 'completion',
          label: 'Training Completion',
          description: 'Evidence shows completion of required training hours',
          required: true,
          allowNotes: true
        });
        break;
      case 'background_check':
        baseCriteria.push({
          id: 'recency',
          label: 'Background Check Currency',
          description: 'Background check is within required timeframe',
          required: true,
          allowNotes: true
        });
        break;
    }
    
    return baseCriteria;
  };
  
  // Initialize checklist when criteria loads
  useEffect(() => {
    if (reviewCriteria.length > 0) {
      const initialChecklist: Record<string, { checked: boolean; notes: string }> = {};
      reviewCriteria.forEach(item => {
        initialChecklist[item.id] = { checked: false, notes: '' };
      });
      setChecklist(initialChecklist);
    }
  }, [reviewCriteria]);
  
  const handleReviewSubmit = async () => {
    if (!decision) {
      toast({
        title: "Error",
        description: "Please select a review decision",
        variant: "destructive"
      });
      return;
    }
    
    if ((decision === 'reject' || decision === 'request_revision') && !reviewNotes.trim()) {
      toast({
        title: "Error",
        description: "Please provide feedback for rejection/revision requests",
        variant: "destructive"
      });
      return;
    }
    
    // Validate required checklist items
    const incompleteItems = reviewCriteria.filter(
      item => item.required && !checklist[item.id]?.checked
    );
    
    if (incompleteItems.length > 0) {
      toast({
        title: "Error",
        description: "Please complete all required review items",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      const reviewerId = currentUser?.user?.id || 'unknown';
      
      const reviewDecision: ReviewDecision = {
        submissionId: submission.id,
        decision,
        reviewNotes,
        checklist,
        reviewedBy: reviewerId,
        reviewedAt: new Date().toISOString(),
        score: decision === 'approve' ? score : undefined,
        metadata: {
          reviewerRole,
          checklistCompletion: calculateChecklistCompletion(checklist),
          previousSubmissions: submissionHistory.length
        }
      };
      
      // Update compliance record
      await ComplianceService.updateComplianceRecord(
        submission.user_id,
        submission.metric_id,
        decision === 'approve' ? (score || 100) : null,
        decision === 'approve' ? 'compliant' : decision === 'reject' ? 'non_compliant' : 'pending',
        reviewNotes
      );
      
      // Submit review
      await onReview(reviewDecision);
      
      // Log review activity
      await supabase
        .from('compliance_audit_log')
        .insert({
          user_id: submission.user_id,
          audit_type: 'requirement_reviewed',
          metric_id: submission.metric_id,
          notes: `Requirement reviewed: ${submission.requirement_name} - Decision: ${decision}`,
          old_value: { status: submission.status },
          new_value: { 
            decision: decision,
            score: score,
            reviewer_role: reviewerRole 
          },
          performed_by: reviewerId
        });
      
      // Send notification to user
      await sendReviewNotification(submission.user_id, decision, reviewNotes);
      
      toast({
        title: "Review Submitted",
        description: `Submission ${decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'marked for revision'} successfully`
      });
      
      onClose();
      
    } catch (error) {
      console.error('Review submission error:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const calculateChecklistCompletion = (checklist: Record<string, { checked: boolean; notes: string }>): number => {
    const total = Object.keys(checklist).length;
    const completed = Object.values(checklist).filter(item => item.checked).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };
  
  const sendReviewNotification = async (userId: string, decision: string, notes: string) => {
    try {
      const notificationMessage = decision === 'approve' 
        ? `Your submission for ${submission.requirement_name} has been approved!`
        : `Your submission for ${submission.requirement_name} needs ${decision === 'reject' ? 'resubmission' : 'revision'}: ${notes}`;
      
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: `Requirement ${decision === 'approve' ? 'Approved' : 'Needs Attention'}`,
          message: notificationMessage,
          type: decision === 'approve' ? 'success' : 'warning',
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download file",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Review Compliance Submission</DialogTitle>
          <DialogDescription>
            Review submission for: {submission.requirement_name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto max-h-[60vh]">
          {/* Left Column - Submission Details */}
          <div className="space-y-4">
            {/* Submission Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Submission Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {userProfile && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Submitted By</Label>
                    <p className="font-medium">{userProfile.display_name}</p>
                    <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                    <Badge variant="outline" className="mt-1">{userProfile.role}</Badge>
                  </div>
                )}
                
                <div>
                  <Label className="text-xs text-muted-foreground">Submission Date</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <p className="font-medium">
                      {format(new Date(submission.submitted_at), 'PPP p')}
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Requirement Type</Label>
                  <Badge variant="outline">{submission.requirement_type}</Badge>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Current Status</Label>
                  <Badge variant={submission.status === 'pending' ? 'default' : 'secondary'}>
                    {submission.status}
                  </Badge>
                </div>
                
                {submission.notes && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Submission Notes</Label>
                    <p className="text-sm bg-gray-50 p-2 rounded">{submission.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Submitted Files */}
            {submission.files && submission.files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Submitted Documents ({submission.files.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {submission.files.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)} • {file.file_type}
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
                            onClick={() => downloadFile(file.url, file.name)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Submission History */}
            {submissionHistory.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Previous Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {submissionHistory.slice(1).map((history, idx) => (
                      <div key={history.id} className="flex items-center justify-between p-2 border rounded text-sm">
                        <div>
                          <Badge variant="outline" className="text-xs">{history.status}</Badge>
                          <span className="ml-2 text-muted-foreground">
                            {format(new Date(history.submitted_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {history.review_notes && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "Previous Review",
                                description: history.review_notes
                              });
                            }}
                          >
                            View Notes
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Right Column - Review Section */}
          <div className="space-y-4">
            {/* Review Checklist */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Review Checklist</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Complete all required items before making a decision
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviewCriteria.map(item => (
                    <div key={item.id} className="space-y-2 border-b pb-3 last:border-b-0">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={item.id}
                          checked={checklist[item.id]?.checked || false}
                          onCheckedChange={(checked) => {
                            setChecklist(prev => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], checked: checked as boolean }
                            }));
                          }}
                        />
                        <div className="flex-1">
                          <Label htmlFor={item.id} className="cursor-pointer font-medium">
                            {item.label}
                            {item.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      
                      {item.allowNotes && checklist[item.id]?.checked && (
                        <Textarea
                          placeholder="Add notes (optional)"
                          value={checklist[item.id]?.notes || ''}
                          onChange={(e) => {
                            setChecklist(prev => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], notes: e.target.value }
                            }));
                          }}
                          className="text-sm"
                          rows={2}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Review Decision */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Review Decision</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup 
                  value={decision || ''} 
                  onValueChange={(value) => setDecision(value as 'approve' | 'reject' | 'request_revision')}
                >
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-green-50 transition-colors">
                    <RadioGroupItem value="approve" id="approve" />
                    <Label htmlFor="approve" className="cursor-pointer flex-1 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Approve Submission
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-yellow-50 transition-colors">
                    <RadioGroupItem value="request_revision" id="request_revision" />
                    <Label htmlFor="request_revision" className="cursor-pointer flex-1 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      Request Revision
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-red-50 transition-colors">
                    <RadioGroupItem value="reject" id="reject" />
                    <Label htmlFor="reject" className="cursor-pointer flex-1 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Reject Submission
                    </Label>
                  </div>
                </RadioGroup>
                
                {/* Score input for approvals */}
                {decision === 'approve' && submission.requirement_type === 'assessment' && (
                  <div className="space-y-2">
                    <Label htmlFor="score">Score (0-100)</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        id="score"
                        min="0"
                        max="100"
                        value={score}
                        onChange={(e) => setScore(parseInt(e.target.value) || 0)}
                        className="w-20 px-3 py-2 border rounded-md"
                      />
                      <span>%</span>
                      <div className="flex items-center gap-1 ml-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${score >= star * 20 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="review-notes">
                    Review Notes {(decision === 'reject' || decision === 'request_revision') && <span className="text-red-500">*</span>}
                  </Label>
                  <Textarea
                    id="review-notes"
                    placeholder={decision === 'reject' || decision === 'request_revision'
                      ? "Provide detailed feedback for the user to address..."
                      : "Add any comments or feedback (optional)..."
                    }
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleReviewSubmit}
            disabled={!decision || isProcessing}
            className={
              decision === 'approve' ? 'bg-green-600 hover:bg-green-700' :
              decision === 'reject' ? 'bg-red-600 hover:bg-red-700' :
              'bg-yellow-600 hover:bg-yellow-700'
            }
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {decision === 'approve' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Approval
                  </>
                ) : decision === 'reject' ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Submit Rejection
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Request Revision
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}