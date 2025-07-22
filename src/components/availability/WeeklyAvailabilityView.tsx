import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Clock } from 'lucide-react';
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

  const getSlotHeight = (slot: UserAvailabilitySlot) => {
    const start = new Date(`2000-01-01T${slot.start_time}`);
    const end = new Date(`2000-01-01T${slot.end_time}`);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60); // minutes
    return Math.max(40, Math.min(120, duration / 15 * 10)); // Scale height based on duration
  };

  const getTimePosition = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const startOfDay = 6 * 60; // 6 AM
    const endOfDay = 22 * 60; // 10 PM
    const workingMinutes = endOfDay - startOfDay;
    
    return Math.max(0, Math.min(100, ((totalMinutes - startOfDay) / workingMinutes) * 100));
  };

  const timeSlots = [];
  for (let hour = 6; hour <= 22; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-8 bg-gray-50 border-b">
        <div className="p-3 border-r">
          <Clock className="h-4 w-4 text-gray-500" />
        </div>
        {DAYS_OF_WEEK.map(day => (
          <div key={day.value} className="p-3 text-center border-r last:border-r-0">
            <div className="font-medium text-gray-900">{day.short}</div>
            <div className="text-xs text-gray-500">{day.label}</div>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <div className="grid grid-cols-8 relative">
        {/* Time Column */}
        <div className="border-r bg-gray-50">
          {timeSlots.map(time => (
            <div key={time} className="h-12 border-b p-2 text-xs text-gray-500 flex items-center">
              {formatTime(`${time}:00`)}
            </div>
          ))}
        </div>

        {/* Days Columns */}
        {DAYS_OF_WEEK.map(day => {
          const daySlots = weeklySchedule[day.value] || [];
          
          return (
            <div key={day.value} className="border-r last:border-r-0 relative min-h-[400px]">
              {/* Time grid lines */}
              {timeSlots.map((time, index) => (
                <div key={time} className="h-12 border-b border-gray-100" />
              ))}
              
              {/* Availability slots */}
              <div className="absolute inset-0">
                {daySlots.map(slot => {
                  const typeInfo = getAvailabilityTypeInfo(slot.availability_type);
                  const top = getTimePosition(slot.start_time);
                  const height = Math.max(36, getSlotHeight(slot));
                  
                  return (
                    <div
                      key={slot.id}
                      className={`absolute left-1 right-1 rounded-md border shadow-sm bg-${typeInfo.color}-50 border-${typeInfo.color}-200 group hover:shadow-md transition-shadow`}
                      style={{
                        top: `${top}%`,
                        height: `${height}px`,
                        zIndex: 10
                      }}
                    >
                      <div className="p-2 h-full flex flex-col justify-between">
                        <div>
                          <div className="text-xs font-medium text-gray-900 truncate">
                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs mt-1 border-${typeInfo.color}-300 text-${typeInfo.color}-700`}
                          >
                            {typeInfo.label}
                          </Badge>
                          {slot.notes && (
                            <div className="text-xs text-gray-600 mt-1 truncate">
                              {slot.notes}
                            </div>
                          )}
                        </div>
                        
                        {/* Action buttons - shown on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mt-1">
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
                })}
              </div>
              
              {/* Empty state for days with no availability */}
              {daySlots.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs text-gray-400 text-center">
                    <div>Not available</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 p-3 border-t">
        <div className="flex items-center gap-4 text-xs">
          <span className="text-gray-600 font-medium">Legend:</span>
          {AVAILABILITY_TYPES.map(type => (
            <div key={type.value} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-sm bg-${type.color}-200 border border-${type.color}-300`} />
              <span className="text-gray-700">{type.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};