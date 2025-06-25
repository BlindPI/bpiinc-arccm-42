# Day 3 Implementation Plan - Role-Specific Dashboards and Requirement Workflows

## Overview

Day 3 focuses on implementing role-specific dashboards with tailored compliance interfaces, requirement submission workflows, and advanced analytics. This builds on the database schema deployed in Day 1 and the tier switching UI implemented in Day 2.

## Implementation Goals

1. **Complete Role-Specific Dashboards**
   - Finalize role-specific UI components for IT, IP, IC, and AP roles
   - Implement role-based requirement grouping and visualization
   - Create specialized performance metrics for each role

2. **Implement Requirement Submission Workflows**
   - Add requirement submission UI components
   - Implement validation and submission processes
   - Create review and approval workflows

3. **Enhance Real-Time Compliance Monitoring**
   - Implement real-time notifications for requirement status changes
   - Add compliance progress tracking
   - Create activity logging for compliance actions

## Detailed Implementation Plan

### 1. Role-Specific Dashboards

#### 1.1 Instructor Compliance (IC) Dashboard

The IC Dashboard provides instructors with a tailored view of their compliance requirements, teaching performance metrics, and student outcomes.

**Key Components:**
- Performance metrics visualization
- Student outcomes tracking
- Compliance requirement categorization
- Upcoming schedule management

```typescript
// Implementation of IC Dashboard main component
export function ICDashboard({ tierInfo, uiConfig, dashboardView, onViewChange }) {
  const { user } = useAuth();
  const { data: requirements } = useUIRequirements(user?.id, 'IC', tierInfo.tier);
  const { data: performanceData } = usePerformanceMetrics(user?.id);
  const { data: scheduleData } = useInstructorSchedule(user?.id);
  
  // Use the DashboardUIContext for tier-specific styling
  const { getThemeColor } = useDashboardUI();
  const accentColor = getThemeColor('accent');
  
  return (
    <div className="space-y-6">
      {/* Tier-specific compliance overview */}
      <ComplianceOverviewCard 
        requirements={requirements}
        tier={tierInfo.tier}
        completionPercentage={tierInfo.completion_percentage}
      />
      
      {/* Performance metrics section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <PerformanceRadarChart 
              data={performanceData?.metrics || {
                studentSatisfaction: 0,
                passRate: 0,
                attendance: 0,
                engagement: 0,
                improvement: 0
              }}
              maxValue={100}
              accentColor={accentColor}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Student Outcomes</CardTitle>
            <div className="flex items-center gap-2">
              <Select defaultValue="month">
                <SelectTrigger className="h-8 w-[100px]">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="quarter">Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <StudentOutcomesChart 
              outcomes={performanceData?.outcomes}
              timeRange="month"
              groupBy="week"
              showTrend={true}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Requirement sections */}
      <TabbedRequirementsView 
        requirements={requirements}
        role="IC"
        tier={tierInfo.tier}
      />
      
      {/* Upcoming schedule and insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <UpcomingSchedule
            evaluations={scheduleData?.evaluations || []}
            classes={scheduleData?.classes || []}
            renewals={scheduleData?.renewals || []}
            onItemClick={(item) => console.log('Schedule item clicked:', item)}
          />
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Instructor Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {performanceData?.insights?.map((insight, i) => (
                <InsightCard
                  key={i}
                  type={insight.type}
                  message={insight.message}
                  action={insight.action}
                  onAction={() => console.log('Insight action:', insight)}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

#### 1.2 Technology Provider (IT) Dashboard

The IT Dashboard focuses on system compliance, technical requirements, and security metrics.

```typescript
export function ITDashboard({ tierInfo, uiConfig, dashboardView }) {
  const { user } = useAuth();
  const { data: requirements } = useUIRequirements(user?.id, 'IT', tierInfo.tier);
  const { data: securityMetrics } = useSecurityCompliance(user?.id);
  
  // Group requirements by category for better organization
  const groupedRequirements = useMemo(() => {
    if (!requirements) return {};
    
    return requirements.reduce((acc, req) => {
      const category = req.category || 'General';
      if (!acc[category]) acc[category] = [];
      acc[category].push(req);
      return acc;
    }, {});
  }, [requirements]);
  
  return (
    <div className="space-y-6">
      {/* Security Compliance Overview */}
      <SecurityComplianceOverview 
        metrics={securityMetrics}
        tier={tierInfo.tier}
      />
      
      {/* System Requirements by Category */}
      {Object.entries(groupedRequirements).map(([category, reqs]) => (
        <RequirementCategoryCard
          key={category}
          title={category}
          requirements={reqs}
          tier={tierInfo.tier}
        />
      ))}
      
      {/* Technical Documentation */}
      <TechnicalDocumentationSection 
        documents={securityMetrics?.documents || []}
      />
    </div>
  );
}
```

#### 1.3 Integration Partner (IP) and Authorized Provider (AP) Dashboards

Implement similar specialized dashboards for IP and AP roles:

```typescript
// IP Dashboard with integration compliance focus
export function IPDashboard({ tierInfo, uiConfig }) {
  // Implementation focusing on integration metrics and partner requirements
  // ...
}

