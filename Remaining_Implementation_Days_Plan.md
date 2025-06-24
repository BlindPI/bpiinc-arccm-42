# Comprehensive Full Compliance Management System Implementation Plan - Remaining Days

## Continuation from Day 9 - Phase 3: Compliance UI Components

### Day 9: Build Requirements Management UI (Continued)

#### 9.1 RequirementsManager Component with Full Interactivity (Continued)

```typescript
// File: src/components/compliance/RequirementsManager.tsx (continued)

                onClick={() => handleBulkAction('start')}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('export')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('assign')}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign to Team
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requirements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="dueDate">Due Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
          
          <ViewModeToggle
            mode={viewMode}
            onChange={setViewMode}
            options={['grid', 'list', 'kanban']}
          />
        </div>
      </div>
      
      {/* Requirements Display */}
      {isLoading ? (
        <RequirementsLoadingSkeleton viewMode={viewMode} count={6} />
      ) : (
        renderRequirements()
      )}
      
      {/* Requirement Detail Dialog */}
      {selectedRequirement && (
        <RequirementDetailDialog
          requirement={selectedRequirement}
          isOpen={!!selectedRequirement}
          onClose={() => setSelectedRequirement(null)}
          onAction={handleRequirementAction}
          onFileUpload={handleFileUpload}
          dragDropProps={
            selectedRequirement.ui_component === 'file_upload' 
              ? { getRootProps, getInputProps, isDragActive }
              : undefined
          }
        />
      )}
    </div>
  );
}
```

#### 9.2 Requirement Detail Dialog with Dynamic UI Components

