
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
      // Ensure all required properties exist with correct property names
      if (typeof item === 'object' && item !== null) {
        return {
          instructor_id: item.instructor_id || item.instructorId || '',
          instructor_name: item.instructor_name || item.instructorName || 'Unknown',
          total_sessions: item.total_sessions || item.totalSessions || 0,
          total_hours: item.total_hours || item.totalHours || 0,
          average_rating: item.average_rating || item.averageRating || 0,
          completion_rate: item.completion_rate || 0,
          student_satisfaction: item.student_satisfaction || 0,
          certification_success_rate: item.certification_success_rate || item.certificatesIssued || 0,
          monthly_breakdown: item.monthly_breakdown || [],
          performance_trends: item.performance_trends || {
            sessions_trend: 0,
            rating_trend: 0,
            satisfaction_trend: 0
          },
          last_updated: item.last_updated || new Date().toISOString()
        } as InstructorPerformanceMetrics;
      }
      
      // Fallback for invalid data
      return {
        instructor_id: '',
        instructor_name: 'Unknown',
        total_sessions: 0,
        total_hours: 0,
        average_rating: 0,
        completion_rate: 0,
        student_satisfaction: 0,
        certification_success_rate: 0,
        monthly_breakdown: [],
        performance_trends: {
          sessions_trend: 0,
          rating_trend: 0,
          satisfaction_trend: 0
        },
        last_updated: new Date().toISOString()
      } as InstructorPerformanceMetrics;
    });
  };

  const safeInstructorData = parseInstructorData(instructorPerformance || []);

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
              <XAxis dataKey="instructor_name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="student_satisfaction" fill="#3B82F6" name="Student Satisfaction" />
              <Bar dataKey="average_rating" fill="#10B981" name="Average Rating" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Instructor Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {safeInstructorData.map((instructor) => (
          <Card key={instructor.instructor_id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <div>
                    <CardTitle className="text-lg">{instructor.instructor_name}</CardTitle>
                    <Badge variant="outline">Instructor</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Performance Score */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Student Satisfaction</span>
                  <span className={getPerformanceColor(instructor.student_satisfaction)}>
                    {instructor.student_satisfaction}%
                  </span>
                </div>
                <Progress value={instructor.student_satisfaction} className="h-2" />
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="font-medium">{instructor.total_sessions}</div>
                    <div className="text-muted-foreground">Sessions</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="font-medium">{instructor.certification_success_rate}</div>
                    <div className="text-muted-foreground">Certificates</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <div>
                    <div className="font-medium">{instructor.total_hours}</div>
                    <div className="text-muted-foreground">Hours</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-orange-500" />
                  <div>
                    <div className="font-medium">{Math.round(instructor.completion_rate)}%</div>
                    <div className="text-muted-foreground">Completion</div>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span>Average Rating</span>
                  <span className="font-medium">{instructor.average_rating}/5.0</span>
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
                {safeInstructorData.reduce((sum, i) => sum + i.total_sessions, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {safeInstructorData.reduce((sum, i) => sum + i.certification_success_rate, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Certificates Issued</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(
                  safeInstructorData.reduce((sum, i) => sum + i.student_satisfaction, 0) / 
                  Math.max(safeInstructorData.length, 1)
                )}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Satisfaction</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default InstructorPerformanceDashboard;
