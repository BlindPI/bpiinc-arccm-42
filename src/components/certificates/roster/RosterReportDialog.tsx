
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  FileText, 
  BarChart3, 
  Users, 
  Award,
  Mail,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { RosterReportService, RosterReportData } from '@/services/reports/rosterReportService';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface RosterReportDialogProps {
  rosterId: string;
  rosterName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RosterReportDialog({ 
  rosterId, 
  rosterName, 
  open, 
  onOpenChange 
}: RosterReportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);

  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ['roster-report', rosterId],
    queryFn: () => RosterReportService.generateRosterReport(rosterId),
    enabled: open && !!rosterId
  });

  const handleExportCSV = async () => {
    if (!reportData) return;
    
    try {
      setIsExporting(true);
      const csvContent = await RosterReportService.exportRosterReportToCSV(reportData);
      const filename = `roster-report-${rosterName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      
      RosterReportService.downloadCSV(csvContent, filename);
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generating Report...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
              <p>Analyzing roster data...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !reportData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <p className="text-red-600">Failed to generate report. Please try again.</p>
        </DialogContent>
      </Dialog>
    );
  }

  const { roster, statistics, courseBreakdown, statusBreakdown } = reportData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Roster Report: {roster.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Summary Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{statistics.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{statistics.active}</div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{statistics.expired}</div>
                  <div className="text-sm text-muted-foreground">Expired</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{statistics.revoked}</div>
                  <div className="text-sm text-muted-foreground">Revoked</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{statistics.emailSuccessRate}%</div>
                  <div className="text-sm text-muted-foreground">Email Success</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certificate Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {statusBreakdown.map((item) => (
                <div key={item.status} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{item.status}</span>
                    <Badge variant="outline">{item.count} ({item.percentage}%)</Badge>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Course Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Course Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {courseBreakdown.map((item) => (
                <div key={item.courseName} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{item.courseName}</span>
                    <Badge variant="outline">{item.count} ({item.percentage}%)</Badge>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Email Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Emails Sent</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {statistics.emailed}
                    </Badge>
                  </div>
                  <Progress value={(statistics.emailed / statistics.total) * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Not Sent</span>
                    <Badge variant="outline" className="bg-gray-50 text-gray-700">
                      {statistics.total - statistics.emailed}
                    </Badge>
                  </div>
                  <Progress value={((statistics.total - statistics.emailed) / statistics.total) * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Roster Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Roster Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Created:</span> {format(new Date(roster.created_at), 'PPP p')}
                </div>
                <div>
                  <span className="font-medium">Status:</span> 
                  <Badge variant={roster.status === 'ACTIVE' ? 'default' : 'secondary'} className="ml-2">
                    {roster.status}
                  </Badge>
                </div>
                {roster.issue_date && (
                  <div>
                    <span className="font-medium">Issue Date:</span> {format(new Date(roster.issue_date), 'PPP')}
                  </div>
                )}
                <div>
                  <span className="font-medium">Certificate Count:</span> {roster.certificate_count}
                </div>
              </div>
              {roster.description && (
                <div className="mt-4">
                  <span className="font-medium">Description:</span>
                  <p className="mt-1 text-sm text-muted-foreground">{roster.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handleExportCSV} disabled={isExporting}>
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
