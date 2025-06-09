
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  BarChart3, 
  FileText, 
  Calendar, 
  Database,
  Download,
  Play,
  Settings,
  Filter,
  Table,
  PieChart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  report_type: 'team_performance' | 'compliance_overview' | 'location_analytics' | 'custom';
  data_sources: string[];
  visualization_config: Record<string, any>;
  schedule_config?: Record<string, any>;
  filters: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface DataSource {
  table: string;
  label: string;
  description: string;
  available_fields: string[];
}

export function AdvancedReportBuilder() {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [newReport, setNewReport] = useState({
    name: '',
    description: '',
    report_type: 'custom' as const,
    data_sources: [] as string[],
    filters: {}
  });

  const queryClient = useQueryClient();

  // Available data sources
  const dataSources: DataSource[] = [
    {
      table: 'profiles',
      label: 'User Profiles',
      description: 'User account and profile information',
      available_fields: ['display_name', 'email', 'role', 'organization', 'created_at']
    },
    {
      table: 'teams',
      label: 'Teams',
      description: 'Team structure and performance data',
      available_fields: ['name', 'team_type', 'status', 'performance_score', 'created_at']
    },
    {
      table: 'certificates',
      label: 'Certificates',
      description: 'Certificate issuance and status tracking',
      available_fields: ['recipient_name', 'course_name', 'issue_date', 'expiry_date', 'status']
    },
    {
      table: 'compliance_issues',
      label: 'Compliance Issues',
      description: 'Compliance tracking and resolution data',
      available_fields: ['issue_type', 'severity', 'status', 'created_at', 'resolved_at']
    }
  ];

  const { data: reportTemplates = [], isLoading } = useQuery({
    queryKey: ['report-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ReportTemplate[];
    }
  });

  const { data: reportExecutions = [] } = useQuery({
    queryKey: ['report-executions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_executions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    }
  });

  const createReportMutation = useMutation({
    mutationFn: async (reportData: typeof newReport) => {
      const { data, error } = await supabase
        .from('report_templates')
        .insert({
          ...reportData,
          visualization_config: { chart_type: 'table', display_options: {} },
          filters: reportData.filters || {}
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Report template created successfully');
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      setNewReport({
        name: '',
        description: '',
        report_type: 'custom',
        data_sources: [],
        filters: {}
      });
    },
    onError: (error) => {
      toast.error(`Failed to create report: ${error.message}`);
    }
  });

  const executeReportMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { data, error } = await supabase
        .from('report_executions')
        .insert({
          template_id: templateId,
          status: 'running',
          executed_by: (await supabase.auth.getUser()).data.user?.id,
          execution_params: {}
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Simulate report execution
      setTimeout(async () => {
        await supabase
          .from('report_executions')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
            result_data: { sample: 'data' }
          })
          .eq('id', data.id);
          
        queryClient.invalidateQueries({ queryKey: ['report-executions'] });
      }, 3000);
      
      return data;
    },
    onSuccess: () => {
      toast.success('Report execution started');
      queryClient.invalidateQueries({ queryKey: ['report-executions'] });
    }
  });

  const handleDataSourceToggle = (table: string) => {
    const isSelected = newReport.data_sources.includes(table);
    if (isSelected) {
      setNewReport({
        ...newReport,
        data_sources: newReport.data_sources.filter(ds => ds !== table)
      });
    } else {
      setNewReport({
        ...newReport,
        data_sources: [...newReport.data_sources, table]
      });
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'team_performance': return <BarChart3 className="h-4 w-4" />;
      case 'compliance_overview': return <Settings className="h-4 w-4" />;
      case 'location_analytics': return <PieChart className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Advanced Report Builder
          </h1>
          <p className="text-muted-foreground">
            Create custom reports with real-time data visualization
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
          <TabsTrigger value="builder">Report Builder</TabsTrigger>
          <TabsTrigger value="executions">Execution History</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {reportTemplates.map((template) => (
              <Card key={template.id} className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getReportTypeIcon(template.report_type)}
                    {template.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {template.data_sources.map((source) => (
                      <Badge key={source} variant="outline" className="text-xs">
                        <Database className="h-3 w-3 mr-1" />
                        {source}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => executeReportMutation.mutate(template.id)}
                      disabled={executeReportMutation.isPending}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Execute
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {reportTemplates.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No report templates created yet</p>
                <p className="text-sm text-gray-500">
                  Use the Report Builder to create your first custom report
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="report-name">Report Name</Label>
                  <Input
                    id="report-name"
                    placeholder="Enter report name"
                    value={newReport.name}
                    onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="report-type">Report Type</Label>
                  <select
                    id="report-type"
                    className="w-full px-3 py-2 border rounded-md"
                    value={newReport.report_type}
                    onChange={(e) => setNewReport({ 
                      ...newReport, 
                      report_type: e.target.value as any
                    })}
                  >
                    <option value="custom">Custom Report</option>
                    <option value="team_performance">Team Performance</option>
                    <option value="compliance_overview">Compliance Overview</option>
                    <option value="location_analytics">Location Analytics</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="report-description">Description</Label>
                <Textarea
                  id="report-description"
                  placeholder="Describe the purpose of this report"
                  value={newReport.description}
                  onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                />
              </div>

              {/* Data Sources Selection */}
              <div>
                <Label>Data Sources</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {dataSources.map((source) => (
                    <div key={source.table} className="flex items-start space-x-3 p-4 border rounded-lg">
                      <Checkbox
                        checked={newReport.data_sources.includes(source.table)}
                        onCheckedChange={() => handleDataSourceToggle(source.table)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{source.label}</div>
                        <div className="text-sm text-muted-foreground">{source.description}</div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {source.available_fields.slice(0, 3).map((field) => (
                            <Badge key={field} variant="outline" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                          {source.available_fields.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{source.available_fields.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={() => createReportMutation.mutate(newReport)}
                disabled={!newReport.name || newReport.data_sources.length === 0 || createReportMutation.isPending}
              >
                Create Report Template
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Report Executions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportExecutions.map((execution: any) => (
                  <div key={execution.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Report Execution #{execution.id.slice(0, 8)}</div>
                      <div className="text-sm text-muted-foreground">
                        Started: {new Date(execution.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        execution.status === 'completed' ? 'default' :
                        execution.status === 'running' ? 'secondary' : 'destructive'
                      }>
                        {execution.status}
                      </Badge>
                      {execution.status === 'completed' && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {reportExecutions.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No report executions yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No scheduled reports configured</p>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
