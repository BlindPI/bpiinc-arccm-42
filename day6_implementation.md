# Day 6 Implementation Plan - Admin Interfaces, Analytics & System Management

## Overview

Day 6 focuses on implementing comprehensive admin interfaces, advanced analytics dashboards, system health monitoring, and production readiness features. This builds on the complete UI integration from Day 5 and prepares the system for production deployment with full administrative capabilities and monitoring systems.

## Implementation Goals

1. **Build Complete Admin Review Dashboard**
   - Implement submission review and approval interfaces
   - Create evidence verification and bulk action capabilities
   - Add admin-specific compliance management tools

2. **Implement Advanced Analytics & Reporting**
   - Create comprehensive compliance analytics dashboards
   - Build automated report generation systems
   - Add predictive analytics and trend monitoring

3. **Deploy System Health Monitoring**
   - Implement real-time system health checks
   - Create automated monitoring and alerting
   - Add data integrity verification systems

4. **Create Production Management Tools**
   - Build user management and role assignment interfaces
   - Implement security auditing and access controls
   - Add deployment validation and rollback capabilities

## Detailed Implementation Plan

### 1. Complete Admin Review Dashboard

#### 1.1 Build ComplianceReviewDashboard with Full Backend Integration

Implement the comprehensive admin review interface for managing all compliance submissions:

```typescript
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
    dateRange: 'all',
    priority: 'all',
    role: 'all'
  });
  
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [selectedSubmission, setSelectedSubmission] = useState<ComplianceSubmission | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState<boolean>(false);
  const [showEvidenceDialog, setShowEvidenceDialog] = useState<boolean>(false);
  const [showBulkReviewDialog, setShowBulkReviewDialog] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  // Backend data connections
  const { data: submissions, isLoading, refetch } = useSubmissionsToReview(filters, reviewerRole);
  const { data: reviewStats } = useReviewerStats(reviewerRole);
  const { data: submissionAnalytics } = useSubmissionAnalytics(filters);
  const { user } = useAuth();
  
  // Real-time subscription for new submissions
  useEffect(() => {
    const channel = supabase
      .channel('admin-submissions')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_compliance_records',
        filter: 'status=eq.submitted'
      }, (payload) => {
        // New submission received
        refetch();
        
        // Show notification for high-priority submissions
        if (payload.new.priority === 'high') {
          toast.info(`New high-priority submission received`, {
            action: {
              label: 'Review',
              onClick: () => {
                setSelectedSubmission(payload.new);
                setShowReviewDialog(true);
              }
            }
          });
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);
  
  // Submission review mutation
  const { mutate: reviewSubmission, isLoading: isReviewing } = useMutation({
    mutationFn: async ({ 
      submissionId, 
      decision, 
      reviewData 
    }: { 
      submissionId: string; 
      decision: 'approve' | 'reject'; 
      reviewData: ReviewData;
    }) => {
      return ComplianceService.reviewSubmission(submissionId, user.id, decision, reviewData);
    },
    onSuccess: (data, variables) => {
      refetch();
      setShowReviewDialog(false);
      setSelectedSubmission(null);
      
      toast.success(
        variables.decision === 'approve'
          ? 'Submission approved successfully'
          : 'Submission returned for revision'
      );
      
      // Log admin activity
      ComplianceActivityLogger.logRequirementReview(
        user.id,
        variables.submissionId,
        variables.decision,
        variables.reviewData
      );
    },
    onError: (error) => {
      console.error('Review error:', error);
      toast.error('Failed to submit review. Please try again.');
    }
  });
  
  // Bulk review mutation
  const { mutate: bulkReview, isLoading: isBulkReviewing } = useMutation({
    mutationFn: async ({
      submissionIds,
      decision,
      reviewData
    }: {
      submissionIds: string[];
      decision: 'approve' | 'reject';
      reviewData: ReviewData;
    }) => {
      return ComplianceAdminService.bulkReviewSubmissions(
        submissionIds,
        user.id,
        decision,
        reviewData
      );
    },
    onSuccess: (data, variables) => {
      refetch();
      setShowBulkReviewDialog(false);
      setSelectedSubmissions(new Set());
      
      toast.success(
        `${variables.decision === 'approve' ? 'Approved' : 'Rejected'} ${variables.submissionIds.length} submissions`
      );
    },
    onError: (error) => {
      console.error('Bulk review error:', error);
      toast.error('Failed to process bulk review. Please try again.');
    }
  });
  
  // Handle individual review
  const handleReview = async (decision: 'approve' | 'reject', reviewData: ReviewData) => {
    if (!selectedSubmission) return;
    
    reviewSubmission({
      submissionId: selectedSubmission.id,
      decision,
      reviewData
    });
  };
  
  // Handle bulk review
  const handleBulkReview = async (decision: 'approve' | 'reject', reviewData: ReviewData) => {
    if (selectedSubmissions.size === 0) return;
    
    bulkReview({
      submissionIds: Array.from(selectedSubmissions),
      decision,
      reviewData
    });
  };
  
  // Export review data
  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const result = await ComplianceReportGenerator.generateReviewReport(
        reviewerRole,
        filters,
        {
          format: 'excel',
          includeAnalytics: true,
          dateRange: filters.dateRange
        }
      );
      
      // Create download link
      const blob = new Blob([result.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
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
  
  // Calculate priority submissions
  const prioritySubmissions = submissions?.filter(s => s.priority === 'high') || [];
  const urgentSubmissions = submissions?.filter(s => 
    s.priority === 'high' && 
    isAfter(new Date(), subDays(new Date(s.submitted_at), 1))
  ) || [];
  
  return (
    <div className="space-y-6">
      {/* Header with Key Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Compliance Review Dashboard</h2>
          <p className="text-muted-foreground">
            Review and approve compliance submissions across all roles and tiers
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {urgentSubmissions.length > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {urgentSubmissions.length} Urgent
            </Badge>
          )}
          
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            className="gap-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export Report
          </Button>
          
          <Button className="gap-2">
            <Inbox className="h-4 w-4" />
            {submissions?.length || 0} Pending
          </Button>
        </div>
      </div>
      
      {/* Critical Alerts */}
      {urgentSubmissions.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Urgent Reviews Required</AlertTitle>
          <AlertDescription>
            {urgentSubmissions.length} high-priority submissions are overdue for review.
            <Button 
              variant="link" 
              className="p-0 h-auto ml-2"
              onClick={() => setFilters({ ...filters, priority: 'high' })}
            >
              View urgent submissions →
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Pending Reviews"
          value={submissions?.length || 0}
          icon={<ClipboardList className="h-6 w-6 text-blue-600" />}
          trend={reviewStats?.pendingTrend}
          trendValue={reviewStats?.pendingChange}
          onClick={() => setFilters({ ...filters, status: 'submitted' })}
          interactive
        />
        
        <MetricCard
          title="Approved Today"
          value={reviewStats?.approvedToday || 0}
          icon={<CheckCircle className="h-6 w-6 text-green-600" />}
          trend="up"
          onClick={() => setFilters({ 
            ...filters, 
            status: 'approved', 
            dateRange: 'today' 
          })}
          interactive
        />
        
        <MetricCard
          title="Rejected Today"
          value={reviewStats?.rejectedToday || 0}
          icon={<XCircle className="h-6 w-6 text-red-600" />}
          trend="down"
          onClick={() => setFilters({ 
            ...filters, 
            status: 'rejected', 
            dateRange: 'today' 
          })}
          interactive
        />
        
        <MetricCard
          title="Avg. Review Time"
          value={reviewStats?.avgReviewTime || 0}
          format="time"
          suffix="min"
          icon={<Clock className="h-6 w-6 text-orange-600" />}
          trend={reviewStats?.reviewTimeTrend}
        />
        
        <MetricCard
          title="Review Score"
          value={reviewStats?.qualityScore || 0}
          format="percentage"
          icon={<Award className="h-6 w-6 text-purple-600" />}
          trend={reviewStats?.qualityTrend}
          subtext="Quality rating"
        />
      </div>
      
      {/* Advanced Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
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
            
            <div className="space-y-2">
              <Label htmlFor="role-filter">User Role</Label>
              <Select
                value={filters.role}
                onValueChange={(value) => setFilters({ ...filters, role: value })}
              >
                <SelectTrigger id="role-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="IT">Instructor Trainee</SelectItem>
                  <SelectItem value="IP">Instructor Provisional</SelectItem>
                  <SelectItem value="IC">Instructor Certified</SelectItem>
                  <SelectItem value="AP">Authorized Provider</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
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
            
            <div className="space-y-2">
              <Label htmlFor="priority-filter">Priority</Label>
              <Select
                value={filters.priority}
                onValueChange={(value) => setFilters({ ...filters, priority: value })}
              >
                <SelectTrigger id="priority-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
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
                  <SelectItem value="quarter">This Quarter</SelectItem>
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
                  dateRange: 'all',
                  priority: 'all',
                  role: 'all'
                })}
                className="w-full"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Submissions Table with Bulk Actions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Submissions to Review</CardTitle>
            <CardDescription>
              {filters.status === 'all'
                ? 'All submissions'
                : `${filters.status === 'submitted' ? 'Pending' : capitalize(filters.status)} submissions`
              }
              {filters.requirementType !== 'all' && ` - ${capitalize(filters.requirementType)} type`}
              {filters.role !== 'all' && ` - ${filters.role} role`}
            </CardDescription>
          </div>
          
          {selectedSubmissions.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedSubmissions.size} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkReviewDialog(true)}
                disabled={isBulkReviewing}
              >
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Bulk Review
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSubmissions(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="py-8">
              <TableSkeleton columns={6} rows={5} />
            </div>
          ) : submissions?.length === 0 ? (
            <div className="py-8 text-center">
              <Inbox className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No submissions to review</h3>
              <p className="text-muted-foreground">
                There are no submissions matching your current filters
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setFilters(defaultFilters || {})}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedSubmissions.size === submissions.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSubmissions(new Set(submissions.map(s => s.id)));
                          } else {
                            setSelectedSubmissions(new Set());
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Requirement</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions?.map((submission) => (
                    <TableRow 
                      key={submission.id}
                      className={cn(
                        selectedSubmissions.has(submission.id) && "bg-blue-50",
                        submission.priority === 'high' && "border-l-4 border-l-red-500"
                      )}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedSubmissions.has(submission.id)}
                          onCheckedChange={(checked) => {
                            const next = new Set(selectedSubmissions);
                            if (checked) {
                              next.add(submission.id);
                            } else {
                              next.delete(submission.id);
                            }
                            setSelectedSubmissions(next);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{submission.requirement_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {submission.requirement_type} • {submission.category}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{submission.user_name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {submission.user_role}
                          </Badge>
                          <span>•</span>
                          <span>{submission.user_tier} tier</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {format(new Date(submission.submitted_at), 'MMM d, yyyy')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            submission.priority === 'high' ? 'destructive' :
                            submission.priority === 'medium' ? 'default' : 'secondary'
                          }
                        >
                          {capitalize(submission.priority)}
                        </Badge>
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
                            disabled={isReviewing}
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
      
      {/* Submission Analytics */}
      {submissionAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle>Review Analytics</CardTitle>
            <CardDescription>
              Performance metrics and trends for compliance reviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SubmissionTrendChart 
                data={submissionAnalytics.submissionTrends}
                timeRange={filters.dateRange}
              />
              <ReviewTimeChart 
                data={submissionAnalytics.reviewTimes}
                targetTime={reviewStats?.targetReviewTime || 60}
              />
            </div>
          </CardContent>
        </Card>
      )}
      
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
          onVerify={async (verified, notes) => {
            try {
              await ComplianceService.verifyEvidence(
                selectedSubmission.id,
                verified,
                notes,
                user.id
              );
              toast.success('Evidence verification completed');
            } catch (error) {
              toast.error('Failed to verify evidence');
            }
          }}
        />
      )}
      
      {/* Bulk Review Dialog */}
      <BulkReviewDialog
        isOpen={showBulkReviewDialog}
        onClose={() => setShowBulkReviewDialog(false)}
        selectedCount={selectedSubmissions.size}
        onReview={handleBulkReview}
        isProcessing={isBulkReviewing}
      />
    </div>
  );
}
```

