
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Calendar, Award } from 'lucide-react';

interface StudentEnrollmentsWidgetProps {
  studentId: string;
}

export const StudentEnrollmentsWidget: React.FC<StudentEnrollmentsWidgetProps> = ({ studentId }) => {
  // Mock enrollment data
  const enrollmentData = {
    activeEnrollments: [
      {
        id: '1',
        courseName: 'CPR Certification',
        startDate: '2025-05-28',
        progress: 75,
        status: 'in_progress',
        instructor: 'John Smith'
      },
      {
        id: '2',
        courseName: 'First Aid Training',
        startDate: '2025-06-05',
        progress: 0,
        status: 'enrolled',
        instructor: 'Sarah Johnson'
      }
    ],
    completedCourses: 8,
    totalCertificates: 6,
    upcomingDeadlines: [
      { course: 'CPR Certification', deadline: '2025-06-15', type: 'exam' },
      { course: 'First Aid Training', deadline: '2025-06-20', type: 'assignment' }
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'enrolled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'in_progress': return 'In Progress';
      case 'enrolled': return 'Enrolled';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          My Enrollments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-900">{enrollmentData.activeEnrollments.length}</div>
            <div className="text-sm text-blue-700">Active</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-900">{enrollmentData.completedCourses}</div>
            <div className="text-sm text-green-700">Completed</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-900">{enrollmentData.totalCertificates}</div>
            <div className="text-sm text-purple-700">Certificates</div>
          </div>
        </div>

        {/* Active Enrollments */}
        <div>
          <h4 className="font-medium mb-3">Current Courses</h4>
          <div className="space-y-3">
            {enrollmentData.activeEnrollments.map((enrollment) => (
              <div key={enrollment.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium">{enrollment.courseName}</h5>
                  <Badge className={getStatusColor(enrollment.status)}>
                    {formatStatus(enrollment.status)}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  Instructor: {enrollment.instructor}
                </div>
                {enrollment.status === 'in_progress' && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{enrollment.progress}%</span>
                    </div>
                    <Progress value={enrollment.progress} className="h-2" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div>
          <h4 className="font-medium mb-3">Upcoming Deadlines</h4>
          <div className="space-y-2">
            {enrollmentData.upcomingDeadlines.map((deadline, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-amber-50 rounded">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium">{deadline.course}</span>
                </div>
                <div className="text-sm text-amber-700">
                  {deadline.type} - {new Date(deadline.deadline).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
