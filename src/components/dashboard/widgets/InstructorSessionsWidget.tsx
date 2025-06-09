
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Clock } from 'lucide-react';
import { useInstructorDashboardData } from '@/hooks/dashboard/useInstructorDashboardData';
import { InlineLoader } from '@/components/ui/LoadingStates';

interface InstructorSessionsWidgetProps {
  instructorId: string;
}

export const InstructorSessionsWidget: React.FC<InstructorSessionsWidgetProps> = ({ 
  instructorId 
}) => {
  const { recentSessions, isLoading } = useInstructorDashboardData(instructorId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Teaching Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <InlineLoader message="Loading sessions..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Recent Teaching Sessions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentSessions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No recent teaching sessions found
          </p>
        ) : (
          recentSessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium">{session.courseName}</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(session.sessionDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {session.attendanceCount}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {session.duration}h
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
