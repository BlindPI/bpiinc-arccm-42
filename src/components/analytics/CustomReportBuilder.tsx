
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Download, Settings, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ReportField {
  field: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  table: string;
}

interface CustomReport {
  id: string;
  name: string;
  description?: string;
  report_type: string;
  configuration: {
    fields: string[];
    filters: any[];
    groupBy?: string;
    orderBy?: string;
  };
  is_automated: boolean;
  schedule_config?: any;
  created_at: string;
}

export function CustomReportBuilder() {
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [reportType, setReportType] = useState('custom');
  const [showSchedule, setShowSchedule] = useState(false);
  const queryClient = useQueryClient();

  const availableFields: ReportField[] = [
    { field: 'certificates.recipient_name', label: 'Recipient Name', type: 'string', table: 'certificates' },
    { field: 'certificates.course_name', label: 'Course Name', type: 'string', table: 'certificates' },
    { field: 'certificates.status', label: 'Certificate Status', type: 'string', table: 'certificates' },
    { field: 'certificates.issue_date', label: 'Issue Date', type: 'date', table: 'certificates' },
    { field: 'certificates.expiry_date', label: 'Expiry Date', type: 'date', table: 'certificates' },
    { field: 'certificates.created_at', label: 'Created Date', type: 'date', table: 'certificates' },
    { field: 'profiles.display_name', label: 'User Name', type: 'string', table: 'profiles' },
    { field: 'profiles.role', label: 'User Role', type: 'string', table: 'profiles' },
    { field: 'profiles.organization', label: 'Organization', type: 'string', table: 'profiles' },
    { field: 'courses.name', label: 'Course Title', type: 'string', table: 'courses' },
    { field: 'courses.length', label: 'Course Length', type: 'number', table: 'courses' },
    { field: 'courses.status', label: 'Course Status', type: 'string', table: 'courses' }
  ];

  const { data: existingReports = [] } = useQuery({
    queryKey: ['custom-reports'],
    queryFn: async (): Promise<CustomReport[]> => {
      const { data, error } = await supabase
        .from('analytics_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      return (data || []).map(report => ({
        ...report,
        configuration: typeof report.configuration === 'string' 
          ? JSON.parse(report.configuration)
          : report.configuration || { fields: [], filters: [] }
      }));
    }
  });

  const createReportMutation = useMutation({
    mutationFn: async (reportData: Partial<CustomReport>) => {
      const { data, error } = await supabase
        .from('analytics_reports')
        .insert({
          name: reportData.name,
          description: reportData.description,
          report_type: reportData.report_type || 'custom',
          configuration: reportData.configuration,
          is_automated: reportData.is_automated || false,
          schedule_config: reportData.schedule_config
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Report created successfully');
      queryClient.invalidateQueries({ queryKey: ['custom-reports'] });
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create report: ${error.message}`);
    }
  });

  const generateReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const report = existingReports.find(r => r.id === reportId);
      if (!report) throw new Error('Report not found');

      // Build the query based on report configuration
      let query = supabase.from('certificates').select('*');
      
      // Apply filters and generate the report data
      const { data, error } = await query;
      if (error) throw error;

      return data;
    },
    onSuccess: (data, reportId) => {
      // Convert data to CSV and download
      const report = existingReports.find(r => r.id === reportId);
      if (data && report) {
        downloadCSV(data, `${report.name}_${new Date().toISOString().split('T')[0]}.csv`);
        toast.success('Report generated and downloaded');
      }
    },
    onError: (error) => {
      toast.error(`Failed to generate report: ${error.message}`);
    }
  });

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setReportName('');
    setReportDescription('');
    setSelectedFields([]);
    setReportType('custom');
    setShowSchedule(false);
  };

  const handleFieldToggle = (fieldId: string, checked: boolean) => {
    if (checked) {
      setSelectedFields([...selectedFields, fieldId]);
    } else {
      setSelectedFields(selectedFields.filter(f => f !== fieldId));
    }
  };

  const handleCreateReport = () => {
    if (!reportName || selectedFields.length === 0) {
      toast.error('Please provide report name and select at least one field');
      return;
    }

    createReportMutation.mutate({
      name: reportName,
      description: reportDescription,
      report_type: reportType,
      configuration: {
        fields: selectedFields,
        filters: [],
        groupBy: undefined,
        orderBy: 'created_at'
      },
      is_automated: showSchedule
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Builder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Custom Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                placeholder="Describe what this report shows"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Report</SelectItem>
                  <SelectItem value="certificate_analysis">Certificate Analysis</SelectItem>
                  <SelectItem value="user_activity">User Activity</SelectItem>
                  <SelectItem value="course_performance">Course Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Fields to Include</Label>
              <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                {availableFields.map((field) => (
                  <div key={field.field} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.field}
                      checked={selectedFields.includes(field.field)}
                      onCheckedChange={(checked) => handleFieldToggle(field.field, checked as boolean)}
                    />
                    <div className="flex-1">
                      <label htmlFor={field.field} className="text-sm font-medium cursor-pointer">
                        {field.label}
                      </label>
                      <div className="text-xs text-muted-foreground">
                        {field.table}.{field.field.split('.')[1]} ({field.type})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="schedule"
                checked={showSchedule}
                onCheckedChange={(checked) => setShowSchedule(checked as boolean)}
              />
              <Label htmlFor="schedule">Enable automated scheduling</Label>
            </div>

            <Button 
              onClick={handleCreateReport}
              disabled={createReportMutation.isPending || !reportName || selectedFields.length === 0}
              className="w-full"
            >
              {createReportMutation.isPending ? 'Creating...' : 'Create Report'}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Saved Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {existingReports.map((report) => (
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
                        <Badge variant="outline">
                          {report.configuration.fields?.length || 0} fields
                        </Badge>
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
                        onClick={() => generateReportMutation.mutate(report.id)}
                        disabled={generateReportMutation.isPending}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {existingReports.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No custom reports created yet</p>
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
