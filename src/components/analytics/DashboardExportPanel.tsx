
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Download, 
  FileText, 
  Image, 
  Share, 
  Mail,
  Calendar,
  Settings
} from 'lucide-react';

interface DashboardExportPanelProps {
  dashboardData: {
    executive: any;
    teams: any;
    heatmap: any;
    risks: any;
  };
}

export function DashboardExportPanel({ dashboardData }: DashboardExportPanelProps) {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'xlsx' | 'csv' | 'png'>('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);

  const handleExport = async () => {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        format: exportFormat,
        includeCharts,
        includeRawData,
        data: dashboardData
      };

      if (exportFormat === 'csv') {
        exportToCSV(exportData);
      } else if (exportFormat === 'xlsx') {
        exportToExcel(exportData);
      } else if (exportFormat === 'pdf') {
        exportToPDF(exportData);
      } else if (exportFormat === 'png') {
        exportToImage();
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const exportToCSV = (data: any) => {
    const csvContent = [
      ['Metric', 'Value', 'Category'],
      ['Total Teams', data.data.teams?.totalTeams || 0, 'Teams'],
      ['Total Members', data.data.teams?.totalMembers || 0, 'Teams'],
      ['Average Performance', data.data.teams?.averagePerformance || 0, 'Performance'],
      ['Average Compliance', data.data.teams?.averageCompliance || 0, 'Compliance']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = (data: any) => {
    // Simplified Excel export - in real implementation would use a library like xlsx
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = (data: any) => {
    // Simplified PDF export - in real implementation would use a library like jsPDF
    const content = `
      Dashboard Export Report
      Generated: ${new Date().toLocaleString()}
      
      Teams Overview:
      - Total Teams: ${data.data.teams?.totalTeams || 0}
      - Total Members: ${data.data.teams?.totalMembers || 0}
      - Average Performance: ${data.data.teams?.averagePerformance || 0}%
      - Average Compliance: ${data.data.teams?.averageCompliance || 0}%
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToImage = () => {
    // In a real implementation, this would capture the dashboard as an image
    console.log('Image export would capture dashboard screenshot');
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={exportFormat} onValueChange={(value: 'pdf' | 'xlsx' | 'csv' | 'png') => setExportFormat(value)}>
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pdf">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              PDF
            </div>
          </SelectItem>
          <SelectItem value="xlsx">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Excel
            </div>
          </SelectItem>
          <SelectItem value="csv">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              CSV
            </div>
          </SelectItem>
          <SelectItem value="png">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              PNG
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>

      <Button variant="ghost" size="sm">
        <Share className="h-4 w-4 mr-2" />
        Share
      </Button>
    </div>
  );
}
