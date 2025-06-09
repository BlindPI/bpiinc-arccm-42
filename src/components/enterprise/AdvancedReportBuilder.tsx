import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  BarChart3, 
  Users, 
  Download, 
  Plus, 
  Calendar,
  Settings,
  Filter,
  RefreshCw
} from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'user' | 'certificate' | 'training' | 'compliance';
  created_at: string;
  is_default: boolean;
}

export function AdvancedReportBuilder() {
  const [selectedType, setSelectedType] = useState<string>('user');
  const [reportName, setReportName] = useState<string>('');
  const [reportDescription, setReportDescription] = useState<string>('');

  // Mock data for now - will be replaced when proper tables are available
  const mockTemplates: ReportTemplate[] = [
    {
      id: '1',
      name: 'User Activity Report',
      description: 'Comprehensive user activity and engagement metrics',
      type: 'user',
      created_at: new Date().toISOString(),
      is_default: true
    },
    {
      id: '2',
      name: 'Certificate Compliance Report',
      description: 'Certificate issuance and compliance tracking',
      type: 'certificate',
      created_at: new Date().toISOString(),
      is_default: false
    }
  ];

  const reportTypes = [
    { value: 'user', label: 'User Reports', icon: Users },
    { value: 'certificate', label: 'Certificate Reports', icon: BarChart3 },
    { value: 'training', label: 'Training Reports', icon: Calendar },
    { value: 'compliance', label: 'Compliance Reports', icon: Settings }
  ];

  const handleCreateReport = () => {
    // Mock implementation - will be replaced with actual report generation
    console.log('Creating report:', { reportName, reportDescription, selectedType });
  };

  const handleExportReport = (template: ReportTemplate) => {
    // Mock implementation - will be replaced with actual export functionality
    console.log('Exporting report:', template.name);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Report Builder</h2>
          <p className="text-muted-foreground">
            Create custom reports and analytics dashboards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((type) => {
          const IconComponent = type.icon;
          return (
            <Card 
              key={type.value}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedType === type.value ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedType(type.value)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <IconComponent className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">{type.label}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Report Builder Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Name</label>
              <Input
                placeholder="Enter report name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Enter report description"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              rows={3}
            />
          </div>

          <Button onClick={handleCreateReport} disabled={!reportName.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Create Report
          </Button>
        </CardContent>
      </Card>

      {/* Existing Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Report Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockTemplates.map((template) => (
              <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{template.name}</h3>
                    {template.is_default && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(template.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExportReport(template)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
