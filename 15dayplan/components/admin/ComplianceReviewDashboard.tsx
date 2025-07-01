import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Archive, 
  CheckCircle, 
  Clock, 
  Download, 
  Filter, 
  Search, 
  XCircle 
} from 'lucide-react';

import { ComplianceReviewDialog } from '@/components/dialogs/ComplianceReviewDialog';
import { Badge } from '@/components/ui/badge';
import { formatDistance, format } from 'date-fns';

interface ComplianceReviewDashboardProps {
  userRole: string;
}

export function ComplianceReviewDashboard({ userRole }: ComplianceReviewDashboardProps) {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch submissions based on active tab and filters
  useEffect(() => {
    fetchSubmissions(activeTab, selectedRole, selectedType, searchQuery);
  }, [activeTab, selectedRole, selectedType, searchQuery]);

  const fetchSubmissions = async (
    status: string, 
    role: string, 
    type: string, 
    query: string
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/compliance-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          role,
          type,
          query,
        }),
      });
      
      const data = await response.json();
      setSubmissions(data.submissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewSubmission = (submission: any) => {
    setSelectedSubmission(submission);
    setReviewDialogOpen(true);
  };

  const handleReviewComplete = async (decision: any) => {
    try {
      await fetch(`/api/admin/review-submission/${selectedSubmission.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(decision),
      });
      
      // Refresh submissions after review
      fetchSubmissions(activeTab, selectedRole, selectedType, searchQuery);
      setReviewDialogOpen(false);
      setSelectedSubmission(null);
    } catch (error) {
      console.error('Error reviewing submission:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pending Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Needs Revision</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Compliance Review Dashboard</h1>
          <p className="text-muted-foreground">
            Review and approve compliance requirement submissions
          </p>
        </div>
        
        <Button onClick={() => console.log('Export data')}>
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>
      
      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="pending">Pending Review</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Needs Revision</TabsTrigger>
            <TabsTrigger value="all">All Submissions</TabsTrigger>
          </TabsList>
          
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search submissions..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="IT">Technology Provider</SelectItem>
                <SelectItem value="IP">Integration Partner</SelectItem>
                <SelectItem value="IC">Instructor</SelectItem>
                <SelectItem value="AP">Authorized Provider</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="certification">Certifications</SelectItem>
                <SelectItem value="form">Forms</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <TabsContent value={activeTab} className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>
                {activeTab === 'pending' && 'Submissions Awaiting Review'}
                {activeTab === 'approved' && 'Approved Submissions'}
                {activeTab === 'rejected' && 'Submissions Needing Revision'}
                {activeTab === 'all' && 'All Submissions'}
              </CardTitle>
              <CardDescription>
                {submissions.length} submissions found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-8">
                  <Archive className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No submissions found</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Requirement</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">{submission.requirement_name}</TableCell>
                          <TableCell>{submission.user_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{submission.user_role}</Badge>
                          </TableCell>
                          <TableCell>{submission.requirement_type}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{format(new Date(submission.submitted_at), 'MMM d, yyyy')}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistance(new Date(submission.submitted_at), new Date(), { addSuffix: true })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(submission.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReviewSubmission(submission)}
                            >
                              {submission.status === 'pending' ? 'Review' : 'View Details'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {selectedSubmission && (
        <ComplianceReviewDialog
          submission={selectedSubmission}
          isOpen={reviewDialogOpen}
          onClose={() => setReviewDialogOpen(false)}
          onReview={handleReviewComplete}
          reviewerRole={userRole}
        />
      )}
    </div>
  );
}