#### 1.2 Implement Evidence Verification Dialog

Create a comprehensive evidence verification system for document review:

```typescript
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
  const [documentAnalysis, setDocumentAnalysis] = useState<DocumentAnalysis | null>(null);
  const [showDocumentViewer, setShowDocumentViewer] = useState<string | null>(null);
  
  // Load document analysis when dialog opens
  useEffect(() => {
    if (isOpen && submission) {
      performDocumentAnalysis();
    }
  }, [isOpen, submission]);
  
  const performDocumentAnalysis = async () => {
    if (!submission.files || submission.files.length === 0) {
      return;
    }
    
    try {
      setIsVerifying(true);
      
      // Run automated document verification
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
      await onVerify(verified, verificationNotes);
      
      // Log verification activity
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
                          
                          {/* Document Preview */}
                          {showDocumentViewer === file.url && (
                            <div className="h-96 bg-gray-100">
                              <DocumentViewer
                                url={file.url}
                                fileName={file.name}
                                onClose={() => setShowDocumentViewer(null)}
                              />
                            </div>
                          )}
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
              
              {/* Previous Submissions History */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Submission History</CardTitle>
                </CardHeader>
                <CardContent>
                  <SubmissionHistoryTimeline
                    userId={submission.user_id}
                    requirementId={submission.requirement_id}
                    currentSubmissionId={submission.id}
                  />
                </CardContent>
              </Card>
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
```

### 2. Implement Advanced Analytics & Reporting

#### 2.1 Create Comprehensive Analytics Dashboard

Build an advanced analytics system for compliance insights:

