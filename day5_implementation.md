# Day 5 Implementation Plan - Complete UI Integration and Backend Services

## Overview

Day 5 focuses on completing the UI component implementations, connecting all frontend components to backend services, and implementing real-time data synchronization. This builds on the database schema (Day 1), tier switching UI (Day 2), role-specific dashboards (Day 3), and sets the foundation for final integration testing.

## Implementation Goals

1. **Complete RequirementsManager Component Implementation**
   - Finish the full RequirementsManager component with all UI interactions
   - Implement requirement submission workflows with validation
   - Add bulk actions and advanced filtering capabilities

2. **Connect All UI Actions to Backend Services**
   - Wire up requirement submission to ComplianceRequirementsService
   - Implement file upload integration with DocumentUploadService
   - Connect tier switching to ComplianceTierService

3. **Implement Real-Time Data Synchronization**
   - Add real-time updates for requirement status changes
   - Implement live progress tracking across all dashboards
   - Create activity logging for all compliance actions

## Detailed Implementation Plan

### 1. Complete RequirementsManager Component

#### 1.1 Finalize RequirementsManager with Full Backend Integration

Building on the partial implementation from Day 3, complete the RequirementsManager component:

```typescript
// File: src/components/compliance/RequirementsManager.tsx

interface RequirementsManagerProps {
  userId: string;
  role: string;
  tier: string;
  viewMode?: 'grid' | 'list' | 'kanban';
  onRequirementComplete?: (requirementId: string) => void;
}

export function RequirementsManager({
  userId,
  role,
  tier,
  viewMode = 'grid',
  onRequirementComplete
}: RequirementsManagerProps) {
  const [selectedRequirement, setSelectedRequirement] = useState<UIRequirement | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'name'>('priority');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Backend connections
  const { data: requirements, isLoading, refetch } = useUIRequirements(userId, role, tier);
  const { mutate: updateRequirement } = useRequirementUpdate();
  const { mutate: bulkUpdate } = useBulkRequirementUpdate();
  
  // Real-time requirement updates
  useEffect(() => {
    const subscription = ComplianceRequirementsUIService.subscribeToRequirementUpdates(
      userId,
      (update) => {
        queryClient.setQueryData(
          ['ui-requirements', userId, role, tier],
          (old: UIRequirement[]) => {
            if (!old) return old;
            return old.map(req => 
              req.id === update.requirementId 
                ? { ...req, ...update.changes }
                : req
            );
          }
        );
      }
    );
    
    return () => subscription.unsubscribe();
  }, [userId, role, tier]);
  
  // Handle requirement action
  const handleRequirementAction = async (
    requirementId: string,
    action: 'start' | 'submit' | 'save_draft' | 'request_help',
    data?: any
  ) => {
    try {
      const result = await ComplianceRequirementsUIService.handleUIAction(
        userId,
        requirementId,
        action,
        data
      );
      
      if (result.success) {
        toast.success(getActionSuccessMessage(action));
        
        if (action === 'submit' && result.updatedRequirement.status === 'approved') {
          onRequirementComplete?.(requirementId);
        }
        
        refetch();
      }
    } catch (error) {
      toast.error('Action failed. Please try again.');
      console.error('Requirement action error:', error);
    }
  };
  
  // Bulk actions implementation
  const handleBulkAction = async (action: 'start' | 'export' | 'assign') => {
    if (selectedIds.size === 0) {
      toast.warning('Please select requirements first');
      return;
    }
    
    try {
      switch (action) {
        case 'start':
          await bulkUpdate({
            requirementIds: Array.from(selectedIds),
            updates: { status: 'in_progress' }
          });
          toast.success(`Started ${selectedIds.size} requirements`);
          break;
          
        case 'export':
          await exportRequirements(Array.from(selectedIds), userId);
          toast.success('Requirements exported');
          break;
          
        case 'assign':
          setShowAssignDialog(true);
          break;
      }
      
      setSelectedIds(new Set());
      setShowBulkActions(false);
      refetch();
    } catch (error) {
      toast.error('Bulk action failed');
      console.error('Bulk action error:', error);
    }
  };
  
  // Render requirement card based on type
  const renderRequirementCard = (requirement: UIRequirement) => {
    return (
      <RequirementCard
        key={requirement.id}
        requirement={requirement}
        isSelected={selectedIds.has(requirement.id)}
        onSelect={() => {
          if (showBulkActions) {
            setSelectedIds(prev => {
              const next = new Set(prev);
              if (next.has(requirement.id)) {
                next.delete(requirement.id);
              } else {
                next.add(requirement.id);
              }
              return next;
            });
          } else {
            setSelectedRequirement(requirement);
          }
        }}
        onAction={(action) => handleRequirementAction(requirement.id, action)}
        onQuickSubmit={
          requirement.ui_component === 'checkbox' 
            ? () => handleRequirementAction(requirement.id, 'submit', { checked: true })
            : undefined
        }
      />
    );
  };
  
  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <RequirementsHeader
        totalCount={requirements?.length || 0}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showBulkActions={showBulkActions}
        onToggleBulkActions={() => setShowBulkActions(!showBulkActions)}
        selectedCount={selectedIds.size}
        onBulkAction={handleBulkAction}
      />
      
      {/* Requirements Display */}
      <RequirementsDisplay
        requirements={processedRequirements}
        viewMode={viewMode}
        renderCard={renderRequirementCard}
        showBulkActions={showBulkActions}
        selectedIds={selectedIds}
        onToggleSelection={setSelectedIds}
        onRequirementClick={setSelectedRequirement}
      />
      
      {/* Requirement Detail Modal */}
      <RequirementDetailDrawer
        requirementId={selectedRequirement?.id}
        isOpen={!!selectedRequirement}
        onClose={() => setSelectedRequirement(null)}
        onUpdate={handleRequirementUpdate}
      />
    </div>
  );
}
```

