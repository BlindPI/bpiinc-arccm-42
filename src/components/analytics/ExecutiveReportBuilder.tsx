import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { FileText, Play, Download, Calendar, Clock } from 'lucide-react';
import { ReportingService } from '@/services/analytics/reportingService';
import type { AnalyticsReport } from '@/types/analytics';

export function ExecutiveReportBuilder() {
  const queryClient = useQueryClient();
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportType, setReportType] = useState<'team_performance' | 'compliance_overview' | 'location_heatmap' | 'cross_team_comparison' | 'custom'>('custom');
  const [isAutomated, setIsAutomated] = useState(false);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['analytics-reports'],
    queryFn: () => ReportingService.getReports()
  });

  const { data: executions = [] } = useQuery({
    queryKey: ['report-executions'],
    queryFn: () => reports.length > 0 ? ReportingService.getReportExecutions(reports[0].id) : Promise.resolve([]),
    enabled: reports.length > 0
  });

  const createReportMutation = useMutation({
    mutationFn: (reportData: Omit<AnalyticsReport, 'id' | 'created_at' | 'updated_at'>) =>
      ReportingService.createReport(reportData),
    onSuccess: () => {
      toast.success('Report created successfully');
      queryClient.invalidateQueries({ queryKey: ['analytics-reports'] });
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create report: ${error.message}`);
    }
  });

  const executeReportMutation = useMutation({
    mutationFn: (reportId: string) => ReportingService.executeReport(reportId),
    onSuccess: () => {
      toast.success('Report execution started');
      queryClient.invalidateQueries({ queryKey: ['report-executions'] });
    },
    onError: (error) => {
      toast.error(`Failed to execute report: ${error.message}`);
    }
  });

  const exportReportMutation = useMutation({
    mutationFn: ({ executionId, format }: { executionId: string; format: string }) =>
      ReportingService.exportReport(executionId, format),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report_${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Report exported successfully');
    }
  });

  const handleCreateReport = () => {
    if (!reportName.trim()) {
      toast.error('Please enter a report name');
      return;
    }

    createReportMutation.mutate({
      name: reportName,
      description: reportDescription,
      report_type: reportType,
      configuration: {},
      is_automated: isAutomated,
      schedule_config: {},
      created_by: 'current-user-id' // This should come from auth context
    });
  };

  const resetForm = () => {
    setReportName('');
    setReportDescription('');
    setReportType('custom');
    setIsAutomated(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Executive Report Builder</h2>
          <p className="text-muted-foreground">Create and manage automated reports</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {reports.length} Reports
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Creation Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="report-name">Report Name</Label>
              <Input
                id="report-name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Enter report name"
              />
            </div>

            <div>
              <Label htmlFor="report-description">Description</Label>
              <Textarea
                id="report-description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Describe the report purpose"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Report</SelectItem>
                  <SelectItem value="team_performance">Team Performance</SelectItem>
                  <SelectItem value="compliance_overview">Compliance Overview</SelectItem>
                  <SelectItem value="location_heatmap">Location Heatmap</SelectItem>
                  <SelectItem value="cross_team_comparison">Cross-Team Comparison</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleCreateReport}
              disabled={createReportMutation.isPending}
              className="w-full"
            >
              {createReportMutation.isPending ? 'Creating...' : 'Create Report'}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{report.name}</h4>
                      {report.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {report.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{report.report_type}</Badge>
                        {report.is_automated && (
                          <Badge variant="outline">
                            <Calendar className="h-3 w-3 mr-1" />
                            Automated
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => executeReportMutation.mutate(report.id)}
                        disabled={executeReportMutation.isPending}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportReportMutation.mutate({ 
                          executionId: report.id, 
                          format: 'csv' 
                        })}
                        disabled={exportReportMutation.isPending}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {reports.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No reports created yet</p>
                  <p className="text-sm">Create your first report to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
