
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Calendar } from 'lucide-react';
import { useStudentDashboardData } from '@/hooks/dashboard/useStudentDashboardData';
import { InlineLoader } from '@/components/ui/LoadingStates';

interface StudentEnrollmentsWidgetProps {
  studentId: string;
}

export const StudentEnrollmentsWidget: React.FC<StudentEnrollmentsWidgetProps> = ({ 
  studentId 
}) => {
  const { enrollments, isLoading } = useStudentDashboardData(studentId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Enrollments</CardTitle>
        </CardHeader>
        <CardContent>
          <InlineLoader message="Loading enrollments..." />
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enrolled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Current Enrollments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {enrollments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No current enrollments found
          </p>
        ) : (
          enrollments.map((enrollment) => (
            <div key={enrollment.id} className="space-y-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{enrollment.courseName}</h4>
                <Badge className={getStatusColor(enrollment.status)}>
                  {enrollment.status}
                </Badge>
              </div>
              
              {enrollment.startDate && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Starts: {new Date(enrollment.startDate).toLocaleDateString()}
                </p>
              )}
              
              {enrollment.progress > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{enrollment.progress}%</span>
                  </div>
                  <Progress value={enrollment.progress} className="h-2" />
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
