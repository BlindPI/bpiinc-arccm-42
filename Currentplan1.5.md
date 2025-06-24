# Remaining Implementation Days Plan - Continued from Day 11

## Day 11: Implement Interactive Dialogs (Continued)

### 11.1 Tier Switch Dialog with Full Integration (Continued)

```typescript
// File: src/components/dialogs/TierSwitchDialog.tsx (continued)

  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [impactAnalysis, setImpactAnalysis] = useState<TierImpactAnalysis | null>(null);
  
  // Backend connections
  const { data: tierComparison } = useTierComparison(userRole);
  const { data: currentRequirements } = useUserRequirements(userId);
  const { data: switchValidation } = useTierSwitchValidation(userId, targetTier);
  
  // Load impact analysis when dialog opens
  useEffect(() => {
    if (isOpen && targetTier) {
      loadImpactAnalysis();
    }
  }, [isOpen, targetTier]);
  
  const loadImpactAnalysis = async () => {
    try {
      const analysis = await ComplianceTierService.analyzeTierSwitchImpact(
        userId,
        currentTier,
        targetTier!
      );
      setImpactAnalysis(analysis);
    } catch (error) {
      console.error('Failed to load impact analysis:', error);
      toast.error('Unable to analyze tier switch impact');
    }
  };
  
  const handleConfirmSwitch = async () => {
    if (!agreedToTerms) {
      setValidationErrors(['You must agree to the terms before proceeding']);
      return;
    }
    
    setStep('processing');
    setIsProcessing(true);
    
    try {
      // Perform the tier switch
      await onConfirm(targetTier!, reason);
      
      // Log the successful switch
      await AuditService.log({
        action: 'tier_switch',
        userId,
        details: {
          from: currentTier,
          to: targetTier,
          reason,
          timestamp: new Date().toISOString()
        }
      });
      
      toast.success('Tier switch completed successfully!');
      onClose();
    } catch (error) {
      console.error('Tier switch failed:', error);
      toast.error('Failed to switch tier. Please try again.');
      setStep('confirmation');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const renderStepContent = () => {
    switch (step) {
      case 'comparison':
        return (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">Compare Compliance Tiers</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Review the differences between tiers before making a switch
              </p>
            </div>
            
            {/* Tier Comparison Table */}
            <TierComparisonTable
              currentTier={currentTier}
              targetTier={targetTier!}
              comparison={tierComparison}
              highlightDifferences
            />
            
            {/* Impact Summary */}
            {impactAnalysis && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle>Impact Summary</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>{impactAnalysis.requirementsToAdd} new requirements will be added</li>
                    <li>{impactAnalysis.requirementsToRemove} requirements will be removed</li>
                    <li>{impactAnalysis.requirementsToPreserve} requirements will be preserved</li>
                    {impactAnalysis.estimatedTimeToComplete && (
                      <li>Estimated time to complete new requirements: {impactAnalysis.estimatedTimeToComplete}</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Current Progress Warning */}
            {currentRequirements?.some(r => r.status === 'in_progress') && (
              <Alert variant="warning">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You have {currentRequirements.filter(r => r.status === 'in_progress').length} requirements
                  in progress. Switching tiers may affect their status.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={() => setStep('confirmation')}
                disabled={!switchValidation?.allowed}
              >
                Continue to Confirmation
              </Button>
            </div>
          </div>
        );
        
      case 'confirmation':
        return (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold">Confirm Tier Switch</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Please review and confirm your tier change
              </p>
            </div>
            
            {/* Summary Card */}
            <Card className="border-2 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center flex-1">
                    <Badge variant={currentTier === 'basic' ? 'default' : 'secondary'} className="mb-2">
                      {currentTier === 'basic' ? 'Essential' : 'Comprehensive'}
                    </Badge>
                    <p className="text-sm font-medium">Current Tier</p>
                  </div>
                  
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  
                  <div className="text-center flex-1">
                    <Badge variant={targetTier === 'basic' ? 'default' : 'secondary'} className="mb-2">
                      {targetTier === 'basic' ? 'Essential' : 'Comprehensive'}
                    </Badge>
                    <p className="text-sm font-medium">New Tier</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Reason Input */}
            <div className="space-y-2">
              <Label htmlFor="switch-reason">
                Reason for tier change <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="switch-reason"
                placeholder="Please provide a reason for this tier change..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
              />
            </div>
            
            {/* Terms Agreement */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium">Terms & Conditions</h4>
              <div className="space-y-2 text-sm">
                <p>By switching tiers, you acknowledge that:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Your compliance requirements will be updated immediately</li>
                  <li>Progress on tier-specific requirements may be reset</li>
                  <li>This action will be logged in your compliance history</li>
                  <li>You may need to complete additional requirements</li>
                </ul>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="agree-terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <Label htmlFor="agree-terms" className="text-sm cursor-pointer">
                  I understand and agree to these terms
                </Label>
              </div>
            </div>
            
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {validationErrors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('comparison')}>
                Back
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleConfirmSwitch}
                  disabled={!reason.trim() || !agreedToTerms}
                  variant="default"
                >
                  Confirm Switch
                </Button>
              </div>
            </div>
          </div>
        );
        
      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <h3 className="text-lg font-semibold">Processing Tier Switch</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Please wait while we update your compliance requirements and migrate your data...
            </p>
            <Progress value={33} className="w-full max-w-xs" />
          </div>
        );
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}
```