// AP Dashboard with provider authorization focus
export function EnhancedProviderDashboard({ tierInfo, uiConfig, config }) {
  // Implementation focusing on provider requirements and authorization status
  // ...
}
```

### 2. Requirement Submission Workflows

#### 2.1 Requirement Submission Components

Create reusable components for different requirement submission types:

```typescript
// File upload component for document requirements
function FileUploadRequirement({ requirement, onSubmit, onSave }) {
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const { mutate: submitRequirement } = useRequirementSubmission();
  
  const handleSubmit = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    
    try {
      // Upload files to storage
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const { data, error } = await supabase.storage
            .from('requirement-uploads')
            .upload(`${requirement.id}/${file.name}`, file);
            
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
      
      // Submit requirement
      submitRequirement({
        userId: auth.user.id,
        requirementId: requirement.id,
        submissionData: {
          files: uploadedFiles,
          notes,
          submittedAt: new Date().toISOString()
        }
      });
      
      onSubmit?.();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed rounded-lg p-4 text-center">
        <Input
          type="file"
          multiple
          accept={requirement.validation_rules?.file_types?.join(',')}
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          className="hidden"
          id={`file-upload-${requirement.id}`}
        />
        <label
          htmlFor={`file-upload-${requirement.id}`}
          className="cursor-pointer flex flex-col items-center"
        >
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <span className="text-sm font-medium">
            Click to upload or drag and drop
          </span>
          <span className="text-xs text-gray-500">
            {requirement.validation_rules?.file_types?.join(', ')} (Max: {formatBytes(requirement.validation_rules?.max_file_size || 5242880)})
          </span>
        </label>
      </div>
      
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center">
                <FileIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">{file.name}</span>
              </div>
              <span className="text-xs text-gray-500">{formatBytes(file.size)}</span>
            </div>
          ))}
        </div>
      )}
      
      <Textarea
        placeholder="Additional notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onSave}>
          Save Draft
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={files.length === 0 || uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Submit Requirement
        </Button>
      </div>
    </div>
  );
}

// Form-based requirement submission
function FormRequirement({ requirement, onSubmit, onSave }) {
  // Implementation for form-based requirements
  // ...
}

// External link requirement
function ExternalLinkRequirement({ requirement, onSubmit }) {
  // Implementation for external training/certification requirements
  // ...
}
```

#### 2.2 Requirement Detail Modal

Create a comprehensive requirement detail view:

```typescript
function RequirementDetailDrawer({
  requirementId,
  isOpen,
  onClose,
  onUpdate
}) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: requirement, isLoading } = useRequirementDetail(requirementId, user?.id);
  
  const [activeTab, setActiveTab] = useState('details');
  
  // Determine the submission component based on requirement type
  const renderSubmissionComponent = () => {
    if (!requirement) return null;
    
    switch (requirement.ui_component) {
      case 'file_upload':
        return (
          <FileUploadRequirement
            requirement={requirement}
            onSubmit={() => {
              onUpdate(requirementId);
              onClose();
            }}
            onSave={() => onUpdate(requirementId)}
          />
        );
        
      case 'form':
        return (
          <FormRequirement
            requirement={requirement}
            onSubmit={() => {
              onUpdate(requirementId);
              onClose();
            }}
            onSave={() => onUpdate(requirementId)}
          />
        );
        
      case 'external_link':
        return (
          <ExternalLinkRequirement
            requirement={requirement}
            onSubmit={() => {
              onUpdate(requirementId);
              onClose();
            }}
          />
        );
        
      default:
        return (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              This requirement type is not supported.
            </p>
          </div>
        );
    }
  };
  
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {isLoading ? 'Loading...' : requirement?.name}
          </DrawerTitle>
          <DrawerDescription>
            {requirement?.description}
          </DrawerDescription>
        </DrawerHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mx-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="submit">Submit</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="px-4">
            <RequirementDetails requirement={requirement} />
          </TabsContent>
          
          <TabsContent value="submit" className="px-4">
            {renderSubmissionComponent()}
          </TabsContent>
          
          <TabsContent value="history" className="px-4">
            <RequirementHistory requirementId={requirementId} userId={user?.id} />
          </TabsContent>
        </Tabs>
        
        <DrawerFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
