
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { RealTimeDashboardWidget } from '../RealTimeDashboardWidget';
import { DashboardDataService } from '@/services/dashboard/dashboardDataService';
import { 
  Award, 
  BookOpen, 
  Clock, 
  TrendingUp,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface StudentDashboardProps {
  config: any;
  profile: any;
}

export default function StudentDashboard({ config, profile }: StudentDashboardProps) {
  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ['student-metrics', profile.id],
    queryFn: () => DashboardDataService.getStudentMetrics(profile.id),
    refetchInterval: 30000
  });

  const { data: recentActivities = [] } = useQuery({
    queryKey: ['student-activities', profile.id],
    queryFn: () => DashboardDataService.getRecentActivities(profile.id, 'ST'),
    refetchInterval: 60000
  });

  return (
    <div className="space-y-6">
      {/* Student Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RealTimeDashboardWidget
          title="My Certificates"
          icon={Award}
          value={metrics?.activeCertifications}
          status="success"
          isLoading={isLoading}
          onRefresh={refetch}
          realTime
          size="sm"
          actions={[
            { label: 'View All', onClick: () => window.location.href = '/certificates' }
          ]}
        />

        <RealTimeDashboardWidget
          title="Courses Enrolled"
          icon={BookOpen}
          value={0} // Will implement when enrollment data exists
          status="info"
          isLoading={isLoading}
          realTime
          size="sm"
        />

        <RealTimeDashboardWidget
          title="Hours Completed"
          icon={Clock}
          value={0} // Will implement when course progress data exists
          status="info"
          isLoading={isLoading}
          realTime
          size="sm"
        />
      </div>

      {/* Learning Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RealTimeDashboardWidget
          title="Learning Progress"
          icon={TrendingUp}
          isLoading={isLoading}
          realTime
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Overall Progress</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">75%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Certificates Earned</span>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {metrics?.activeCertifications || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Current Streak</span>
              <Badge variant="outline" className="bg-orange-50 text-orange-700">7 days</Badge>
            </div>
          </div>
        </RealTimeDashboardWidget>

        <RealTimeDashboardWidget
          title="Upcoming Deadlines"
          icon={Calendar}
          isLoading={isLoading}
          realTime
          size="md"
        >
          <div className="space-y-3">
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p className="text-sm">No upcoming deadlines</p>
              <p className="text-xs">You're all caught up!</p>
            </div>
          </div>
        </RealTimeDashboardWidget>
      </div>

      {/* Student Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/certificates'}
              className="h-20 flex flex-col gap-2"
            >
              <Award className="h-6 w-6" />
              <span className="text-sm">My Certificates</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => console.log('Browse courses')}
              className="h-20 flex flex-col gap-2"
            >
              <BookOpen className="h-6 w-6" />
              <span className="text-sm">Browse Courses</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => console.log('Learning history')}
              className="h-20 flex flex-col gap-2"
            >
              <Clock className="h-6 w-6" />
              <span className="text-sm">Learning History</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/profile'}
              className="h-20 flex flex-col gap-2"
            >
              <TrendingUp className="h-6 w-6" />
              <span className="text-sm">My Progress</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