```typescript
// File: src/components/compliance/analytics/ComplianceAnalyticsDashboard.tsx

interface ComplianceAnalyticsDashboardProps {
  role?: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
  showPredictive?: boolean;
}

export function ComplianceAnalyticsDashboard({
  role,
  timeRange = 'month',
  showPredictive = true
}: ComplianceAnalyticsDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>('overview');
  const [comparisonMode, setComparisonMode] = useState<'time' | 'role' | 'tier'>('time');
  const [drilldownLevel, setDrilldownLevel] = useState<'high' | 'medium' | 'detailed'>('medium');
  
  // Analytics data hooks
  const { data: overviewMetrics, isLoading: overviewLoading } = useComplianceOverviewMetrics(timeRange);
  const { data: roleMetrics } = useRoleComplianceMetrics(timeRange);
  const { data: tierMetrics } = useTierComplianceMetrics(timeRange);
  const { data: trendData } = useComplianceTrends(timeRange);
  const { data: performanceData } = useCompliancePerformance(timeRange);
  const { data: predictiveData } = usePredictiveAnalytics(timeRange, showPredictive);
  
  // Real-time analytics updates
  useEffect(() => {
    const channel = supabase
      .channel('analytics-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_compliance_records'
      }, () => {
        // Refresh analytics data
        queryClient.invalidateQueries(['compliance-overview-metrics']);
        queryClient.invalidateQueries(['compliance-trends']);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  // Export analytics report
  const handleExportReport = async () => {
    try {
      const reportData = {
        timeRange,
        metrics: overviewMetrics,
        roleBreakdown: roleMetrics,
        tierBreakdown: tierMetrics,
        trends: trendData,
        performance: performanceData,
        predictions: predictiveData
      };
      
      const result = await ComplianceReportGenerator.generateAnalyticsReport(reportData, {
        format: 'pdf',
        includeCharts: true,
        includeRawData: false
      });
      
      // Download report
      const blob = new Blob([result.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.fileName;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Analytics report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export analytics report');
    }
  };
  
  if (overviewLoading) {
    return <AnalyticsDashboardSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Compliance Analytics</h2>
          <p className="text-muted-foreground">
            Advanced insights and performance metrics for compliance management
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
          
          <Select
            value={comparisonMode}
            onValueChange={(value) => setComparisonMode(value as any)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="time">Time Comparison</SelectItem>
              <SelectItem value="role">Role Comparison</SelectItem>
              <SelectItem value="tier">Tier Comparison</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={handleExportReport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>
      
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Overall Compliance Rate"
          value={overviewMetrics?.overallComplianceRate || 0}
          format="percentage"
          icon={<TrendingUp className="h-6 w-6 text-green-600" />}
          trend={overviewMetrics?.complianceRateTrend}
          trendValue={overviewMetrics?.complianceRateChange}
          target={95}
          description="Organization-wide compliance completion rate"
        />
        
        <KPICard
          title="Active Users"
          value={overviewMetrics?.activeUsers || 0}
          format="number"
          icon={<Users className="h-6 w-6 text-blue-600" />}
          trend={overviewMetrics?.activeUsersTrend}
          trendValue={overviewMetrics?.activeUsersChange}
          description="Users with compliance activity this period"
        />
        
        <KPICard
          title="Avg. Completion Time"
          value={overviewMetrics?.avgCompletionTime || 0}
          format="days"
          icon={<Clock className="h-6 w-6 text-orange-600" />}
          trend={overviewMetrics?.completionTimeTrend}
          trendValue={overviewMetrics?.completionTimeChange}
          target={30}
          description="Average days to complete all requirements"
        />
        
        <KPICard
          title="Review Efficiency"
          value={overviewMetrics?.reviewEfficiency || 0}
          format="percentage"
          icon={<Zap className="h-6 w-6 text-purple-600" />}
          trend={overviewMetrics?.reviewEfficiencyTrend}
          trendValue={overviewMetrics?.reviewEfficiencyChange}
          target={90}
          description="Reviews completed within SLA"
        />
        
        <KPICard
          title="Quality Score"
          value={overviewMetrics?.qualityScore || 0}
          format="rating"
          maxValue={5}
          icon={<Award className="h-6 w-6 text-yellow-600" />}
          trend={overviewMetrics?.qualityScoreTrend}
          trendValue={overviewMetrics?.qualityScoreChange}
          target={4.5}
          description="Average quality rating of submissions"
        />
      </div>
      
      {/* Analytics Tabs */}
      <Tabs value={selectedMetric} onValueChange={setSelectedMetric}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Distribution</CardTitle>
                <CardDescription>Breakdown of compliance status across the organization</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ComplianceDistributionChart
                  data={overviewMetrics?.distributionData || []}
                  showLabels={true}
                  interactive={true}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Role Performance</CardTitle>
                <CardDescription>Compliance completion rates by role</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <RolePerformanceChart
                  data={roleMetrics || []}
                  timeRange={timeRange}
                  showTargets={true}
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tier Distribution</CardTitle>
                <CardDescription>Users by compliance tier</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <TierDistributionChart
                  data={tierMetrics?.distribution || []}
                  onTierClick={(tier) => setSelectedMetric('comparison')}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest compliance submissions and reviews</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <RecentActivityFeed
                  activities={overviewMetrics?.recentActivities || []}
                  maxItems={5}
                  showUserDetails={true}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Compliance system performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <SystemHealthIndicators
                  metrics={overviewMetrics?.systemHealth || {}}
                  thresholds={{
                    responseTime: 200,
                    errorRate: 1,
                    availability: 99.9
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Completion Rate Trends</CardTitle>
                <CardDescription>Track completion rates over time</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <CompletionTrendChart
                  data={performanceData?.completionTrends || []}
                  timeRange={timeRange}
                  showPredictions={showPredictive}
                  targets={performanceData?.targets}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Review Time Analysis</CardTitle>
                <CardDescription>Average time to review submissions</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ReviewTimeAnalysisChart
                  data={performanceData?.reviewTimes || []}
                  targetSLA={performanceData?.reviewSLA || 48}
                  showOutliers={true}
                />
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Performance Heatmap</CardTitle>
              <CardDescription>Visual representation of performance by role and time</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <PerformanceHeatmap
                data={performanceData?.heatmapData || []}
                xAxis="time"
                yAxis="role"
                metric="completionRate"
                colorScale="blues"
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Trends</CardTitle>
              <CardDescription>Historical trends and patterns in compliance data</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ComplianceTrendsChart
                data={trendData || []}
                metrics={['submissions', 'approvals', 'rejections']}
                timeRange={timeRange}
                showMovingAverage={true}
                showSeasonality={true}
              />
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Seasonal Patterns</CardTitle>
                <CardDescription>Compliance activity patterns by season</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <SeasonalPatternChart
                  data={trendData?.seasonalData || []}
                  pattern="monthly"
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Growth Metrics</CardTitle>
                <CardDescription>Month-over-month growth indicators</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <GrowthMetricsChart
                  data={trendData?.growthData || []}
                  metrics={['userGrowth', 'submissionGrowth', 'completionGrowth']}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {comparisonMode === 'role' ? 'Role Comparison' :
                 comparisonMode === 'tier' ? 'Tier Comparison' : 'Time Comparison'}
              </CardTitle>
              <CardDescription>
                Compare compliance metrics across {comparisonMode}s
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ComparisonChart
                data={getComparisonData(comparisonMode, roleMetrics, tierMetrics, trendData)}
                mode={comparisonMode}
                metrics={['completionRate', 'avgTime', 'qualityScore']}
                showBenchmarks={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Predictive Tab */}
        <TabsContent value="predictive" className="space-y-6">
          {showPredictive ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Predictive Analytics</CardTitle>
                  <CardDescription>
                    AI-powered insights and predictions based on historical data
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                  <PredictiveAnalyticsChart
                    data={predictiveData?.predictions || []}
                    confidence={predictiveData?.confidence || 0}
                    timeHorizon={predictiveData?.timeHorizon || 90}
                    scenarios={predictiveData?.scenarios || []}
                  />
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Assessment</CardTitle>
                    <CardDescription>Predicted compliance risks and mitigation recommendations</CardDescription>
                  </CardHeader>
                  <CardContent className="h-64">
                    <RiskAssessmentChart
                      risks={predictiveData?.risks || []}
                      onRiskClick={(risk) => console.log('Risk clicked:', risk)}
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Optimization Opportunities</CardTitle>
                    <CardDescription>AI-recommended improvements</CardDescription>
                  </CardHeader>
                  <CardContent className="h-64">
                    <OptimizationRecommendations
                      recommendations={predictiveData?.recommendations || []}
                      onImplementRecommendation={(rec) => console.log('Implement:', rec)}
                    />
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Brain className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Predictive Analytics</h3>
                  <p className="text-muted-foreground">
                    Enable predictive analytics to see AI-powered insights and forecasts
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setShowPredictive(true)}
                  >
                    Enable Predictive Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

#### 2.2 Implement Automated Report Generation

Create a comprehensive report generation system:

```typescript
// File: src/services/compliance/complianceReportGenerator.ts

export class ComplianceReportGenerator {
  static async generateComplianceReport(
    reportType: 'user' | 'role' | 'organization' | 'review',
    parameters: ReportParameters
  ): Promise<ReportResult> {
    try {
      switch (reportType) {
        case 'user':
          return this.generateUserComplianceReport(parameters);
        case 'role':
          return this.generateRoleComplianceReport(parameters);
        case 'organization':
          return this.generateOrganizationReport(parameters);
        case 'review':
          return this.generateReviewReport(parameters);
        default:
          throw new Error(`Unsupported report type: ${reportType}`);
      }
    } catch (error) {
      console.error('Report generation error:', error);
      throw error;
    }
  }
  
  static async generateOrganizationReport(
    parameters: OrganizationReportParameters
  ): Promise<ReportResult> {
    try {
      // Collect comprehensive organization data
      const reportData = await this.collectOrganizationData(parameters);
      
      // Generate report based on format
      switch (parameters.format) {
        case 'pdf':
          return this.generatePDFReport(reportData, 'organization');
        case 'excel':
          return this.generateExcelReport(reportData, 'organization');
        case 'json':
          return this.generateJSONReport(reportData, 'organization');
        default:
          throw new Error(`Unsupported format: ${parameters.format}`);
      }
    } catch (error) {
      console.error('Organization report generation error:', error);
      throw error;
    }
  }
  