```typescript
// File: src/components/compliance/dialogs/RequirementDetailDialog.tsx

interface RequirementDetailDialogProps {
  requirement: UIRequirement;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, data?: any) => Promise<void>;
  onFileUpload?: (file: File) => Promise<void>;
  dragDropProps?: any;
}

export function RequirementDetailDialog({
  requirement,
  isOpen,
  onClose,
  onAction,
  onFileUpload,
  dragDropProps
}: RequirementDetailDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState(requirement.ui_state?.form_data || {});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'help'>('details');
  
  // Backend connections
  const { data: requirementHistory } = useRequirementHistory(requirement.id);
  const { data: helpResources } = useRequirementHelp(requirement.type);
  const { mutate: saveProgress } = useSaveRequirementProgress();
  
  // Auto-save form progress
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (requirement.ui_component === 'form' && Object.keys(formData).length > 0) {
        saveProgress({
          requirementId: requirement.id,
          formData,
          status: 'in_progress'
        });
      }
    }, 2000); // Auto-save after 2 seconds of inactivity
    
    return () => clearTimeout(saveTimer);
  }, [formData, requirement.id]);
  
  // Validate form data
  const validateForm = (): boolean => {
    const errors: string[] = [];
    const rules = requirement.validation_rules;
    
    if (rules?.required_fields) {
      rules.required_fields.forEach(field => {
        if (!formData[field]) {
          errors.push(`${field} is required`);
        }
      });
    }
    
    if (requirement.type === 'assessment' && rules?.min_score) {
      const score = parseFloat(formData.score);
      if (isNaN(score) || score < rules.min_score) {
        errors.push(`Minimum score of ${rules.min_score} required`);
      }
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };
  
  // Handle submission based on requirement type
  const handleSubmit = async () => {
    if (requirement.ui_component === 'form' && !validateForm()) {
      toast.error('Please fix validation errors');
      return;
    }
    
    setIsLoading(true);
    try {
      await onAction('submit', {
        ...formData,
        submittedAt: new Date().toISOString(),
        validationPassed: true
      });
      
      toast.success('Requirement submitted successfully');
      onClose();
    } catch (error) {
      toast.error('Submission failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render component based on UI type
  const renderRequirementComponent = () => {
    switch (requirement.ui_component) {
      case 'file_upload':
        return (
          <FileUploadComponent
            requirement={requirement}
            onUpload={onFileUpload}
            dragDropProps={dragDropProps}
            existingFile={requirement.submission_data?.fileUrl}
            validationRules={requirement.validation_rules}
          />
        );
        
      case 'form':
        return (
          <DynamicForm
            fields={getFormFields(requirement)}
            values={formData}
            onChange={setFormData}
            errors={validationErrors}
            disabled={requirement.status === 'approved'}
          />
        );
        
      case 'external_link':
        return (
          <ExternalLinkComponent
            requirement={requirement}
            onConfirm={() => onAction('submit', { visitedAt: new Date().toISOString() })}
            targetUrl={requirement.submission_data?.targetUrl}
          />
        );
        
      case 'checkbox':
        return (
          <CheckboxComponent
            requirement={requirement}
            checked={requirement.submission_data?.checked || false}
            onChange={(checked) => {
              setFormData({ ...formData, checked });
              if (checked) {
                handleSubmit();
              }
            }}
          />
        );
        
      default:
        return <div>Unknown requirement type</div>;
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose} maxWidth="2xl">
      <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{requirement.name}</DialogTitle>
              <DialogDescription className="mt-1">
                {requirement.description}
              </DialogDescription>
            </div>
            <StatusBadge status={requirement.status} />
          </div>
        </DialogHeader>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="history">
              History
              {requirementHistory?.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {requirementHistory.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="help">Help</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="details" className="space-y-4">
              {/* Requirement Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <p className="font-medium capitalize">{requirement.category}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <p className="font-medium capitalize">{requirement.type}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Priority</Label>
                  <Badge variant={getPriorityVariant(requirement.display_config.priority)}>
                    {requirement.display_config.priority}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Points</Label>
                  <p className="font-medium">{requirement.points_value || 10} pts</p>
                </div>
              </div>
              
              {/* Dynamic Component */}
              <div className="space-y-4">
                {renderRequirementComponent()}
              </div>
              
              {/* Progress Indicator */}
              {requirement.ui_component === 'form' && requirement.progress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Form Progress</span>
                    <span>{requirement.progress}%</span>
                  </div>
                  <Progress value={requirement.progress} />
                </div>
              )}
              
              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Validation Errors</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside mt-2">
                      {validationErrors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4">
              <RequirementHistoryTimeline
                history={requirementHistory || []}
                onViewDetails={(entry) => setSelectedHistoryEntry(entry)}
              />
            </TabsContent>
            
            <TabsContent value="help" className="space-y-4">
              <HelpResourcesList
                resources={helpResources || []}
                requirementType={requirement.type}
                onResourceClick={(resource) => {
                  if (resource.type === 'video') {
                    setShowVideoPlayer(true);
                    setSelectedVideo(resource);
                  } else if (resource.type === 'document') {
                    window.open(resource.url, '_blank');
                  }
                }}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Need Additional Help?</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => onAction('request_help')}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Request Assistance
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
        
        <DialogFooter className="border-t pt-4">
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              {requirement.status === 'pending' && (
                <Button
                  variant="outline"
                  onClick={() => onAction('start')}
                  disabled={isLoading}
                >
                  Start Requirement
                </Button>
              )}
              
              {requirement.status === 'in_progress' && (
                <Button
                  variant="outline"
                  onClick={() => onAction('save_draft', formData)}
                  disabled={isLoading}
                >
                  Save Draft
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Close
              </Button>
              
              {requirement.actions.can_submit && (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || requirement.status === 'approved'}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Requirement'
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

## Phase 4: Service Integration (Days 10-12)

### Day 10: Connect All Backend Services

#### 10.1 Comprehensive Service Integration Layer

```typescript
// File: src/services/integration/complianceIntegrationService.ts

export class ComplianceIntegrationService {
  // Central service for coordinating all compliance operations
  
