
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Award, Users, Target } from 'lucide-react';

interface ProviderPerformanceViewProps {
  providerId: string;
}

export function ProviderPerformanceView({ providerId }: ProviderPerformanceViewProps) {
  // Mock performance data - in real implementation, fetch from API
  const performanceData = {
    totalCertificates: 245,
    totalCourses: 32,
    averageSatisfaction: 88.5,
    complianceScore: 92.0,
    performanceTrend: 15.2
  };

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Award className="h-4 w-4" />
              Certificates Issued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.totalCertificates}</div>
            <p className="text-xs text-muted-foreground mt-1">Total certificates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Courses Conducted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData.totalCourses}</div>
            <p className="text-xs text-muted-foreground mt-1">Training sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Satisfaction Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{performanceData.averageSatisfaction}%</div>
            <Progress value={performanceData.averageSatisfaction} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Compliance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{performanceData.complianceScore}%</div>
            <Progress value={performanceData.complianceScore} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{performanceData.totalCertificates}</div>
              <p className="text-sm text-muted-foreground">Total Certificates</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{performanceData.totalCourses}</div>
              <p className="text-sm text-muted-foreground">Training Sessions</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{performanceData.averageSatisfaction}%</div>
              <p className="text-sm text-muted-foreground">Avg Satisfaction</p>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Performance Trend</span>
              <Badge variant={performanceData.performanceTrend > 0 ? 'default' : 'secondary'}>
                {performanceData.performanceTrend > 0 ? `+${performanceData.performanceTrend}%` : `${performanceData.performanceTrend}%`}
              </Badge>
            </div>
            <Progress value={Math.abs(performanceData.performanceTrend) + 50} className="mt-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