### 11.2 Requirement Submission Dialog

```typescript
// File: src/components/dialogs/RequirementSubmissionDialog.tsx

interface RequirementSubmissionDialogProps {
  requirement: UIRequirement;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SubmissionData) => Promise<void>;
}

export function RequirementSubmissionDialog({
  requirement,
  isOpen,
  onClose,
  onSubmit
}: RequirementSubmissionDialogProps) {
  const [submissionData, setSubmissionData] = useState<SubmissionData>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  
  // File upload handling
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    acceptedFiles,
    rejectedFiles
  } = useDropzone({
    accept: requirement.validation_rules?.file_types || {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxSize: requirement.validation_rules?.max_file_size || 10485760,
    maxFiles: requirement.validation_rules?.max_files || 1,
    onDrop: async (acceptedFiles) => {
      await handleFileUpload(acceptedFiles);
    }
  });
  
  const handleFileUpload = async (files: File[]) => {
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('requirementId', requirement.id);
        formData.append('userId', user.id);
        
        const response = await ComplianceUploadService.uploadFile(formData);
        
        if (response.success) {
          setUploadedFiles(prev => [...prev, {
            id: response.fileId,
            name: file.name,
            size: file.size,
            url: response.fileUrl,
            uploadedAt: new Date().toISOString()
          }]);
          
          toast.success(`${file.name} uploaded successfully`);
        }
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
        console.error('Upload error:', error);
      }
    }
  };
  
  const validateSubmission = (): boolean => {
    const errors: ValidationError[] = [];
    
    // Check required files
    if (requirement.ui_component === 'file_upload' && uploadedFiles.length === 0) {
      errors.push({
        field: 'files',
        message: 'At least one file must be uploaded'
      });
    }
    
    // Check required form fields
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
    
    setValidationErrors(errors);
    return errors.length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateSubmission()) {
      toast.error('Please fix validation errors before submitting');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const fullSubmissionData: SubmissionData = {
        ...submissionData,
        files: uploadedFiles,
        submittedAt: new Date().toISOString(),
        requirementId: requirement.id
      };
      
      await onSubmit(fullSubmissionData);
      
      // Clear form and close
      setSubmissionData({});
      setUploadedFiles([]);
      onClose();
      
      toast.success('Requirement submitted successfully!');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit requirement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{requirement.name}</DialogTitle>
          <DialogDescription>{requirement.description}</DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* File Upload Section */}
          {requirement.ui_component === 'file_upload' && (
            <div className="space-y-4">
              <Label>Upload Required Documents</Label>
              
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                )}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {isDragActive
                    ? "Drop files here..."
                    : "Drag & drop files here, or click to select"}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Accepted formats: {Object.keys(requirement.validation_rules?.file_types || {}).join(', ')}
                </p>
                <p className="text-xs text-gray-500">
                  Max size: {formatFileSize(requirement.validation_rules?.max_file_size || 10485760)}
                </p>
              </div>
              
              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Files</Label>
                  {uploadedFiles.map(file => (
                    <FileCard
                      key={file.id}
                      file={file}
                      onRemove={() => {
                        setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
                        ComplianceUploadService.deleteFile(file.id);
                      }}
                    />
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
                          {rejection.file.name}: {rejection.errors.map(e => e.message).join(', ')}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          {/* Additional Form Fields */}
          {requirement.ui_component === 'form' && (
            <DynamicRequirementForm
              fields={getRequirementFormFields(requirement)}
              values={submissionData}
              onChange={(field, value) => {
                setSubmissionData(prev => ({ ...prev, [field]: value }));
              }}
              errors={validationErrors}
            />
          )}
          
          {/* Notes Section */}
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
```

### 11.3 Compliance Review Dialog

