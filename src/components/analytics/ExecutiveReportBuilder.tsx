
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  FileText, 
  Download, 
  Mail, 
  Settings, 
  Play, 
  Calendar,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { toast } from 'sonner';
import { reportingService } from '@/services/analytics/reportingService';
import type { AnalyticsReport, ReportExecution } from '@/types/analytics';

export const ExecutiveReportBuilder: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [newReportForm, setNewReportForm] = useState({
    name: '',
    description: '',
    report_type: '',
    configuration: {},
    is_automated: false,
    schedule_config: {}
  });

  const { data: reports, isLoading } = useQuery({
    queryKey: ['analytics-reports'],
    queryFn: () => reportingService.getReports()
  });

  const { data: executions } = useQuery({
    queryKey: ['report-executions', selectedReport],
    queryFn: () => selectedReport ? reportingService.getReportExecutions(selectedReport) : Promise.resolve([]),
    enabled: !!selectedReport
  });

  const createReportMutation = useMutation({
    mutationFn: (report: Omit<AnalyticsReport, 'id' | 'created_at' | 'updated_at'>) =>
      reportingService.createReport(report),
    onSuccess: () => {
      toast.success('Report created successfully');
      queryClient.invalidateQueries(['analytics-reports']);
      setNewReportForm({
        name: '',
        description: '',
        report_type: '',
        configuration: {},
        is_automated: false,
        schedule_config: {}
      });
    }
  });

  const executeReportMutation = useMutation({
    mutationFn: ({ reportId, userId }: { reportId: string; userId: string }) =>
      reportingService.executeReport(reportId, userId),
    onSuccess: () => {
      toast.success('Report execution started');
      queryClient.invalidateQueries(['report-executions', selectedReport]);
    }
  });

  const exportReportMutation = useMutation({
    mutationFn: ({ executionId, format }: { executionId: string; format: 'pdf' | 'excel' | 'csv' }) =>
      reportingService.exportReport(executionId, format),
    onSuccess: (url) => {
      if (url) {
        toast.success('Report exported successfully');
        // In a real implementation, trigger download
        window.open(url, '_blank');
      }
    }
  });

  const handleCreateReport = () => {
    if (!newReportForm.name || !newReportForm.report_type) {
      toast.error('Please fill in required fields');
      return;
    }

    createReportMutation.mutate({
      ...newReportForm,
      created_by: 'current-user-id' // Get from auth context
    });
  };

  const handleExecuteReport = (reportId: string) => {
    executeReportMutation.mutate({
      reportId,
      userId: 'current-user-id' // Get from auth context
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Executive Report Builder</h2>
        <Button onClick={() => setSelectedReport('')}>
          <FileText className="h-4 w-4 mr-2" />
          New Report
        </Button>
      </div>

      <Tabs value={selectedReport ? 'existing' : 'new'} className="space-y-4">
        <TabsList>
          <TabsTrigger value="new">Create New Report</TabsTrigger>
          <TabsTrigger value="existing">Existing Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="report-name">Report Name</Label>
                  <Input
                    id="report-name"
                    value={newReportForm.name}
                    onChange={(e) => setNewReportForm({...newReportForm, name: e.target.value})}
                    placeholder="Monthly Performance Summary"
                  />
                </div>

                <div>
                  <Label htmlFor="report-type">Report Type</Label>
                  <Select 
                    value={newReportForm.report_type}
                    onValueChange={(value) => setNewReportForm({...newReportForm, report_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="team_performance">Team Performance</SelectItem>
                      <SelectItem value="compliance_overview">Compliance Overview</SelectItem>
                      <SelectItem value="location_heatmap">Location Heatmap</SelectItem>
                      <SelectItem value="cross_team_comparison">Cross-Team Comparison</SelectItem>
                      <SelectItem value="custom">Custom Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="report-description">Description</Label>
                <Textarea
                  id="report-description"
                  value={newReportForm.description}
                  onChange={(e) => setNewReportForm({...newReportForm, description: e.target.value})}
                  placeholder="Brief description of the report content and purpose"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newReportForm.is_automated}
                  onCheckedChange={(checked) => setNewReportForm({...newReportForm, is_automated: checked})}
                />
                <Label>Enable automated generation</Label>
              </div>

              {newReportForm.is_automated && (
                <Card className="p-4 bg-blue-50">
                  <h4 className="font-medium mb-2">Schedule Configuration</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Frequency</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Delivery Method</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="How to deliver" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="dashboard">Dashboard</SelectItem>
                          <SelectItem value="download">Download Portal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              )}

              <Button 
                onClick={handleCreateReport}
                disabled={createReportMutation.isPending}
                className="w-full"
              >
                {createReportMutation.isPending ? 'Creating...' : 'Create Report'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="existing" className="space-y-6">
          {/* Reports List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports?.map((report) => (
              <Card 
                key={report.id} 
                className={`cursor-pointer transition-all ${
                  selectedReport === report.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedReport(report.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{report.name}</CardTitle>
                    <div className="flex items-center space-x-1">
                      {report.is_automated && (
                        <Badge variant="secondary">
                          <Calendar className="h-3 w-3 mr-1" />
                          Auto
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {report.report_type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExecuteReport(report.id);
                      }}
                      disabled={executeReportMutation.isPending}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Run
                    </Button>
                    
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm">
                        <Settings className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Mail className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Report Executions */}
          {selectedReport && executions && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Executions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {executions.slice(0, 10).map((execution) => (
                    <div key={execution.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(execution.started_at).toLocaleString()}
                        </p>
                        <Badge variant={
                          execution.execution_status === 'completed' ? 'default' :
                          execution.execution_status === 'failed' ? 'destructive' :
                          execution.execution_status === 'running' ? 'secondary' : 'outline'
                        }>
                          {execution.execution_status}
                        </Badge>
                      </div>
                      
                      {execution.execution_status === 'completed' && (
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportReportMutation.mutate({
                              executionId: execution.id,
                              format: 'pdf'
                            })}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportReportMutation.mutate({
                              executionId: execution.id,
                              format: 'excel'
                            })}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Excel
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportReportMutation.mutate({
                              executionId: execution.id,
                              format: 'csv'
                            })}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            CSV
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