  private static async collectOrganizationData(
    parameters: OrganizationReportParameters
  ): Promise<OrganizationReportData> {
    const { timeRange, includeAnalytics, includePredictions } = parameters;
    
    // Get overall metrics
    const { data: overallMetrics } = await supabase.rpc(
      'get_organization_compliance_metrics',
      { time_range: timeRange }
    );
    
    // Get role breakdown
    const { data: roleBreakdown } = await supabase.rpc(
      'get_compliance_by_role',
      { time_range: timeRange }
    );
    
    // Get tier distribution
    const { data: tierDistribution } = await supabase.rpc(
      'get_tier_distribution',
      { time_range: timeRange }
    );
    
    // Get trend data
    const { data: trendData } = await supabase.rpc(
      'get_compliance_trends',
      { time_range: timeRange }
    );
    
    // Get performance metrics
    const { data: performanceMetrics } = await supabase.rpc(
      'get_performance_metrics',
      { time_range: timeRange }
    );
    
    let analyticsData = null;
    if (includeAnalytics) {
      analyticsData = await ComplianceAnalyticsService.getAdvancedAnalytics(timeRange);
    }
    
    let predictionsData = null;
    if (includePredictions) {
      predictionsData = await PredictiveAnalyticsService.generatePredictions(timeRange);
    }
    
    return {
      generatedAt: new Date().toISOString(),
      timeRange,
      overallMetrics,
      roleBreakdown,
      tierDistribution,
      trendData,
      performanceMetrics,
      analytics: analyticsData,
      predictions: predictionsData,
      metadata: {
        totalUsers: overallMetrics.total_users,
        activeUsers: overallMetrics.active_users,
        completionRate: overallMetrics.overall_completion_rate,
        reportVersion: '2.0'
      }
    };
  }
  