```typescript
// File: src/components/dialogs/ComplianceReviewDialog.tsx

interface ComplianceReviewDialogProps {
  submission: ComplianceSubmission;
  isOpen: boolean;
  onClose: () => void;
  onReview: (decision: ReviewDecision) => Promise<void>;
  reviewerRole: string;
}

export function ComplianceReviewDialog({
  submission,
  isOpen,
  onClose,
  onReview,
  reviewerRole
}: ComplianceReviewDialogProps) {
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [checklist, setChecklist] = useState<ReviewChecklist>({});
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Load review criteria
  const { data: reviewCriteria } = useReviewCriteria(submission.requirement_type);
  const { data: submissionHistory } = useSubmissionHistory(submission.id);
  const { data: userProfile } = useUserProfile(submission.user_id);
  
  // Initialize checklist
  useEffect(() => {
    if (reviewCriteria) {
      const initialChecklist: ReviewChecklist = {};
      reviewCriteria.items.forEach(item => {
        initialChecklist[item.id] = { checked: false, notes: '' };
      });
      setChecklist(initialChecklist);
    }
  }, [reviewCriteria]);
  
  const handleReviewSubmit = async () => {
    if (!decision) {
      toast.error('Please select a decision');
      return;
    }
    
    if (decision === 'reject' && !reviewNotes.trim()) {
      toast.error('Please provide feedback for rejection');
      return;
    }
    
    // Validate checklist completion
    const incompleteItems = reviewCriteria?.items.filter(
      item => item.required && !checklist[item.id]?.checked
    );
    
    if (incompleteItems && incompleteItems.length > 0) {
      toast.error('Please complete all required review items');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const reviewDecision: ReviewDecision = {
        submissionId: submission.id,
        decision,
        reviewNotes,
        checklist,
        reviewedBy: user.id,
        reviewedAt: new Date().toISOString(),
        metadata: {
          reviewerRole,
          checklistCompletion: calculateChecklistCompletion(checklist),
          previousSubmissions: submissionHistory?.length || 0
        }
      };
      
      await onReview(reviewDecision);
      
      // Send notification to user
      await NotificationService.send({
        userId: submission.user_id,
        type: decision === 'approve' ? 'submission_approved' : 'submission_rejected',
        title: `Requirement ${decision === 'approve' ? 'Approved' : 'Needs Revision'}`,
        message: decision === 'approve' 
          ? `Your submission for ${submission.requirement_name} has been approved!`
          : `Your submission needs revision: ${reviewNotes}`,
        metadata: {
          submissionId: submission.id,
          requirementId: submission.requirement_id
        }
      });
      
      toast.success(`Submission ${decision === 'approve' ? 'approved' : 'rejected'} successfully`);
      onClose();
    } catch (error) {
      console.error('Review submission error:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose} maxWidth="4xl">
      <DialogContent className="max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Review Compliance Submission</DialogTitle>
          <DialogDescription>
            Review submission for: {submission.requirement_name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto max-h-[60vh]">
          {/* Submission Details */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Submission Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Submitted By</Label>
                  <p className="font-medium">{userProfile?.display_name}</p>
                  <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Submission Date</Label>
                  <p className="font-medium">
                    {format(new Date(submission.submitted_at), 'PPP')}
                  </p>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Requirement Type</Label>
                  <Badge variant="outline">{submission.requirement_type}</Badge>
                </div>
                
                {submission.notes && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Submission Notes</Label>
                    <p className="text-sm">{submission.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Submitted Files */}
            {submission.files && submission.files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Submitted Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {submission.files.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
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
            {submissionHistory && submissionHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Previous Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <SubmissionHistoryList
                    history={submissionHistory}
                    compact
                  />
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Review Section */}
          <div className="space-y-4">
            {/* Review Checklist */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Review Checklist</CardTitle>
                <CardDescription>
                  Complete all required items before making a decision
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reviewCriteria?.items.map(item => (
                    <div key={item.id} className="space-y-2">
                      <div className="flex items-start gap-2">
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
                          <Label htmlFor={item.id} className="cursor-pointer">
                            {item.label}
                            {item.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {item.allowNotes && checklist[item.id]?.checked && (
                        <Input
                          placeholder="Add notes (optional)"
                          value={checklist[item.id]?.notes || ''}
                          onChange={(e) => {
                            setChecklist(prev => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], notes: e.target.value }
                            }));
                          }}
                          className="ml-6 text-sm"
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
                <RadioGroup value={decision || ''} onValueChange={(value) => setDecision(value as 'approve' | 'reject')}>
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-green-50 transition-colors">
                    <RadioGroupItem value="approve" id="approve" />
                    <Label htmlFor="approve" className="cursor-pointer flex-1 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Approve Submission
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-red-50 transition-colors">
                    <RadioGroupItem value="reject" id="reject" />
                    <Label htmlFor="reject" className="cursor-pointer flex-1 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Request Revision
                    </Label>
                  </div>
                </RadioGroup>
                
                <div className="space-y-2">
                  <Label htmlFor="review-notes">
                    Review Notes {decision === 'reject' && <span className="text-red-500">*</span>}
                  </Label>
                  <Textarea
                    id="review-notes"
                    placeholder={decision === 'reject' 
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
            variant={decision === 'approve' ? 'default' : 'destructive'}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {decision === 'approve' ? (
