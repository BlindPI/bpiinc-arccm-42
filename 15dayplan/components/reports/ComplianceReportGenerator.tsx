import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { Label } from '../ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Checkbox } from '../ui/Checkbox';
import { format } from 'date-fns';
import { Download, FileSpreadsheet, Loader2, FileText } from 'lucide-react';
import { ComplianceReportService, ReportFilter } from '../../services/reports/complianceReportService';

export function ComplianceReportGenerator() {
  const [reportType, setReportType] = useState('status');
  const [reportFormat, setReportFormat] = useState('excel');
  const [isGenerating, setIsGenerating] = useState(false);
  const [filters, setFilters] = useState<ReportFilter>({
    role: '',
    tier: '',
    status: '',
    requirementType: '',
    dateFrom: '',
    dateTo: ''
  });
  const [includeStats, setIncludeStats] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  
  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };
  
  const handleDateChange = (key: string, date: Date | null) => {
    setFilters({
      ...filters,
      [key]: date ? format(date, 'yyyy-MM-dd') : ''
    });
  };
  
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    try {
      // Generate Excel report
      if (reportFormat === 'excel') {
        const blob = await ComplianceReportService.exportToExcel(filters);
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compliance-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('Report generated and downloaded');
      }
      // PDF export would be implemented similarly
      else if (reportFormat === 'pdf') {
        console.log('PDF generation not implemented yet');
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Reports</CardTitle>
        <CardDescription>
          Generate and export compliance reports for analysis and documentation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="filters" className="space-y-4">
          <TabsList>
            <TabsTrigger value="filters">Report Filters</TabsTrigger>
            <TabsTrigger value="options">Export Options</TabsTrigger>
          </TabsList>
          
          <TabsContent value="filters" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Report Type */}
              <div className="space-y-2">
                <Label htmlFor="report-type">Report Type</Label>
                <select
                  id="report-type"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="">Select report type</option>
                  <option value="status">Compliance Status Report</option>
                  <option value="progress">Progress Over Time Report</option>
                  <option value="comparison">Tier Comparison Report</option>
                  <option value="audit">Audit Trail Report</option>
                </select>
              </div>
              
              {/* Role Filter */}
              <div className="space-y-2">
                <Label htmlFor="role-filter">Role</Label>
                <select
                  id="role-filter"
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="">All Roles</option>
                  <option value="IT">Technology Provider (IT)</option>
                  <option value="IP">Integration Partner (IP)</option>
                  <option value="IC">Instructor (IC)</option>
                  <option value="AP">Authorized Provider (AP)</option>
                </select>
              </div>
              
              {/* Tier Filter */}
              <div className="space-y-2">
                <Label htmlFor="tier-filter">Compliance Tier</Label>
                <select
                  id="tier-filter"
                  value={filters.tier}
                  onChange={(e) => handleFilterChange('tier', e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="">All Tiers</option>
                  <option value="basic">Basic Tier</option>
                  <option value="robust">Robust Tier</option>
                </select>
              </div>
              
              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status-filter">Requirement Status</Label>
                <select
                  id="status-filter"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              {/* Requirement Type Filter */}
              <div className="space-y-2">
                <Label htmlFor="type-filter">Requirement Type</Label>
                <select
                  id="type-filter"
                  value={filters.requirementType}
                  onChange={(e) => handleFilterChange('requirementType', e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="">All Types</option>
                  <option value="document">Document</option>
                  <option value="training">Training</option>
                  <option value="certification">Certification</option>
                  <option value="assessment">Assessment</option>
                  <option value="form">Form</option>
                </select>
              </div>
              
              {/* Date Range Filters */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="date-from" className="text-xs">From</Label>
                    <input 
                      type="date" 
                      id="date-from" 
                      className="w-full border rounded p-2 text-sm"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="date-to" className="text-xs">To</Label>
                    <input 
                      type="date" 
                      id="date-to" 
                      className="w-full border rounded p-2 text-sm"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="options" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Export Format */}
              <div className="space-y-2">
                <Label htmlFor="format">Export Format</Label>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      id="format-excel" 
                      name="format"
                      checked={reportFormat === 'excel'}
                      onChange={() => setReportFormat('excel')}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="format-excel" className="flex items-center gap-1 cursor-pointer">
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      Excel
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      id="format-pdf" 
                      name="format"
                      checked={reportFormat === 'pdf'}
                      onChange={() => setReportFormat('pdf')}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="format-pdf" className="flex items-center gap-1 cursor-pointer">
                      <FileText className="h-4 w-4 text-red-600" />
                      PDF
                    </Label>
                  </div>
                </div>
              </div>
              
              {/* Include Statistics */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include-stats" 
                  checked={includeStats}
                  onCheckedChange={(checked) => setIncludeStats(Boolean(checked))}
                />
                <Label htmlFor="include-stats" className="cursor-pointer">
                  Include Statistics Summary
                </Label>
              </div>
              
              {/* Include Charts */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include-charts" 
                  checked={includeCharts}
                  onCheckedChange={(checked) => setIncludeCharts(Boolean(checked))}
                />
                <Label htmlFor="include-charts" className="cursor-pointer">
                  Include Charts and Visualizations
                </Label>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => {
          setFilters({
            role: '',
            tier: '',
            status: '',
            requirementType: '',
            dateFrom: '',
            dateTo: ''
          });
          setReportType('status');
          setReportFormat('excel');
        }}>
          Reset Filters
        </Button>
        
        <Button onClick={handleGenerateReport} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate Report
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}