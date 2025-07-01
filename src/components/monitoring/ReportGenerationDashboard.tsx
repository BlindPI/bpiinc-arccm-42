
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Calendar, 
  Clock, 
  Plus,
  Settings,
  BarChart3,
  TrendingUp,
  Users,
  Shield
} from 'lucide-react';

interface Report {
  id: string;
  name: string;
  type: 'system_health' | 'performance' | 'analytics' | 'compliance';
  status: 'generating' | 'completed' | 'failed' | 'scheduled';
  created_at: string;
  file_url?: string;
  scheduled_for?: string;
  description: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: React.ElementType;
}

const ReportGenerationDashboard: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [scheduleType, setScheduleType] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDate, setScheduledDate] = useState('');

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'system_health',
      name: 'System Health Report',
      type: 'system_health',
      description: 'Comprehensive system health and performance metrics',
      icon: Shield
    },
    {
      id: 'performance_analytics',
      name: 'Performance Analytics',
      type: 'performance',
      description: 'Detailed performance analysis and trends',
      icon: TrendingUp
    },
    {
      id: 'user_activity',
      name: 'User Activity Report',
      type: 'analytics',
      description: 'User engagement and activity statistics',
      icon: Users
    },
    {
      id: 'compliance_audit',
      name: 'Compliance Audit',
      type: 'compliance',
      description: 'Security and compliance assessment',
      icon: BarChart3
    }
  ];

  // Mock data for demonstration
  useEffect(() => {
    const mockReports: Report[] = [
      {
        id: '1',
        name: 'Weekly System Health Report',
        type: 'system_health',
        status: 'completed',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        file_url: '/reports/system-health-weekly.pdf',
        description: 'Weekly system health and performance summary'
      },
      {
        id: '2',
        name: 'Monthly Performance Analytics',
        type: 'performance',
        status: 'generating',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        description: 'Monthly performance metrics and trends'
      },
      {
        id: '3',
        name: 'Quarterly Compliance Report',
        type: 'compliance',
        status: 'scheduled',
        created_at: new Date().toISOString(),
        scheduled_for: new Date(Date.now() + 86400000).toISOString(),
        description: 'Quarterly compliance assessment and audit'
      }
    ];
    setReports(mockReports);
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedTemplate || !reportName) return;

    setLoading(true);
    
    // Simulate report generation
    setTimeout(() => {
      const newReport: Report = {
        id: Date.now().toString(),
        name: reportName,
        type: selectedTemplate as any,
        status: scheduleType === 'immediate' ? 'generating' : 'scheduled',
        created_at: new Date().toISOString(),
        scheduled_for: scheduleType === 'scheduled' ? scheduledDate : undefined,
        description: reportDescription
      };

      setReports(prev => [newReport, ...prev]);
      
      // Reset form
      setReportName('');
      setReportDescription('');
      setSelectedTemplate('');
      setScheduleType('immediate');
      setScheduledDate('');
      
      setLoading(false);
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'generating': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    const template = reportTemplates.find(t => t.id === type);
    return template?.icon || FileText;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Report Generation</h2>
          <p className="text-muted-foreground">Generate and schedule system reports</p>
        </div>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
          <TabsTrigger value="reports">Report History</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Generate New Report
              </CardTitle>
              <CardDescription>
                Create custom reports or use predefined templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="template">Report Template</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {reportTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center gap-2">
                              <template.icon className="h-4 w-4" />
                              {template.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="name">Report Name</Label>
                    <Input
                      id="name"
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      placeholder="Enter report name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Enter report description"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Schedule</Label>
                    <Select value={scheduleType} onValueChange={(value: 'immediate' | 'scheduled') => setScheduleType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Generate Now</SelectItem>
                        <SelectItem value="scheduled">Schedule for Later</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {scheduleType === 'scheduled' && (
                    <div>
                      <Label htmlFor="scheduled-date">Scheduled Date & Time</Label>
                      <Input
                        id="scheduled-date"
                        type="datetime-local"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="pt-4">
                    <Button 
                      onClick={handleGenerateReport}
                      disabled={!selectedTemplate || !reportName || loading}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          {scheduleType === 'immediate' ? 'Generate Report' : 'Schedule Report'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report History</CardTitle>
              <CardDescription>
                View and download generated reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => {
                  const IconComponent = getTypeIcon(report.type);
                  return (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <IconComponent className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <h4 className="font-semibold">{report.name}</h4>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getStatusColor(report.status)}>
                              {report.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {report.status === 'scheduled' && report.scheduled_for
                                ? `Scheduled for ${new Date(report.scheduled_for).toLocaleString()}`
                                : `Created ${new Date(report.created_at).toLocaleString()}`
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {report.status === 'completed' && report.file_url && (
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <template.icon className="h-5 w-5" />
                    {template.name}
                  </CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      setReportName(template.name);
                      setReportDescription(template.description);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportGenerationDashboard;