#### 1.2 Implement Requirement Submission Workflows

Create comprehensive submission workflows for different requirement types:

```typescript
// File: src/components/compliance/RequirementSubmissionWorkflow.tsx

interface RequirementSubmissionWorkflowProps {
  requirement: UIRequirement;
  onSubmit: (data: SubmissionData) => Promise<void>;
  onSaveDraft: (data: SubmissionData) => Promise<void>;
}

export function RequirementSubmissionWorkflow({
  requirement,
  onSubmit,
  onSaveDraft
}: RequirementSubmissionWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [submissionData, setSubmissionData] = useState<SubmissionData>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Workflow steps based on requirement type
  const steps = getWorkflowSteps(requirement);
  
  const validateCurrentStep = (): boolean => {
    const currentStepConfig = steps[currentStep];
    const errors: ValidationError[] = [];
    
    // Validate based on step requirements
    currentStepConfig.validations?.forEach(validation => {
      const isValid = validation.validate(submissionData);
      if (!isValid) {
        errors.push({
          field: validation.field,
          message: validation.message
        });
      }
    });
    
    setValidationErrors(errors);
    return errors.length === 0;
  };
  
  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(submissionData);
      toast.success('Requirement submitted successfully');
    } catch (error) {
      toast.error('Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSaveDraft = async () => {
    try {
      await onSaveDraft(submissionData);
      toast.success('Draft saved');
    } catch (error) {
      toast.error('Failed to save draft');
    }
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{requirement.name}</CardTitle>
        <CardDescription>{requirement.description}</CardDescription>
        
        {/* Progress Indicator */}
        <div className="flex items-center space-x-2 mt-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm",
                index === currentStep 
                  ? "bg-blue-600 text-white" 
                  : index < currentStep 
                    ? "bg-green-600 text-white" 
                    : "bg-gray-300 text-gray-600"
              )}
            >
              {index < currentStep ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Current Step Content */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">{steps[currentStep].title}</h3>
            <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
          </div>
          
          {/* Step Component */}
          <steps[currentStep].component
            requirement={requirement}
            data={submissionData}
            onChange={setSubmissionData}
            errors={validationErrors}
          />
          
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
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0 || isSubmitting}
          >
            Previous
          </Button>
          
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
          >
            Save Draft
          </Button>
        </div>
        
        <Button
          onClick={handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : currentStep === steps.length - 1 ? (
            'Submit Requirement'
          ) : (
            'Next'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Helper function to get workflow steps based on requirement type
function getWorkflowSteps(requirement: UIRequirement): WorkflowStep[] {
  const baseSteps = [
    {
      title: 'Review Requirements',
      description: 'Understand what needs to be submitted',
      component: RequirementReviewStep,
      validations: []
    }
  ];
  
  switch (requirement.ui_component) {
    case 'file_upload':
      return [
        ...baseSteps,
        {
          title: 'Upload Documents',
          description: 'Upload required files and documents',
          component: FileUploadStep,
          validations: [
            {
              field: 'files',
              message: 'At least one file must be uploaded',
              validate: (data) => data.files && data.files.length > 0
            }
          ]
        },
        {
          title: 'Add Notes',
          description: 'Add any additional notes or comments',
          component: NotesStep,
          validations: []
        },
        {
          title: 'Review & Submit',
          description: 'Review your submission before submitting',
          component: ReviewStep,
          validations: []
        }
      ];
      
    case 'form':
      return [
        ...baseSteps,
        {
          title: 'Fill Form',
          description: 'Complete the required form fields',
          component: FormFillStep,
          validations: requirement.validation_rules?.required_fields?.map(field => ({
            field,
            message: `${field} is required`,
            validate: (data) => !!data[field]
          })) || []
        },
        {
          title: 'Review & Submit',
          description: 'Review your submission before submitting',
          component: ReviewStep,
          validations: []
        }
      ];
      
    case 'external_link':
      return [
        ...baseSteps,
        {
          title: 'Complete External Task',
          description: 'Complete the external training or certification',
          component: ExternalLinkStep,
          validations: [
            {
              field: 'completed',
              message: 'You must complete the external task',
              validate: (data) => data.completed === true
            }
          ]
        }
      ];
      
    default:
      return baseSteps;
  }
}
```

