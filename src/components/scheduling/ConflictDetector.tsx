
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Clock, Users, MapPin, CheckCircle } from 'lucide-react';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import type { CourseSchedule } from '@/types/courseScheduling';

interface ConflictDetectorProps {
  schedules: CourseSchedule[];
}

interface Conflict {
  id: string;
  type: 'instructor' | 'location' | 'capacity';
  severity: 'high' | 'medium' | 'low';
  message: string;
  affectedSchedules: CourseSchedule[];
}

export const ConflictDetector: React.FC<ConflictDetectorProps> = ({ schedules }) => {
  const conflicts = useMemo(() => {
    const detectedConflicts: Conflict[] = [];

    // Instructor conflicts
    const instructorSchedules = schedules.reduce((acc, schedule) => {
      if (schedule.instructor_id) {
        if (!acc[schedule.instructor_id]) {
          acc[schedule.instructor_id] = [];
        }
        acc[schedule.instructor_id].push(schedule);
      }
      return acc;
    }, {} as Record<string, CourseSchedule[]>);

    Object.entries(instructorSchedules).forEach(([instructorId, instructorScheduleList]) => {
      for (let i = 0; i < instructorScheduleList.length; i++) {
        for (let j = i + 1; j < instructorScheduleList.length; j++) {
          const schedule1 = instructorScheduleList[i];
          const schedule2 = instructorScheduleList[j];
          
          const start1 = parseISO(schedule1.start_date);
          const end1 = parseISO(schedule1.end_date);
          const start2 = parseISO(schedule2.start_date);
          const end2 = parseISO(schedule2.end_date);

          // Check for overlap
          if (
            (isBefore(start1, end2) && isAfter(end1, start2)) ||
            (isBefore(start2, end1) && isAfter(end2, start1))
          ) {
            detectedConflicts.push({
              id: `instructor-${instructorId}-${i}-${j}`,
              type: 'instructor',
              severity: 'high',
              message: 'Instructor has overlapping schedule assignments',
              affectedSchedules: [schedule1, schedule2]
            });
          }
        }
      }
    });

    // Location conflicts
    const locationSchedules = schedules.reduce((acc, schedule) => {
      if (schedule.location_id) {
        if (!acc[schedule.location_id]) {
          acc[schedule.location_id] = [];
        }
        acc[schedule.location_id].push(schedule);
      }
      return acc;
    }, {} as Record<string, CourseSchedule[]>);

    Object.entries(locationSchedules).forEach(([locationId, locationScheduleList]) => {
      for (let i = 0; i < locationScheduleList.length; i++) {
        for (let j = i + 1; j < locationScheduleList.length; j++) {
          const schedule1 = locationScheduleList[i];
          const schedule2 = locationScheduleList[j];
          
          const start1 = parseISO(schedule1.start_date);
          const end1 = parseISO(schedule1.end_date);
          const start2 = parseISO(schedule2.start_date);
          const end2 = parseISO(schedule2.end_date);

          // Check for overlap
          if (
            (isBefore(start1, end2) && isAfter(end1, start2)) ||
            (isBefore(start2, end1) && isAfter(end2, start1))
          ) {
            detectedConflicts.push({
              id: `location-${locationId}-${i}-${j}`,
              type: 'location',
              severity: 'high',
              message: 'Location has overlapping bookings',
              affectedSchedules: [schedule1, schedule2]
            });
          }
        }
      }
    });

    // Capacity warnings
    schedules.forEach(schedule => {
      const utilizationRate = schedule.current_enrollment / schedule.max_capacity;
      if (utilizationRate > 0.9) {
        detectedConflicts.push({
          id: `capacity-${schedule.id}`,
          type: 'capacity',
          severity: utilizationRate > 0.95 ? 'high' : 'medium',
          message: `Course is at ${Math.round(utilizationRate * 100)}% capacity`,
          affectedSchedules: [schedule]
        });
      }
    });

    return detectedConflicts;
  }, [schedules]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'instructor': return <Users className="h-4 w-4" />;
      case 'location': return <MapPin className="h-4 w-4" />;
      case 'capacity': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (conflicts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Conflict Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              No scheduling conflicts detected. All schedules appear to be compatible.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Conflict Detection ({conflicts.length} issues)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conflicts.map((conflict) => (
            <div key={conflict.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getConflictIcon(conflict.type)}
                  <span className="font-medium capitalize">{conflict.type} Conflict</span>
                </div>
                <Badge className={getSeverityColor(conflict.severity)}>
                  {conflict.severity} priority
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{conflict.message}</p>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Affected Schedules:</h4>
                {conflict.affectedSchedules.map((schedule) => (
                  <div key={schedule.id} className="bg-gray-50 p-2 rounded text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(parseISO(schedule.start_date), 'MMM d, h:mm a')} - 
                          {format(parseISO(schedule.end_date), 'h:mm a')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{schedule.current_enrollment}/{schedule.max_capacity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