  static async updateRequirementStatus(
    userId: string,
    requirementId: string,
    status: ComplianceStatus,
    evidence?: any,
    metadata?: {
      reviewedBy?: string;
      reviewNotes?: string;
      expiryDate?: string;
    }
  ): Promise<UpdateResult> {
    try {
      // 1. Begin transaction
      const { data: requirement } = await supabase
        .from('compliance_requirements')
        .select('*, compliance_templates!inner(*)')
        .eq('id', requirementId)
        .single();
      
      if (!requirement) {
        throw new Error('Requirement not found');
      }
      
      // 2. Update compliance record with full audit trail
      const { data: record, error: recordError } = await supabase
        .from('user_compliance_records')
        .upsert({
          user_id: userId,
          requirement_id: requirementId,
          status,
          submission_data: evidence,
          reviewed_at: metadata?.reviewedBy ? new Date().toISOString() : null,
          reviewed_by: metadata?.reviewedBy,
          review_notes: metadata?.reviewNotes,
          expiry_date: metadata?.expiryDate,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (recordError) throw recordError;
      
      // 3. Update user's overall compliance metrics
      await this.recalculateUserCompliance(userId);
      
      // 4. Check for tier advancement eligibility
      const tierInfo = await ComplianceTierService.getUserTierInfo(userId);
      const advancementCheck = await this.checkTierAdvancement(userId, tierInfo);
      
      // 5. Handle status-specific actions
      switch (status) {
        case 'approved':
          // Award points
          await this.awardCompliancePoints(userId, requirement.points_value);
          
          // Check for milestone achievements
          await this.checkMilestoneAchievements(userId, requirement.category);
          
          // Send success notification
          await NotificationService.send({
            userId,
            type: 'requirement_approved',
            title: 'Requirement Approved',
            message: `${requirement.name} has been approved!`,
            metadata: {
              requirementId,
              points: requirement.points_value
            }
          });
          break;
          
        case 'rejected':
          // Send rejection notification with feedback
          await NotificationService.send({
            userId,
            type: 'requirement_rejected',
            title: 'Requirement Needs Attention',
            message: `${requirement.name} requires revision: ${metadata?.reviewNotes}`,
            metadata: {
              requirementId,
              reviewNotes: metadata?.reviewNotes
            }
          });
          break;
          
        case 'submitted':
          // Notify reviewers
          await this.notifyReviewers(requirement, userId);
          break;
      }
      
      // 6. Update real-time dashboard data
      await this.broadcastComplianceUpdate(userId, {
        requirementId,
        status,
        tierInfo: advancementCheck.newTierInfo,
        canAdvance: advancementCheck.eligible
      });
      
      // 7. Generate activity log entry
      await this.logComplianceActivity(userId, {
        action: 'requirement_status_update',
        requirementId,
        requirementName: requirement.name,
        oldStatus: record.status,
        newStatus: status,
        metadata
      });
      
      return {
        success: true,
        record,
        advancementEligible: advancementCheck.eligible,
        newCompliancePercentage: advancementCheck.newTierInfo?.completion_percentage
      };
      
    } catch (error) {
      console.error('Failed to update requirement status:', error);
      throw error;
    }
  }
  
  static async switchUserTierWithFullMigration(
    userId: string,
    newTier: 'basic' | 'robust',
    requestedBy: string,
    reason: string
  ): Promise<TierSwitchResult> {
    try {
      // 1. Get current state
      const currentTierInfo = await ComplianceTierService.getUserTierInfo(userId);
      const currentRequirements = await this.getUserRequirements(userId);
      
      // 2. Validate tier switch
      const validation = await this.validateTierSwitch(
        userId,
        currentTierInfo.role,
        currentTierInfo.tier,
        newTier
      );
      
      if (!validation.allowed) {
        return {
          success: false,
          message: validation.reason,
          blockedBy: validation.blockedBy
        };
      }
      
      // 3. Begin tier migration transaction
      const migrationResult = await supabase.rpc('migrate_user_tier', {
        p_user_id: userId,
        p_old_tier: currentTierInfo.tier,
        p_new_tier: newTier,
        p_requested_by: requestedBy,
        p_reason: reason
      });
      
      if (migrationResult.error) throw migrationResult.error;
      
      // 4. Reassign requirements based on new tier
      const reassignmentResult = await this.reassignTierRequirements(
        userId,
        currentTierInfo.role,
        newTier,
        currentRequirements
      );
      
      // 5. Update user profile
      await supabase
        .from('profiles')
        .update({ 
          compliance_tier: newTier,
          tier_updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      // 6. Create tier history record
      await supabase
        .from('compliance_tier_history')
        .insert({
          user_id: userId,
          old_tier: currentTierInfo.tier,
          new_tier: newTier,
          changed_by: requestedBy,
          change_reason: reason,
          requirements_affected: reassignmentResult.affected,
          metadata: {
            preserved_requirements: reassignmentResult.preserved,
            new_requirements: reassignmentResult.added,
            removed_requirements: reassignmentResult.removed
          }
        });
      
      // 7. Send notifications
      await this.sendTierChangeNotifications(userId, {
        oldTier: currentTierInfo.tier,
        newTier,
        summary: reassignmentResult.summary
      });
      
      // 8. Update all connected UIs in real-time
      await this.broadcastTierChange(userId, newTier);
      
      return {
        success: true,
        message: `Successfully switched to ${newTier} tier`,
        requirementsAffected: reassignmentResult.affected,
        summary: reassignmentResult.summary
      };
      
    } catch (error) {
      console.error('Tier switch failed:', error);
      return {
        success: false,
        message: 'Failed to switch tier. Please try again.',
        error: error.message
      };
    }
  }
  
  static async recalculateUserCompliance(userId: string): Promise<void> {
    // Get all requirements and records
    const { data: records } = await supabase
      .from('user_compliance_records')
      .select(`
        *,
        compliance_requirements!inner(
          points_value,
          category,
          is_mandatory
        )
      `)
      .eq('user_id', userId);
    
    // Calculate metrics
    const metrics = {
      total: records?.length || 0,
      completed: records?.filter(r => r.status === 'approved').length || 0,
      in_progress: records?.filter(r => r.status === 'in_progress').length || 0,
      pending: records?.filter(r => r.status === 'pending').length || 0,
      total_points: records?.reduce((sum, r) => 
        r.status === 'approved' ? sum + r.compliance_requirements.points_value : sum, 0
      ) || 0,
      mandatory_complete: records?.filter(r => 
        r.compliance_requirements.is_mandatory && r.status === 'approved'
      ).length || 0,
      mandatory_total: records?.filter(r => 
        r.compliance_requirements.is_mandatory
      ).length || 0
    };
    
    const overallPercentage = metrics.total > 0 
      ? Math.round((metrics.completed / metrics.total) * 100)
      : 0;
    
    // Update cached metrics
    await supabase
      .from('user_compliance_metrics')
      .upsert({
        user_id: userId,
        ...metrics,
        overall_percentage: overallPercentage,
        last_calculated: new Date().toISOString()
      });
  }
  
  static async checkTierAdvancement(
    userId: string, 
    currentTierInfo: TierInfo
  ): Promise<AdvancementCheck> {
    if (currentTierInfo.tier === 'robust') {
      return { eligible: false, reason: 'Already at highest tier' };
    }
    
    // Check completion percentage
    if (currentTierInfo.completion_percentage < 80) {
      return { 
        eligible: false, 
        reason: `Need ${80 - currentTierInfo.completion_percentage}% more completion`,
        blockedBy: 'completion_percentage'
      };
    }
    
    // Check mandatory requirements
    const { data: mandatoryIncomplete } = await supabase
      .from('user_compliance_records')
      .select('id')
      .eq('user_id', userId)
      .eq('compliance_requirements.is_mandatory', true)
      .neq('status', 'approved');
    
    if (mandatoryIncomplete && mandatoryIncomplete.length > 0) {
      return {
        eligible: false,
        reason: `${mandatoryIncomplete.length} mandatory requirements incomplete`,
        blockedBy: 'mandatory_requirements'
      };
    }
    
    // Check role-specific rules
    const roleRules = await this.getRoleAdvancementRules(currentTierInfo.role);
    const ruleCheck = await this.checkRoleSpecificRules(userId, roleRules);
    
    if (!ruleCheck.passed) {
      return {
        eligible: false,
        reason: ruleCheck.reason,
        blockedBy: 'role_specific_rules'
      };
    }
    
    return {
      eligible: true,
      newTierInfo: {
        ...currentTierInfo,
        can_advance_tier: true,
        advancement_available_date: new Date().toISOString()
      }
    };
  }
  
  static async broadcastComplianceUpdate(userId: string, update: any): Promise<void> {
    // Broadcast to user's dashboard
    await supabase
      .from('realtime_updates')
      .insert({
        channel: `compliance_${userId}`,
        event: 'compliance_update',
        payload: update
      });
    
    // Update connected UI components via WebSocket
    const channel = supabase.channel(`user_compliance_${userId}`);
    await channel.send({
      type: 'broadcast',
      event: 'compliance_update',
      payload: update
    });
  }
}
```

#### 10.2 Real-time Data Synchronization Service

```typescript
// File: src/services/realtime/complianceRealtimeService.ts

export class ComplianceRealtimeService {
  private static channels: Map<string, RealtimeChannel> = new Map();
  private static subscriptions: Map<string, Set<(data: any) => void>> = new Map();
  
  static initializeRealtimeConnections(userId: string): void {
    // Main compliance channel
    const complianceChannel = supabase
      .channel(`compliance_main_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_compliance_records',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        this.handleComplianceRecordChange(userId, payload);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`
      }, (payload) => {
        this.handleProfileUpdate(userId, payload);
      })
      .on('broadcast', { event: 'compliance_update' }, (payload) => {
        this.handleBroadcastUpdate(userId, payload);
      })
      .subscribe();
    
    this.channels.set(`main_${userId}`, complianceChannel);
    
    // Requirements channel
    const requirementsChannel = supabase
      .channel(`requirements_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'compliance_requirements'
      }, (payload) => {
        this.handleRequirementChange(userId, payload);
      })
      .subscribe();
    
    this.channels.set(`requirements_${userId}`, requirementsChannel);
    
    // Notifications channel
    const notificationsChannel = supabase
      .channel(`notifications_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        this.handleNewNotification(userId, payload);
      })
      .subscribe();
    
    this.channels.set(`notifications_${userId}`, notificationsChannel);
  }
  
  static subscribeToUpdates(
    userId: string,
    updateType: 'compliance' | 'tier' | 'requirements' | 'all',
    callback: (data: any) => void
  ): () => void {
    const key = `${userId}_${updateType}`;
    
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    
    this.subscriptions.get(key)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscriptions.get(key)?.delete(callback);
      if (this.subscriptions.get(key)?.size === 0) {
        this.subscriptions.delete(key);
      }
    };
  }
  
  private static handleComplianceRecordChange(userId: string, payload: any): void {
    const update = {
      type: 'compliance_record',
      action: payload.eventType,
      requirementId: payload.new?.requirement_id || payload.old?.requirement_id,
      oldStatus: payload.old?.status,
      newStatus: payload.new?.status,
      timestamp: new Date().toISOString()
    };
    
    // Notify all compliance subscribers
    this.notifySubscribers(`${userId}_compliance`, update);
    this.notifySubscribers(`${userId}_all`, update);
    
    // Update UI components
    queryClient.invalidateQueries(['compliance-records', userId]);
    queryClient.invalidateQueries(['compliance-progress', userId]);
  }
  
  private static handleProfileUpdate(userId: string, payload: any): void {
    if (payload.new?.compliance_tier !== payload.old?.compliance_tier) {
      const tierUpdate = {
        type: 'tier_change',
        oldTier: payload.old?.compliance_tier,
        newTier: payload.new?.compliance_tier,
        timestamp: new Date().toISOString()
      };
      
      // Notify tier subscribers
      this.notifySubscribers(`${userId}_tier`, tierUpdate);
      this.notifySubscribers(`${userId}_all`, tierUpdate);
      
      // Invalidate all tier-related queries
      queryClient.invalidateQueries(['compliance-tier', userId]);
      queryClient.invalidateQueries(['requirements', userId]);
    }
  }
  
  private static handleBroadcastUpdate(userId: string, payload: any): void {
    // Handle custom broadcast updates
    const update = {
      type: 'broadcast',
      ...payload.payload,
      timestamp: new Date().toISOString()
    };
    
    this.notifySubscribers(`${userId}_all`, update);
  }
  
  private static notifySubscribers(key: string, data: any): void {
    const callbacks = this.subscriptions.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in realtime callback:', error);
        }
      });
    }
  }
  
  static async sendRealtimeUpdate(
    userId: string,
    updateType: string,
    data: any
  ): Promise<void> {
    const channel = this.channels.get(`main_${userId}`);
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: updateType,
        payload: data
      });
    }
  }
  
  static cleanup(userId: string): void {
    // Unsubscribe from all channels
    this.channels.forEach((channel, key) => {
      if (key.includes(userId)) {
        supabase.removeChannel(channel);
        this.channels.delete(key);
      }
    });
    
    // Clear subscriptions
    this.subscriptions.forEach((_, key) => {
      if (key.includes(userId)) {
        this.subscriptions.delete(key);
      }
    });
  }
}
```

### Day 11: Implement Interactive Dialogs

#### 11.1 Tier Switch Dialog with Full Integration

```typescript
// File: src/components/dialogs/TierSwitchDialog.tsx

interface TierSwitchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: 'basic' | 'robust';
  targetTier?: 'basic' | 'robust';
  userId: string;
  userRole: string;
  onConfirm: (newTier: string, reason: string) => Promise<void>;
}

export function TierSwitchDialog({
  isOpen,
  onClose,
  currentTier,
  targetTier,
  userId,
  userRole,
  onConfirm
}: TierSwitchDialogProps) {
  const [step, setStep] = useState<'comparison' | 'confirmation' | 'processing'>('comparison');
  const [reason, setReason] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
