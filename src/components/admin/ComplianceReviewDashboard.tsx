import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Users, 
  TrendingUp,
  Download,
  RefreshCw,
  Eye,
  Filter
} from 'lucide-react';
import { ComplianceService, type UserComplianceRecord, type ComplianceDocument } from '@/services/compliance/complianceService';
import { toast } from 'sonner';

interface ComplianceSubmission {
  id: string;
  user_id: string;
  metric_id: string;
  compliance_status: 'compliant' | 'non_compliant' | 'warning' | 'pending' | 'not_applicable';
  current_value: any;
  last_checked_at: string;
  notes: string;
  user_profile?: {
    display_name: string;
    email: string;
    role: string;
  };
  compliance_metrics?: {
    name: string;
    category: string;
    description: string;
  };
  documents?: ComplianceDocument[];
}

interface ReviewFilters {
  status: string;
  category: string;
  role: string;
  priority: string;
}

export function ComplianceReviewDashboard() {
  const [submissions, setSubmissions] = useState<ComplianceSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ComplianceSubmission | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewDecision, setReviewDecision] = useState<string>('');
  const [processingReview, setProcessingReview] = useState(false);
  const [filters, setFilters] = useState<ReviewFilters>({
    status: 'all',
    category: 'all',
    role: 'all',
    priority: 'all'
  });

  useEffect(() => {
    loadComplianceSubmissions();
  }, [filters]);

  const loadComplianceSubmissions = async () => {
    try {
      setLoading(true);
      
      // Get all compliance records that need review
      const allRecords = await ComplianceService.getAllComplianceRecords();
      
      // Transform to submission format
      const transformedSubmissions: ComplianceSubmission[] = allRecords.map(record => ({
        id: record.id,
        user_id: record.user_id,
        metric_id: record.metric_id,
        compliance_status: record.compliance_status,
        current_value: record.current_value,
        last_checked_at: record.last_checked_at,
        notes: record.notes || '',
        user_profile: (record as any).profiles ? {
          display_name: (record as any).profiles.display_name,
          email: (record as any).profiles.email,
          role: (record as any).profiles.role
        } : undefined,
        compliance_metrics: record.compliance_metrics ? {
          name: record.compliance_metrics.name,
          category: record.compliance_metrics.category,
          description: record.compliance_metrics.description
        } : undefined
      }));

      // Apply filters
      let filtered = transformedSubmissions;
      
      if (filters.status !== 'all') {
        filtered = filtered.filter(s => s.compliance_status === filters.status);
      }
      
      if (filters.category !== 'all') {
        filtered = filtered.filter(s => s.compliance_metrics?.category === filters.category);
      }
      
      if (filters.role !== 'all') {
        filtered = filtered.filter(s => s.user_profile?.role === filters.role);
      }

      setSubmissions(filtered);
    } catch (error) {
      console.error('Error loading compliance submissions:', error);
      toast.error('Failed to load compliance submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmission = async (submission: ComplianceSubmission, decision: string) => {
    try {
      setProcessingReview(true);
      
      // Update the compliance record
      await ComplianceService.updateComplianceRecord(
        submission.user_id,
        submission.metric_id,
        submission.current_value,
        decision as any,
        reviewNotes
      );
      
      toast.success(`Submission ${decision} successfully`);
      
      // Reload submissions
      await loadComplianceSubmissions();
      
      // Reset form
      setSelectedSubmission(null);
      setReviewNotes('');
      setReviewDecision('');
      
    } catch (error) {
      console.error('Error processing review:', error);
      toast.error('Failed to process review');
    } finally {
      setProcessingReview(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'non_compliant': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'not_applicable': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="h-4 w-4" />;
      case 'non_compliant': return <XCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getUniqueCategories = () => {
    const categories = new Set(submissions.map(s => s.compliance_metrics?.category).filter(Boolean));
    return Array.from(categories);
  };

  const getUniqueRoles = () => {
    const roles = new Set(submissions.map(s => s.user_profile?.role).filter(Boolean));
    return Array.from(roles);
  };

  const getStatusCounts = () => {
    return {
      pending: submissions.filter(s => s.compliance_status === 'pending').length,
      compliant: submissions.filter(s => s.compliance_status === 'compliant').length,
      non_compliant: submissions.filter(s => s.compliance_status === 'non_compliant').length,
      warning: submissions.filter(s => s.compliance_status === 'warning').length
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Compliance Review Dashboard</h1>
          <p className="text-muted-foreground">Review and approve compliance submissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadComplianceSubmissions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliant</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.compliant}</div>
            <p className="text-xs text-muted-foreground">
              Approved submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-Compliant</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statusCounts.non_compliant}</div>
            <p className="text-xs text-muted-foreground">
              Rejected submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.warning}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="compliant">Compliant</SelectItem>
                  <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {getUniqueCategories().map(cat => (
                    <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={filters.role} onValueChange={(value) => setFilters({...filters, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {getUniqueRoles().map(role => (
                    <SelectItem key={role} value={role!}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={() => setFilters({status: 'all', category: 'all', role: 'all', priority: 'all'})}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Submissions ({submissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {submissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2" />
                <p>No submissions found matching your filters</p>
              </div>
            ) : (
              submissions.map((submission) => (
                <div key={submission.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium">{submission.compliance_metrics?.name || 'Unknown Metric'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {submission.user_profile?.display_name || 'Unknown User'} • {submission.user_profile?.email}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{submission.user_profile?.role || 'Unknown Role'}</Badge>
                        <Badge variant="outline">{submission.compliance_metrics?.category || 'Unknown Category'}</Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(submission.compliance_status)}>
                        {getStatusIcon(submission.compliance_status)}
                        <span className="ml-1 capitalize">{submission.compliance_status.replace('_', ' ')}</span>
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => setSelectedSubmission(submission)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                  
                  {submission.notes && (
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm">{submission.notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold">Review Submission</h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedSubmission(null)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">{selectedSubmission.compliance_metrics?.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedSubmission.compliance_metrics?.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">User</Label>
                    <p>{selectedSubmission.user_profile?.display_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Role</Label>
                    <p>{selectedSubmission.user_profile?.role}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Category</Label>
                    <p>{selectedSubmission.compliance_metrics?.category}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Current Status</Label>
                    <Badge className={getStatusColor(selectedSubmission.compliance_status)}>
                      {selectedSubmission.compliance_status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>

                {selectedSubmission.notes && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Submission Notes</Label>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      {selectedSubmission.notes}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Review Decision</Label>
                  <Select value={reviewDecision} onValueChange={setReviewDecision}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select decision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compliant">Approve (Compliant)</SelectItem>
                      <SelectItem value="non_compliant">Reject (Non-Compliant)</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="pending">Keep Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Review Notes</Label>
                  <Textarea
                    placeholder="Add your review notes..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleReviewSubmission(selectedSubmission, reviewDecision)}
                    disabled={!reviewDecision || processingReview}
                  >
                    {processingReview ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Submit Review
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}