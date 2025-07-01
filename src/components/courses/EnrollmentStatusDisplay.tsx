
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CourseSchedulingService } from '@/services/courses/courseSchedulingService';

interface EnrollmentStatusDisplayProps {
  courseId: string;
}

export const EnrollmentStatusDisplay: React.FC<EnrollmentStatusDisplayProps> = ({ courseId }) => {
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['course-schedules', courseId],
    queryFn: () => CourseSchedulingService.getCourseSchedules(courseId)
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (!schedules || schedules.length === 0) {
    return <div className="text-sm text-muted-foreground">No schedules</div>;
  }

  // Calculate total enrollment across all active schedules
  const activeSchedules = schedules.filter(s => s.status === 'scheduled' || s.status === 'in_progress');
  const totalEnrollment = activeSchedules.reduce((sum, schedule) => sum + schedule.current_enrollment, 0);
  const totalCapacity = activeSchedules.reduce((sum, schedule) => sum + schedule.max_capacity, 0);
  
  const enrollmentPercentage = totalCapacity > 0 ? (totalEnrollment / totalCapacity) * 100 : 0;
  
  let statusVariant: "default" | "secondary" | "destructive" | "outline" = 'outline';
  if (enrollmentPercentage >= 90) statusVariant = 'destructive';
  else if (enrollmentPercentage >= 70) statusVariant = 'secondary';
  else if (enrollmentPercentage >= 30) statusVariant = 'default';

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 text-sm">
        <Users className="h-3 w-3 text-muted-foreground" />
        <span>{totalEnrollment}/{totalCapacity}</span>
      </div>
      {totalCapacity > 0 && (
        <>
          <Progress value={enrollmentPercentage} className="h-2" />
          <Badge variant={statusVariant} className="text-xs">
            {enrollmentPercentage.toFixed(0)}% full
          </Badge>
        </>
      )}
    </div>
  );
};
