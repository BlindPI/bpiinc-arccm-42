
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useReportingAnalytics } from '@/hooks/useReportingAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { User, Award, Clock, TrendingUp } from 'lucide-react';
import type { InstructorPerformanceMetrics } from '@/types/team-management';

export function InstructorPerformanceDashboard() {
  const { instructorPerformance, isLoading } = useReportingAnalytics();

  // Safe data parsing with validation
  const parseInstructorData = (data: any): InstructorPerformanceMetrics[] => {
    if (!Array.isArray(data)) return [];
    
    return data.map((item: any) => {
      // Ensure all required properties exist
      if (typeof item === 'object' && item !== null) {
        return {
          instructorId: item.instructorId || '',
          instructorName: item.instructorName || 'Unknown',
          role: item.role || 'IT',
          totalSessions: item.totalSessions || 0,
          totalHours: item.totalHours || 0,
          averageRating: item.averageRating || 0,
          averageSessionRating: item.averageSessionRating || 0,
          certificatesIssued: item.certificatesIssued || 0,
          complianceScore: item.complianceScore || 0,
          studentsCount: item.studentsCount || 0
        } as InstructorPerformanceMetrics;
      }
      
      // Fallback for invalid data
      return {
        instructorId: '',
        instructorName: 'Unknown',
        role: 'IT',
        totalSessions: 0,
        totalHours: 0,
        averageRating: 0,
        averageSessionRating: 0,
        certificatesIssued: 0,
        complianceScore: 0,
        studentsCount: 0
      } as InstructorPerformanceMetrics;
    });
  };

  const safeInstructorData = parseInstructorData(instructorPerformance || []);

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'IT': return 'default';
      case 'IP': return 'secondary';
      case 'IC': return 'outline';
      default: return 'secondary';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
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
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Instructor Performance Dashboard</h2>
        <p className="text-muted-foreground">
          Comprehensive performance metrics and analytics for all instructors
        </p>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={safeInstructorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="instructorName" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="complianceScore" fill="#3B82F6" name="Compliance Score" />
              <Bar dataKey="averageRating" fill="#10B981" name="Average Rating" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Instructor Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {safeInstructorData.map((instructor) => (
          <Card key={instructor.instructorId}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <div>
                    <CardTitle className="text-lg">{instructor.instructorName}</CardTitle>
                    <Badge variant={getRoleBadgeVariant(instructor.role)}>
                      {instructor.role}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Performance Score */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Compliance Score</span>
                  <span className={getPerformanceColor(instructor.complianceScore)}>
                    {instructor.complianceScore}%
                  </span>
                </div>
                <Progress value={instructor.complianceScore} className="h-2" />
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="font-medium">{instructor.totalSessions}</div>
                    <div className="text-muted-foreground">Sessions</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="font-medium">{instructor.certificatesIssued}</div>
                    <div className="text-muted-foreground">Certificates</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <div>
                    <div className="font-medium">{instructor.totalHours}</div>
                    <div className="text-muted-foreground">Hours</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-orange-500" />
                  <div>
                    <div className="font-medium">{instructor.studentsCount}</div>
                    <div className="text-muted-foreground">Students</div>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span>Average Rating</span>
                  <span className="font-medium">{instructor.averageRating}/5.0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {safeInstructorData.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Instructors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {safeInstructorData.reduce((sum, i) => sum + i.totalSessions, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {safeInstructorData.reduce((sum, i) => sum + i.certificatesIssued, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Certificates Issued</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(
                  safeInstructorData.reduce((sum, i) => sum + i.complianceScore, 0) / 
                  Math.max(safeInstructorData.length, 1)
                )}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Compliance</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default InstructorPerformanceDashboard;
