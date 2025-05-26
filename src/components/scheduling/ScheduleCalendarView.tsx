
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Clock, Users, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import type { CourseSchedule } from '@/types/courseScheduling';

interface ScheduleCalendarViewProps {
  schedules: CourseSchedule[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onScheduleClick: (schedule: CourseSchedule) => void;
}

export const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({
  schedules,
  selectedDate,
  onDateSelect,
  onScheduleClick
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const schedulesForDate = schedules.filter(schedule => 
    isSameDay(parseISO(schedule.start_date), selectedDate)
  );

  const getSchedulesForDay = (date: Date) => {
    return schedules.filter(schedule => 
      isSameDay(parseISO(schedule.start_date), date)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {format(currentMonth, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateSelect(date)}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="w-full"
              components={{
                Day: ({ date, ...props }) => {
                  const daySchedules = getSchedulesForDay(date);
                  return (
                    <div className="relative">
                      <button
                        {...props}
                        className={`
                          w-full h-full p-2 text-sm rounded
                          ${isSameDay(date, selectedDate) ? 'bg-primary text-primary-foreground' : ''}
                          ${daySchedules.length > 0 ? 'bg-blue-50 border border-blue-200' : ''}
                          hover:bg-gray-100
                        `}
                      >
                        {format(date, 'd')}
                        {daySchedules.length > 0 && (
                          <div className="absolute bottom-0 right-0 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                            {daySchedules.length}
                          </div>
                        )}
                      </button>
                    </div>
                  );
                }
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Selected Date Details */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {format(selectedDate, 'EEEE, MMMM d')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {schedulesForDate.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No courses scheduled for this date</p>
              </div>
            ) : (
              <div className="space-y-4">
                {schedulesForDate.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => onScheduleClick(schedule)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">Course Session</h4>
                      <Badge className={getStatusColor(schedule.status)}>
                        {schedule.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(parseISO(schedule.start_date), 'h:mm a')} - 
                          {format(parseISO(schedule.end_date), 'h:mm a')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        <span>
                          {schedule.current_enrollment}/{schedule.max_capacity} enrolled
                        </span>
                      </div>
                      
                      {schedule.location_id && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span>Location assigned</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
