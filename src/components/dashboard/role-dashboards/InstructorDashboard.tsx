
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { RealTimeDashboardWidget } from '../RealTimeDashboardWidget';
import { DashboardDataService } from '@/services/dashboard/dashboardDataService';
import { 
  Award, 
  Users, 
  BookOpen, 
  Calendar,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface InstructorDashboardProps {
  teamContext?: any;
  config: any;
  profile: any;
}

export default function InstructorDashboard({ teamContext, config, profile }: InstructorDashboardProps) {
  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ['instructor-metrics', profile.id],
    queryFn: () => DashboardDataService.getInstructorMetrics(profile.id),
    refetchInterval: 30000
  });

  const { data: recentActivities = [] } = useQuery({
    queryKey: ['instructor-activities', profile.id],
    queryFn: () => DashboardDataService.getRecentActivities(profile.id, profile.role),
    refetchInterval: 60000
  });

  return (
    <div className="space-y-6">
      {/* Instructor Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RealTimeDashboardWidget
          title="Certificates Issued"
          icon={Award}
          value={metrics?.activeCertifications}
          status="success"
          isLoading={isLoading}
          onRefresh={refetch}
          realTime
          size="sm"
        />

        <RealTimeDashboardWidget
          title="Active Students"
          icon={Users}
          value={0} // Will implement when student enrollment data exists
          status="info"
          isLoading={isLoading}
          realTime
          size="sm"
        />

        <RealTimeDashboardWidget
          title="Courses Teaching"
          icon={BookOpen}
          value={0} // Will implement when course assignment data exists
          status="info"
          isLoading={isLoading}
          realTime
          size="sm"
        />
      </div>

      {/* Teaching Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RealTimeDashboardWidget
          title="Teaching Performance"
          icon={TrendingUp}
          isLoading={isLoading}
          realTime
          size="md"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Course Completion Rate</span>
              <span className="font-medium text-green-600">92%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Student Satisfaction</span>
              <span className="font-medium text-blue-600">4.7/5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Certificates This Month</span>
              <span className="font-medium">{metrics?.activeCertifications || 0}</span>
            </div>
          </div>
        </RealTimeDashboardWidget>

        <RealTimeDashboardWidget
          title="Recent Activities"
          icon={Calendar}
          isLoading={isLoading}
          realTime
          size="md"
        >
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {recentActivities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activities
              </p>
            )}
          </div>
        </RealTimeDashboardWidget>
      </div>

      {/* Instructor Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructor Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/certificates'}
              className="h-20 flex flex-col gap-2"
            >
              <Award className="h-6 w-6" />
              <span className="text-sm">Issue Certificates</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => console.log('Manage students')}
              className="h-20 flex flex-col gap-2"
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">My Students</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => console.log('Course materials')}
              className="h-20 flex flex-col gap-2"
            >
              <BookOpen className="h-6 w-6" />
              <span className="text-sm">Course Materials</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => console.log('Schedule classes')}
              className="h-20 flex flex-col gap-2"
            >
              <Calendar className="h-6 w-6" />
              <span className="text-sm">Schedule</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
