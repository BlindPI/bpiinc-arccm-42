
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from '@tanstack/react-query';
import { teamManagementService } from '@/services/team/teamManagementService';
import { TrendingUp, Award, Users, Target } from 'lucide-react';

interface TeamPerformanceDashboardProps {
  teamId: string;
}

export function TeamPerformanceDashboard({ teamId }: TeamPerformanceDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  const { data: performanceSummary, isLoading } = useQuery({
    queryKey: ['team-performance-summary', teamId, selectedPeriod],
    queryFn: () => teamManagementService.getTeamPerformanceSummary(teamId, selectedPeriod)
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading performance data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Performance Analytics</h3>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Certificates Issued</p>
                <p className="text-2xl font-bold">{performanceSummary?.total_certificates || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Courses Conducted</p>
                <p className="text-2xl font-bold">{performanceSummary?.total_courses || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Satisfaction Score</p>
                <p className="text-2xl font-bold">
                  {performanceSummary?.avg_satisfaction ? 
                    `${(performanceSummary.avg_satisfaction * 100).toFixed(1)}%` : 
                    'N/A'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Compliance Score</p>
                <p className="text-2xl font-bold">
                  {performanceSummary?.compliance_score ? 
                    `${performanceSummary.compliance_score.toFixed(1)}%` : 
                    'N/A'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location Performance */}
      {performanceSummary?.location_name && (
        <Card>
          <CardHeader>
            <CardTitle>Location Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{performanceSummary.location_name}</p>
                  <p className="text-sm text-muted-foreground">Primary location for this team</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{performanceSummary.performance_trend?.toFixed(1) || '0.0'}</p>
                  <p className="text-sm text-muted-foreground">Performance Trend</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Details */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          {performanceSummary ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Total Certificates</p>
                  <p className="text-lg">{performanceSummary.total_certificates}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Courses</p>
                  <p className="text-lg">{performanceSummary.total_courses}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Average Satisfaction</p>
                  <p className="text-lg">
                    {performanceSummary.avg_satisfaction ? 
                      `${(performanceSummary.avg_satisfaction * 100).toFixed(1)}%` : 
                      'No data'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Compliance Score</p>
                  <p className="text-lg">
                    {performanceSummary.compliance_score ? 
                      `${performanceSummary.compliance_score.toFixed(1)}%` : 
                      'No data'
                    }
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No performance data available</p>
              <p className="text-sm">Performance metrics will appear as team activities are recorded</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
