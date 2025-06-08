import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Award, Clock, TrendingUp, Star, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { InstructorPerformanceMetrics } from '@/types/team-management';

interface InstructorPerformanceDashboardProps {
  instructorId?: string;
}

function InstructorPerformanceDashboard({ instructorId }: InstructorPerformanceDashboardProps) {
  const [selectedInstructor, setSelectedInstructor] = useState(instructorId || '');

  // Get list of instructors
  const { data: instructors = [] } = useQuery({
    queryKey: ['instructors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, role')
        .in('role', ['IC', 'IP', 'IT'])
        .order('display_name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Get instructor performance metrics using the new database function
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['instructor-performance', selectedInstructor],
    queryFn: async (): Promise<InstructorPerformanceMetrics | null> => {
      if (!selectedInstructor) return null;
      
      const { data, error } = await supabase.rpc('get_instructor_performance_metrics', {
        p_instructor_id: selectedInstructor
      });
      
      if (error) throw error;
      return data as InstructorPerformanceMetrics;
    },
    enabled: !!selectedInstructor
  });

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      'IC': 'Certified Instructor',
      'IP': 'Provisional Instructor', 
      'IT': 'Instructor Trainee'
    };
    return roleMap[role] || role;
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
      {/* Header with Instructor Selection */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Instructor Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive performance metrics and analytics
          </p>
        </div>
        <div className="w-64">
          <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
            <SelectTrigger>
              <SelectValue placeholder="Select an instructor" />
            </SelectTrigger>
            <SelectContent>
              {instructors.map((instructor) => (
                <SelectItem key={instructor.id} value={instructor.id}>
                  {instructor.display_name} ({getRoleDisplayName(instructor.role)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!metrics ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Select an instructor to view their performance metrics
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Instructor Info Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{metrics.instructorName}</h2>
                  <p className="text-muted-foreground">{getRoleDisplayName(metrics.role)}</p>
                </div>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  Performance Score: {Math.round((metrics.averageRating / 5) * 100)}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sessions</p>
                    <p className="text-3xl font-bold">{metrics.totalSessions}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Teaching Hours</p>
                    <p className="text-3xl font-bold">{Math.round(metrics.totalHours)}</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Certificates Issued</p>
                    <p className="text-3xl font-bold">{metrics.certificatesIssued}</p>
                  </div>
                  <Award className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Average Session Rating</p>
                    <p className="text-3xl font-bold">{metrics.averageSessionRating}/5</p>
                  </div>
                  <Star className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Students Taught</p>
                    <p className="text-3xl font-bold">{metrics.studentsCount}</p>
                  </div>
                  <Users className="h-8 w-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Compliance Score</p>
                    <p className={`text-3xl font-bold ${getComplianceColor(metrics.complianceScore)}`}>
                      {metrics.complianceScore}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Teaching Effectiveness</span>
                  <Badge variant={metrics.averageRating >= 4 ? 'default' : 'secondary'}>
                    {metrics.averageRating >= 4 ? 'Excellent' : 'Good'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Compliance Status</span>
                  <Badge variant={metrics.complianceScore >= 90 ? 'default' : 'destructive'}>
                    {metrics.complianceScore >= 90 ? 'Compliant' : 'Needs Attention'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Activity Level</span>
                  <Badge variant={metrics.totalSessions >= 10 ? 'default' : 'secondary'}>
                    {metrics.totalSessions >= 10 ? 'High' : 'Moderate'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export { InstructorPerformanceDashboard };
export default InstructorPerformanceDashboard;
