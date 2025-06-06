import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  FileText, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Settings,
  BarChart3,
  Database,
  Users,
  Activity
} from 'lucide-react';
import { exportReportService } from '@/services/monitoring';
import type { ReportConfig, ExportJob } from '@/services/monitoring';

interface ReportCardProps {
  config: ReportConfig;
  onGenerate: (configId: string) => void;
  onEdit: (config: ReportConfig) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ config, onGenerate, onEdit }) => {
  const getTypeIcon = (type: ReportConfig['report_type']) => {
    switch (type) {
      case 'analytics': return <BarChart3 className="h-4 w-4" />;
      case 'system_health': return <Activity className="h-4 w-4" />;
      case 'user_activity': return <Users className="h-4 w-4" />;
      case 'performance': return <Clock className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getFormatBadge = (format: ReportConfig['format']) => {
    const colors = {
      csv: 'bg-green-100 text-green-800',
      json: 'bg-blue-100 text-blue-800',
      pdf: 'bg-red-100 text-red-800',
      excel: 'bg-orange-100 text-orange-800'
    };
    
    return (
      <Badge className={colors[format] || 'bg-gray-100 text-gray-800'}>
        {format.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getTypeIcon(config.report_type)}
            <CardTitle className="text-lg">{config.name}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            {getFormatBadge(config.format)}
            {config.schedule?.enabled && (
              <Badge variant="outline">
                <Calendar className="h-3 w-3 mr-1" />
                Scheduled
              </Badge>
            )}
          </div>
        </div>
        {config.description && (
          <CardDescription>{config.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
          <div>
            <strong>Type:</strong> {config.report_type.replace('_', ' ')}
          </div>
          <div>
            <strong>Data Sources:</strong> {config.data_sources.join(', ')}
          </div>
          <div>
            <strong>Created:</strong> {new Date(config.created_at).toLocaleDateString()}
          </div>
          <div>
            <strong>Updated:</strong> {new Date(config.updated_at).toLocaleDateString()}
          </div>
        </div>

        {config.schedule?.enabled && (
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <div className="text-sm">
              <strong>Schedule:</strong> {config.schedule.frequency} at {config.schedule.time}
            </div>
            {config.schedule.recipients && config.schedule.recipients.length > 0 && (
              <div className="text-sm mt-1">
                <strong>Recipients:</strong> {config.schedule.recipients.join(', ')}
              </div>
            )}
          </div>
        )}

        <div className="flex space-x-2">
          <Button onClick={() => onGenerate(config.id)} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          <Button variant="outline" onClick={() => onEdit(config)}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface JobCardProps {
  job: ExportJob;
  onDownload: (job: ExportJob) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onDownload }) => {
  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {getStatusIcon(job.status)}
            <span className="font-medium">Export Job</span>
          </div>
          <Badge className={getStatusColor(job.status)}>
            {job.status}
          </Badge>
        </div>

        {job.status === 'processing' && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{job.progress}%</span>
            </div>
            <Progress value={job.progress} className="w-full" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
          <div>
            <strong>Started:</strong> {new Date(job.started_at).toLocaleString()}
          </div>
          {job.completed_at && (
            <div>
              <strong>Completed:</strong> {new Date(job.completed_at).toLocaleString()}
            </div>
          )}
          {job.file_size && (
            <div>
              <strong>File Size:</strong> {formatFileSize(job.file_size)}
            </div>
          )}
          <div>
            <strong>Requested by:</strong> {job.requested_by}
          </div>
        </div>

        {job.error_message && (
          <div className="bg-red-50 p-3 rounded-lg mb-4">
            <div className="text-sm text-red-700">
              <strong>Error:</strong> {job.error_message}
            </div>
          </div>
        )}

        {job.status === 'completed' && job.file_url && (
          <Button onClick={() => onDownload(job)} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const ReportGenerationDashboard: React.FC = () => {
  const [reportConfigs, setReportConfigs] = useState<ReportConfig[]>([]);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ReportConfig | null>(null);
  const [newConfig, setNewConfig] = useState({
    name: '',
    description: '',
    report_type: 'analytics' as ReportConfig['report_type'],
    data_sources: [''],
    format: 'csv' as ReportConfig['format'],
    schedule: {
      enabled: false,
      frequency: 'daily' as const,
      time: '09:00',
      recipients: ['']
    }
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [configs, jobs] = await Promise.all([
        exportReportService.getReportConfigs(),
        exportReportService.getExportJobs('current-user-id')
      ]);
      
      setReportConfigs(configs);
      setExportJobs(jobs);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateReport = async () => {
    try {
      await exportReportService.createReportConfig({
        ...newConfig,
        data_sources: newConfig.data_sources.filter(ds => ds.trim() !== ''),
        created_by: 'current-user-id'
      });
      
      setShowCreateDialog(false);
      resetNewConfig();
      fetchData();
    } catch (error) {
      console.error('Error creating report config:', error);
    }
  };

  const handleGenerateReport = async (configId: string) => {
    try {
      const jobId = await exportReportService.generateReport(configId, 'current-user-id');
      console.log('Report generation started:', jobId);
      
      // Refresh jobs to show the new one
      setTimeout(fetchData, 1000);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const handleDownloadReport = (job: ExportJob) => {
    if (job.file_url) {
      // Create a temporary link and click it to download
      const link = document.createElement('a');
      link.href = job.file_url;
      link.download = `report-${job.id}.${job.file_url.includes('csv') ? 'csv' : 'json'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetNewConfig = () => {
    setNewConfig({
      name: '',
      description: '',
      report_type: 'analytics',
      data_sources: [''],
      format: 'csv',
      schedule: {
        enabled: false,
        frequency: 'daily',
        time: '09:00',
        recipients: ['']
      }
    });
  };

  const addDataSource = () => {
    setNewConfig({
      ...newConfig,
      data_sources: [...newConfig.data_sources, '']
    });
  };

  const updateDataSource = (index: number, value: string) => {
    const newDataSources = [...newConfig.data_sources];
    newDataSources[index] = value;
    setNewConfig({ ...newConfig, data_sources: newDataSources });
  };

  const removeDataSource = (index: number) => {
    const newDataSources = newConfig.data_sources.filter((_, i) => i !== index);
    setNewConfig({ ...newConfig, data_sources: newDataSources });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Report Generation</h2>
          <p className="text-muted-foreground">
            Create, schedule, and manage automated reports
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Report Configuration</DialogTitle>
                <DialogDescription>
                  Define a new report template that can be generated on-demand or scheduled
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="report-name">Report Name</Label>
                    <Input
                      id="report-name"
                      value={newConfig.name}
                      onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                      placeholder="Enter report name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="report-type">Report Type</Label>
                    <Select value={newConfig.report_type} onValueChange={(value: any) => setNewConfig({ ...newConfig, report_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="analytics">Analytics</SelectItem>
                        <SelectItem value="system_health">System Health</SelectItem>
                        <SelectItem value="user_activity">User Activity</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="report-description">Description</Label>
                  <Textarea
                    id="report-description"
                    value={newConfig.description}
                    onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })}
                    placeholder="Enter report description"
                  />
                </div>

                <div>
                  <Label>Data Sources</Label>
                  {newConfig.data_sources.map((source, index) => (
                    <div key={index} className="flex items-center space-x-2 mt-2">
                      <Input
                        value={source}
                        onChange={(e) => updateDataSource(index, e.target.value)}
                        placeholder="Enter data source (e.g., audit_logs, certificates)"
                      />
                      {newConfig.data_sources.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeDataSource(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDataSource}
                    className="mt-2"
                  >
                    Add Data Source
                  </Button>
                </div>

                <div>
                  <Label htmlFor="report-format">Export Format</Label>
                  <Select value={newConfig.format} onValueChange={(value: any) => setNewConfig({ ...newConfig, format: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="pdf">PDF (Coming Soon)</SelectItem>
                      <SelectItem value="excel">Excel (Coming Soon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enable-schedule"
                      checked={newConfig.schedule.enabled}
                      onChange={(e) => setNewConfig({
                        ...newConfig,
                        schedule: { ...newConfig.schedule, enabled: e.target.checked }
                      })}
                    />
                    <Label htmlFor="enable-schedule">Enable Scheduled Generation</Label>
                  </div>

                  {newConfig.schedule.enabled && (
                    <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                      <div>
                        <Label htmlFor="schedule-frequency">Frequency</Label>
                        <Select 
                          value={newConfig.schedule.frequency} 
                          onValueChange={(value: any) => setNewConfig({
                            ...newConfig,
                            schedule: { ...newConfig.schedule, frequency: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="schedule-time">Time</Label>
                        <Input
                          id="schedule-time"
                          type="time"
                          value={newConfig.schedule.time}
                          onChange={(e) => setNewConfig({
                            ...newConfig,
                            schedule: { ...newConfig.schedule, time: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateReport}>
                    Create Report
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={fetchData} variant="outline">
            <Database className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="configs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configs">Report Configurations ({reportConfigs.length})</TabsTrigger>
          <TabsTrigger value="jobs">Export Jobs ({exportJobs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="configs" className="space-y-4">
          {reportConfigs.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No report configurations</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first report configuration to get started
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {reportConfigs.map((config) => (
                <ReportCard
                  key={config.id}
                  config={config}
                  onGenerate={handleGenerateReport}
                  onEdit={setEditingConfig}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          {exportJobs.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No export jobs</h3>
                  <p className="text-muted-foreground">
                    Generate a report to see export jobs here
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {exportJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onDownload={handleDownloadReport}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportGenerationDashboard;