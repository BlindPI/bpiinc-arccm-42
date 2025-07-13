import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { InstructorAvailability, CalendarEvent } from '@/hooks/useCalendarScheduling';

interface AvailabilityVisualizationProps {
  instructorAvailability: InstructorAvailability[];
  events: CalendarEvent[];
  selectedDate?: Date;
}

export const AvailabilityVisualization: React.FC<AvailabilityVisualizationProps> = ({
  instructorAvailability,
  events,
  selectedDate = new Date()
}) => {
  const currentDay = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  const calculateAvailabilityStats = () => {
    const totalInstructors = instructorAvailability.length;
    let totalAvailableHours = 0;
    let totalScheduledHours = 0;
    let instructorsWithGaps = 0;
    
    instructorAvailability.forEach(instructor => {
      const dayAvailability = instructor.availability.filter(avail => avail.dayOfWeek === currentDay);
      const instructorEvents = events.filter(event => 
        event.extendedProps.instructorId === instructor.instructorId &&
        new Date(event.start).toDateString() === selectedDate.toDateString()
      );
      
      // Calculate available hours for this instructor on selected day
      const availableHours = dayAvailability.reduce((total, avail) => {
        const start = new Date(`2000-01-01T${avail.startTime}`);
        const end = new Date(`2000-01-01T${avail.endTime}`);
        return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0);
      
      // Calculate scheduled hours
      const scheduledHours = instructorEvents.reduce((total, event) => {
        const start = new Date(event.start);
        const end = new Date(event.end);
        return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0);
      
      totalAvailableHours += availableHours;
      totalScheduledHours += scheduledHours;
      
      // Check for gaps (available time - scheduled time > 2 hours)
      if (availableHours - scheduledHours > 2) {
        instructorsWithGaps++;
      }
    });
    
    const utilizationRate = totalAvailableHours > 0 ? (totalScheduledHours / totalAvailableHours) * 100 : 0;
    
    return {
      totalInstructors,
      totalAvailableHours: Math.round(totalAvailableHours * 10) / 10,
      totalScheduledHours: Math.round(totalScheduledHours * 10) / 10,
      utilizationRate: Math.round(utilizationRate),
      instructorsWithGaps,
      availableGapHours: Math.round((totalAvailableHours - totalScheduledHours) * 10) / 10
    };
  };

  const stats = calculateAvailabilityStats();

  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return 'text-red-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUtilizationBadgeVariant = (rate: number) => {
    if (rate >= 80) return 'destructive';
    if (rate >= 60) return 'secondary';
    return 'default';
  };

  return (
    <div className="space-y-4">
      {/* Overall Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Availability Overview - {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric' 
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                {stats.totalInstructors}
              </div>
              <p className="text-sm text-muted-foreground">Total Instructors</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.totalAvailableHours}h
              </div>
              <p className="text-sm text-muted-foreground">Available Hours</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalScheduledHours}h
              </div>
              <p className="text-sm text-muted-foreground">Scheduled Hours</p>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${getUtilizationColor(stats.utilizationRate)}`}>
                {stats.utilizationRate}%
              </div>
              <p className="text-sm text-muted-foreground">Utilization Rate</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Capacity Utilization</span>
              <Badge variant={getUtilizationBadgeVariant(stats.utilizationRate)}>
                {stats.utilizationRate >= 80 ? 'High' : stats.utilizationRate >= 60 ? 'Moderate' : 'Low'}
              </Badge>
            </div>
            <Progress value={stats.utilizationRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Availability Gaps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Scheduling Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">{stats.availableGapHours}h Available</p>
                <p className="text-sm text-muted-foreground">Unscheduled capacity</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">{stats.instructorsWithGaps} Instructors</p>
                <p className="text-sm text-muted-foreground">With scheduling gaps</p>
              </div>
            </div>
          </div>

          {stats.availableGapHours > 0 && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border">
              <p className="text-sm text-green-800">
                <strong>Scheduling Opportunity:</strong> You have {stats.availableGapHours} hours of 
                unscheduled instructor time available. Consider scheduling additional courses or training sessions.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Instructor Availability */}
      <Card>
        <CardHeader>
          <CardTitle>Instructor Availability Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {instructorAvailability.map(instructor => {
              const dayAvailability = instructor.availability.filter(avail => avail.dayOfWeek === currentDay);
              const instructorEvents = events.filter(event => 
                event.extendedProps.instructorId === instructor.instructorId &&
                new Date(event.start).toDateString() === selectedDate.toDateString()
              );
              
              const availableHours = dayAvailability.reduce((total, avail) => {
                const start = new Date(`2000-01-01T${avail.startTime}`);
                const end = new Date(`2000-01-01T${avail.endTime}`);
                return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
              }, 0);
              
              const scheduledHours = instructorEvents.reduce((total, event) => {
                const start = new Date(event.start);
                const end = new Date(event.end);
                return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
              }, 0);
              
              const utilization = availableHours > 0 ? (scheduledHours / availableHours) * 100 : 0;
              const gapHours = availableHours - scheduledHours;
              
              return (
                <div key={instructor.instructorId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{instructor.instructorName}</h4>
                      <Badge variant="outline" className="text-xs">
                        {instructor.role}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{availableHours}h available</span>
                      <span>{scheduledHours}h scheduled</span>
                      {gapHours > 0 && (
                        <span className="text-green-600 font-medium">{gapHours.toFixed(1)}h gap</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-medium ${getUtilizationColor(utilization)}`}>
                      {Math.round(utilization)}%
                    </div>
                    <div className="w-24 mt-1">
                      <Progress value={utilization} className="h-1" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};