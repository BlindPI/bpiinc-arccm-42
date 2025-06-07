
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Download, 
  Upload, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  Calendar,
  Settings,
  Plus,
  Play,
  Trash2
} from 'lucide-react';
import { ExportReportService } from '@/services/monitoring';
import type { ReportConfig, ExportJob } from '@/types/api';

interface ReportGenerationDashboardProps {
  className?: string;
}

export const ReportGenerationDashboard: React.FC<ReportGenerationDashboardProps> = ({ 
  className 
}) => {
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [newReportConfig, setNewReportConfig] = useState<Partial<ReportConfig>>({
    name: '',
    type: 'analytics',
    enabled: true,
    format: 'xlsx',
    description: '',
    data_sources: []
  });

  const queryClient = useQueryClient();

  // Fetch report configurations
  const { data: reportConfigs = [], isLoading: loadingConfigs } = useQuery({
    queryKey: ['report-configs'],
    queryFn: () => ExportReportService.getReportConfigs()
  });

  // Fetch export jobs with current user filter
  const { data: exportJobs = [], isLoading: loadingJobs } = useQuery({
    queryKey: ['export-jobs'],
    queryFn: () => ExportReportService.getExportJobs({ userId: 'current-user-id' })
  });

  // Create report configuration mutation
  const createReportMutation = useMutation({
    mutationFn: (config: Partial<ReportConfig>) => ExportReportService.createReportConfig(config),
    onSuccess: () => {
      toast.success('Report configuration created successfully');
      queryClient.invalidateQueries({ queryKey: ['report-configs'] });
      setIsCreatingReport(false);
      setNewReportConfig({
        name: '',
        type: 'analytics',
        enabled: true,
        format: 'xlsx',
        description: '',
        data_sources: []
      });
    },
    onError: () => {
      toast.error('Failed to create report configuration');
    }
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: (configId: string) => ExportReportService.generateReport(configId),
    onSuccess: () => {
      toast.success('Report generation started');
      queryClient.invalidateQueries({ queryKey: ['export-jobs'] });
    },
    onError: () => {
      toast.error('Failed to start report generation');
    }
  });

  const handleCreateReport = () => {
    if (!newReportConfig.name) {
      toast.error('Report name is required');
      return;
    }
    createReportMutation.mutate(newReportConfig);
  };

  const handleGenerateReport = (configId: string) => {
    generateReportMutation.mutate(configId);
  };

  const getStatusColor = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'running':
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'running':
      case 'processing':
        return <Clock className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Report Generation</h1>
          <p className="text-gray-600">Generate and manage system reports</p>
        </div>
        <Button onClick={() => setIsCreatingReport(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Report Configuration
        </Button>
      </div>

      {/* Report Configurations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Report Configurations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingConfigs ? (
            <div>Loading configurations...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportConfigs.map((config) => (
                <Card key={config.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{config.name}</h3>
                      <Badge variant={config.enabled ? "default" : "secondary"}>
                        {config.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{config.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>Type: {config.type}</span>
                      <span>Format: {config.format}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleGenerateReport(config.id)}
                      disabled={!config.enabled || generateReportMutation.isPending}
                      className="w-full"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Export Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingJobs ? (
            <div>Loading export jobs...</div>
          ) : (
            <div className="space-y-4">
              {exportJobs.map((job) => (
                <Card key={job.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <span className="font-medium">Export Job #{job.id}</span>
                      </div>
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                    </div>
                    
                    {job.status === 'running' || job.status === 'processing' ? (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{job.progress}%</span>
                        </div>
                        <Progress value={job.progress} className="h-2" />
                      </div>
                    ) : null}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Started:</span>
                        <div>{job.started_at ? new Date(job.started_at).toLocaleString() : 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Completed:</span>
                        <div>{job.completed_at ? new Date(job.completed_at).toLocaleString() : 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">File Size:</span>
                        <div>{formatFileSize(job.file_size)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Requested By:</span>
                        <div>{job.requested_by || 'N/A'}</div>
                      </div>
                    </div>

                    {job.status === 'completed' && job.file_url && (
                      <div className="mt-3 pt-3 border-t">
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3 mr-1" />
                          Download Report
                        </Button>
                      </div>
                    )}

                    {job.status === 'failed' && job.error_message && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm text-red-600">
                          <span className="font-medium">Error:</span> {job.error_message}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Report Configuration Modal */}
      {isCreatingReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create Report Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="report-name">Report Name</Label>
                <Input
                  id="report-name"
                  value={newReportConfig.name}
                  onChange={(e) => setNewReportConfig({...newReportConfig, name: e.target.value})}
                  placeholder="Enter report name"
                />
              </div>

              <div>
                <Label htmlFor="report-type">Report Type</Label>
                <Select
                  value={newReportConfig.type}
                  onValueChange={(value) => setNewReportConfig({...newReportConfig, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="certificates">Certificates</SelectItem>
                    <SelectItem value="users">Users</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="report-format">Format</Label>
                <Select
                  value={newReportConfig.format}
                  onValueChange={(value) => setNewReportConfig({...newReportConfig, format: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="report-description">Description</Label>
                <Textarea
                  id="report-description"
                  value={newReportConfig.description}
                  onChange={(e) => setNewReportConfig({...newReportConfig, description: e.target.value})}
                  placeholder="Enter report description"
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleCreateReport}
                  disabled={createReportMutation.isPending}
                  className="flex-1"
                >
                  Create Report
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreatingReport(false)}
                  disabled={createReportMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReportGenerationDashboard;
