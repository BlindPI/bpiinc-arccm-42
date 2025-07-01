import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Download, 
  Calendar, 
  BarChart3,
  TrendingUp,
  Users,
  Globe,
  Clock,
  Filter,
  Mail,
  Settings,
  Plus
} from 'lucide-react';

export function EnterpriseReportingDashboard() {
  const [activeTab, setActiveTab] = useState('scheduled');
  const [reportType, setReportType] = useState('all');
  const [timeRange, setTimeRange] = useState('monthly');

  // Mock reporting data
  const scheduledReports = [
    {
      id: '1',
      name: 'Executive Team Performance Summary',
      type: 'executive',
      frequency: 'weekly',
      nextRun: '2024-06-08 09:00 AM',
      status: 'active',
      recipients: ['ceo@company.com', 'hr@company.com'],
      format: 'PDF'
    },
    {
      id: '2',
      name: 'Cross-Location Analytics Report',
      type: 'analytics',
      frequency: 'monthly',
      nextRun: '2024-07-01 08:00 AM',
      status: 'active',
      recipients: ['operations@company.com'],
      format: 'Excel'
    },
    {
      id: '3',
      name: 'Team Compliance Audit',
      type: 'compliance',
      frequency: 'quarterly',
      nextRun: '2024-09-01 10:00 AM',
      status: 'paused',
      recipients: ['compliance@company.com', 'legal@company.com'],
      format: 'PDF'
    }
  ];

  const recentReports = [
    {
      name: 'June Team Performance Report',
      generated: '2024-06-07 09:15 AM',
      size: '2.4 MB',
      downloads: 15,
      type: 'performance'
    },
    {
      name: 'Q2 Cross-Location Analysis',
      generated: '2024-06-05 10:30 AM',
      size: '5.1 MB',
      downloads: 8,
      type: 'analytics'
    },
    {
      name: 'May Compliance Summary',
      generated: '2024-06-03 08:45 AM',
      size: '1.8 MB',
      downloads: 22,
      type: 'compliance'
    }
  ];

  const reportTemplates = [
    {
      name: 'Executive Dashboard',
      description: 'High-level KPIs and strategic metrics',
      category: 'executive',
      lastUsed: '3 days ago'
    },
    {
      name: 'Team Performance Deep Dive',
      description: 'Detailed team analytics and performance metrics',
      category: 'performance',
      lastUsed: '1 week ago'
    },
    {
      name: 'Resource Utilization Report',
      description: 'Cross-location resource allocation and efficiency',
      category: 'operations',
      lastUsed: '2 weeks ago'
    },
    {
      name: 'Compliance Status Report',
      description: 'Regulatory compliance and audit readiness',
      category: 'compliance',
      lastUsed: '1 month ago'
    }
  ];

  const reportMetrics = {
    totalReports: 156,
    scheduledActive: 12,
    avgGenerationTime: '3.2 minutes',
    storageUsed: '1.2 GB'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'executive': return 'bg-purple-100 text-purple-800';
      case 'analytics': return 'bg-blue-100 text-blue-800';
      case 'performance': return 'bg-green-100 text-green-800';
      case 'compliance': return 'bg-amber-100 text-amber-800';
      case 'operations': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Enterprise Reporting Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Automated reporting and advanced analytics for enterprise teams
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reports</SelectItem>
              <SelectItem value="executive">Executive</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="analytics">Analytics</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Report Settings
          </Button>
          
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </div>
      </div>

      {/* Report Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {reportMetrics.totalReports}
            </div>
            <p className="text-xs text-gray-500 mt-1">Generated this year</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Scheduled Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reportMetrics.scheduledActive}
            </div>
            <p className="text-xs text-gray-500 mt-1">Automated reports</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Generation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {reportMetrics.avgGenerationTime}
            </div>
            <p className="text-xs text-gray-500 mt-1">Processing time</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Storage Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {reportMetrics.storageUsed}
            </div>
            <p className="text-xs text-gray-500 mt-1">Report archive</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="recent">Recent Reports</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="builder">Report Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledReports.map((report) => (
                  <div key={report.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{report.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Next run: {report.nextRun} • {report.frequency}
                          </div>
                        </div>
                        <Badge className={getTypeColor(report.type)}>
                          {report.type}
                        </Badge>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-1" />
                          Configure
                        </Button>
                        <Button size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Run Now
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span>{report.recipients.length} recipients</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>{report.format} format</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recently Generated Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentReports.map((report, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{report.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Generated: {report.generated} • {report.size}
                        </div>
                      </div>
                      <Badge className={getTypeColor(report.type)}>
                        {report.type}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-muted-foreground">
                        {report.downloads} downloads
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {reportTemplates.map((template, index) => (
                  <Card key={index} className="border-2 border-dashed border-gray-200 hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{template.name}</h4>
                        <Badge className={getTypeColor(template.category)}>
                          {template.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {template.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Last used: {template.lastUsed}
                        </span>
                        <Button variant="outline" size="sm">
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Report Builder</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Advanced Report Builder</h3>
                <p>Create custom reports with drag-and-drop interface and advanced analytics</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
