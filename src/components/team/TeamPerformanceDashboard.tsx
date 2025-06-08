
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { teamManagementService } from '@/services/team/teamManagementService';
import { 
  TrendingUp, 
  Award, 
  Users, 
  Target,
  Calendar,
  MapPin
} from 'lucide-react';
import type { TeamPerformanceMetrics } from '@/types/team-management';

interface TeamPerformanceDashboardProps {
  teamId: string;
}

export function TeamPerformanceDashboard({ teamId }: TeamPerformanceDashboardProps) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['team-performance-metrics', teamId],
    queryFn: () => teamManagementService.getTeamPerformanceMetrics(teamId)
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Performance Data</h3>
          <p className="text-muted-foreground">Performance metrics will appear here once data is available.</p>
        </CardContent>
      </Card>
    );
  }

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
            <div className="text-2xl font-bold">{metrics.total_certificates}</div>
            <p className="text-xs text-muted-foreground mt-1">Total certificates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Courses Conducted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_courses}</div>
            <p className="text-xs text-muted-foreground mt-1">Training sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Satisfaction Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.averageSatisfaction.toFixed(1)}%</div>
            <Progress value={metrics.averageSatisfaction} className="mt-2" />
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
            <div className="text-2xl font-bold text-blue-600">{metrics.complianceScore.toFixed(1)}%</div>
            <Progress value={metrics.complianceScore} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Location Information */}
      {metrics.location_name && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Team Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium">{metrics.location_name}</p>
                <p className="text-sm text-muted-foreground">Primary operational location</p>
              </div>
              <Badge variant="outline">Active</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{metrics.total_certificates}</div>
              <p className="text-sm text-muted-foreground">Total Certificates</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{metrics.total_courses}</div>
              <p className="text-sm text-muted-foreground">Training Sessions</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">{metrics.averageSatisfaction.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">Avg Satisfaction</p>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Performance Trend</span>
              <Badge variant={metrics.complianceScore >= 80 ? 'default' : 'secondary'}>
                {metrics.complianceScore >= 80 ? 'Excellent' : 'Good'}
              </Badge>
            </div>
            <Progress value={metrics.performance_trend} className="mt-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
