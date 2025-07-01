Remaining Implementation Days Plan - Continued from Day 11
Day 11: Implement Interactive Dialogs (Continued)
11.3 Compliance Review Dialog (Continued)
// File: src/components/dialogs/ComplianceReviewDialog.tsx (continued)
                 {decision === 'approve' ? (
                   <>
                     <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                     Submit Approval
                   </>
                 ) : (
                   <>
                     <XCircle className="h-4 w-4 mr-2 text-red-600" />
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

typescript



11.4 Evidence Verification Dialog
// File: src/components/dialogs/EvidenceVerificationDialog.tsx

interface EvidenceVerificationDialogProps {
  submission: ComplianceSubmission;
  isOpen: boolean;
  onClose: () => void;
  onVerify: (verified: boolean, notes?: string) => Promise<void>;
}

export function EvidenceVerificationDialog({
  submission,
  isOpen,
  onClose,
  onVerify
}: EvidenceVerificationDialogProps) {
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Use backend verification service
  const { mutate: runAutomaticVerification } = useEvidenceVerification();
  
  useEffect(() => {
    if (isOpen && submission) {
      checkEvidenceValidity();
    }
  }, [isOpen, submission]);
  
  const checkEvidenceValidity = async () => {
    if (!submission.files || submission.files.length === 0) {
      return;
    }
    
    try {
      setIsVerifying(true);
      const result = await runAutomaticVerification({
        submissionId: submission.id,
        fileUrls: submission.files.map(file => file.url),
        requirementType: submission.requirement_type
      });
      
      if (result.verified) {
        setVerificationStatus('verified');
        setVerificationNotes(result.notes || 'Automatic verification successful');
      } else {
        setVerificationStatus('pending');
        setVerificationNotes(result.notes || 'Manual verification required');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('pending');
      setVerificationNotes('Error during automatic verification. Please review manually.');
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleVerification = async (verified: boolean) => {
    try {
      setIsVerifying(true);
      await onVerify(verified, verificationNotes);
      toast.success(verified ? 'Evidence verified successfully' : 'Evidence rejected');
      onClose();
    } catch (error) {
      console.error('Verification submission error:', error);
      toast.error('Failed to submit verification. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Evidence Verification</DialogTitle>
          <DialogDescription>
            Verify submitted evidence for: {submission.requirement_name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Evidence Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evidence Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Requirement Type</Label>
                  <p className="font-medium">{submission.requirement_type}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Submission Date</Label>
                  <p className="font-medium">
                    {format(new Date(submission.submitted_at), 'PPP')}
                  </p>
                </div>
              </div>
              
              {submission.notes && (
                <div>
                  <Label className="text-xs text-muted-foreground">Submission Notes</Label>
                  <p className="text-sm">{submission.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Document Preview */}
          {submission.files && submission.files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Document Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submission.files.map(file => (
                    <div key={file.id} className="border rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between bg-gray-50 p-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-sm">{file.name}</span>
                        </div>
                        <div className="flex gap-2">
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
                      
                      {file.url.endsWith('.pdf') ? (
                        <div className="h-96 bg-gray-100 flex items-center justify-center">
                          <PDFPreview url={file.url} />
                        </div>
                      ) : file.url.match(/\.(jpe?g|png|gif)$/i) ? (
                        <div className="h-96 bg-gray-100 flex items-center justify-center">
                          <img 
                            src={file.url} 
                            alt={file.name}
                            className="max-h-full max-w-full object-contain" 
                          />
                        </div>
                      ) : (
                        <div className="h-32 bg-gray-100 flex items-center justify-center">
                          <File className="h-12 w-12 text-gray-400" />
                          <p className="text-sm text-gray-500 mt-2">
                            Preview not available. Please download to view.
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Verification Status */}
          <Card className={cn(
            "border-2",
            verificationStatus === 'verified' ? "border-green-200" :
            verificationStatus === 'rejected' ? "border-red-200" : "border-yellow-200"
          )}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {verificationStatus === 'verified' && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                {verificationStatus === 'rejected' && (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                {verificationStatus === 'pending' && (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
                Verification Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Label>Evidence is:</Label>
                <RadioGroup
                  value={verificationStatus}
                  onValueChange={(value) => setVerificationStatus(value as any)}
                  className="flex items-center space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="verified" id="verified" />
                    <Label htmlFor="verified" className="text-green-600 font-medium">Valid</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="rejected" id="rejected" />
                    <Label htmlFor="rejected" className="text-red-600 font-medium">Invalid</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pending" id="pending" />
                    <Label htmlFor="pending" className="text-yellow-600 font-medium">Needs review</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="verification-notes">Verification Notes</Label>
                <Textarea
                  id="verification-notes"
                  placeholder="Add notes about the verification process..."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={isVerifying}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => handleVerification(false)}
              disabled={isVerifying}
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
              disabled={isVerifying}
            >
              {isVerifying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Confirm Verification
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

typescript



11.5 Bulk Compliance Actions Dialog
// File: src/components/dialogs/BulkComplianceActionsDialog.tsx

interface BulkComplianceActionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRequirements: UIRequirement[];
  onAction: (action: BulkAction, data?: any) => Promise<void>;
}

type BulkAction = 'start' | 'assign' | 'export' | 'archive' | 'reassign';

export function BulkComplianceActionsDialog({
  isOpen,
  onClose,
  selectedRequirements,
  onAction
}: BulkComplianceActionsDialogProps) {
  const [selectedAction, setSelectedAction] = useState<BulkAction>('start');
  const [assigneeId, setAssigneeId] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Load team members for assignment
  const { data: teamMembers } = useTeamMembers();
  
  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedAction('start');
      setAssigneeId('');
      setNotes('');
    }
  }, [isOpen]);
  
  const handleSubmit = async () => {
    setIsProcessing(true);
    
    try {
      let actionData: any = { notes };
      
      if (selectedAction === 'assign' || selectedAction === 'reassign') {
        if (!assigneeId) {
          toast.error('Please select an assignee');
          setIsProcessing(false);
          return;
        }
        actionData.assigneeId = assigneeId;
      }
      
      await onAction(selectedAction, actionData);
      toast.success(`Bulk action completed for ${selectedRequirements.length} requirements`);
      onClose();
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error('Failed to perform bulk action. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Actions</DialogTitle>
          <DialogDescription>
            Apply actions to {selectedRequirements.length} selected requirements
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Summary */}
          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Selected:</span>
                  <Badge>{selectedRequirements.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status Breakdown:</span>
                  <div className="flex gap-2">
                    {countStatusTypes(selectedRequirements).map(({ status, count }) => (
                      <Badge key={status} variant={getStatusVariant(status)}>
                        {count} {status}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Action Selection */}
          <div className="space-y-2">
            <Label>Select Action</Label>
            <RadioGroup
              value={selectedAction}
              onValueChange={(value) => setSelectedAction(value as BulkAction)}
              className="space-y-2"
            >
              <div className="flex items-start space-x-2 p-2 rounded-md hover:bg-gray-50">
                <RadioGroupItem value="start" id="start" />
                <div className="grid gap-1">
                  <Label htmlFor="start" className="cursor-pointer">
                    Start Requirements
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Change status to "In Progress" for all selected requirements
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2 p-2 rounded-md hover:bg-gray-50">
                <RadioGroupItem value="assign" id="assign" />
                <div className="grid gap-1">
                  <Label htmlFor="assign" className="cursor-pointer">
                    Assign to Team Member
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Delegate requirements to another team member
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2 p-2 rounded-md hover:bg-gray-50">
                <RadioGroupItem value="export" id="export" />
                <div className="grid gap-1">
                  <Label htmlFor="export" className="cursor-pointer">
                    Export Requirements
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Download requirements as CSV or PDF
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2 p-2 rounded-md hover:bg-gray-50">
                <RadioGroupItem value="archive" id="archive" />
                <div className="grid gap-1">
                  <Label htmlFor="archive" className="cursor-pointer">
                    Archive Requirements
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Move requirements to archive (retrievable later)
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          {/* Assignee Selection */}
          {(selectedAction === 'assign' || selectedAction === 'reassign') && (
            <div className="space-y-2">
              <Label htmlFor="assignee">Select Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers?.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Action Notes */}
          <div className="space-y-2">
            <Label htmlFor="action-notes">Notes (Optional)</Label>
            <Textarea
              id="action-notes"
              placeholder="Add notes for this bulk action..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Apply to Selected'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to count requirements by status
function countStatusTypes(requirements: UIRequirement[]) {
  const counts: Record<string, number> = {};
  
  requirements.forEach(req => {
    counts[req.status] = (counts[req.status] || 0) + 1;
  });
  
  return Object.entries(counts).map(([status, count]) => ({ status, count }));
}

typescript



Day 12: Connect All Backend Interactions
12.1 Implement ComplianceService with Real-Time Hooks
// File: src/services/compliance/complianceService.ts

export class ComplianceService {
  static async getUserRequirements(
    userId: string,
    role: string,
    tier: string
  ): Promise<RequirementWithStatus[]> {
    try {
      const { data: requirements, error } = await supabase
        .from('compliance_requirements')
        .select(`
          *,
          compliance_templates!inner(id, role, tier),
          user_compliance_records!left(
            id, 
            status, 
            submission_data, 
            submitted_at, 
            reviewed_at, 
            expiry_date
          )
        `)
        .eq('compliance_templates.role', role)
        .eq('compliance_templates.tier', tier)
        .eq('user_compliance_records.user_id', userId)
        .order('display_order');
        
      if (error) throw error;
      
      return requirements.map(req => this.formatRequirementWithStatus(req, userId));
    } catch (error) {
      console.error('Error fetching requirements:', error);
      throw error;
    }
  }
  
  static async submitRequirement(
    userId: string,
    requirementId: string,
    submissionData: SubmissionData
  ): Promise<SubmissionResult> {
    try {
      // Begin transaction
      const { data: requirement } = await supabase
        .from('compliance_requirements')
        .select('*')
        .eq('id', requirementId)
        .single();
        
      if (!requirement) {
        throw new Error('Requirement not found');
      }
      
      // Validate submission data against requirement rules
      const validationResult = this.validateSubmission(requirement, submissionData);
      if (!validationResult.valid) {
        return {
          success: false,
          errors: validationResult.errors
        };
      }
      
      // Update user compliance record
      const { data: record, error: recordError } = await supabase
        .from('user_compliance_records')
        .upsert({
          user_id: userId,
          requirement_id: requirementId,
          status: 'submitted',
          submission_data: submissionData,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (recordError) throw recordError;
      
      // Update user's compliance metrics
      await ComplianceIntegrationService.recalculateUserCompliance(userId);
      
      // Process automatic approvals if applicable
      let finalStatus = 'submitted';
      let reviewNotes = null;
      
      if (requirement.auto_approval_rules) {
        const autoApprovalResult = await this.processAutoApproval(
          record.id,
          requirement,
          submissionData
        );
        
        if (autoApprovalResult.approved) {
          finalStatus = 'approved';
          reviewNotes = 'Automatically approved';
          
          // Update record with approval
          await supabase
            .from('user_compliance_records')
            .update({
              status: 'approved',
              reviewed_at: new Date().toISOString(),
              review_notes: reviewNotes
            })
            .eq('id', record.id);
        }
      }
      
      // Create activity log entry
      await this.logComplianceActivity(userId, {
        action: 'requirement_submitted',
        requirementId,
        requirementName: requirement.name,
        oldStatus: 'in_progress',
        newStatus: finalStatus
      });
      
      // Send notifications
      if (finalStatus === 'submitted') {
        await this.notifyReviewers(requirement, userId, submissionData);
      } else if (finalStatus === 'approved') {
        await NotificationService.send({
          userId,
          type: 'requirement_approved',
          title: 'Requirement Automatically Approved',
          message: `Your submission for ${requirement.name} has been automatically approved!`,
          metadata: {
            requirementId,
            status: 'approved'
          }
        });
      }
      
      return {
        success: true,
        record: {
          ...record,
          status: finalStatus
        },
        autoApproved: finalStatus === 'approved'
      };
    } catch (error) {
      console.error('Error submitting requirement:', error);
      throw error;
    }
  }
  
  static async reviewSubmission(
    submissionId: string,
    reviewerId: string,
    decision: 'approve' | 'reject',
    reviewData: ReviewData
  ): Promise<ReviewResult> {
    try {
      // Get submission record
      const { data: record, error: recordError } = await supabase
        .from('user_compliance_records')
        .select(`
          *,
          compliance_requirements(*)
        `)
        .eq('id', submissionId)
        .single();
      
      if (recordError) throw recordError;
      
      // Update record with review decision
      const { error: updateError } = await supabase
        .from('user_compliance_records')
        .update({
          status: decision === 'approve' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewerId,
          review_notes: reviewData.notes,
          review_data: reviewData.metadata || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);
      
      if (updateError) throw updateError;
      
      // Update user's compliance metrics
      await ComplianceIntegrationService.recalculateUserCompliance(record.user_id);
      
      // Award points if approved
      if (decision === 'approve') {
        await ComplianceIntegrationService.awardCompliancePoints(
          record.user_id,
          record.compliance_requirements.points_value || 10
        );
        
        // Check for milestone achievements
        await ComplianceIntegrationService.checkMilestoneAchievements(
          record.user_id,
          record.compliance_requirements.category
        );
      }
      
      // Create review history record
      await supabase
        .from('compliance_review_history')
        .insert({
          record_id: submissionId,
          requirement_id: record.requirement_id,
          user_id: record.user_id,
          reviewer_id: reviewerId,
          decision,
          notes: reviewData.notes,
          review_data: reviewData.metadata || {},
          created_at: new Date().toISOString()
        });
      
      // Send notification to user
      await NotificationService.send({
        userId: record.user_id,
        type: decision === 'approve' ? 'requirement_approved' : 'requirement_rejected',
        title: decision === 'approve' ? 'Requirement Approved' : 'Requirement Needs Revision',
        message: decision === 'approve'
          ? `Your submission for ${record.compliance_requirements.name} has been approved!`
          : `Your submission for ${record.compliance_requirements.name} needs revision: ${reviewData.notes}`,
        metadata: {
          requirementId: record.requirement_id,
          status: decision === 'approve' ? 'approved' : 'rejected'
        }
      });
      
      // Log review activity
      await this.logComplianceActivity(record.user_id, {
        action: decision === 'approve' ? 'requirement_approved' : 'requirement_rejected',
        requirementId: record.requirement_id,
        requirementName: record.compliance_requirements.name,
        oldStatus: 'submitted',
        newStatus: decision === 'approve' ? 'approved' : 'rejected',
        metadata: {
          reviewerId,
          reviewNotes: reviewData.notes
        }
      });
      
      return {
        success: true,
        record: {
          ...record,
          status: decision === 'approve' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewerId,
          review_notes: reviewData.notes
        }
      };
    } catch (error) {
      console.error('Error reviewing submission:', error);
      throw error;
    }
  }
  
  // Helper method to validate submissions against requirement rules
  private static validateSubmission(
    requirement: ComplianceRequirement,
    submissionData: SubmissionData
  ): ValidationResult {
    const errors: string[] = [];
    const rules = requirement.validation_rules || {};
    
    // Check required fields
    if (rules.required_fields) {
      rules.required_fields.forEach(field => {
        if (!submissionData[field]) {
          errors.push(`Field '${field}' is required`);
        }
      });
    }
    
    // Check file requirements
    if (requirement.ui_component_type === 'file_upload') {
      if (!submissionData.files || submissionData.files.length === 0) {
        errors.push('At least one file must be uploaded');
      } else if (rules.max_files && submissionData.files.length > rules.max_files) {
        errors.push(`Maximum ${rules.max_files} files allowed`);
      }
      
      // Check file types
      if (rules.file_types && submissionData.files) {
        submissionData.files.forEach(file => {
          const extension = file.name.split('.').pop()?.toLowerCase();
          const allowed = Object.values(rules.file_types).flat();
          
          if (extension && !allowed.includes(`.${extension}`)) {
            errors.push(`File type .${extension} is not allowed`);
          }
        });
      }
    }
    
    // Check assessment score requirements
    if (requirement.requirement_type === 'assessment' && rules.min_score) {
      const score = parseFloat(submissionData.score);
      if (isNaN(score) || score < rules.min_score) {
        errors.push(`Minimum score of ${rules.min_score} required`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  // Helper method to process automatic approvals
  private static async processAutoApproval(
    recordId: string,
    requirement: ComplianceRequirement,
    submissionData: SubmissionData
  ): Promise<{ approved: boolean; reason?: string }> {
    const rules = requirement.auto_approval_rules;
    
    if (!rules || !rules.enabled) {
      return { approved: false };
    }
    
    // Simple rule-based auto approval
    if (rules.always_approve) {
      return { approved: true, reason: 'Auto-approval rule: always approve' };
    }
    
    // Keyword-based approval for text submissions
    if (rules.keyword_match && submissionData.text) {
      const text = submissionData.text.toLowerCase();
      const matchesAll = rules.keyword_match.every(keyword => text.includes(keyword.toLowerCase()));
      
      if (matchesAll) {
        return { approved: true, reason: 'Auto-approval rule: keyword match' };
      }
    }
    
    // File verification for document submissions
    if (rules.verify_documents && submissionData.files && submissionData.files.length > 0) {
      try {
        const verificationResult = await DocumentVerificationService.verifyDocuments(
          submissionData.files.map(f => f.url),
          rules.document_verification_rules || {}
        );
        
        if (verificationResult.verified) {
          return { approved: true, reason: 'Auto-approval rule: document verification' };
        }
      } catch (error) {
        console.error('Document verification error:', error);
        return { approved: false, reason: 'Document verification failed' };
      }
    }
    
    return { approved: false };
  }
}

typescript



12.2 Create Custom React Hooks for Compliance UI
// File: src/hooks/useComplianceRequirements.ts

export function useComplianceRequirements(userId: string, role: string, tier: string) {
  return useQuery({
    queryKey: ['compliance-requirements', userId, role, tier],
    queryFn: () => ComplianceService.getUserRequirements(userId, role, tier),
    enabled: !!userId && !!role && !!tier,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: true,
    onError: (error) => {
      console.error('Error fetching requirements:', error);
      toast.error('Failed to load compliance requirements');
    },
  });
}

export function useRequirementSubmission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      requirementId, 
      submissionData 
    }: { 
      userId: string; 
      requirementId: string; 
      submissionData: SubmissionData;
    }) => {
      return ComplianceService.submitRequirement(userId, requirementId, submissionData);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['compliance-requirements', variables.userId]);
      queryClient.invalidateQueries(['compliance-progress', variables.userId]);
      queryClient.invalidateQueries(['compliance-metrics', variables.userId]);
      
      if (data.autoApproved) {
        toast.success('Requirement automatically approved!');
      } else {
        toast.success('Requirement submitted successfully');
      }
    },
    onError: (error) => {
      console.error('Submission error:', error);
      toast.error('Failed to submit requirement. Please try again.');
    },
  });
}

export function useRequirementReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      submissionId, 
      reviewerId, 
      decision, 
      reviewData 
    }: {
      submissionId: string;
      reviewerId: string;
      decision: 'approve' | 'reject';
      reviewData: ReviewData;
    }) => {
      return ComplianceService.reviewSubmission(submissionId, reviewerId, decision, reviewData);
    },
    onSuccess: (data, variables) => {
      // Get user ID from the record returned
      const userId = data.record.user_id;
      
      queryClient.invalidateQueries(['compliance-requirements', userId]);
      queryClient.invalidateQueries(['compliance-progress', userId]);
      queryClient.invalidateQueries(['compliance-metrics', userId]);
      queryClient.invalidateQueries(['submissions-to-review']);
      
      toast.success(
        variables.decision === 'approve'
          ? 'Requirement approved successfully'
          : 'Requirement returned for revision'
      );
    },
    onError: (error) => {
      console.error('Review error:', error);
      toast.error('Failed to submit review. Please try again.');
    },
  });
}

// Hook for real-time updates
export function useComplianceRealtimeUpdates(userId: string) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Skip if no userId
    if (!userId) return;
    
    const channel = supabase
      .channel(`compliance-updates-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_compliance_records',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        // Update cache with new data
        queryClient.invalidateQueries(['compliance-requirements', userId]);
        queryClient.invalidateQueries(['compliance-progress', userId]);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'compliance_metrics',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        queryClient.invalidateQueries(['compliance-metrics', userId]);
      })
      .subscribe();
    
    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}

typescript



12.3 Implement Document Upload Service
// File: src/services/compliance/documentUploadService.ts

export class DocumentUploadService {
  static async uploadRequirementFile(
    formData: FormData
  ): Promise<UploadResult> {
    try {
      const file = formData.get('file') as File;
      const requirementId = formData.get('requirementId') as string;
      const userId = formData.get('userId') as string;
      
      if (!file || !requirementId || !userId) {
        throw new Error('Missing required parameters');
      }
      
      // Generate unique filename with original extension
      const extension = file.name.split('.').pop();
      const uniqueFileName = `${userId}/${requirementId}/${uuidv4()}.${extension}`;
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('compliance-documents')
        .upload(uniqueFileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = await supabase.storage
        .from('compliance-documents')
        .getPublicUrl(uniqueFileName);
      
      // Create file record in database
      const { data: fileRecord, error: recordError } = await supabase
        .from('compliance_files')
        .insert({
          user_id: userId,
          requirement_id: requirementId,
          storage_path: uniqueFileName,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          public_url: urlData.publicUrl,
          uploaded_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (recordError) throw recordError;
      
      // Run virus scan in background (if enabled)
      if (process.env.NEXT_PUBLIC_ENABLE_VIRUS_SCAN === 'true') {
        this.queueVirusScan(fileRecord.id, urlData.publicUrl);
      }
      
      return {
        success: true,
        fileId: fileRecord.id,
        fileName: file.name,
        fileUrl: urlData.publicUrl,
        filePath: uniqueFileName
      };
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }
  
  static async deleteFile(fileId: string): Promise<{ success: boolean }> {
    try {
      // Get file record
      const { data: fileRecord, error: fetchError } = await supabase
        .from('compliance_files')
        .select('storage_path')
        .eq('id', fileId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('compliance-documents')
        .remove([fileRecord.storage_path]);
      
      if (storageError) throw storageError;
      
      // Delete record
      const { error: recordError } = await supabase
        .from('compliance_files')
        .delete()
        .eq('id', fileId);
      
      if (recordError) throw recordError;
      
      return { success: true };
    } catch (error) {
      console.error('File deletion error:', error);
      throw error;
    }
  }
  
  static async getFilesByRequirement(
    requirementId: string,
    userId: string
  ): Promise<FileRecord[]> {
    try {
      const { data: files, error } = await supabase
        .from('compliance_files')
        .select('*')
        .eq('requirement_id', requirementId)
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      
      return files;
    } catch (error) {
      console.error('Error fetching files:', error);
      throw error;
    }
  }
  
  // Queue file for virus scanning
  private static async queueVirusScan(fileId: string, fileUrl: string): Promise<void> {
    try {
      await supabase.functions.invoke('scan-uploaded-file', {
        body: { fileId, fileUrl }
      });
    } catch (error) {
      console.error('Error queuing virus scan:', error);
      // Don't throw - this is a background process
    }
  }
}

typescript



Day 13: Implement Data Visualization and Reporting
13.1 Create ComplianceReportGenerator Service
// File: src/services/compliance/complianceReportGenerator.ts

export class ComplianceReportGenerator {
  static async generateUserComplianceReport(
    userId: string,
    options: ReportOptions = {}
  ): Promise<ReportResult> {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      // Get compliance data
      const { data: metrics } = await supabase
        .from('user_compliance_metrics')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      // Get requirement records
      const { data: records } = await supabase
        .from('user_compliance_records')
        .select(`
          *,
          compliance_requirements(
            id, name, category, requirement_type, points_value
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      // Get activity log
      const { data: activities } = await supabase
        .from('compliance_activity_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(options.activityLimit || 50);
      
      // Generate report data
      const reportData: ComplianceReport = {
        user: {
          id: userId,
          name: profile.display_name,
          email: profile.email,
          role: profile.role,
          tier: profile.compliance_tier
        },
        generatedAt: new Date().toISOString(),
        metrics: {
          overallCompletion: metrics?.overall_percentage || 0,
          totalRequirements: metrics?.total || 0,
          completedRequirements: metrics?.completed || 0,
          inProgressRequirements: metrics?.in_progress || 0,
          totalPoints: metrics?.total_points || 0,
          mandatoryCompliance: metrics?.mandatory_complete 
            ? (metrics.mandatory_complete / metrics.mandatory_total) * 100 
            : 0
        },
        requirements: records.map(record => ({
          id: record.requirement_id,
          name: record.compliance_requirements.name,
          category: record.compliance_requirements.category,
          type: record.compliance_requirements.requirement_type,
          status: record.status,
          points: record.compliance_requirements.points_value,
          submittedAt: record.submitted_at,
          reviewedAt: record.reviewed_at
        })),
        activities: activities.map(activity => ({
          timestamp: activity.created_at,
          action: activity.action,
          requirementName: activity.metadata?.requirementName,
          status: activity.metadata?.newStatus,
          points: activity.metadata?.points
        })),
        categories: this.calculateCategoryBreakdown(records)
      };
      
      // Generate PDF or return JSON
      if (options.format === 'pdf') {
        const pdfBuffer = await this.generatePDFReport(reportData);
        
        // Create report record
        await supabase
          .from('compliance_reports')
          .insert({
            user_id: userId,
            report_type: 'compliance_summary',
            report_format: 'pdf',
            generated_at: reportData.generatedAt,
            metadata: {
              overallCompletion: reportData.metrics.overallCompletion,
              totalRequirements: reportData.metrics.totalRequirements
            }
          });
        
        return {
          success: true,
          format: 'pdf',
          data: pdfBuffer,
          fileName: `compliance_report_${profile.display_name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`
        };
      } else {
        // Create report record for JSON
        await supabase
          .from('compliance_reports')
          .insert({
            user_id: userId,
            report_type: 'compliance_summary',
            report_format: 'json',
            generated_at: reportData.generatedAt,
            metadata: {
              overallCompletion: reportData.metrics.overallCompletion,
              totalRequirements: reportData.metrics.totalRequirements
            }
          });
        
        return {
          success: true,
          format: 'json',
          data: reportData,
          fileName: `compliance_report_${profile.display_name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.json`
        };
      }
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }
  
  // Calculate breakdown by category
  private static calculateCategoryBreakdown(records: any[]): CategoryBreakdown[] {
    const categories: Record<string, CategoryBreakdown> = {};
    
    records.forEach(record => {
      const category = record.compliance_requirements.category;
      
      if (!categories[category]) {
        categories[category] = {
          name: category,
          total: 0,
          completed: 0,
          inProgress: 0,
          pending: 0,
          percentage: 0
        };
      }
      
      categories[category].total++;
      
      if (record.status === 'approved') {
        categories[category].completed++;
      } else if (record.status === 'in_progress' || record.status === 'submitted') {
        categories[category].inProgress++;
      } else {
        categories[category].pending++;
      }
    });
    
    // Calculate percentages
    Object.values(categories).forEach(category => {
      category.percentage = category.total > 0 
        ? Math.round((category.completed / category.total) * 100) 
        : 0;
    });
    
    return Object.values(categories);
  }
  
  // Generate PDF report using PDF generation library
  private static async generatePDFReport(reportData: ComplianceReport): Promise<Buffer> {
    try {
      // This would typically use a PDF generation library like PDFKit or a service
      // For simplicity, this is a placeholder
      const pdf = new PDFDocument();
      const buffers: Buffer[] = [];
      
      pdf.on('data', buffers.push.bind(buffers));
      
      // Add report content
      pdf.fontSize(24).text('Compliance Report', { align: 'center' });
      pdf.moveDown();
      
      pdf.fontSize(14).text(`User: ${reportData.user.name} (${reportData.user.role})`);
      pdf.fontSize(12).text(`Tier: ${reportData.user.tier}`);
      pdf.fontSize(12).text(`Generated: ${format(new Date(reportData.generatedAt), 'PPP')}`);
      
      pdf.moveDown();
      
      // Overall metrics
      pdf.fontSize(16).text('Overall Compliance', { underline: true });
      pdf.moveDown(0.5);
      pdf.fontSize(12).text(`Overall Completion: ${reportData.metrics.overallCompletion}%`);
      pdf.fontSize(12).text(`Total Requirements: ${reportData.metrics.totalRequirements}`);
      pdf.fontSize(12).text(`Completed: ${reportData.metrics.completedRequirements}`);
      pdf.fontSize(12).text(`In Progress: ${reportData.metrics.inProgressRequirements}`);
      pdf.fontSize(12).text(`Total Points: ${reportData.metrics.totalPoints}`);
      
      pdf.moveDown();
      
      // Category breakdown
      pdf.fontSize(16).text('Category Breakdown', { underline: true });
      pdf.moveDown(0.5);
      
      reportData.categories.forEach(category => {
        pdf.fontSize(14).text(category.name);
        pdf.fontSize(12).text(`Progress: ${category.percentage}% (${category.completed}/${category.total})`);
        pdf.moveDown(0.5);
      });
      
      pdf.moveDown();
      
      // Recent activity
      pdf.fontSize(16).text('Recent Activity', { underline: true });
      pdf.moveDown(0.5);
      
      reportData.activities.slice(0, 10).forEach(activity => {
        pdf.fontSize(12).text(`${format(new Date(activity.timestamp), 'PP')}: ${activity.action} - ${activity.requirementName || 'N/A'}`);
      });
      
      pdf.end();
      
      return Buffer.concat(buffers);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw error;
    }
  }
}

typescript



13.2 Create Compliance Analytics Dashboard
// File: src/components/compliance/ComplianceAnalyticsDashboard.tsx

interface ComplianceAnalyticsDashboardProps {
  userId: string;
  role: string;
  tier: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
}

export function ComplianceAnalyticsDashboard({
  userId,
  role,
  tier,
  timeRange = 'month'
}: ComplianceAnalyticsDashboardProps) {
  const [selectedChart, setSelectedChart] = useState<string>('progress');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPredictions, setShowPredictions] = useState<boolean>(true);
  
  // Load analytics data
  const { data: metrics, isLoading: metricsLoading } = useComplianceMetrics(userId);
  const { data: activities } = useComplianceActivities(userId, timeRange);
  const { data: projections } = useComplianceProjections(userId);
  const { data: requirements } = useComplianceRequirements(userId, role, tier);
  
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['compliance-analytics', userId, timeRange],
    queryFn: () => ComplianceAnalyticsService.getUserAnalytics(userId, timeRange),
    enabled: !!userId && !!timeRange
  });
  
  // Calculate category data
  const categoryData = useMemo(() => {
    if (!requirements) return [];
    
    const categories: Record<string, CategoryData> = {};
    
    requirements.forEach(req => {
      if (!categories[req.category]) {
        categories[req.category] = {
          name: req.category,
          total: 0,
          completed: 0,
          inProgress: 0,
          pending: 0
        };
      }
      
      categories[req.category].total++;
      
      if (req.status === 'approved') {
        categories[req.category].completed++;
      } else if (req.status === 'in_progress' || req.status === 'submitted') {
        categories[req.category].inProgress++;
      } else {
        categories[req.category].pending++;
      }
    });
    
    return Object.values(categories);
  }, [requirements]);
  
  // Calculate time series data
  const timeSeriesData = useMemo(() => {
    if (!activities) return [];
    
    const dates = groupActivitiesByDate(activities);
    return Object.entries(dates).map(([date, value]) => ({
      date,
      completed: value.completed || 0,
      submitted: value.submitted || 0,
      started: value.started || 0
    }));
  }, [activities]);
  
  // Handle report generation
  const handleGenerateReport = async () => {
    try {
      const result = await ComplianceReportGenerator.generateUserComplianceReport(userId, {
        format: 'pdf',
        timeRange,
        includeActivities: true
      });
      
      if (result.success && result.format === 'pdf') {
        // Create download link
        const blob = new Blob([result.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.fileName;
        a.click();
        URL.revokeObjectURL(url);
        
        toast.success('Report generated successfully');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  };
  
  // Render loading state
  if (metricsLoading || analyticsLoading) {
    return <AnalyticsDashboardSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Compliance Analytics</h2>
          <p className="text-muted-foreground">
            Track your compliance progress and performance
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as any)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={handleGenerateReport}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Overall Compliance"
          value={metrics?.overall_percentage || 0}
          format="percentage"
          icon={<CheckCircle className="h-6 w-6 text-green-600" />}
          trend={calculateTrend(analyticsData?.trends?.overall_completion)}
          trendValue={analyticsData?.trends?.overall_completion?.change}
        />
        
        <MetricCard
          title="Requirements Complete"
          value={`${metrics?.completed || 0}/${metrics?.total || 0}`}
          format="fraction"
          icon={<ClipboardCheck className="h-6 w-6 text-blue-600" />}
          trend={calculateTrend(analyticsData?.trends?.completed_requirements)}
          trendValue={analyticsData?.trends?.completed_requirements?.change}
        />
        
        <MetricCard
          title="Compliance Points"
          value={metrics?.total_points || 0}
          format="number"
          icon={<Award className="h-6 w-6 text-purple-600" />}
          trend={calculateTrend(analyticsData?.trends?.points_earned)}
          trendValue={analyticsData?.trends?.points_earned?.change}
        />
        
        <MetricCard
          title="Time to Complete"
          value={projections?.estimatedDays || 'N/A'}
          format="text"
          suffix="days"
          icon={<CalendarClock className="h-6 w-6 text-orange-600" />}
          subtext={projections?.projectedDate ? formatDate(projections.projectedDate) : ''}
        />
      </div>
      
      {/* Chart Selection Tabs */}
      <Tabs
        value={selectedChart}
        onValueChange={setSelectedChart}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="completion">Completion</TabsTrigger>
        </TabsList>
        
        <div className="mt-6 bg-white rounded-lg border p-6">
          <TabsContent value="progress" className="h-80">
            <ComplianceProgressChart
              overallPercentage={metrics?.overall_percentage || 0}
              categoryData={categoryData}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
            />
          </TabsContent>
          
          <TabsContent value="categories" className="h-80">
            <CategoryBreakdownChart
              categories={categoryData}
              onCategorySelect={setSelectedCategory}
            />
          </TabsContent>
          
          <TabsContent value="timeline" className="h-80">
            <TimeSeriesChart
              data={timeSeriesData}
              timeRange={timeRange}
              showPredictions={showPredictions}
              predictions={projections?.dailyProjections}
            />
          </TabsContent>
          
          <TabsContent value="completion" className="h-80">
            <CompletionPredictionChart
              currentCompletion={metrics?.overall_percentage || 0}
              projections={projections?.weeklyProjections}
              targetDate={projections?.targetDate}
              showPredictions={showPredictions}
            />
          </TabsContent>
        </div>
      </Tabs>
      
      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="show-predictions" className="cursor-pointer">
            Show Predictions
          </Label>
          <Switch
            id="show-predictions"
            checked={showPredictions}
            onCheckedChange={setShowPredictions}
          />
        </div>
        
        {selectedChart === 'categories' && (
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoryData.map((category) => (
                <SelectItem key={category.name} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      {/* Activity Feed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <ActivityFeed
            activities={activities?.slice(0, 5) || []}
            emptyMessage="No recent activity"
          />
        </CardContent>
      </Card>
      
      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Compliance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData?.insights?.map((insight, index) => (
              <Alert
                key={index}
                variant={getInsightVariant(insight.type)}
                className="flex items-start"
              >
                <div className="mr-2 mt-0.5">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="space-y-1">
                  <AlertTitle>{insight.title}</AlertTitle>
                  <AlertDescription>{insight.message}</AlertDescription>
                  {insight.action && (
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => handleInsightAction(insight.action)}
                    >
                      {insight.action.label}
                    </Button>
                  )}
                </div>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper components and functions
function ComplianceProgressChart({
  overallPercentage,
  categoryData,
  selectedCategory,
  onCategorySelect
}: {
  overallPercentage: number;
  categoryData: CategoryData[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}) {
  // Chart implementation with recharts
  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="30%"
          outerRadius="90%"
          data={
            selectedCategory === 'all'
              ? [{ name: 'Overall', value: overallPercentage }]
              : categoryData
                  .filter(c => c.name === selectedCategory)
                  .map(c => ({
                    name: c.name,
                    value: c.total > 0 ? (c.completed / c.total) * 100 : 0
                  }))
          }
          startAngle={180}
          endAngle={0}
        >
          <RadialBar
            background
            clockWise
            dataKey="value"
            cornerRadius={10}
            fill="#3b82f6"
          />
          <Legend
            iconSize={10}
            layout="vertical"
            verticalAlign="middle"
            align="right"
          />
          <Tooltip
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Completion']}
          />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}

typescript



Day 14: Create Admin Review Interface
14.1 Build ComplianceReviewDashboard
// File: src/components/compliance/admin/ComplianceReviewDashboard.tsx

interface ComplianceReviewDashboardProps {
  reviewerRole: string;
  defaultFilters?: SubmissionFilters;
}

export function ComplianceReviewDashboard({
  reviewerRole,
  defaultFilters
}: ComplianceReviewDashboardProps) {
  const [filters, setFilters] = useState<SubmissionFilters>(defaultFilters || {
    status: 'submitted',
    requirementType: 'all',
    dateRange: 'all'
  });
  
  const [selectedSubmission, setSelectedSubmission] = useState<ComplianceSubmission | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState<boolean>(false);
  const [showEvidenceDialog, setShowEvidenceDialog] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  // Backend data connections
  const { data: submissions, isLoading, refetch } = useSubmissionsToReview(filters, reviewerRole);
  const { data: reviewStats } = useReviewerStats(reviewerRole);
  const { user } = useAuth();
  
  // Submission review mutation
  const { mutate: reviewSubmission } = useRequirementReview();
  
  // Evidence verification mutation
  const { mutate: verifyEvidence } = useEvidenceVerification();
  
  // Handle review submission
  const handleReview = async (decision: 'approve' | 'reject', reviewData: ReviewData) => {
    if (!selectedSubmission || !user?.id) return;
    
    try {
      await reviewSubmission({
        submissionId: selectedSubmission.id,
        reviewerId: user.id,
        decision,
        reviewData
      });
      
      refetch();
      setShowReviewDialog(false);
      setSelectedSubmission(null);
    } catch (error) {
      console.error('Review error:', error);
      toast.error('Failed to submit review. Please try again.');
    }
  };
  
  // Handle evidence verification
  const handleEvidenceVerification = async (verified: boolean, notes?: string) => {
    if (!selectedSubmission) return;
    
    try {
      await verifyEvidence({
        submissionId: selectedSubmission.id,
        verified,
        notes,
        verifiedBy: user?.id
      });
      
      toast.success('Evidence verification recorded');
      setShowEvidenceDialog(false);
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Failed to verify evidence. Please try again.');
    }
  };
  
  // Export review data
  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const result = await ComplianceReportGenerator.generateReviewReport(
        reviewerRole,
        filters
      );
      
      // Create download link
      const blob = new Blob([result.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.fileName;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Review report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export review data');
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Compliance Review Dashboard</h2>
          <p className="text-muted-foreground">
            Review and approve compliance submissions
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            className="gap-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Export Data
          </Button>
          
          <Button className="gap-2">
            <Inbox className="h-4 w-4" />
            {submissions?.length || 0} Pending
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Pending Reviews"
          value={submissions?.length || 0}
          icon={<ClipboardList className="h-6 w-6 text-blue-600" />}
          trend={reviewStats?.pendingTrend}
          trendValue={reviewStats?.pendingChange}
        />
        
        <MetricCard
          title="Approved Today"
          value={reviewStats?.approvedToday || 0}
          icon={<CheckCircle className="h-6 w-6 text-green-600" />}
          trend="up"
        />
        
        <MetricCard
          title="Rejected Today"
          value={reviewStats?.rejectedToday || 0}
          icon={<XCircle className="h-6 w-6 text-red-600" />}
          trend="down"
        />
        
        <MetricCard
          title="Avg. Review Time"
          value={reviewStats?.avgReviewTime || 0}
          format="time"
          suffix="min"
          icon={<Clock className="h-6 w-6 text-orange-600" />}
          trend={reviewStats?.reviewTimeTrend}
        />
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="all">All Statuses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 space-y-2">
              <Label htmlFor="type-filter">Requirement Type</Label>
              <Select
                value={filters.requirementType}
                onValueChange={(value) => setFilters({ ...filters, requirementType: value })}
              >
                <SelectTrigger id="type-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="certification">Certification</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 space-y-2">
              <Label htmlFor="date-filter">Date Range</Label>
              <Select
                value={filters.dateRange}
                onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
              >
                <SelectTrigger id="date-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters(defaultFilters || {
                  status: 'submitted',
                  requirementType: 'all',
                  dateRange: 'all'
                })}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Submissions to Review</CardTitle>
          <CardDescription>
            {filters.status === 'all'
              ? 'All submissions'
              : `${filters.status === 'submitted' ? 'Pending' : capitalize(filters.status)} submissions`
            }
            {filters.requirementType !== 'all' && ` - ${capitalize(filters.requirementType)} type`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8">
              <TableSkeleton columns={5} rows={5} />
            </div>
          ) : submissions?.length === 0 ? (
            <div className="py-8 text-center">
              <Inbox className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No submissions to review</h3>
              <p className="text-muted-foreground">
                There are no submissions matching your filters
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requirement</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions?.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div className="font-medium">{submission.requirement_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {submission.requirement_type}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{submission.user_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {submission.user_role}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(submission.submitted_at), 'PP')}
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusVariant(submission.status)}>
                          {capitalize(submission.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setShowEvidenceDialog(true);
                            }}
                          >
                            <Search className="h-4 w-4" />
                            <span className="sr-only">View Evidence</span>
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setShowReviewDialog(true);
                            }}
                          >
                            <ClipboardCheck className="h-4 w-4" />
                            <span className="sr-only">Review</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Review Dialog */}
      {selectedSubmission && (
        <ComplianceReviewDialog
          submission={selectedSubmission}
          isOpen={showReviewDialog}
          onClose={() => {
            setShowReviewDialog(false);
            setSelectedSubmission(null);
          }}
          onReview={handleReview}
          reviewerRole={reviewerRole}
        />
      )}
      
      {/* Evidence Verification Dialog */}
      {selectedSubmission && (
        <EvidenceVerificationDialog
          submission={selectedSubmission}
          isOpen={showEvidenceDialog}
          onClose={() => {
            setShowEvidenceDialog(false);
            setSelectedSubmission(null);
          }}
          onVerify={handleEvidenceVerification}
        />
      )}
    </div>
  );
}