### 2. Connect All UI Actions to Backend Services

#### 2.1 Implement Complete Service Integration Layer

Create a comprehensive integration service that connects all UI actions to backend services:

```typescript
// File: src/services/integration/complianceUIIntegrationService.ts

export class ComplianceUIIntegrationService {
  static async handleRequirementSubmission(
    userId: string,
    requirementId: string,
    submissionData: SubmissionData
  ): Promise<SubmissionResult> {
    try {
      // 1. Validate submission data
      const validation = await this.validateSubmissionData(requirementId, submissionData);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors
        };
      }
      
      // 2. Process file uploads if any
      if (submissionData.files && submissionData.files.length > 0) {
        const uploadResults = await this.processFileUploads(
          userId,
          requirementId,
          submissionData.files
        );
        submissionData.fileUrls = uploadResults.map(r => r.url);
      }
      
      // 3. Submit to ComplianceRequirementsService
      const result = await ComplianceRequirementsService.submitRequirement(
        userId,
        requirementId,
        submissionData
      );
      
      // 4. Update user metrics
      await this.updateUserMetrics(userId);
      
      // 5. Check for tier advancement eligibility
      await this.checkTierAdvancement(userId);
      
      // 6. Send notifications
      await this.sendSubmissionNotifications(userId, requirementId, result);
      
      return result;
    } catch (error) {
      console.error('Requirement submission error:', error);
      throw error;
    }
  }
  
  static async handleTierSwitch(
    userId: string,
    targetTier: 'basic' | 'robust',
    reason: string
  ): Promise<TierSwitchResult> {
    try {
      // 1. Validate tier switch eligibility
      const eligibility = await ComplianceTierService.validateTierSwitch(
        userId,
        targetTier
      );
      
      if (!eligibility.allowed) {
        return {
          success: false,
          message: eligibility.reason
        };
      }
      
      // 2. Perform tier switch
      const result = await ComplianceTierService.switchUserTier(
        userId,
        targetTier,
        userId, // switcher is the user themselves
        reason
      );
      
      // 3. Update dashboard UI state
      await this.refreshDashboardData(userId);
      
      // 4. Send confirmation notifications
      await ComplianceNotificationService.sendTierSwitchNotification(
        userId,
        result.oldTier,
        result.newTier
      );
      
      return result;
    } catch (error) {
      console.error('Tier switch error:', error);
      throw error;
    }
  }
  
  static async handleBulkRequirementAction(
    userId: string,
    requirementIds: string[],
    action: BulkAction,
    data?: any
  ): Promise<BulkActionResult> {
    try {
      const results: IndividualResult[] = [];
      
      for (const requirementId of requirementIds) {
        try {
          let result;
          
          switch (action) {
            case 'start':
              result = await ComplianceRequirementsService.updateRequirementStatus(
                userId,
                requirementId,
                'in_progress'
              );
              break;
              
            case 'assign':
              result = await ComplianceRequirementsService.assignRequirement(
                requirementId,
                data.assigneeId,
                userId
              );
              break;
              
            case 'export':
              // Handle in batch after loop
              result = { success: true };
              break;
              
            default:
              result = { success: false, error: 'Unknown action' };
          }
          
          results.push({
            requirementId,
            success: result.success,
            error: result.error
          });
        } catch (error) {
          results.push({
            requirementId,
            success: false,
            error: error.message
          });
        }
      }
      
      // Handle export separately
      if (action === 'export') {
        await this.exportRequirements(userId, requirementIds);
      }
      
      // Update metrics
      await this.updateUserMetrics(userId);
      
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.length - successCount;
      
      return {
        success: failedCount === 0,
        processed: results.length,
        succeeded: successCount,
        failed: failedCount,
        results
      };
    } catch (error) {
      console.error('Bulk action error:', error);
      throw error;
    }
  }
  
  // Helper methods
  private static async validateSubmissionData(
    requirementId: string,
    submissionData: SubmissionData
  ): Promise<ValidationResult> {
    // Get requirement details
    const { data: requirement } = await supabase
      .from('compliance_requirements')
      .select('*')
      .eq('id', requirementId)
      .single();
    
    if (!requirement) {
      return {
        valid: false,
        errors: ['Requirement not found']
      };
    }
    
    // Validate based on requirement rules
    return ComplianceRequirementsService.validateSubmission(requirement, submissionData);
  }
  
  private static async processFileUploads(
    userId: string,
    requirementId: string,
    files: File[]
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('requirementId', requirementId);
      
      return DocumentUploadService.uploadRequirementFile(formData);
    });
    
    return Promise.all(uploadPromises);
  }
  
  private static async updateUserMetrics(userId: string): Promise<void> {
    // Recalculate user compliance metrics
    await supabase.rpc('recalculate_user_compliance_metrics', {
      user_id: userId
    });
  }
  
  private static async checkTierAdvancement(userId: string): Promise<void> {
    const tierInfo = await ComplianceTierService.getUserTierInfo(userId);
    
    if (tierInfo.tier === 'basic' && tierInfo.completion_percentage >= 80) {
      await ComplianceNotificationService.sendTierAdvancementNotification(
        userId,
        tierInfo.tier,
        { eligible: true, currentPercentage: tierInfo.completion_percentage }
      );
    }
  }
  
  private static async refreshDashboardData(userId: string): Promise<void> {
    // Invalidate React Query caches
    queryClient.invalidateQueries(['compliance-tier', userId]);
    queryClient.invalidateQueries(['ui-requirements', userId]);
    queryClient.invalidateQueries(['compliance-progress', userId]);
  }
}
```

