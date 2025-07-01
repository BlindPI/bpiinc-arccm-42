
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