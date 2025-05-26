
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Award,
  Download,
  Filter,
  BarChart3
} from 'lucide-react';
import { useReportingAnalytics } from '@/hooks/useReportingAnalytics';
import { PageHeader } from '@/components/ui/PageHeader';

export const InstructorPerformanceDashboard: React.FC = () => {
  const { useInstructorPerformance, generateReport } = useReportingAnalytics();
  const [timeRange, setTimeRange] = useState('6');
  const [sortBy, setSortBy] = useState('complianceScore');

  const { data: performanceData, isLoading } = useInstructorPerformance(timeRange);

  const sortedData = performanceData?.slice().sort((a, b) => {
    switch (sortBy) {
      case 'complianceScore':
        return b.complianceScore - a.complianceScore;
      case 'totalHours':
        return b.totalHours - a.totalHours;
      case 'certificatesIssued':
        return b.certificatesIssued - a.certificatesIssued;
      default:
        return 0;
    }
  });

  const handleExportReport = () => {
    generateReport.mutate({ type: 'instructor_performance', timeRange });
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <BarChart3 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const avgCompliance = sortedData?.reduce((sum, i) => sum + i.complianceScore, 0) / (sortedData?.length || 1);
  const avgHours = sortedData?.reduce((sum, i) => sum + i.totalHours, 0) / (sortedData?.length || 1);
  const totalCertificates = sortedData?.reduce((sum, i) => sum + i.certificatesIssued, 0) || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<TrendingUp className="h-7 w-7 text-primary" />}
        title="Instructor Performance Analytics"
        subtitle="Comprehensive instructor performance metrics and insights"
        actions={
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Last 3 months</SelectItem>
                <SelectItem value="6">Last 6 months</SelectItem>
                <SelectItem value="12">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportReport} disabled={generateReport.isPending}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{sortedData?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Active Instructors</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{avgCompliance.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Avg Compliance</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{avgHours.toFixed(0)}</div>
              <div className="text-sm text-muted-foreground">Avg Hours</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{totalCertificates}</div>
              <div className="text-sm text-muted-foreground">Certificates Issued</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Performance Overview
            </CardTitle>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="complianceScore">Compliance Score</SelectItem>
                <SelectItem value="totalHours">Total Hours</SelectItem>
                <SelectItem value="certificatesIssued">Certificates Issued</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedData?.map((instructor) => (
              <div key={instructor.instructorId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{instructor.instructorName}</h4>
                    <p className="text-sm text-muted-foreground">{instructor.role}</p>
                  </div>
                  <Badge className={getPerformanceBadge(instructor.complianceScore)}>
                    {instructor.complianceScore.toFixed(1)}% Compliant
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-lg font-semibold">{instructor.totalHours}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Total Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4 text-green-500" />
                      <span className="text-lg font-semibold">{instructor.totalSessions}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Sessions</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Award className="h-4 w-4 text-purple-500" />
                      <span className="text-lg font-semibold">{instructor.certificatesIssued}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Certificates</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                      <span className="text-lg font-semibold">{instructor.averageSessionRating.toFixed(1)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4 text-indigo-500" />
                      <span className="text-lg font-semibold">{instructor.studentsCount}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Students</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Compliance Score</span>
                    <span className={getPerformanceColor(instructor.complianceScore)}>
                      {instructor.complianceScore.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={instructor.complianceScore} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstructorPerformanceDashboard;
