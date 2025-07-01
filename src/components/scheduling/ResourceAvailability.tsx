
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, Clock, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { format, parseISO, isSameDay, startOfDay, endOfDay } from 'date-fns';
import type { CourseSchedule } from '@/types/courseScheduling';

interface ResourceAvailabilityProps {
  schedules: CourseSchedule[];
  selectedDate: Date;
}

interface ResourceUtilization {
  id: string;
  name: string;
  type: 'instructor' | 'location';
  totalCapacity: number;
  currentUtilization: number;
  utilizationRate: number;
  schedules: CourseSchedule[];
  conflicts: number;
  status: 'available' | 'busy' | 'overbooked';
}

export const ResourceAvailability: React.FC<ResourceAvailabilityProps> = ({
  schedules,
  selectedDate
}) => {
  const { instructorUtilization, locationUtilization, dailyOverview } = useMemo(() => {
    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);
    
    const daySchedules = schedules.filter(schedule => 
      isSameDay(parseISO(schedule.start_date), selectedDate)
    );

    // Calculate instructor utilization
    const instructorStats: Record<string, ResourceUtilization> = {};
    
    schedules.forEach(schedule => {
      if (schedule.instructor_id) {
        if (!instructorStats[schedule.instructor_id]) {
          instructorStats[schedule.instructor_id] = {
            id: schedule.instructor_id,
            name: `Instructor ${schedule.instructor_id.slice(-4)}`,
            type: 'instructor',
            totalCapacity: 40, // Assuming 40 hours per week capacity
            currentUtilization: 0,
            utilizationRate: 0,
            schedules: [],
            conflicts: 0,
            status: 'available'
          };
        }
        
        const duration = (parseISO(schedule.end_date).getTime() - parseISO(schedule.start_date).getTime()) / (1000 * 60 * 60);
        instructorStats[schedule.instructor_id].currentUtilization += duration;
        instructorStats[schedule.instructor_id].schedules.push(schedule);
      }
    });

    // Calculate utilization rates and conflicts for instructors
    Object.values(instructorStats).forEach(instructor => {
      instructor.utilizationRate = (instructor.currentUtilization / instructor.totalCapacity) * 100;
      
      // Check for conflicts (overlapping schedules)
      const sortedSchedules = instructor.schedules.sort((a, b) => 
        parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime()
      );
      
      for (let i = 0; i < sortedSchedules.length - 1; i++) {
        const currentEnd = parseISO(sortedSchedules[i].end_date);
        const nextStart = parseISO(sortedSchedules[i + 1].start_date);
        if (currentEnd > nextStart) {
          instructor.conflicts++;
        }
      }
      
      // Determine status
      if (instructor.conflicts > 0) {
        instructor.status = 'overbooked';
      } else if (instructor.utilizationRate > 80) {
        instructor.status = 'busy';
      } else {
        instructor.status = 'available';
      }
    });

    // Calculate location utilization
    const locationStats: Record<string, ResourceUtilization> = {};
    
    schedules.forEach(schedule => {
      if (schedule.location_id) {
        if (!locationStats[schedule.location_id]) {
          locationStats[schedule.location_id] = {
            id: schedule.location_id,
            name: `Location ${schedule.location_id.slice(-4)}`,
            type: 'location',
            totalCapacity: 50, // Assuming 50 hours per week capacity
            currentUtilization: 0,
            utilizationRate: 0,
            schedules: [],
            conflicts: 0,
            status: 'available'
          };
        }
        
        const duration = (parseISO(schedule.end_date).getTime() - parseISO(schedule.start_date).getTime()) / (1000 * 60 * 60);
        locationStats[schedule.location_id].currentUtilization += duration;
        locationStats[schedule.location_id].schedules.push(schedule);
      }
    });

    // Calculate utilization rates and conflicts for locations
    Object.values(locationStats).forEach(location => {
      location.utilizationRate = (location.currentUtilization / location.totalCapacity) * 100;
      
      // Check for conflicts
      const sortedSchedules = location.schedules.sort((a, b) => 
        parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime()
      );
      
      for (let i = 0; i < sortedSchedules.length - 1; i++) {
        const currentEnd = parseISO(sortedSchedules[i].end_date);
        const nextStart = parseISO(sortedSchedules[i + 1].start_date);
        if (currentEnd > nextStart) {
          location.conflicts++;
        }
      }
      
      // Determine status
      if (location.conflicts > 0) {
        location.status = 'overbooked';
      } else if (location.utilizationRate > 80) {
        location.status = 'busy';
      } else {
        location.status = 'available';
      }
    });

    // Daily overview stats
    const overview = {
      totalSchedules: daySchedules.length,
      totalInstructors: new Set(daySchedules.map(s => s.instructor_id).filter(Boolean)).size,
      totalLocations: new Set(daySchedules.map(s => s.location_id).filter(Boolean)).size,
      totalEnrollments: daySchedules.reduce((sum, s) => sum + s.current_enrollment, 0),
      totalCapacity: daySchedules.reduce((sum, s) => sum + s.max_capacity, 0),
      utilizationRate: daySchedules.length > 0 
        ? (daySchedules.reduce((sum, s) => sum + s.current_enrollment, 0) / 
           daySchedules.reduce((sum, s) => sum + s.max_capacity, 0)) * 100 
        : 0
    };

    return {
      instructorUtilization: Object.values(instructorStats),
      locationUtilization: Object.values(locationStats),
      dailyOverview: overview
    };
  }, [schedules, selectedDate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'overbooked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4" />;
      case 'busy': return <Clock className="h-4 w-4" />;
      case 'overbooked': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Daily Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Overview - {format(selectedDate, 'EEEE, MMMM d')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{dailyOverview.totalSchedules}</div>
              <div className="text-sm text-blue-700">Scheduled Courses</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-900">{dailyOverview.totalInstructors}</div>
              <div className="text-sm text-green-700">Active Instructors</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-900">{dailyOverview.totalLocations}</div>
              <div className="text-sm text-purple-700">Locations Used</div>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-900">
                {Math.round(dailyOverview.utilizationRate)}%
              </div>
              <div className="text-sm text-amber-700">Capacity Utilization</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instructor Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Instructor Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {instructorUtilization.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No instructor assignments found</p>
                </div>
              ) : (
                instructorUtilization.map((instructor) => (
                  <div key={instructor.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{instructor.name}</span>
                        <Badge className={getStatusColor(instructor.status)}>
                          {getStatusIcon(instructor.status)}
                          {instructor.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-600">
                        {Math.round(instructor.utilizationRate)}%
                      </span>
                    </div>
                    <Progress value={instructor.utilizationRate} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{instructor.currentUtilization}h used</span>
                      <span>{instructor.schedules.length} courses</span>
                      {instructor.conflicts > 0 && (
                        <span className="text-red-600">{instructor.conflicts} conflicts</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {locationUtilization.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No location assignments found</p>
                </div>
              ) : (
                locationUtilization.map((location) => (
                  <div key={location.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{location.name}</span>
                        <Badge className={getStatusColor(location.status)}>
                          {getStatusIcon(location.status)}
                          {location.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-600">
                        {Math.round(location.utilizationRate)}%
                      </span>
                    </div>
                    <Progress value={location.utilizationRate} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{location.currentUtilization}h used</span>
                      <span>{location.schedules.length} bookings</span>
                      {location.conflicts > 0 && (
                        <span className="text-red-600">{location.conflicts} conflicts</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