```

#### 2.3 Review and Approval Process (Admin)

Implement requirement review components for administrators:

```typescript
function RequirementReviewQueue() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [filters, setFilters] = useState({
    requirementType: 'all',
    dateRange: 'week'
  });
  
  const { data: submissionsToReview, isLoading } = useSubmissionsToReview(
    filters,
    profile?.role
  );
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Submissions Awaiting Review</CardTitle>
          <CardDescription>
            Review and approve compliance requirement submissions
          </CardDescription>
          
          <div className="flex flex-wrap gap-2 mt-2">
            <Select
              value={filters.requirementType}
              onValueChange={(value) => 
                setFilters({ ...filters, requirementType: value })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Requirement Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="certification">Certifications</SelectItem>
                <SelectItem value="assessment">Assessments</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.dateRange}
              onValueChange={(value) => 
                setFilters({ ...filters, dateRange: value })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : submissionsToReview?.length === 0 ? (
            <div className="text-center py-8">
              <InboxIcon className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">
                No submissions waiting for review
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissionsToReview?.map((submission) => (
                <SubmissionReviewCard
                  key={submission.id}
                  submission={submission}
                  onReview={() => {/* Open review dialog */}}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SubmissionReviewCard({ submission, onReview }) {
  return (
    <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{submission.requirement_name}</h3>
          <p className="text-sm text-muted-foreground">
            Submitted by {submission.user_name} ({submission.user_role}) on{' '}
            {format(new Date(submission.submitted_at), 'PPP')}
          </p>
        </div>
        <Badge variant="outline">{submission.requirement_type}</Badge>
      </div>
      
      <div className="mt-2 flex flex-wrap gap-2">
        {submission.files?.map((file, i) => (
          <a
            key={i}
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs p-1 bg-gray-100 rounded hover:bg-gray-200"
          >
            <FileIcon className="h-3 w-3" />
            {file.name}
          </a>
        ))}
      </div>
      
      {submission.notes && (
        <p className="mt-2 text-sm bg-gray-50 p-2 rounded">
          {submission.notes}
        </p>
      )}
      
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => onReview()}>
          Review
        </Button>
      </div>
    </div>
  );
}
```

### 3. Enhanced Real-Time Compliance Monitoring

#### 3.1 Real-Time Notification System

```typescript
function useComplianceNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!user?.id) return;
    
    // Subscribe to status changes
    const statusChannel = supabase
      .channel(`status-updates-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_compliance_records',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const { old, new: updated } = payload;
        
        // Only show notification if status changed
        if (old.status !== updated.status) {
          // Fetch requirement details
          const fetchRequirementDetails = async () => {
            const { data } = await supabase
              .from('compliance_requirements')
              .select('name')
              .eq('id', updated.requirement_id)
              .single();
              
            if (data) {
              // Show toast notification
              switch (updated.status) {
                case 'approved':
                  toast.success(`Requirement "${data.name}" has been approved!`);
                  break;
                case 'rejected':
                  toast.error(`Requirement "${data.name}" needs revision.`);
                  break;
                case 'submitted':
                  toast.info(`Requirement "${data.name}" submitted for review.`);
                  break;
              }
            }
          };
          
          fetchRequirementDetails();
          
          // Invalidate queries
          queryClient.invalidateQueries(['ui-requirements', user.id]);
          queryClient.invalidateQueries(['compliance-progress', user.id]);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(statusChannel);
    };
  }, [user?.id, queryClient]);
}
```

#### 3.2 Compliance Progress Tracking

```typescript
function useComplianceProgress(userId: string) {
  return useQuery({
    queryKey: ['compliance-progress', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_compliance_records')
        .select(`
          status,
          compliance_requirements!inner(
            is_mandatory,
            points_value,
            requirement_type
          )
        `)
        .eq('user_id', userId);
        
      if (error) throw error;
      
      // Calculate progress metrics
      const total = data.length;
      const completed = data.filter(r => r.status === 'approved').length;
      const inProgress = data.filter(r => ['in_progress', 'submitted'].includes(r.status)).length;
      const pending = data.filter(r => r.status === 'pending').length;
      
      // Calculate points
      const totalPoints = data.reduce((sum, r) => sum + r.compliance_requirements.points_value, 0);
      const earnedPoints = data
        .filter(r => r.status === 'approved')
        .reduce((sum, r) => sum + r.compliance_requirements.points_value, 0);
      
      // Calculate by type
      const byType = data.reduce((acc, r) => {
        const type = r.compliance_requirements.requirement_type;
        if (!acc[type]) {
          acc[type] = { total: 0, completed: 0 };
        }
        acc[type].total += 1;
        if (r.status === 'approved') {
          acc[type].completed += 1;
        }
        return acc;
      }, {});
      
      return {
        completion: {
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
          completed,
          inProgress,
          pending,
          total
        },
        points: {
          earned: earnedPoints,
          total: totalPoints,
          percentage: totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
        },
        byType
      };
    },
    enabled: !!userId
  });
}
```

#### 3.3 Activity Logging for Compliance Actions

```typescript
// Service method for logging compliance activities
static async logComplianceActivity(
  userId: string,
  action: string,
  metadata: any
): Promise<void> {
  try {
    await supabase
      .from('compliance_activity_log')
      .insert({
        user_id: userId,
        action,
        metadata,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

// Hook for fetching user's compliance activity
function useComplianceActivity(userId: string, limit = 10) {
  return useQuery({
    queryKey: ['compliance-activity', userId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_activity_log')
        .select(`
          id,
          action,
          metadata,
          created_at,
          requirement_id,
          compliance_requirements(name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
        
      if (error) throw error;
      
      return data.map(activity => ({
        id: activity.id,
        action: activity.action,
        requirementName: activity.compliance_requirements?.name,
        timestamp: activity.created_at,
        metadata: activity.metadata
      }));
    },
    enabled: !!userId
  });
}
```

## Integration Points

To complete Day 3 implementation, the following integration points must be addressed:

1. **Dashboard Integration**
   - Connect role-specific dashboards to the requirement submission system
   - Integrate real-time notification system with all dashboards
   - Ensure tier-specific UI elements are properly rendered

2. **Service Layer Integration**
   - Connect requirement submission components to the ComplianceRequirementsService
   - Ensure proper handling of file uploads and storage
   - Implement validation logic for different requirement types

3. **Real-time Updates Integration**
   - Connect all components to the real-time hooks
   - Ensure UI updates when requirement statuses change
   - Implement activity logging throughout the system

## Testing Plan

1. **Role-Specific Dashboard Tests**
   - Test dashboard rendering for each role and tier
   - Verify metrics and visualizations display correctly
   - Test responsive layouts on different screen sizes

2. **Requirement Submission Tests**
   - Test file upload requirements with valid and invalid files
   - Test form submissions with valid and invalid data
   - Test external link requirements with completion tracking

3. **Real-time Update Tests**
   - Test notifications when requirement statuses change
   - Verify UI updates in real-time when data changes
   - Test activity logging for all compliance actions

## Implementation Sequence

1. Start with implementing the core requirement submission components
2. Complete the role-specific dashboards, starting with IC Dashboard
3. Implement real-time notification system
4. Add requirement review and approval components
5. Implement compliance progress tracking
6. Add activity logging throughout the system
7. Integrate all components and test end-to-end workflows

## Expected Outcomes

After Day 3 implementation, users will be able to:

- View role-specific dashboards tailored to their compliance needs
- Submit requirements with proper validation and file uploads
- Receive real-time notifications for requirement status changes
- Track compliance progress with detailed metrics
- Review submission history and activity logs

Administrators will be able to:
- Review and approve submitted requirements
- Track compliance across the organization
- Generate reports on compliance status

The system will provide a comprehensive compliance management experience with role-specific interfaces, real-time updates, and detailed analytics to guide users through the compliance process.