import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2, Clock, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  UserAvailabilitySlot, 
  WeeklySchedule, 
  DAYS_OF_WEEK, 
  AVAILABILITY_TYPES 
} from '@/types/availability';

interface WeeklyAvailabilityViewProps {
  weeklySchedule: WeeklySchedule;
  onEditSlot: (slot: UserAvailabilitySlot) => void;
  onDeleteSlot: (id: string) => void;
}

export const WeeklyAvailabilityView: React.FC<WeeklyAvailabilityViewProps> = ({
  weeklySchedule,
  onEditSlot,
  onDeleteSlot
}) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getAvailabilityTypeInfo = (type: string) => {
    return AVAILABILITY_TYPES.find(t => t.value === type) || AVAILABILITY_TYPES[0];
  };

  const getAvailabilityColors = (type: string) => {
    const typeInfo = getAvailabilityTypeInfo(type);
    switch (type) {
      case 'available':
        return {
          bg: 'bg-green-50',
          border: 'border-green-300',
          text: 'text-green-800',
          badge: 'bg-green-100 text-green-700 border-green-300'
        };
      case 'busy':
        return {
          bg: 'bg-red-50',
          border: 'border-red-300', 
          text: 'text-red-800',
          badge: 'bg-red-100 text-red-700 border-red-300'
        };
      case 'out_of_office':
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-300',
          text: 'text-gray-800',
          badge: 'bg-gray-100 text-gray-700 border-gray-300'
        };
      case 'tentative':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-300',
          text: 'text-yellow-800',
          badge: 'bg-yellow-100 text-yellow-700 border-yellow-300'
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-300',
          text: 'text-blue-800',
          badge: 'bg-blue-100 text-blue-700 border-blue-300'
        };
    }
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction * 7));
    setCurrentWeek(newDate);
  };

  const getWeekRange = () => {
    const start = new Date(currentWeek);
    start.setDate(currentWeek.getDate() - currentWeek.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    return {
      start: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      end: end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
  };

  const weekRange = getWeekRange();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <CardTitle className="flex items-center gap-2 min-w-64 text-center">
              <Calendar className="h-5 w-5" />
              Weekly Schedule ({weekRange.start} - {weekRange.end})
            </CardTitle>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(new Date())}
          >
            Today
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {DAYS_OF_WEEK.map(day => (
            <div key={day.value} className="p-3 text-center font-medium text-muted-foreground border rounded-md bg-gray-50">
              <div className="font-semibold">{day.short}</div>
              <div className="text-xs">{day.label}</div>
            </div>
          ))}
        </div>

        {/* Availability Grid */}
        <div className="grid grid-cols-7 gap-1">
          {DAYS_OF_WEEK.map(day => {
            const daySlots = weeklySchedule[day.value.toString()] || [];
            
            return (
              <div
                key={day.value}
                className="min-h-48 p-2 border rounded-md bg-background hover:bg-muted/50 transition-colors"
              >
                {/* Day slots */}
                <div className="space-y-2">
                  {daySlots.length > 0 ? (
                    daySlots.map(slot => {
                      const colors = getAvailabilityColors(slot.availability_type);
                      const typeInfo = getAvailabilityTypeInfo(slot.availability_type);
                      
                      return (
                        <div
                          key={slot.id}
                          className={cn(
                            'p-2 rounded-md border transition-all duration-200 group hover:shadow-md',
                            colors.bg,
                            colors.border
                          )}
                        >
                          <div className="space-y-1">
                            {/* Time range */}
                            <div className={cn('text-xs font-medium', colors.text)}>
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </div>
                            
                            {/* Availability type badge */}
                            <Badge 
                              variant="outline" 
                              className={cn('text-xs', colors.badge)}
                            >
                              {typeInfo.label}
                            </Badge>
                            
                            {/* Notes */}
                            {slot.notes && (
                              <div className={cn('text-xs mt-1', colors.text)}>
                                {slot.notes}
                              </div>
                            )}
                            
                            {/* Action buttons */}
                            <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => onEditSlot(slot)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                onClick={() => onDeleteSlot(slot.id!)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center justify-center h-full min-h-32">
                      <div className="text-xs text-muted-foreground text-center">
                        <Clock className="h-4 w-4 mx-auto mb-1 opacity-50" />
                        <div>No availability</div>
                        <div>set for this day</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-muted/50 rounded-md">
          <div className="flex items-center gap-6 text-sm">
            <span className="font-medium text-muted-foreground">Legend:</span>
            {AVAILABILITY_TYPES.map(type => {
              const colors = getAvailabilityColors(type.value);
              return (
                <div key={type.value} className="flex items-center gap-2">
                  <div className={cn('w-3 h-3 rounded-sm border', colors.bg, colors.border)} />
                  <span className="text-muted-foreground">{type.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">Weekly Summary</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {AVAILABILITY_TYPES.map(type => {
                const count = Object.values(weeklySchedule).flat().filter(slot => 
                  slot.availability_type === type.value
                ).length;
                return (
                  <div key={type.value} className="flex justify-between">
                    <span>{type.label}:</span>
                    <span className="font-medium">{count} slots</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};