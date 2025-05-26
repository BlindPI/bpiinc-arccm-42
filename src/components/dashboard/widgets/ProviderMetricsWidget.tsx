
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Calendar, Award } from 'lucide-react';
import { useProviderDashboardData } from '@/hooks/dashboard/useProviderDashboardData';
import { InlineLoader } from '@/components/ui/LoadingStates';

interface ProviderMetricsWidgetProps {
  providerId: string;
}

export const ProviderMetricsWidget: React.FC<ProviderMetricsWidgetProps> = ({ 
  providerId 
}) => {
  const { upcomingCourses, isLoading } = useProviderDashboardData();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <InlineLoader message="Loading courses..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Courses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingCourses.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No upcoming courses scheduled
          </p>
        ) : (
          upcomingCourses.map((course) => (
            <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium">{course.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {course.date} at {course.time}
                </p>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {course.enrolledCount} enrolled
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