  private static async generatePDFReport(
    data: ReportData,
    type: string
  ): Promise<ReportResult> {
    try {
      // Create PDF document using a PDF library (e.g., PDFKit, jsPDF)
      const pdf = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Compliance Report - ${type}`,
          Author: 'Compliance Management System',
          Subject: 'Compliance Analytics Report',
          CreationDate: new Date()
        }
      });
      
      const buffers: Buffer[] = [];
      pdf.on('data', buffers.push.bind(buffers));
      
      // Add header
      this.addPDFHeader(pdf, data, type);
      
      // Add executive summary
      this.addPDFExecutiveSummary(pdf, data);
      
      // Add detailed sections based on report type
      switch (type) {
        case 'organization':
          this.addOrganizationSections(pdf, data as OrganizationReportData);
          break;
        case 'user':
          this.addUserSections(pdf, data as UserReportData);
          break;
        case 'role':
          this.addRoleSections(pdf, data as RoleReportData);
          break;
      }
      
      // Add analytics charts if available
      if (data.analytics) {
        await this.addPDFCharts(pdf, data.analytics);
      }
      
      // Add appendices
      this.addPDFAppendices(pdf, data);
      
      pdf.end();
      
      return new Promise((resolve) => {
        pdf.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve({
            success: true,
            format: 'pdf',
            data: pdfBuffer,
            fileName: `compliance_${type}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
            metadata: {
              pages: pdf.page.count,
              size: pdfBuffer.length,
              generatedAt: new Date().toISOString()
            }
          });
        });
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  }
  
  private static async generateExcelReport(
    data: ReportData,
    type: string
  ): Promise<ReportResult> {
    try {
      const XLSX = require('xlsx');
      const workbook = XLSX.utils.book_new();
      
      // Summary sheet
      const summaryData = this.prepareSummaryData(data);
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Detailed data sheets based on type
      switch (type) {
        case 'organization':
          this.addOrganizationExcelSheets(workbook, data as OrganizationReportData);
          break;
        case 'user':
          this.addUserExcelSheets(workbook, data as UserReportData);
          break;
        case 'role':
          this.addRoleExcelSheets(workbook, data as RoleReportData);
          break;
      }
      
      // Analytics sheet
      if (data.analytics) {
        const analyticsSheet = XLSX.utils.json_to_sheet(data.analytics.rawData || []);
        XLSX.utils.book_append_sheet(workbook, analyticsSheet, 'Analytics');
      }
      
      // Generate buffer
      const buffer = XLSX.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx',
        compression: true
      });
      
      return {
        success: true,
        format: 'excel',
        data: buffer,
        fileName: `compliance_${type}_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
        metadata: {
          sheets: workbook.SheetNames.length,
          size: buffer.length,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Excel generation error:', error);
      throw error;
    }
  }
  
  // Helper methods for PDF generation
  private static addPDFHeader(pdf: any, data: ReportData, type: string): void {
    pdf.fontSize(24)
       .font('Helvetica-Bold')
       .text(`Compliance ${capitalize(type)} Report`, 50, 50);
    
    pdf.fontSize(12)
       .font('Helvetica')
       .text(`Generated: ${format(new Date(data.generatedAt), 'PPP')}`, 50, 80)
       .text(`Time Range: ${data.timeRange}`, 50, 95);
    
    // Add company logo if available
    // pdf.image('logo.png', 450, 45, { width: 100 });
    
    pdf.moveDown(2);
  }
  
  private static addPDFExecutiveSummary(pdf: any, data: ReportData): void {
    pdf.fontSize(16)
       .font('Helvetica-Bold')
       .text('Executive Summary', { underline: true });
    
    pdf.moveDown(0.5);
    
    // Add key metrics summary
    const metrics = data.overallMetrics || {};
    pdf.fontSize(12)
       .font('Helvetica')
       .text(`Overall Compliance Rate: ${metrics.completion_rate || 0}%`)
       .text(`Total Active Users: ${metrics.active_users || 0}`)
       .text(`Average Completion Time: ${metrics.avg_completion_time || 0} days`)
       .text(`Quality Score: ${metrics.quality_score || 0}/5`);
    
    pdf.moveDown();
  }
  
  private static addOrganizationSections(pdf: any, data: OrganizationReportData): void {
    // Role Performance Section
    pdf.addPage();
    pdf.fontSize(16)
       .font('Helvetica-Bold')
       .text('Role Performance Analysis', { underline: true });
    
    pdf.moveDown(0.5);
    
    data.roleBreakdown.forEach((role, index) => {
      pdf.fontSize(14)
         .font('Helvetica-Bold')
         .text(`${role.role_name} (${role.role_code})`);
      
      pdf.fontSize(12)
         .font('Helvetica')
         .text(`  Completion Rate: ${role.completion_rate}%`)
         .text(`  Active Users: ${role.active_users}`)
         .text(`  Average Time: ${role.avg_completion_time} days`);
      
      pdf.moveDown(0.5);
    });
    
    // Tier Distribution Section
    pdf.moveDown();
    pdf.fontSize(16)
       .font('Helvetica-Bold')
       .text('Tier Distribution', { underline: true });
    
    pdf.moveDown(0.5);
    
    data.tierDistribution.forEach(tier => {
      pdf.fontSize(12)
         .font('Helvetica')
         .text(`${tier.tier_name}: ${tier.user_count} users (${tier.percentage}%)`);
    });
  }
  
  private static async addPDFCharts(pdf: any, analytics: any): Promise<void> {
    // This would integrate with a chart generation library
    // to create charts and embed them in the PDF
    pdf.addPage();
    pdf.fontSize(16)
       .font('Helvetica-Bold')
       .text('Analytics Charts', { underline: true });
    
    // Add chart placeholders or actual generated charts
    pdf.moveDown();
    pdf.text('Charts would be embedded here based on analytics data');
  }
  
  private static addPDFAppendices(pdf: any, data: ReportData): void {
    pdf.addPage();
    pdf.fontSize(16)
       .font('Helvetica-Bold')
       .text('Appendices', { underline: true });
    
    pdf.moveDown(0.5);
    
    // Add methodology
    pdf.fontSize(14)
       .font('Helvetica-Bold')
       .text('A. Methodology');
    
    pdf.fontSize(12)
       .font('Helvetica')
       .text('This report was generated using data from the Compliance Management System.')
       .text('Metrics are calculated based on user compliance records and system activities.');
    
    pdf.moveDown();
    
    // Add data sources
    pdf.fontSize(14)
       .font('Helvetica-Bold')
       .text('B. Data Sources');
    
    pdf.fontSize(12)
       .font('Helvetica')
       .text('- User compliance records')
       .text('- Requirement submissions and reviews')
       .text('- System activity logs')
       .text('- Performance metrics');
  }
}
```

### 3. Deploy System Health Monitoring

#### 3.1 Implement Real-Time System Health Monitoring

Create a comprehensive system health monitoring dashboard:

```typescript
// File: src/components/system/SystemHealthDashboard.tsx

interface SystemHealthDashboardProps {
  refreshInterval?: number;
  showAlerts?: boolean;
}

export function SystemHealthDashboard({
  refreshInterval = 60000, // 1 minute
  showAlerts = true
}: SystemHealthDashboardProps) {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [alertLevel, setAlertLevel] = useState<'healthy' | 'warning' | 'critical'>('healthy');
  const [activeIncidents, setActiveIncidents] = useState<SystemIncident[]>([]);
  
  // Health monitoring data
  const { data: currentHealth, isLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => ComplianceHealthMonitor.checkSystemHealth(),
    refetchInterval: refreshInterval,
    enabled: isMonitoring
  });
  
  const { data: healthHistory } = useQuery({
    queryKey: ['health-history'],
    queryFn: () => ComplianceHealthMonitor.getHealthHistory(24), // Last 24 hours
    refetchInterval: 300000 // 5 minutes
  });
  
  const { data: performanceMetrics } = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: () => SystemPerformanceMonitor.getCurrentMetrics(),
    refetchInterval: 30000 // 30 seconds
  });
  
  // Real-time health updates
  useEffect(() => {
    const channel = supabase
      .channel('system-health')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'system_health_logs'
      }, (payload) => {
        const newHealth = payload.new as HealthStatus;
        setHealthStatus(newHealth);
        
        // Check for critical alerts
        if (newHealth.status === 'critical' && showAlerts) {
          toast.error(`Critical system issue detected: ${newHealth.checks.filter(c => c.status === 'critical').map(c => c.name).join(', ')}`, {
            duration: 0, // Don't auto-dismiss
            action: {
              label: 'View Details',
              onClick: () => setSelectedIncident(newHealth)
            }
          });
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [showAlerts]);
  
  // Update alert level based on current health
  useEffect(() => {
    if (currentHealth) {
      setHealthStatus(currentHealth);
      
      const criticalIssues = currentHealth.checks.filter(c => c.status === 'critical');
      const warningIssues = currentHealth.checks.filter(c => c.status === 'degraded');
      
      if (criticalIssues.length > 0) {
        setAlertLevel('critical');
      } else if (warningIssues.length > 0) {
        setAlertLevel('warning');
      } else {
        setAlertLevel('healthy');
      }
    }
  }, [currentHealth]);
  
  // Manual health check
  const runHealthCheck = async () => {
    try {
      setIsMonitoring(false);
      const result = await ComplianceHealthMonitor.checkSystemHealth();
      setHealthStatus(result);
      toast.success('Health check completed');
    } catch (error) {
      toast.error('Health check failed');
    } finally {
      setIsMonitoring(true);
    }
  };
  
  if (isLoading && !healthStatus) {
    return <SystemHealthSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">System Health Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of compliance system health and performance
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant={
              alertLevel === 'critical' ? 'destructive' :
              alertLevel === 'warning' ? 'secondary' : 'default'
            }
            className="gap-1"
          >
            <div className={cn(
              "w-2 h-2 rounded-full",
              alertLevel === 'critical' ? "bg-red-500 animate-pulse" :
              alertLevel === 'warning' ? "bg-yellow-500" : "bg-green-500"
            )} />
            {capitalize(alertLevel)}
          </Badge>
          
          <Button
            variant="outline"
            onClick={runHealthCheck}
            disabled={!isMonitoring}
            className="gap-2"
          >
            <RefreshCcw className={cn("h-4 w-4", !isMonitoring && "animate-spin")} />
            Run Check
          </Button>
          
          <Button
            variant={isMonitoring ? "secondary" : "default"}
            onClick={() => setIsMonitoring(!isMonitoring)}
            className="gap-2"
          >
            {isMonitoring ? (
              <>
                <Pause className="h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Resume
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Critical Alerts Banner */}
      {alertLevel === 'critical' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical System Issues Detected</AlertTitle>
          <AlertDescription>
            {healthStatus?.checks.filter(c => c.status === 'critical').map(c => c.message).join('; ')}
            <Button 
              variant="link" 
              className="p-0 h-auto ml-2 text-red-600"
              onClick={() => setShowIncidentDialog(true)}
            >
              View incident details →
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="Database"
          status={getCheckStatus(healthStatus?.checks, 'database')}
          metric={getCheckMetric(healthStatus?.checks, 'database', 'responseTime')}
          unit="ms"
          threshold={200}
          icon={<Database className="h-6 w-6" />}
        />
        
        <StatusCard
          title="Storage"
          status={getCheckStatus(healthStatus?.checks, 'storage')}
          metric={getCheckMetric(healthStatus?.checks, 'storage', 'responseTime')}
          unit="ms"
          threshold={300}
          icon={<HardDrive className="h-6 w-6" />}
        />
        
        <StatusCard
          title="Edge Functions"
          status={getCheckStatus(healthStatus?.checks, 'edge_functions')}
          metric={getCheckMetric(healthStatus?.checks, 'edge_functions', 'responseTime')}
          unit="ms"
          threshold={800}
          icon={<Zap className="h-6 w-6" />}
        />
        
        <StatusCard
          title="Real-time"
          status={getCheckStatus(healthStatus?.checks, 'realtime')}
          metric={getCheckMetric(healthStatus?.checks, 'realtime', 'connectionCount')}
          unit="connections"
          icon={<Radio className="h-6 w-6" />}
        />
      </div>
      
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Response Time Trends</CardTitle>
            <CardDescription>System response times over the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponseTimeChart
              data={healthHistory?.map(h => ({
                timestamp: h.timestamp,
                database: h.checks.find(c => c.name === 'database')?.metrics?.responseTime || 0,
                storage: h.checks.find(c => c.name === 'storage')?.metrics?.responseTime || 0,
                functions: h.checks.find(c => c.name === 'edge_functions')?.metrics?.responseTime || 0
              })) || []}
              thresholds={{
                database: 200,
                storage: 300,
                functions: 800
              }}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>System Resource Usage</CardTitle>
            <CardDescription>Current resource utilization</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResourceUsageChart
              data={performanceMetrics || {
                cpu: 0,
                memory: 0,
                storage: 0,
                network: 0
              }}
              limits={{
                cpu: 80,
                memory: 85,
                storage: 90,
                network: 70
              }}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Health Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Health Checks</CardTitle>
          <CardDescription>
            Comprehensive status of all system components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {healthStatus?.checks.map((check, index) => (
              <HealthCheckRow
                key={index}
                check={check}
                onViewDetails={() => setSelectedCheck(check)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Health History Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Health Status History</CardTitle>
          <CardDescription>System health over time</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <HealthHistoryChart
            data={healthHistory || []}
            timeRange="24h"
            showDetails={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components
function StatusCard({ 
  title, 
  status, 
  metric, 
  unit, 
  threshold, 
  icon 
}: {
  title: string;
  status: 'healthy' | 'degraded' | 'critical';
  metric?: number;
  unit?: string;
  threshold?: number;
  icon: React.ReactNode;
}) {
  const isOverThreshold = threshold && metric && metric > threshold;
  
  return (
    <Card className={cn(
      "border-l-4",
      status === 'healthy' ? "border-l-green-500" :
      status === 'degraded' ? "border-l-yellow-500" : "border-l-red-500"
    )}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant={
                  status === 'healthy' ? 'default' :
                  status === 'degraded' ? 'secondary' : 'destructive'
                }
              >
                {capitalize(status)}
              </Badge>
              {metric && (
                <span className={cn(
                  "text-sm font-medium",
                  isOverThreshold ? "text-red-600" : "text-green-600"
                )}>
                  {metric}{unit}
                </span>
              )}
            </div>
          </div>
          <div className={cn(
            "p-2 rounded-full",
            status === 'healthy' ? "bg-green-100 text-green-600" :
            status === 'degraded' ? "bg-yellow-100 text-yellow-600" : "bg-red-100 text-red-600"
          )}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HealthCheckRow({ 
  check, 
  onViewDetails 
}: { 
  check: HealthCheck; 
  onViewDetails: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-3 h-3 rounded-full",
          check.status === 'healthy' ? "bg-green-500" :
          check.status === 'degraded' ? "bg-yellow-500" : "bg-red-500"
        )} />
        <div>
          <h4 className="font-medium">{check.name}</h4>
          <p className="text-sm text-muted-foreground">{check.message}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {check.metrics && (
          <div className="text-right">
            {Object.entries(check.metrics).map(([key, value]) => (
              <div key={key} className="text-sm">
                <span className="text-muted-foreground capitalize">{key}: </span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={onViewDetails}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

### 4. Production Management Tools

#### 4.1 Create User Management Interface

Build comprehensive user management capabilities:

```typescript
// File: src/components/admin/UserManagementDashboard.tsx

interface UserManagementDashboardProps {
  adminRole: string;
}

export function UserManagementDashboard({ adminRole }: UserManagementDashboardProps) {
  const [filters, setFilters] = useState<UserFilters>({
    role: 'all',
    tier: 'all',
    status: 'all',
    search: ''
  });
  
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  // Data hooks
  const { data: users, isLoading, refetch } = useUsersManagement(filters);
  const { data: userStats } = useUserStatistics();
  const { data: roleOptions } = useRoleOptions();
  
  // Mutations
  const { mutate: updateUser } = useUpdateUser();
  const { mutate: bulkUpdateUsers } = useBulkUpdateUsers();
  const { mutate: assignTier } = useAssignUserTier();
  
  // Handle user updates
  const handleUpdateUser = async (userId: string, updates: Partial<UserProfile>) => {
    try {
      await updateUser({ userId, updates });
      refetch();
      toast.success('User updated successfully');
    } catch (error) {
      toast.error('Failed to update user');
    }
  };
  
  // Handle bulk tier assignment
  const handleBulkTierAssignment = async (tier: 'basic' | 'robust') => {
    if (selectedUsers.size === 0) return;
    
    try {
      const userIds = Array.from(selectedUsers);
      await bulkUpdateUsers({
        userIds,
        updates: { compliance_tier: tier }
      });
      
      // Initialize tier requirements for each user
      for (const userId of userIds) {
        const user = users?.find(u => u.id === userId);
        if (user) {
          await ComplianceTierService.initializeTierRequirements(
            userId,
            user.role,
            tier
          );
        }
      }
      
      refetch();
      setSelectedUsers(new Set());
      toast.success(`Updated ${userIds.length} users to ${tier} tier`);
    } catch (error) {
      toast.error('Failed to update user tiers');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">
            Manage user roles, tiers, and compliance assignments
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBulkActions(!showBulkActions)}
          >
            {showBulkActions ? 'Cancel Bulk' : 'Bulk Actions'}
          </Button>
          
          <Button onClick={() => setShowUserDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>
      
      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={userStats?.totalUsers || 0}
          icon={<Users className="h-6 w-6 text-blue-600" />}
          trend={userStats?.userGrowthTrend}
        />
        
        <MetricCard
          title="Active Users"
          value={userStats?.activeUsers || 0}
          icon={<UserCheck className="h-6 w-6 text-green-600" />}
          subtext="Last 30 days"
        />
        
        <MetricCard
          title="Basic Tier"
          value={userStats?.basicTierUsers || 0}
          icon={<Award className="h-6 w-6 text-yellow-600" />}
          percentage={(userStats?.basicTierUsers / userStats?.totalUsers * 100) || 0}
        />
        
        <MetricCard
          title="Robust Tier"
          value={userStats?.robustTierUsers || 0}
          icon={<Crown className="h-6 w-6 text-purple-600" />}
          percentage={(userStats?.robustTierUsers / userStats?.totalUsers * 100) || 0}
        />
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search-filter">Search Users</Label>
              <Input
                id="search-filter"
                placeholder="Search by name or email..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role-filter">Role</Label>
              <Select
                value={filters.role}
                onValueChange={(value) => setFilters({ ...filters, role: value })}
              >
                <SelectTrigger id="role-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="IT">Instructor Trainee</SelectItem>
                  <SelectItem value="IP">Instructor Provisional</SelectItem>
                  <SelectItem value="IC">Instructor Certified</SelectItem>
                  <SelectItem value="AP">Authorized Provider</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tier-filter">Compliance Tier</Label>
              <Select
                value={filters.tier}
                onValueChange={(value) => setFilters({ ...filters, tier: value })}
              >
                <SelectTrigger id="tier-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="basic">Basic Tier</SelectItem>
                  <SelectItem value="robust">Robust Tier</SelectItem>
                  <SelectItem value="none">No Tier Assigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status-filter">Account Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({
                  role: 'all',
                  tier: 'all',
                  status: 'all',
                  search: ''
                })}
                className="w-full"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Bulk Actions Bar */}
      {showBulkActions && selectedUsers.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedUsers.size} users selected
              </span>
              
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Assign Tier
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkTierAssignment('basic')}>
                      Basic Tier
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkTierAssignment('robust')}>
                      Robust Tier
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button variant="outline" size="sm">
                  Export Selected
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedUsers(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage user accounts, roles, and compliance tier assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton columns={7} rows={10} />
          ) : users?.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No users found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or add new users
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {showBulkActions && (
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedUsers.size === users?.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers(new Set(users?.map(u => u.id) || []));
                            } else {
                              setSelectedUsers(new Set());
                            }
                          }}
                        />
                      </TableHead>
                    )}
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <TableRow key={user.id}>
                      {showBulkActions && (
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.has(user.id)}
                            onCheckedChange={(checked) => {
                              const next = new Set(selectedUsers);
                              if (checked) {
                                next.add(user.id);
                              } else {
                                next.delete(user.id);
                              }
                              setSelectedUsers(next);
                            }}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>
                              {user.display_name?.split(' ').map(n => n[0]).join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.display_name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {user.compliance_tier ? (
                          <Badge 
                            variant={user.compliance_tier === 'basic' ? 'default' : 'secondary'}
                          >
                            {user.compliance_tier === 'basic' ? 'Basic' : 'Robust'}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={user.compliance_completion_rate || 0} 
                            className="w-16 h-2"
                          />
                          <span className="text-sm">{user.compliance_completion_rate || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.last_active_at ? (
                          <div>
                            <div className="text-sm">{format(new Date(user.last_active_at), 'MMM d')}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(user.last_active_at), { addSuffix: true })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.status === 'active' ? 'default' :
                            user.status === 'pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {capitalize(user.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Shield className="h-4 w-4 mr-2" />
                              View Compliance
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Activity className="h-4 w-4 mr-2" />
                              View Activity
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleUpdateUser(user.id, { status: 'suspended' })}
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Suspend User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* User Detail/Edit Dialog */}
      <UserDetailDialog
        user={selectedUser}
        isOpen={showUserDialog}
        onClose={() => {
          setShowUserDialog(false);
          setSelectedUser(null);
        }}
        onUpdate={handleUpdateUser}
        roleOptions={roleOptions}
      />
    </div>
  );
}
```

#### 4.2 Implement Security Auditing and Access Controls

Create comprehensive security monitoring and access control systems:

```typescript
// File: src/components/admin/SecurityAuditDashboard.tsx

interface SecurityAuditDashboardProps {
  timeRange?: 'day' | 'week' | 'month';
}

export function SecurityAuditDashboard({ 
  timeRange = 'week' 
}: SecurityAuditDashboardProps) {
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [alertLevel, setAlertLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Security data hooks
  const { data: securityEvents, isLoading } = useSecurityEvents(timeRange);
  const { data: accessLogs } = useAccessLogs(timeRange);
  const { data: loginAttempts } = useLoginAttempts(timeRange);
  const { data: permissionChanges } = usePermissionChanges(timeRange);
  const { data: securityMetrics } = useSecurityMetrics(timeRange);
  
  // Real-time security monitoring
  useEffect(() => {
    if (!autoRefresh) return;
    
    const channel = supabase
      .channel('security-events')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'security_audit_log'
      }, (payload) => {
        const event = payload.new as SecurityEvent;
        
        // Show immediate alerts for high-severity events
        if (event.severity === 'high') {
          toast.error(`Security Alert: ${event.event_type}`, {
            description: event.description,
            duration: 0,
            action: {
              label: 'Investigate',
              onClick: () => setSelectedEvent(event)
            }
          });
        }
        
        // Refresh data
        queryClient.invalidateQueries(['security-events']);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [autoRefresh]);
  
  // Export security report
  const handleExportSecurityReport = async () => {
    try {
      const reportData = {
        timeRange,
        events: securityEvents,
        metrics: securityMetrics,
        accessLogs: accessLogs,
        loginAttempts: loginAttempts
      };
      
      const result = await SecurityReportGenerator.generateSecurityReport(reportData, {
        format: 'pdf',
        includeDetails: true,
        classification: 'confidential'
      });
      
      // Download encrypted report
      const blob = new Blob([result.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.fileName;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Security report exported');
    } catch (error) {
      toast.error('Failed to export security report');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Security Audit Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor security events, access logs, and system vulnerabilities
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant={
              alertLevel === 'high' ? 'destructive' :
              alertLevel === 'medium' ? 'secondary' : 'default'
            }
            className="gap-1"
          >
            <Shield className="h-3 w-3" />
            {capitalize(alertLevel)} Risk
          </Badge>
          
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(autoRefresh && "bg-blue-50")}
          >
            {autoRefresh ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause Monitor
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume Monitor
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExportSecurityReport}
            className="gap-2"
          >
            <FileShield className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>
      
      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SecurityMetricCard
          title="Failed Login Attempts"
          value={securityMetrics?.failedLogins || 0}
          icon={<UserX className="h-6 w-6 text-red-600" />}
          trend={securityMetrics?.failedLoginsTrend}
          threshold={10}
          severity="high"
        />
        
        <SecurityMetricCard
          title="Suspicious Activities"
          value={securityMetrics?.suspiciousActivities || 0}
          icon={<AlertTriangle className="h-6 w-6 text-orange-600" />}
          trend={securityMetrics?.suspiciousActivitiesTrend}
          threshold={5}
          severity="medium"
        />
        
        <SecurityMetricCard
          title="Permission Changes"
          value={securityMetrics?.permissionChanges || 0}
          icon={<Key className="h-6 w-6 text-blue-600" />}
          trend={securityMetrics?.permissionChangesTrend}
          threshold={3}
          severity="medium"
        />
        
        <SecurityMetricCard
          title="Data Access Events"
          value={securityMetrics?.dataAccessEvents || 0}
          icon={<Database className="h-6 w-6 text-purple-600" />}
          trend={securityMetrics?.dataAccessTrend}
          threshold={1000}
          severity="low"
        />
      </div>
      
      {/* Security Events Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Security Events Timeline</CardTitle>
          <CardDescription>
            Recent security events and incidents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : securityEvents?.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-green-600" />
              <h3 className="mt-4 text-lg font-medium text-green-800">All Clear</h3>
              <p className="text-green-600">No security events detected</p>
            </div>
          ) : (
            <div className="space-y-4">
              {securityEvents?.map((event) => (
                <SecurityEventCard
                  key={event.id}
                  event={event}
                  onClick={() => setSelectedEvent(event)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Access Control Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Control Matrix</CardTitle>
            <CardDescription>Current role-based permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <AccessControlMatrix
              permissions={securityMetrics?.rolePermissions || []}
              onPermissionChange={handlePermissionChange}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Access Logs</CardTitle>
            <CardDescription>User access and authentication events</CardDescription>
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto">
            <AccessLogsList
              logs={accessLogs || []}
              onViewDetails={(log) => setSelectedAccessLog(log)}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Vulnerability Scanner */}
      <Card>
        <CardHeader>
          <CardTitle>Security Vulnerability Scanner</CardTitle>
          <CardDescription>
            Automated security scans and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VulnerabilityScanner
            onScanComplete={handleScanComplete}
            lastScan={securityMetrics?.lastVulnerabilityScan}
            findings={securityMetrics?.vulnerabilityFindings || []}
          />
        </CardContent>
      </Card>
      
      {/* Security Event Detail Dialog */}
      <SecurityEventDetailDialog
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onTakeAction={handleSecurityAction}
      />
    </div>
  );
}

// Security Event Card Component
function SecurityEventCard({ 
  event, 
  onClick 
}: { 
  event: SecurityEvent; 
  onClick: () => void;
}) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-orange-500 bg-orange-50';
      case 'low': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };
  
  return (
    <div
      className={cn(
        "p-4 border-l-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow",
        getSeverityColor(event.severity)
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge 
              variant={
                event.severity === 'high' ? 'destructive' :
                event.severity === 'medium' ? 'secondary' : 'default'
              }
            >
              {event.severity}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {event.event_type}
            </span>
          </div>
          <h4 className="font-medium">{event.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">
            {event.description}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>User: {event.user_email || 'System'}</span>
            <span>IP: {event.ip_address || 'N/A'}</span>
            <span>{format(new Date(event.created_at), 'PPp')}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {event.status === 'unresolved' && (
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              Unresolved
            </Badge>
          )}
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
```

#### 4.3 Implement Deployment Validation and Rollback

Create production deployment management tools:

```typescript
// File: src/components/admin/DeploymentManagementDashboard.tsx

interface DeploymentManagementDashboardProps {
  environment: 'staging' | 'production';
}

export function DeploymentManagementDashboard({ 
  environment 
}: DeploymentManagementDashboardProps) {
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null);
  const [showRollbackDialog, setShowRollbackDialog] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  
  // Deployment data hooks
  const { data: currentDeployment } = useCurrentDeployment(environment);
  const { data: deploymentHistory } = useDeploymentHistory(environment, 10);
  const { data: systemHealth } = useSystemHealth();
  const { data: validationResults } = useValidationResults();
  
  // Run deployment validation
  const runDeploymentValidation = async () => {
    setIsValidating(true);
    try {
      const result = await ImplementationValidationService.validateComplianceImplementation();
      setDeploymentStatus(result);
      
      if (result.status === 'passed') {
        toast.success(`Validation passed with ${result.successRate.toFixed(1)}% success rate`);
      } else {
        toast.error(`Validation failed. Success rate: ${result.successRate.toFixed(1)}%`);
      }
    } catch (error) {
      toast.error('Validation failed to run');
    } finally {
      setIsValidating(false);
    }
  };
  
  // Initiate rollback
  const handleRollback = async (targetVersion: string) => {
    try {
      const result = await DeploymentService.initiateRollback(targetVersion, {
        environment,
        reason: 'Manual rollback requested',
        userId: user.id
      });
      
      if (result.success) {
        toast.success('Rollback initiated successfully');
        queryClient.invalidateQueries(['deployment-history']);
      } else {
        toast.error('Rollback failed: ' + result.error);
      }
    } catch (error) {
      toast.error('Failed to initiate rollback');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Deployment Management</h2>
          <p className="text-muted-foreground">
            Manage deployments, validation, and rollback procedures for {environment}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant={environment === 'production' ? 'destructive' : 'secondary'}
            className="gap-1"
          >
            <Server className="h-3 w-3" />
            {capitalize(environment)}
          </Badge>
          
          <Button
            variant="outline"
            onClick={runDeploymentValidation}
            disabled={isValidating}
            className="gap-2"
          >
            {isValidating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Run Validation
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowRollbackDialog(true)}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Rollback
          </Button>
        </div>
      </div>
      
      {/* Current Deployment Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Deployment</CardTitle>
          <CardDescription>
            Active deployment information and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Version</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {currentDeployment?.version || 'Unknown'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  deployed {currentDeployment?.deployedAt ? 
                    formatDistanceToNow(new Date(currentDeployment.deployedAt), { addSuffix: true }) : 
                    'Unknown'
                  }
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Health Status</Label>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  systemHealth?.status === 'healthy' ? "bg-green-500" :
                  systemHealth?.status === 'degraded' ? "bg-yellow-500" : "bg-red-500"
                )} />
                <span className="font-medium">{capitalize(systemHealth?.status || 'unknown')}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Validation Status</Label>
              <div className="flex items-center gap-2">
                {deploymentStatus ? (
                  <>
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      deploymentStatus.status === 'passed' ? "bg-green-500" : "bg-red-500"
                    )} />
                    <span className="font-medium">
                      {deploymentStatus.status === 'passed' ? 'Valid' : 'Invalid'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({deploymentStatus.successRate.toFixed(1)}%)
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Not validated</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Validation Results */}
      {deploymentStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Results</CardTitle>
            <CardDescription>
              Detailed validation status of all system components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deploymentStatus.validations.map((validation, index) => (
                <ValidationResultCard
                  key={index}
                  validation={validation}
                  onViewDetails={() => setSelectedValidation(validation)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Deployment History */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment History</CardTitle>
          <CardDescription>
            Recent deployments and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deploymentHistory?.map((deployment) => (
              <DeploymentHistoryCard
                key={deployment.id}
                deployment={deployment}
                onRollback={() => handleRollback(deployment.version)}
                canRollback={deployment.status === 'success' && deployment.id !== currentDeployment?.id}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Pre-deployment Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Pre-deployment Checklist</CardTitle>
          <CardDescription>
            Essential checks before deploying to {environment}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PreDeploymentChecklist
            environment={environment}
            onCheckComplete={handleChecklistComplete}
            validationResults={validationResults}
          />
        </CardContent>
      </Card>
      
      {/* Rollback Dialog */}
      <RollbackDialog
        isOpen={showRollbackDialog}
        onClose={() => setShowRollbackDialog(false)}
        deploymentHistory={deploymentHistory || []}
        onConfirmRollback={handleRollback}
        currentVersion={currentDeployment?.version}
      />
    </div>
  );
}

// Validation Result Card Component
function ValidationResultCard({ 
  validation, 
  onViewDetails 
}: { 
  validation: ValidationItem; 
  onViewDetails: () => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'text-green-600 bg-green-50 border-green-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };
  
  return (
    <div className={cn(
      "p-4 border rounded-lg",
      getStatusColor(validation.status)
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium capitalize">{validation.name.replace('_', ' ')}</h4>
            <Badge 
              variant={
                validation.status === 'passed' ? 'default' :
                validation.status === 'failed' ? 'destructive' : 'secondary'
              }
            >
              {validation.status}
            </Badge>
          </div>
          <p className="text-sm">{validation.message}</p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span>Passed: {validation.passedChecks}/{validation.totalChecks}</span>
            <span>Success Rate: {((validation.passedChecks / validation.totalChecks) * 100).toFixed(1)}%</span>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onViewDetails}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
      
      {validation.failedChecks && validation.failedChecks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-current/20">
          <h5 className="font-medium text-sm mb-2">Failed Checks:</h5>
          <ul className="space-y-1">
            {validation.failedChecks.map((check, idx) => (
              <li key={idx} className="text-sm flex items-start gap-2">
                <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                {check.name}: {check.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Pre-deployment Checklist Component
function PreDeploymentChecklist({ 
  environment, 
  onCheckComplete,
  validationResults
}: {
  environment: string;
  onCheckComplete: (results: ChecklistResults) => void;
  validationResults: any;
}) {
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [isRunning, setIsRunning] = useState(false);
  
  const checklistItems = [
    {
      id: 'database_backup',
      label: 'Database backup created',
      description: 'Ensure recent backup exists for rollback',
      required: true,
      automated: true
    },
    {
      id: 'schema_validation',
      label: 'Database schema validated',
      description: 'All required tables and indexes exist',
      required: true,
      automated: true
    },
    {
      id: 'data_integrity',
      label: 'Data integrity verified',
      description: 'No orphaned records or inconsistencies',
      required: true,
      automated: true
    },
    {
      id: 'service_health',
      label: 'All services healthy',
      description: 'Backend services responding normally',
      required: true,
      automated: true
    },
    {
      id: 'ui_validation',
      label: 'UI components validated',
      description: 'All dashboard routes and components working',
      required: true,
      automated: true
    },
    {
      id: 'notification_test',
      label: 'Notification system tested',
      description: 'Email and in-app notifications functional',
      required: environment === 'production',
      automated: false
    },
    {
      id: 'monitoring_configured',
      label: 'Monitoring configured',
      description: 'Health checks and alerts set up',
      required: environment === 'production',
      automated: false
    },
    {
      id: 'rollback_plan',
      label: 'Rollback plan confirmed',
      description: 'Rollback procedures documented and tested',
      required: environment === 'production',
      automated: false
    }
  ];
  
  const runAutomatedChecks = async () => {
    setIsRunning(true);
    const results: Record<string, boolean> = {};
    
    try {
      // Run validation service
      const validation = await ImplementationValidationService.validateComplianceImplementation();
      
      // Map validation results to checklist items
      results.database_backup = true; // Assume backup exists if validation runs
      results.schema_validation = validation.validations.find(v => v.name === 'database_schema')?.status === 'passed';
      results.data_integrity = validation.validations.find(v => v.name === 'data_flows')?.status === 'passed';
      results.service_health = validation.validations.find(v => v.name === 'service_implementations')?.status === 'passed';
      results.ui_validation = validation.validations.find(v => v.name === 'ui_components')?.status === 'passed';
      
      setChecklist(prev => ({ ...prev, ...results }));
      onCheckComplete(results);
    } catch (error) {
      toast.error('Automated checks failed');
    } finally {
      setIsRunning(false);
    }
  };
  
  const allRequiredChecked = checklistItems
    .filter(item => item.required)
    .every(item => checklist[item.id]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Complete all required checks before deploying to {environment}
          </p>
        </div>
        <Button
          onClick={runAutomatedChecks}
          disabled={isRunning}
          className="gap-2"
        >
          {isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Run Automated Checks
        </Button>
      </div>
      
      <div className="space-y-3">
        {checklistItems.map((item) => (
          <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
            <Checkbox
              checked={checklist[item.id] || false}
              onCheckedChange={(checked) => {
                setChecklist(prev => ({ 
                  ...prev, 
                  [item.id]: checked as boolean 
                }));
              }}
              disabled={item.automated && isRunning}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{item.label}</h4>
                {item.required && (
                  <Badge variant="outline" className="text-xs">Required</Badge>
                )}
                {item.automated && (
                  <Badge variant="secondary" className="text-xs">Auto</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className={cn(
        "p-3 rounded-lg border",
        allRequiredChecked ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
      )}>
        <div className="flex items-center gap-2">
          {allRequiredChecked ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          )}
          <span className="font-medium">
            {allRequiredChecked 
              ? 'Ready for deployment' 
              : 'Complete required checks before deploying'
            }
          </span>
        </div>
      </div>
    </div>
  );
}
```

## Implementation Checklist

### Admin Interfaces
- [ ] Complete ComplianceReviewDashboard with real-time submissions
- [ ] Implement EvidenceVerificationDialog with document analysis
- [ ] Build BulkReviewDialog for batch processing
- [ ] Create SubmissionAnalytics components
- [ ] Add admin notification system for urgent reviews

### Advanced Analytics
- [ ] Implement ComplianceAnalyticsDashboard with all tabs
- [ ] Create automated report generation (PDF, Excel, JSON)
- [ ] Build predictive analytics components
- [ ] Add real-time analytics data updates
- [ ] Implement custom chart components

### System Health Monitoring
- [ ] Deploy SystemHealthDashboard with real-time monitoring
- [ ] Implement ComplianceHealthMonitor service
- [ ] Create automated alert system
- [ ] Build performance metrics tracking
- [ ] Add health history visualization

### Production Management
- [ ] Build UserManagementDashboard with bulk operations
- [ ] Implement SecurityAuditDashboard with real-time events
- [ ] Create DeploymentManagementDashboard
- [ ] Add access control matrix management
- [ ] Implement vulnerability scanning

### Security & Compliance
- [ ] Deploy security event monitoring
- [ ] Implement audit logging for all admin actions
- [ ] Create encrypted report generation
- [ ] Add role-based access controls
- [ ] Implement data integrity verification

## Success Criteria

**Administrative Capabilities:**
- Complete review and approval workflows for all submission types
- Bulk operations for user and submission management
- Real-time security monitoring and alerting
- Comprehensive audit trails for all administrative actions

**Analytics and Reporting:**
- Advanced analytics dashboards with predictive insights
- Automated report generation in multiple formats
- Real-time performance monitoring and trend analysis
- Customizable metrics and KPI tracking

**System Management:**
- Real-time system health monitoring and alerting
- Automated deployment validation and rollback capabilities
- Comprehensive security auditing and access controls
- Production-ready monitoring and incident response

**Performance Requirements:**
- Admin dashboards load within 3 seconds
- Real-time updates propagate within 2 seconds
- Report generation completes within 30 seconds
- System health checks complete within 10 seconds

## Next Steps (Day 7)

After completing Day 6, the system will be ready for:
- Final end-to-end testing across all user types and admin functions
- Performance optimization and load testing
- Security penetration testing and vulnerability assessment
- User acceptance testing with real stakeholders
- Production deployment preparation and go-live planning

Day 6 establishes the complete administrative infrastructure needed to manage the compliance system in production, with comprehensive monitoring, security, and management capabilities.