#### 2.2 Implement File Upload Integration

Connect the file upload components to the backend storage service:

```typescript
// File: src/components/compliance/FileUploadIntegration.tsx

interface FileUploadIntegrationProps {
  requirementId: string;
  userId: string;
  validationRules?: FileValidationRules;
  onUploadComplete: (files: UploadedFile[]) => void;
  onUploadError: (error: string) => void;
}

export function FileUploadIntegration({
  requirementId,
  userId,
  validationRules,
  onUploadComplete,
  onUploadError
}: FileUploadIntegrationProps) {
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(new Map());
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: validationRules?.file_types || {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxSize: validationRules?.max_file_size || 10485760, // 10MB default
    maxFiles: validationRules?.max_files || 5,
    onDrop: handleFileDrop,
    onDropRejected: handleDropRejected
  });
  
  // Handle file drop
  const handleFileDrop = async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      await uploadFile(file);
    }
  };
  
  // Handle rejected files
  const handleDropRejected = (rejectedFiles: FileRejection[]) => {
    const errors = rejectedFiles.map(rejection => 
      `${rejection.file.name}: ${rejection.errors.map(e => e.message).join(', ')}`
    );
    onUploadError(`Upload rejected: ${errors.join('; ')}`);
  };
  
  // Upload individual file
  const uploadFile = async (file: File) => {
    const fileId = `${file.name}-${Date.now()}`;
    
    try {
      // Start upload progress tracking
      setUploadingFiles(prev => new Map(prev).set(fileId, 0));
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('requirementId', requirementId);
      
      // Upload with progress tracking
      const result = await DocumentUploadService.uploadRequirementFile(
        formData,
        (progress) => {
          setUploadingFiles(prev => new Map(prev).set(fileId, progress));
        }
      );
      
      if (result.success) {
        const uploadedFile: UploadedFile = {
          id: result.fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          url: result.fileUrl,
          uploadedAt: new Date().toISOString()
        };
        
        setUploadedFiles(prev => [...prev, uploadedFile]);
        onUploadComplete([...uploadedFiles, uploadedFile]);
        
        toast.success(`${file.name} uploaded successfully`);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      onUploadError(`Failed to upload ${file.name}: ${error.message}`);
      toast.error(`Failed to upload ${file.name}`);
    } finally {
      // Remove from uploading files
      setUploadingFiles(prev => {
        const next = new Map(prev);
        next.delete(fileId);
        return next;
      });
    }
  };
  
  // Remove uploaded file
  const removeFile = async (fileId: string) => {
    try {
      await DocumentUploadService.deleteFile(fileId);
      
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
      onUploadComplete(uploadedFiles.filter(f => f.id !== fileId));
      
      toast.success('File removed');
    } catch (error) {
      console.error('File removal error:', error);
      toast.error('Failed to remove file');
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive 
            ? "border-blue-500 bg-blue-50" 
            : "border-gray-300 hover:border-gray-400"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium text-gray-900">
          {isDragActive ? "Drop files here..." : "Drag & drop files here"}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          or click to browse your computer
        </p>
        
        {/* Validation Info */}
        {validationRules && (
          <div className="mt-4 text-xs text-gray-500">
            <p>Accepted: {Object.keys(validationRules.file_types || {}).join(', ')}</p>
            <p>Max size: {formatFileSize(validationRules.max_file_size || 10485760)}</p>
            {validationRules.max_files && (
              <p>Max files: {validationRules.max_files}</p>
            )}
          </div>
        )}
      </div>
      
      {/* Upload Progress */}
      {uploadingFiles.size > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Uploading...</h4>
          {Array.from(uploadingFiles.entries()).map(([fileId, progress]) => (
            <div key={fileId} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{fileId.split('-')[0]}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ))}
        </div>
      )}
      
      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Uploaded Files</h4>
          {uploadedFiles.map(file => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <FileIcon className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • Uploaded {formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(file.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 3. Implement Real-Time Data Synchronization

#### 3.1 Create Real-Time Updates System

Implement comprehensive real-time updates across all components:

```typescript
// File: src/hooks/useRealTimeCompliance.ts

