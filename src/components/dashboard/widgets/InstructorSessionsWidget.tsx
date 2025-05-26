
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface InstructorSessionsWidgetProps {
  instructorId: string;
}

export const InstructorSessionsWidget: React.FC<InstructorSessionsWidgetProps> = ({ instructorId }) => {
  const { data: upcomingSessions = [], isLoading } = useQuery({
    queryKey: ['instructor-sessions', instructorId],
    queryFn: async () => {
      // Mock data for upcoming sessions
      return [
        {
          id: '1',
          courseName: 'CPR Certification',
          date: '2025-05-28',
          time: '10:00 AM',
          duration: '4 hours',
          enrolledStudents: 12,
          location: 'Training Center A'
        },
        {
          id: '2',
          courseName: 'First Aid Training',
          date: '2025-05-30',
          time: '2:00 PM',
          duration: '6 hours',
          enrolledStudents: 8,
          location: 'Training Center B'
        }
      ];
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Upcoming Sessions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingSessions.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No upcoming sessions scheduled
            </div>
          ) : (
            upcomingSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900">{session.courseName}</h4>
                  <div className="flex items-center gap-4 text-sm text-blue-700 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(session.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {session.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {session.enrolledStudents} students
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
