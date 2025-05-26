
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CourseSchedulingService } from '@/services/courses/courseSchedulingService';
import { format } from 'date-fns';

interface NextSessionDisplayProps {
  courseId: string;
}

export const NextSessionDisplay: React.FC<NextSessionDisplayProps> = ({ courseId }) => {
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['course-schedules', courseId],
    queryFn: () => CourseSchedulingService.getCourseSchedules(courseId)
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (!schedules || schedules.length === 0) {
    return <div className="text-sm text-muted-foreground">No sessions scheduled</div>;
  }

  // Find the next upcoming session
  const now = new Date();
  const upcomingSession = schedules
    .filter(schedule => new Date(schedule.start_date) > now)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0];

  if (!upcomingSession) {
    return <div className="text-sm text-muted-foreground">No upcoming sessions</div>;
  }

  const startDate = new Date(upcomingSession.start_date);
  const statusVariant = upcomingSession.status === 'scheduled' ? 'default' : 
                       upcomingSession.status === 'in_progress' ? 'secondary' : 'outline';

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 text-sm">
        <Calendar className="h-3 w-3 text-muted-foreground" />
        <span>{format(startDate, 'MMM d, yyyy')}</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>{format(startDate, 'h:mm a')}</span>
      </div>
      <Badge variant={statusVariant} className="text-xs">
        {upcomingSession.status}
      </Badge>
    </div>
  );
};