export function useRealTimeCompliance(userId: string) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!userId) return;
    
    // Subscribe to user compliance record changes
    const complianceChannel = supabase
      .channel(`compliance-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_compliance_records',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        handleComplianceRecordChange(payload);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'compliance_tier_history',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        handleTierChange(payload);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'compliance_activity_log',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        handleActivityChange(payload);
      })
      .subscribe();
    
    // Handle compliance record changes
    const handleComplianceRecordChange = (payload: any) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      // Update requirements cache
      queryClient.invalidateQueries(['ui-requirements', userId]);
      queryClient.invalidateQueries(['compliance-progress', userId]);
      
      // Show notification for status changes
      if (eventType === 'UPDATE' && oldRecord.status !== newRecord.status) {
        showStatusChangeNotification(newRecord);
      }
    };
    
    // Handle tier changes
    const handleTierChange = (payload: any) => {
      const { eventType, new: newRecord } = payload;
      
      if (eventType === 'INSERT') {
        // Tier changed
        queryClient.invalidateQueries(['compliance-tier', userId]);
        queryClient.invalidateQueries(['ui-requirements', userId]);
        
        toast.success(
          `Tier changed from ${newRecord.old_tier} to ${newRecord.new_tier}`,
          {
            description: newRecord.change_reason || 'Tier switch completed'
          }
        );
      }
    };
    
    // Handle activity changes
    const handleActivityChange = (payload: any) => {
      queryClient.invalidateQueries(['compliance-activity', userId]);
    };
    
    // Show status change notification
    const showStatusChangeNotification = async (record: any) => {
      // Get requirement name
      const { data: requirement } = await supabase
        .from('compliance_requirements')
        .select('name')
        .eq('id', record.requirement_id)
        .single();
      
      if (requirement) {
        switch (record.status) {
          case 'approved':
            toast.success(`Requirement "${requirement.name}" approved!`);
            break;
          case 'rejected':
            toast.error(`Requirement "${requirement.name}" needs revision`);
            break;
          case 'submitted':
            toast.info(`Requirement "${requirement.name}" submitted for review`);
            break;
        }
      }
    };
    
    return () => {
      supabase.removeChannel(complianceChannel);
    };
  }, [userId, queryClient]);
}

// Global real-time hook for dashboard updates
export function useGlobalComplianceUpdates() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // Global compliance updates channel
    const globalChannel = supabase
      .channel('global-compliance')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'compliance_templates'
      }, () => {
        // Template changes affect all users
        queryClient.invalidateQueries(['compliance-templates']);
        queryClient.invalidateQueries(['tier-comparison']);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'compliance_requirements'
      }, () => {
        // Requirement changes
        queryClient.invalidateQueries(['compliance-requirements']);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(globalChannel);
    };
  }, [queryClient]);
}
```

#### 3.2 Implement Activity Logging System

Create comprehensive activity logging for all compliance actions:

```typescript
// File: src/services/compliance/complianceActivityLogger.ts

export class ComplianceActivityLogger {
  static async logActivity(
    userId: string,
    action: ComplianceAction,
    metadata: ActivityMetadata = {}
  ): Promise<void> {
    try {
      // Create activity log entry
      const { error } = await supabase
        .from('compliance_activity_log')
        .insert({
          user_id: userId,
          action: action.type,
          requirement_id: action.requirementId,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            ip_address: await this.getClientIP()
          },
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // Update activity metrics
      await this.updateActivityMetrics(userId, action.type);
      
    } catch (error) {
      console.error('Failed to log compliance activity:', error);
      // Don't throw - logging failures shouldn't break the user experience
    }
  }
  
  static async logRequirementSubmission(
    userId: string,
    requirementId: string,
    submissionData: SubmissionData
  ): Promise<void> {
    await this.logActivity(userId, {
      type: 'requirement_submitted',
      requirementId
    }, {
      submission_type: submissionData.type,
      file_count: submissionData.files?.length || 0,
      notes_length: submissionData.notes?.length || 0
    });
  }
  
  static async logTierSwitch(
    userId: string,
    oldTier: string,
    newTier: string,
    reason?: string
  ): Promise<void> {
    await this.logActivity(userId, {
      type: 'tier_switched'
    }, {
      old_tier: oldTier,
      new_tier: newTier,
      reason,
      tier_change_direction: newTier === 'robust' ? 'upgrade' : 'downgrade'
    });
  }
  
  static async logRequirementAction(
    userId: string,
    requirementId: string,
    action: string,
    result?: any
  ): Promise<void> {
    await this.logActivity(userId, {
      type: `requirement_${action}`,
      requirementId
    }, {
      action,
      success: result?.success || true,
      error: result?.error,
      processing_time: result?.processingTime
    });
  }
  
  static async logDashboardView(
    userId: string,
    dashboardType: string,
    viewDuration?: number
  ): Promise<void> {
    await this.logActivity(userId, {
      type: 'dashboard_viewed'
    }, {
      dashboard_type: dashboardType,
      view_duration: viewDuration,
      device_type: this.getDeviceType()
    });
  }
  
  static async logBulkAction(
    userId: string,
    action: string,
    requirementIds: string[],
    result: BulkActionResult
  ): Promise<void> {
    await this.logActivity(userId, {
      type: 'bulk_action_performed'
    }, {
      bulk_action: action,
      requirement_count: requirementIds.length,
      succeeded: result.succeeded,
      failed: result.failed,
      requirement_ids: requirementIds
    });
  }
  
  // Helper methods
  private static async updateActivityMetrics(
    userId: string,
    actionType: string
  ): Promise<void> {
    try {
      await supabase.rpc('update_user_activity_metrics', {
        user_id: userId,
        action_type: actionType
      });
    } catch (error) {
      console.error('Failed to update activity metrics:', error);
    }
  }
  
  private static async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }
  
  private static getDeviceType(): string {
    const userAgent = navigator.userAgent;
    
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }
}
```

### 4. Integration Testing Setup

#### 4.1 Create Integration Test Suite

Set up comprehensive integration testing for all components:

```typescript
// File: src/tests/integration/complianceIntegration.test.ts

describe('Compliance System Integration Tests', () => {
  let testUser: any;
  let testRequirement: any;
  
  beforeEach(async () => {
    // Setup test data
    testUser = await createTestUser('IT', 'basic');
    testRequirement = await createTestRequirement(testUser.id);
  });
  
  afterEach(async () => {
    // Cleanup test data
    await cleanupTestData(testUser.id);
  });
  
  describe('Requirement Submission Flow', () => {
    it('should handle complete requirement submission workflow', async () => {
      // 1. Load requirements
      const requirements = await ComplianceRequirementsUIService.getUIRequirements(
        testUser.id,
        'IT',
        'basic'
      );
      
      expect(requirements).toBeDefined();
      expect(requirements.length).toBeGreaterThan(0);
      
      // 2. Submit requirement
      const submissionData = {
        files: [createMockFile('test.pdf')],
        notes: 'Test submission'
      };
      
      const result = await ComplianceUIIntegrationService.handleRequirementSubmission(
        testUser.id,
        testRequirement.id,
        submissionData
      );
      
      expect(result.success).toBe(true);
      expect(result.record.status).toBe('submitted');
      
      // 3. Verify activity log
      const activities = await ComplianceActivityLogger.getUserActivities(testUser.id);
      expect(activities.some(a => a.action === 'requirement_submitted')).toBe(true);
    });
  });
  
  describe('Tier Switching', () => {
    it('should handle tier switching with requirement updates', async () => {
      // 1. Switch tier
      const result = await ComplianceUIIntegrationService.handleTierSwitch(
        testUser.id,
        'robust',
        'Testing tier advancement'
      );
      
      expect(result.success).toBe(true);
      expect(result.newTier).toBe('robust');
      
      // 2. Verify requirements updated
      const newRequirements = await ComplianceRequirementsUIService.getUIRequirements(
        testUser.id,
        'IT',
        'robust'
      );
      
      expect(newRequirements.length).toBeGreaterThan(0);
      
      // 3. Verify tier history
      const tierHistory = await ComplianceTierService.getTierHistory(testUser.id);
      expect(tierHistory.length).toBeGreaterThan(0);
      expect(tierHistory[0].new_tier).toBe('robust');
    });
  });
  
  describe('Real-Time Updates', () => {
    it('should trigger real-time updates on status changes', async () => {
      let updateReceived = false;
      
      // Subscribe to updates
      const subscription = ComplianceRequirementsUIService.subscribeToRequirementUpdates(
        testUser.id,
        () => {
          updateReceived = true;
        }
      );
      
      // Update requirement status
      await supabase
        .from('user_compliance_records')
        .update({ status: 'approved' })
        .eq('user_id', testUser.id)
        .eq('requirement_id', testRequirement.id);
      
      // Wait for real-time update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      expect(updateReceived).toBe(true);
      
      subscription.unsubscribe();
    });
  });
  
  describe('File Upload Integration', () => {
    it('should handle file upload and storage', async () => {
      const mockFile = createMockFile('test-document.pdf');
      const formData = new FormData();
      formData.append('file', mockFile);
      formData.append('userId', testUser.id);
      formData.append('requirementId', testRequirement.id);
      
      const result = await DocumentUploadService.uploadRequirementFile(formData);
      
      expect(result.success).toBe(true);
      expect(result.fileUrl).toBeDefined();
      expect(result.fileName).toBe('test-document.pdf');
      
      // Verify file record created
      const { data: fileRecord } = await supabase
        .from('compliance_files')
        .select('*')
        .eq('id', result.fileId)
        .single();
      
      expect(fileRecord).toBeDefined();
      expect(fileRecord.user_id).toBe(testUser.id);
    });
  });
});

// Helper functions
async function createTestUser(role: string, tier: string) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: generateTestId(),
      email: `test-${generateTestId()}@example.com`,
      display_name: 'Test User',
      role,
      compliance_tier: tier
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

async function createTestRequirement(userId: string) {
  // Create a test requirement for the user
  const { data: template } = await supabase
    .from('compliance_templates')
    .select('id')
    .eq('role', 'IT')
    .eq('tier', 'basic')
    .single();
  
  const { data: requirement } = await supabase
    .from('compliance_requirements')
    .select('id')
    .eq('template_id', template.id)
    .limit(1)
    .single();
  
  return requirement;
}

function createMockFile(name: string): File {
  const content = new Blob(['test file content'], { type: 'application/pdf' });
  return new File([content], name, { type: 'application/pdf' });
}
```

## Implementation Checklist

### Core Components
- [ ] Complete RequirementsManager component with all UI interactions
- [ ] Implement RequirementSubmissionWorkflow with multi-step validation
- [ ] Create FileUploadIntegration with progress tracking
- [ ] Build comprehensive service integration layer

### Backend Connections
- [ ] Connect all UI actions to ComplianceRequirementsService
- [ ] Implement file upload integration with DocumentUploadService
- [ ] Wire tier switching to ComplianceTierService
- [ ] Add bulk action support with proper validation

### Real-Time Features
- [ ] Implement real-time requirement status updates
- [ ] Add live progress tracking across dashboards
- [ ] Create comprehensive activity logging system
- [ ] Set up global compliance update subscriptions

### Testing and Validation
- [ ] Create integration test suite for all workflows
- [ ] Test requirement submission end-to-end
- [ ] Verify tier switching with requirement updates
- [ ] Validate real-time update propagation
- [ ] Test file upload and storage integration

## Success Criteria

**Technical Requirements:**
- All UI components connected to backend services
- Real-time updates working across all dashboards
- File upload integration complete with progress tracking
- Comprehensive activity logging implemented

**User Experience:**
- Seamless requirement submission workflows
- Instant feedback on all actions
- Real-time progress updates
- Proper error handling and validation

**Performance:**
- UI actions complete within 2 seconds
- Real-time updates propagate within 1 second
- File uploads show progress and handle errors gracefully
- No memory leaks in real-time subscriptions

## Next Steps (Day 6)

After completing Day 5, the system will be ready for:
- End-to-end testing across all roles and tiers
- Performance optimization and caching
- Security testing and validation
- User acceptance testing preparation
- Production deployment preparation