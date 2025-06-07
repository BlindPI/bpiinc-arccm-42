
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  AlertCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ComplianceService } from '@/services/compliance/complianceService';
import { toast } from 'sonner';

interface TeamComplianceMonitorProps {
  teams: any[];
}

export function TeamComplianceMonitor({ teams }: TeamComplianceMonitorProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: complianceReport, isLoading } = useQuery({
    queryKey: ['compliance-report'],
    queryFn: () => ComplianceService.generateComplianceReport()
  });

  const resolveIssueMutation = useMutation({
    mutationFn: ({ issueId, notes }: { issueId: string; notes?: string }) =>
      ComplianceService.resolveIssue(issueId, 'current-user-id', notes),
    onSuccess: () => {
      toast.success('Compliance issue resolved successfully');
      queryClient.invalidateQueries({ queryKey: ['compliance-report'] });
    },
    onError: (error) => {
      toast.error(`Failed to resolve issue: ${error.message}`);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ issueId, status }: { issueId: string; status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' }) =>
      ComplianceService.updateIssueStatus(issueId, status),
    onSuccess: () => {
      toast.success('Issue status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['compliance-report'] });
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    }
  });

  const filteredIssues = complianceReport?.issues.filter(issue => {
    const matchesSearch = issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || issue.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  }) || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'IN_PROGRESS': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'RESOLVED': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compliance Overview */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Team Compliance Monitor</h2>
          <p className="text-muted-foreground">System-wide compliance monitoring and issue management</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Generate Assessment
          </Button>
        </div>
      </div>

      {/* Compliance Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Overall Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {complianceReport?.metrics.overallScore || 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">System compliance</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Compliant Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {complianceReport?.metrics.compliantUsers || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              of {complianceReport?.metrics.totalUsers || 0} total users
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Active Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filteredIssues.filter(i => i.status !== 'RESOLVED').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Requiring attention</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {filteredIssues.filter(i => i.status === 'IN_PROGRESS').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Being addressed</p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Issues */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Compliance Issues</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search issues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredIssues.map((issue) => (
              <div key={issue.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(issue.status)}
                      <span className="font-medium">{issue.type}</span>
                      <Badge className={getSeverityColor(issue.severity)}>
                        {issue.severity}
                      </Badge>
                      <Badge variant="outline">
                        {issue.status}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-700 mb-2">{issue.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">User:</span>
                        <div className="font-medium">{issue.userName}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Due Date:</span>
                        <div className="font-medium">
                          {issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : 'No due date'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <div className="font-medium">{issue.status}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {issue.status !== 'RESOLVED' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ 
                            issueId: issue.id, 
                            status: issue.status === 'OPEN' ? 'IN_PROGRESS' : 'RESOLVED'
                          })}
                          disabled={updateStatusMutation.isPending}
                        >
                          {issue.status === 'OPEN' ? 'Start Progress' : 'Resolve'}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveIssueMutation.mutate({ 
                            issueId: issue.id,
                            notes: 'Resolved by admin'
                          })}
                          disabled={resolveIssueMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                      </>
                    )}
                    
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {complianceReport?.trends.map((trend, index) => (
              <div key={index} className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold mb-1">{trend.percentage}%</div>
                <div className="text-sm text-muted-foreground">{trend.category}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
